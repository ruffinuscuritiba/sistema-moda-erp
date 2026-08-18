import { Injectable, Logger } from '@nestjs/common';

export interface EvolutionCreds {
  baseUrl: string;
  apiKey: string;
}

/** Chamadas HTTP de baixo nível ao Evolution API — sem noção de tenant/DB. */
@Injectable()
export class EvolutionClientService {
  private readonly log = new Logger(EvolutionClientService.name);

  private async request(creds: EvolutionCreds, method: string, path: string, body?: unknown) {
    const url = `${creds.baseUrl.replace(/\/$/, '')}${path}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', apikey: creds.apiKey },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(45_000),
      });
    } catch (err: any) {
      this.log.error(`Evolution ${method} ${path} -> erro de conexão: ${err?.message ?? err}`);
      throw new Error(`Não foi possível conectar à Evolution API (${err?.message ?? 'timeout'}).`);
    }

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!res.ok) {
      this.log.warn(`Evolution ${method} ${path} -> ${res.status}: ${text.slice(0, 200)}`);
    }
    return { ok: res.ok, status: res.status, data };
  }

  async createInstance(creds: EvolutionCreds, instanceName: string): Promise<{ qrCode: string | null }> {
    const { ok, data } = await this.request(creds, 'POST', '/instance/create', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });
    if (!ok) throw new Error(`Falha ao criar instância Evolution: ${JSON.stringify(data)}`);
    const d = data as any;
    return { qrCode: d?.qrcode?.base64 ?? d?.hash?.qrcode ?? d?.base64 ?? null };
  }

  async getQrCode(creds: EvolutionCreds, instanceName: string): Promise<string | null> {
    const { ok, data } = await this.request(creds, 'GET', `/instance/connect/${instanceName}`);
    if (!ok) return null;
    const d = data as any;
    return d?.base64 ?? d?.qrcode?.base64 ?? null;
  }

  async getState(creds: EvolutionCreds, instanceName: string): Promise<'open' | 'connecting' | 'close'> {
    const { ok, data } = await this.request(creds, 'GET', `/instance/connectionState/${instanceName}`);
    if (!ok) return 'close';
    const state = (data as any)?.instance?.state ?? (data as any)?.state ?? 'close';
    if (state === 'open') return 'open';
    if (state === 'connecting') return 'connecting';
    return 'close';
  }

  /**
   * Evolution API v2.x exige o payload aninhado em `webhook: {...}` com camelCase
   * (`webhookByEvents`) — o formato flat antigo retorna 400 nessa versão.
   */
  async setWebhook(creds: EvolutionCreds, instanceName: string, webhookUrl: string): Promise<void> {
    await this.request(creds, 'POST', `/webhook/set/${instanceName}`, {
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      },
    });
  }

  async getPhoneNumber(creds: EvolutionCreds, instanceName: string): Promise<string | null> {
    const { ok, data } = await this.request(creds, 'GET', '/instance/fetchInstances');
    if (!ok) return null;
    const arr = Array.isArray(data) ? data : ((data as any)?.instances ?? []);
    const inst = arr.find((i: any) => i.name === instanceName || i.instance?.instanceName === instanceName);
    return inst?.instance?.owner ?? inst?.owner ?? null;
  }

  async deleteInstance(creds: EvolutionCreds, instanceName: string): Promise<void> {
    await this.request(creds, 'DELETE', `/instance/delete/${instanceName}`);
  }

  async sendText(creds: EvolutionCreds, instanceName: string, phone: string, text: string): Promise<void> {
    const { ok } = await this.request(creds, 'POST', `/message/sendText/${instanceName}`, { number: phone, text });
    if (!ok) this.log.warn(`Falha ao enviar mensagem para ${phone} via instância ${instanceName}`);
  }
}
