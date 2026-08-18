import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { EvolutionClientService, EvolutionCreds } from './services/evolution-client.service';
import { EvolutionProvisionService } from './services/evolution-provision.service';

const log = new Logger('WhatsappAiService');

interface CartItemInput {
  productVariantId: string;
  quantidade: number;
}

interface StructuredResponse {
  resposta_cliente: string;
  carrinho: CartItemInput[];
  finalizar_pedido: boolean;
  forma_pagamento?: string | null;
  transferir_humano?: boolean;
}

type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class WhatsappAiService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private ordersService: OrdersService,
    private evolutionClient: EvolutionClientService,
    private provisionService: EvolutionProvisionService,
  ) {}

  // ── API administrativa (autenticada) ──────────────────────────────────────

  listConnections(companyId: string) {
    return this.provisionService.listConnections(companyId);
  }

  createConnection(companyId: string, name: string) {
    return this.provisionService.provisionConnection(companyId, name);
  }

  getConnectionQr(companyId: string, connectionId: string) {
    return this.provisionService.getConnectionQr(companyId, connectionId);
  }

  deleteConnection(companyId: string, connectionId: string) {
    return this.provisionService.deleteConnection(companyId, connectionId);
  }

  // ── Webhook público (Evolution API) ───────────────────────────────────────

  async handleEvolutionWebhook(connectionId: string, body: Record<string, unknown>) {
    const event = String(body?.event ?? '').toLowerCase().replace(/[_-]/g, '.');
    if (!['messages.upsert', 'message', 'messages.set'].includes(event)) {
      return { ok: true };
    }

    const data = body?.data as Record<string, unknown> | undefined;
    if (!data) return { ok: true };

    // Evolution v1 manda os campos direto em `data`; v2 embrulha em `data.messages[0]`.
    const msgData = (
      Array.isArray((data as any).messages) && (data as any).messages.length > 0
        ? (data as any).messages[0]
        : data
    ) as Record<string, unknown>;

    const fromMe = Boolean((msgData?.key as any)?.fromMe);
    if (fromMe) return { ok: true };

    const rawPhone = String((msgData?.key as any)?.remoteJid ?? '');
    if (!rawPhone || rawPhone.includes('@g.us') || rawPhone.includes('@broadcast')) return { ok: true };
    const phone = rawPhone.replace('@s.whatsapp.net', '').replace('@c.us', '');

    const message = msgData?.message as Record<string, unknown> | undefined;
    const text = String(
      (message?.conversation as string) ??
        (message?.extendedTextMessage as any)?.text ??
        (message?.buttonsResponseMessage as any)?.selectedDisplayText ??
        '',
    ).trim();

    if (!phone || !text) return { ok: true };

    try {
      await this.processIncoming(connectionId, phone, text);
    } catch (err: any) {
      log.error(`processIncoming falhou (phone=${phone}, connectionId=${connectionId}): ${err?.message ?? err}`);
    }
    return { ok: true };
  }

  // ── Núcleo da conversa ─────────────────────────────────────────────────────

  private async processIncoming(connectionId: string, phone: string, text: string) {
    const connection = await this.prisma.whatsappConnection.findUnique({ where: { id: connectionId } });
    if (!connection || !connection.isActive) return;

    const companyId = connection.companyId;

    const conversation = await this.prisma.whatsappConversation.upsert({
      where: { connectionId_phone: { connectionId, phone } },
      update: {},
      create: { connectionId, companyId, phone, context: {} },
    });

    await this.prisma.whatsappMessage.create({
      data: { conversationId: conversation.id, direction: 'IN', content: text },
    });

    const [company, catalog, history] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }),
      this.productsService.publicCatalog(companyId),
      this.prisma.whatsappMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const conversationHistory: ChatMessage[] = history
      .slice()
      .reverse()
      .map((m) => ({ role: m.direction === 'IN' ? 'user' : 'assistant', content: m.content }));

    const cartContext = (conversation.context as { itens?: CartItemInput[] } | null) ?? {};

    const structured = await this.callAi({
      companyName: company?.name ?? 'a loja',
      catalog,
      cart: cartContext.itens ?? [],
      conversationHistory,
    });

    await this.prisma.whatsappMessage.create({
      data: { conversationId: conversation.id, direction: 'OUT', content: structured.resposta_cliente },
    });

    let replyText = structured.resposta_cliente;
    let newContext: Record<string, unknown> = { itens: structured.carrinho };

    if (structured.finalizar_pedido && structured.carrinho.length > 0) {
      try {
        const customer = await this.findOrCreateCustomer(companyId, phone);
        const order = await this.ordersService.createFromWhatsapp(companyId, {
          customerId: customer.id,
          paymentMethod: this.mapPaymentMethod(structured.forma_pagamento),
          items: structured.carrinho.map((i) => ({ productVariantId: i.productVariantId, quantity: i.quantidade })),
        });
        replyText += `\n\n✅ Pedido #${order.number} reservado! A(s) peça(s) ficam separadas — só falta você passar na loja para provar e fechar.`;
        newContext = {};
      } catch (err: any) {
        replyText += `\n\n⚠️ Não consegui reservar o pedido agora (${err?.message ?? 'erro desconhecido'}). Vou chamar um atendente para te ajudar.`;
      }
    }

    await this.prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { context: newContext as any, lastMessageAt: new Date() },
    });

    if (connection.instanceName) {
      const creds: EvolutionCreds = {
        baseUrl: connection.apiUrl || process.env.EVOLUTION_API_URL || '',
        apiKey: connection.apiToken || process.env.EVOLUTION_API_KEY || '',
      };
      await this.evolutionClient.sendText(creds, connection.instanceName, phone, replyText);
    }
  }

  private async findOrCreateCustomer(companyId: string, phone: string) {
    const existing = await this.prisma.customer.findFirst({ where: { companyId, phone } });
    if (existing) return existing;
    return this.prisma.customer.create({
      data: { companyId, name: `Cliente WhatsApp ${phone.slice(-4)}`, phone },
    });
  }

  private mapPaymentMethod(raw?: string | null): PaymentMethod {
    switch (raw) {
      case 'pix':
        return PaymentMethod.PIX;
      case 'credit_card':
        return PaymentMethod.CREDIT_CARD;
      case 'debit_card':
        return PaymentMethod.DEBIT_CARD;
      default:
        return PaymentMethod.CASH;
    }
  }

  // ── Chamada de IA (Anthropic primário, Gemini como fallback) ──────────────

  private async callAi(params: {
    companyName: string;
    catalog: any[];
    cart: CartItemInput[];
    conversationHistory: ChatMessage[];
  }): Promise<StructuredResponse> {
    const systemPrompt = this.buildSystemPrompt(params);
    const history = params.conversationHistory.length ? params.conversationHistory : [{ role: 'user' as const, content: 'Olá' }];

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        return await this.chatAnthropic(anthropicKey, systemPrompt, history);
      } catch (err: any) {
        log.warn(`Anthropic falhou, tentando Gemini: ${err?.message ?? err}`);
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('Nenhum provedor de IA configurado (ANTHROPIC_API_KEY/GEMINI_API_KEY).');
    return this.chatGemini(geminiKey, systemPrompt, history);
  }

  private async chatAnthropic(apiKey: string, systemPrompt: string, history: ChatMessage[]): Promise<StructuredResponse> {
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, system: systemPrompt, messages: history, max_tokens: 1024, temperature: 0.7 }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as any;
    const rawText = String(data?.content?.[0]?.text ?? '');
    return this.parseStructured(rawText);
  }

  private async chatGemini(apiKey: string, systemPrompt: string, history: ChatMessage[]): Promise<StructuredResponse> {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const contents = history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1024, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as any;
    const rawText = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
    return this.parseStructured(rawText);
  }

  private parseStructured(raw: string): StructuredResponse {
    let jsonText = raw.trim();
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    try {
      const parsed = JSON.parse(jsonText);
      return {
        resposta_cliente: String(parsed?.resposta_cliente ?? 'Desculpe, não entendi. Pode repetir?'),
        carrinho: Array.isArray(parsed?.carrinho)
          ? parsed.carrinho.filter((i: any) => i?.productVariantId && Number(i?.quantidade) > 0)
          : [],
        finalizar_pedido: Boolean(parsed?.finalizar_pedido),
        forma_pagamento: parsed?.forma_pagamento ?? null,
        transferir_humano: Boolean(parsed?.transferir_humano),
      };
    } catch {
      return {
        resposta_cliente: raw.slice(0, 500) || 'Desculpe, tive um problema para responder. Pode repetir?',
        carrinho: [],
        finalizar_pedido: false,
      };
    }
  }

  // ── Prompt do sistema ──────────────────────────────────────────────────────

  private buildSystemPrompt(params: { companyName: string; catalog: any[]; cart: CartItemInput[] }): string {
    const catalogLines = params.catalog
      .slice(0, 80)
      .flatMap((p: any) =>
        (p.variants ?? [])
          .filter((v: any) => v.stock > 0)
          .map((v: any) => `- [ID:${v.id}] ${p.name} — Tam ${v.size}/${v.color} — R$ ${Number(p.effectivePrice).toFixed(2)} (estoque: ${v.stock})`),
      );
    const catalogText = catalogLines.length ? catalogLines.join('\n') : 'Catálogo vazio no momento.';
    const cartJson = JSON.stringify(params.cart, null, 2);

    return `Você é a assistente virtual de vendas da loja "${params.companyName}" (moda/vestuário) no WhatsApp. Seu objetivo é ajudar o cliente a escolher peças do catálogo e montar um pedido.

━━━ REGRAS ━━━
1. Nunca invente produtos, tamanhos, cores ou preços fora do catálogo abaixo.
2. O "productVariantId" no carrinho deve ser EXATAMENTE o valor entre [ID:xxx].
3. Sempre pergunte tamanho e cor quando o cliente pedir uma peça sem especificar, escolhendo entre as variantes com estoque disponível.
4. Se o cliente disser que quer pagar "fiado", "crediário" ou "parcelado na loja" — explique que essa forma só pode ser fechada presencialmente na loja, e sugira PIX, dinheiro ou cartão para reservar pelo WhatsApp.
5. Antes de finalizar_pedido: true, confirme os itens, tamanhos/cores e a forma de pagamento com o cliente.
6. O pedido feito pelo WhatsApp é uma RESERVA — deixe sempre claro que a(s) peça(s) ficam separadas e o cliente prova/paga na loja.
7. Sempre repita no campo "carrinho" TODOS os itens já combinados anteriormente (não apenas os novos) — o bloco CARRINHO ATUAL abaixo é a fonte da verdade do que já foi confirmado; nunca apague um item sem o cliente pedir.
8. No máximo 3 frases por mensagem, no máximo 1 emoji.
9. Se o cliente pedir para falar com um humano, marque "transferir_humano": true.
10. Responda SEMPRE e SOMENTE com o JSON abaixo — zero texto fora do JSON.

━━━ CATÁLOGO DISPONÍVEL ━━━
${catalogText}

━━━ CARRINHO ATUAL ━━━
${cartJson}

━━━ FORMATO DE RESPOSTA (JSON OBRIGATÓRIO) ━━━
{
  "resposta_cliente": "texto humanizado para o WhatsApp",
  "carrinho": [ { "productVariantId": "id_exato_do_catalogo", "quantidade": 1 } ],
  "finalizar_pedido": false,
  "forma_pagamento": "pix",
  "transferir_humano": false
}`;
  }
}
