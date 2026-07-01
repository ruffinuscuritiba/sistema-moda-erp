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

Projeto criado do zero em 01/07/2026 como scaffold inicial (MVP funcional, não testado em produção).
`npm install` + `prisma generate` + build ainda precisam ser validados no ambiente de destino — ver
seção "Pendências" no fim deste arquivo.

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

/frontend
  middleware.ts          # protege /dashboard via cookie "token"
  app/
    login/ signup/       # públicas — signup em 2 passos (nicho → dados)
    dashboard/           # painel admin (layout com Sidebar)
      produtos/ estoque/ clientes/ pedidos/ condicionais/ crediario/ equipe/ configuracoes/
    catalogo/[slug]/     # catálogo digital público, tema aplicado dinamicamente
  components/
    ui/                  # Button, Input, Card, Badge
    products/ orders/ conditional/  # modais de formulário
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

## Convenções

- Idioma: PT-BR em mensagens de erro e UI. Código em inglês.
- Path alias frontend: `@/*` → raiz de `/frontend`. Backend: `@/*` → `src/`.
- Money: Prisma `Decimal @db.Decimal(10,2)`; sempre `Number(...)` antes de cálculos no JS.
- Tema por loja: nunca hardcode cor de marca — sempre `var(--color-brand)` (Tailwind `bg-brand`,
  `text-brand` etc.), injetado via `applyStoreTheme()`.

---

## Pendências (antes de considerar "pronto para produção")

1. **Nunca rodado**: `npm install` (backend e frontend), `npx prisma generate`,
   `npx prisma migrate dev`, `npm run build` de ambos — validar nesta ordem antes de deploy.
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
