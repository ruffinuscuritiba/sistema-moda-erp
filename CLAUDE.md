# CLAUDE.md — Sistema Moda ERP

Memória técnica do projeto. Consultar antes de explorar o código.

---

## Stack

**Backend** (`/backend`): NestJS 11 + TypeScript, Prisma 5 + PostgreSQL, JWT (`@nestjs/jwt` +
`passport-jwt`), bcrypt, class-validator (ValidationPipe global `whitelist` + `forbidNonWhitelisted`
+ `transform`), Helmet, `@nestjs/throttler`.

**Frontend** (`/frontend`): Next.js 14 (App Router) + React 18, Tailwind CSS 3 com tokens de design
via CSS variables (light/dark), Zustand (auth store), axios (interceptor JWT), js-cookie.

---

## Status

Projeto criado do zero em 01/07/2026. **Publicado em produção no mesmo dia** (mesmo padrão
multi-vertical do VPS Hostinger usado pelo food-system-Sas-ERP — ver `project_multi_vertical_vps.md`).

**URLs de produção:**
- Frontend: `https://sistema-moda-erp-frontend.vercel.app`
- Backend: `https://moda-api.srv1747711.hstgr.cloud/api`
- Login demo: `admin@modaerp.com.br` / `ModaDemo@2026` (loja "Loja Demo Moda", segmento MODA, slug `loja-demo-moda`)
- Catálogo digital: `https://sistema-moda-erp-frontend.vercel.app/catalogo/loja-demo-moda`
- Repo GitHub: `https://github.com/ruffinuscuritiba/sistema-moda-erp` (público — necessário para o build
  remoto do Docker no VPS conseguir clonar sem autenticação; sem segredos reais commitados)

**Infra VPS** (`/docker/moda-erp/docker-compose.yml` no host `srv1747711`):
- `moda-postgres` (postgres:16-alpine) + `moda-backend` (build remoto do GitHub `#master:backend`)
- **Importante**: o `context` do build usa a sintaxe `<repo>.git#<branch>:<subdir>` (não só `#<branch>`)
  porque o `Dockerfile` do backend assume que o contexto É a pasta `backend/` (COPY sem prefixo) —
  sem o `:backend` no fim, o build falha com "COPY prisma ./prisma/: not found" (contexto viraria a
  raiz do monorepo). Ver `feedback_deploy_vps.md` / `project_multi_vertical_vps.md` para o padrão geral.
- Nomes de serviço prefixados (`moda-postgres`, `moda-backend`) — nunca genéricos, por causa do bug de
  colisão de DNS documentado no VPS quando múltiplos projetos compartilham a rede `proxy`.
- `.env` do projeto tem `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (gerados nesta sessão, valores
  fortes aleatórios — não reutilizar em outro ambiente).
- Sem seed script rodado em produção — a loja demo foi criada via `POST /auth/signup` real (mais
  simples que rodar `ts-node` numa imagem de produção sem devDependencies).

Local: `npm install` + `prisma generate` + build validados (ver seção "Pendências" no fim deste
arquivo para o que falta ANTES de considerar isso pronto para clientes reais).

---

## Arquitetura

SaaS multi-tenant por `companyId` em toda tabela de domínio. JWT carrega `{sub, email, companyId,
role}`. Nenhum service aceita `companyId` do body — sempre via `@CompanyId()` decorator lendo do
token (`src/common/decorators/company-id.decorator.ts`).

**Onboarding por nicho**: signup escolhe `Segment` (`BRECHO | DEPARTAMENTO | MODA`).
`NicheSeedService.seedForCompany` popula categorias/produtos de exemplo (idempotente — só roda se
`Category.count === 0`). Tema padrão por nicho em `niche-seed.data.ts` (`SEGMENT_THEME`): Brechó =
âmbar terroso, Departamento = índigo (Tech Clean), Moda = dourado (Premium Minimalist).

---

## Estrutura de pastas

```
/backend
  prisma/schema.prisma   # todos os models
  prisma/seed.ts         # loja demo: admin@moda.com / 123456
  src/
    main.ts              # bootstrap (Helmet, CORS, prefix /api, ValidationPipe)
    app.module.ts         # registra todos os módulos + ThrottlerGuard global
    database/            # PrismaModule + PrismaService (readiness gate)
    common/
      decorators/         # CompanyId, CurrentUser, Roles
      guards/             # JwtAuthGuard, RolesGuard, TenantGuard
      filters/            # HttpExceptionFilter
      utils/              # slugify.ts, pricing.ts (getEffectivePrice)
    modules/
      auth/               # signup (com niche seed), login, JWT strategy
      niche-seed/         # dados + service de onboarding por nicho
      company/            # settings (tema/layout) + rota pública por slug
      categories/ products/  # produtos com ProductVariant (tamanho x cor)
      customers/          # clientes + crediário (creditLimit/creditBalance)
      stock/              # StockMovement + ajuste manual + alerta de mínimo
      orders/             # venda (Serializable tx), cancelamento, parcelamento
      installments/        # parcelas do crediário próprio
      conditional/         # "leva pra provar" — reserva e resolução
      catalog/             # catálogo público por slug + registro de visitas
      users/               # equipe (roles ADMIN/MANAGER/SELLER/CASHIER)
      whatsapp-ai/         # assistente de vendas via WhatsApp (Evolution API) — ver seção própria

/frontend
  middleware.ts          # protege /dashboard via cookie "token"
  app/
    login/ signup/       # públicas — signup em 2 passos (nicho → dados)
    dashboard/           # painel admin (layout com Sidebar)
      produtos/ estoque/ clientes/ pedidos/ condicionais/ crediario/ equipe/ configuracoes/ whatsapp-ia/
    catalogo/[slug]/     # catálogo digital público, tema aplicado dinamicamente
  components/
    ui/                  # Button, Input, Card, Badge
    products/ orders/ conditional/  # modais de formulário
    whatsapp/ConnectionQrModal.tsx  # polling de QR Code da conexão WhatsApp
    layout/Sidebar.tsx
    ThemeProvider.tsx    # aplica tema em runtime (usado no dashboard layout)
  lib/theme.ts           # applyStoreTheme() — injeta --color-brand/--radius-button/classe dark
  lib/format.ts          # formatCurrency, formatDate
  services/api.ts        # axios com interceptor JWT (skip em auth/login|signup)
  stores/auth.store.ts    # Zustand — token/user/company em localStorage + cookie
```

---

## Modelos Prisma principais

- `Company` — tenant. Campos de tema: `primaryColor/secondaryColor/backgroundColor/darkMode/
  logoUrl/bannerUrl/layoutType(GRID|LIST)/buttonRadius(SM|MD|LG|FULL)`.
- `User` — `email` globalmente único (login não depende de slug/company).
- `Product` — preço (`costPrice/salePrice`), consignação (`isConsigned/consignorName/
  commissionPercent`), **estado da peça** (`condition: NOVO|SEMINOVO|USADO|COM_DEFEITO` +
  `defectNotes` + `defectPhotoUrl` — transparência de defeito visível no catálogo público),
  **promoção** (`isOnSale/promoPrice/saleStartsAt/saleEndsAt`).
- `ProductVariant` — grade tamanho×cor com estoque próprio (`@@unique([productId,size,color])`).
- `Order`/`OrderItem` — venda imediata (`status COMPLETED` na criação, não é fluxo de cozinha).
  `OrderItem.commissionAmount` calculado se produto é consignado.
- `Installment` — parcelas do `PaymentMethod.STORE_CREDIT`, geradas em `OrdersService.
  createInstallments` (mensal, última parcela absorve arredondamento).
- `ConditionalCheckout`/`ConditionalItem` — "leva pra provar". `resolve()` decide por item
  (`kept` vs devolvido) e cria `Order` só para os itens comprados.
- `CatalogVisit` — analytics leve do catálogo público (contagem por período).

---

## Regras de negócio

**Preço efetivo**: `getEffectivePrice()` (`common/utils/pricing.ts`) — se `isOnSale` e dentro da
janela `saleStartsAt/saleEndsAt` (quando definida), usa `promoPrice`; senão `salePrice`. Usado em
`ProductsService.publicCatalog`, `OrdersService.create` e `ConditionalService.create`.

**Crediário**: venda com `paymentMethod=STORE_CREDIT` exige `customerId`; bloqueia se
`customer.creditBalance + total > customer.creditLimit`. Parcelas geradas automaticamente.
Pagamento de parcela (`InstallmentsService.pay`) decrementa `creditBalance`.

**Condicional**: ao criar, decrementa estoque imediatamente (tipo `EXIT`, não `SALE` — não é venda
ainda). Ao resolver, itens mantidos (`keptVariantIds`) viram `Order` com estoque **não** decrementado
de novo (já saiu no passo anterior); os demais retornam ao estoque (`RETURN`).

**Cancelamento de pedido**: bloqueado se alguma parcela já foi paga. Restaura estoque de todos os
itens e reverte `creditBalance` se era crediário.

**Multi-tenant**: toda query filtra por `companyId` obtido do JWT via `@CompanyId()`. Nunca aceito
do body (única exceção documentada: nenhuma nesta versão — diferente do FoodSaaS que tem
`/orders/public`, aqui não há endpoint público de criação de pedido ainda).

---

## WhatsApp IA — assistente de vendas (módulo `whatsapp-ai`)

Réplica do padrão validado no food-system-Sas-ERP ("Kely"), adaptado ao domínio de moda/vestuário.
Construído do zero nesta sessão — antes não existia nenhum código de WhatsApp no projeto.

**Models** (`WhatsappConnection`/`WhatsappConversation`/`WhatsappMessage`, migration
`20260707212723_add_whatsapp_ai`): uma `WhatsappConnection` por loja (1:N — a loja pode ter mais de
uma, mas hoje o fluxo assume uma ativa por vez), `WhatsappConversation` por `(connectionId, phone)`
com `context: Json` guardando o carrinho atual, `WhatsappMessage` como histórico IN/OUT usado para dar
contexto de conversa à IA.

**Servidor Evolution API compartilhado**: mesmo servidor usado pelo food-system e (no futuro) pela
oficina — `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` no `.env`. Isolamento por **prefixo obrigatório de
instância `moda-`** (`INSTANCE_PREFIX` em `evolution-provision.service.ts`): toda criação/deleção de
instância confere o prefixo antes de qualquer chamada destrutiva — nunca é possível mexer numa
instância de outro projeto (`kely-...` do food-system, futura `oficina-...`) por engano.
`instanceName = moda-{slug}-{companyId.slice(0,8)}-{timestamp36}`.

**Fluxo de checkout — decisão de produto importante**: `OrdersService.create()` (venda de balcão)
sempre marca `status: COMPLETED` e consome estoque na hora — não serve para checkout autônomo de bot.
Por isso `createFromWhatsapp()` (método aditivo, não altera `create()`) cria o pedido como
**`PENDING`**: reserva o estoque na hora (evita duas pessoas reservarem a mesma peça única de
brechó) mas **não fecha a venda** — a loja confirma presencialmente quando o cliente vem provar/pagar,
via `completePending()` (`PATCH /orders/:id/complete`, novo endpoint) ou cancela via `cancel()` já
existente (reaproveitado sem alteração, libera a reserva). `STORE_CREDIT` é **rejeitado** em
`createFromWhatsapp` — crediário próprio sempre exige avaliação humana na loja.

**Núcleo do bot** (`whatsapp-ai.service.ts`): webhook Evolution (`POST
/whatsapp-ai/webhook/:connectionId`, público, parse compatível v1/v2 — mesmo padrão de
`msgData = data.messages?.[0] ?? data` documentado no food-system) → carrega/cria
`WhatsappConversation` → injeta catálogo via `ProductsService.publicCatalog()` (reaproveitado, não
duplicado) + carrinho persistido em `context` no prompt → chama IA (**Anthropic primário, Gemini como
fallback automático** — mesmo padrão de confiabilidade do food-system) esperando JSON estrito
`{resposta_cliente, carrinho, finalizar_pedido, forma_pagamento, transferir_humano}` → se
`finalizar_pedido && carrinho.length > 0`, chama `createFromWhatsapp` e responde com o número do
pedido. Erros em qualquer etapa (IA sem provedor configurado, Evolution fora do ar) são capturados e
logados — o webhook sempre responde `{ok:true}` para não gerar retry infinito da Evolution API.

**Env vars novas** (`.env.example` atualizado): `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`,
`BACKEND_URL` (usada para montar a URL do webhook no provisionamento), `ANTHROPIC_API_KEY` +
`ANTHROPIC_MODEL` (default `claude-haiku-4-5-20251001`), `GEMINI_API_KEY` + `GEMINI_MODEL` (fallback,
default `gemini-2.0-flash`). Projeto não usa `@nestjs/config` — lidas via `process.env` direto, como
o resto do projeto já faz (`main.ts`).

**Frontend**: `/dashboard/whatsapp-ia` — cria conexão, mostra modal de QR Code (polling 3s via
`GET /connections/:id/qr` até `isActive`), lista conexões com status/telefone, botão remover. Item
"WhatsApp IA" na sidebar (ícone `MessageCircle`). `/dashboard/pedidos` ganhou badge "Reservado
(WhatsApp)" para `status=PENDING` + botão "Confirmar" (chama `completePending`) ao lado do
"Cancelar" já existente.

**Validado localmente nesta sessão** (Postgres throwaway em Docker, sem tocar produção/nenhum número
real): migration aplicada, `tsc`/`nest build`/`next build` limpos, webhook simulado via curl
(parse correto + degrada graciosamente sem crashar quando não há chave de IA configurada), e um
script temporário (apagado após uso) validou via `OrdersService` direto: `STORE_CREDIT` rejeitado,
reserva de estoque em `createFromWhatsapp`, `completePending` muda para `COMPLETED` e rejeita
segunda chamada, `cancel()` restaura estoque corretamente. **Não conectado nenhum WhatsApp real** —
fica para quando o usuário quiser escanear o QR Code de verdade.

**Fora de escopo desta sessão**: réplica do mesmo padrão para Estética (vai migrar de Meta Cloud API
para Evolution API primeiro) e Oficina (adicionar roteamento por `:connectionId` no lugar do
`resolverOficinaAtual()` atual, que assume 1 instância global).

---

## Convenções

- Idioma: PT-BR em mensagens de erro e UI. Código em inglês.
- Path alias frontend: `@/*` → raiz de `/frontend`. Backend: `@/*` → `src/`.
- Money: Prisma `Decimal @db.Decimal(10,2)`; sempre `Number(...)` antes de cálculos no JS.
- Tema por loja: nunca hardcode cor de marca — sempre `var(--color-brand)` (Tailwind `bg-brand`,
  `text-brand` etc.), injetado via `applyStoreTheme()`.

---

## Pendências (antes de considerar "pronto para produção")

1. ~~Nunca rodado~~ **Validado localmente** (sessão do módulo WhatsApp IA): `npm install`,
   `npx prisma generate`, `npx prisma migrate dev` e `npm run build` de ambos rodaram limpos contra
   um Postgres throwaway em Docker. Falta ainda validar contra o Postgres real de produção do VPS
   antes do próximo deploy (rodar `prisma migrate deploy` lá, não `migrate dev`).
2. **CRUD de categorias na UI**: endpoints prontos (`/categories`), sem tela — hoje só existem as
   categorias criadas pelo onboarding por nicho.
3. **Upload de imagem real**: `imageUrl`/`logoUrl`/`bannerUrl`/`defectPhotoUrl` são campos de texto
   (cole uma URL). Sem integração de upload (Cloudinary/S3) ainda.
4. **Split de pagamento da consignação**: comissão é calculada e fica em `OrderItem.
   commissionAmount`, mas não há tela de "acerto com fornecedor" nem repasse automático.
5. **PDV dedicado**: a "Nova venda" no painel (`/dashboard/pedidos`) cobre o fluxo básico, mas não
   é uma tela de caixa full-screen/offline como pedido no briefing original.
6. **Sem testes automatizados**.
7. **JWT_SECRET**: sem fallback (por design — falha explícita se env não setado, diferente do
   FoodSaaS que documentou esse risco). Configurar em produção.
