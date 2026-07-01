# Sistema Moda ERP

SaaS multi-loja para varejo de moda — brechó, loja de departamento e grandes marcas — com
catálogo digital, PDV com crediário próprio e condicional ("leva pra provar").

## Stack

**Backend** (`/backend`)
- NestJS 11 + TypeScript
- Prisma 5 + PostgreSQL
- JWT (`@nestjs/jwt` + `passport-jwt`)
- bcrypt, class-validator, Helmet, Throttler

**Frontend** (`/frontend`)
- Next.js 14 (App Router) + React 18
- Tailwind CSS 3 com tokens de design (light/dark) por CSS variables
- Zustand (auth store) + axios + js-cookie

## Como rodar localmente

### 1. Banco de dados
Suba um PostgreSQL local (ou use um serviço gerenciado) e copie `.env.example` para `.env` em `/backend`:

```
cp backend/.env.example backend/.env
```

Ajuste `DATABASE_URL` e `JWT_SECRET`.

### 2. Backend

```
cd backend
npm install
npx prisma migrate dev --name init
npm run seed        # opcional: cria "Loja Demo Moda" (admin@moda.com / 123456)
npm run start:dev
```

API sobe em `http://localhost:3001/api`.

### 3. Frontend

```
cd frontend
npm install
```

Crie `.env.local` com:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

```
npm run dev
```

Painel em `http://localhost:3000`.

## Arquitetura multi-tenant

Isolamento por `companyId` em toda tabela de domínio, validado em duas camadas:
1. JWT carrega `companyId` (assinado no login/signup)
2. Todo service filtra queries Prisma por `companyId` — nunca aceito do body

## Onboarding por nicho ("motor de criação")

No signup, o lojista escolhe um nicho (`BRECHO`, `DEPARTAMENTO`, `MODA`). Isso:
- Aplica uma paleta de cores padrão diferente por nicho (`niche-seed.data.ts`)
- Popula categorias e produtos de exemplo (`NicheSeedService.seedForCompany`) — a loja não nasce vazia

## Módulos implementados

- **Catálogo**: categorias, produtos com grade tamanho×cor (`ProductVariant`), estado da peça
  (`NOVO/SEMINOVO/USADO/COM_DEFEITO` com campo de observação — transparência de defeito),
  promoção/queima de estoque (`isOnSale` + `promoPrice` + janela de datas)
- **Estoque**: movimentações tipadas (`ENTRY/EXIT/SALE/RETURN/ADJUSTMENT/LOSS`), alerta de estoque mínimo
- **Consignação (brechó)**: `Product.isConsigned` + `commissionPercent` — comissão calculada
  automaticamente em `OrderItem.commissionAmount` na venda
- **Crediário próprio**: pagamento `STORE_CREDIT` gera parcelas (`Installment`) e debita
  `Customer.creditBalance` contra `Customer.creditLimit`; tela de recebimento em `/dashboard/crediario`
- **Condicional ("leva pra provar")**: `ConditionalCheckout` reserva peças (sai do estoque),
  e ao resolver (`/conditional/:id/resolve`) o que foi comprado vira `Order`, o resto volta ao estoque
- **Catálogo digital público**: `/catalogo/[slug]`, tema por loja (cor, layout grade/lista, raio de
  botão), contagem de visitas (`CatalogVisit`) exibida no dashboard com botão de copiar link

## O que NÃO foi implementado (roadmap)

Itens do briefing original que ficaram de fora do MVP por escopo/tempo — a base de dados e a
arquitetura já preveem onde eles se encaixam:

- **Split de pagamento** para consignação (hoje a comissão é só calculada e registrada; o repasse
  financeiro ao fornecedor é manual)
- **Omnichannel de estoque** (vender do estoque de outra filial/e-commerce)
- **PDV offline-first** (hoje depende de conexão com a API)
- **Emissão fiscal (NFC-e/SAT)**
- **CRUD de categorias na UI** (endpoints existem em `/categories`, mas a tela de gestão ainda não
  foi construída — categorias vêm prontas do onboarding por nicho)
- **App mobile / PWA**

## Estrutura de pastas

```
/backend
  prisma/schema.prisma       # modelos multi-tenant
  prisma/seed.ts             # loja demo
  src/
    main.ts, app.module.ts
    database/                # PrismaModule + PrismaService (readiness)
    common/                  # guards, decorators, filters, utils (slugify, pricing)
    modules/
      auth/ niche-seed/ company/ categories/ products/
      customers/ stock/ orders/ installments/ conditional/ catalog/ users/

/frontend
  middleware.ts              # protege /dashboard via cookie
  app/
    login/ signup/           # públicas
    dashboard/                # painel admin (produtos, estoque, clientes, pedidos,
                               #   condicionais, crediário, equipe, configurações)
    catalogo/[slug]/          # catálogo digital público
  components/ui/             # Button, Input, Card, Badge
  components/products|orders|conditional/  # modais de formulário
  lib/                        # theme.ts (tokens dinâmicos por loja), format.ts
  services/                   # api.ts (axios), env.ts
  stores/auth.store.ts        # Zustand
```
