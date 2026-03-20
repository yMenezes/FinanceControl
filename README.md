<div align="center">

# 💸 FinTrack

**EN** | [PT-BR](#pt-br)

> A personal finance web application to track credit card expenses, installments, and spending by person.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel)

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Project Structure](#project-structure) · [Database Schema](#database-schema) · [Contributing](#contributing)

---

</div>

## Features

- 💳 **Credit card management** — register cards with closing day, due date and spending limit
- 📦 **Installment tracking** — launch a purchase in N installments and the app distributes each parcel across the correct months automatically
- 🗂️ **Categories** — create custom categories with icon and color
- 👥 **Spending by person** — tag expenses to a specific person (e.g. a family member using your card) and see how much they owe you
- 📊 **Monthly dashboard** — overview of invoices, totals per card and spending breakdown
- 🔐 **Authentication** — secure login via Supabase Auth (email/password and OAuth)
- 🌙 **Dark mode** — fully supported

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) | Full-stack in one project, Server Components, API Routes |
| Language | [TypeScript](https://www.typescriptlang.org/) | Type safety, better DX, required in serious projects |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | Utility-first, fast to build, easy to maintain |
| Components | [shadcn/ui](https://ui.shadcn.com/) | Accessible, unstyled-by-default, copy-paste components |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) | Free tier, built-in auth, Row Level Security |
| Auth | [Supabase Auth](https://supabase.com/docs/guides/auth) | JWT sessions, OAuth providers, SSR-ready |
| Deploy | [Vercel](https://vercel.com/) | Zero-config deploy for Next.js, free for personal projects |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Performant forms with schema validation |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A free [Supabase](https://supabase.com/) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/fintrack.git
cd fintrack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run the migration file:

```bash
# The schema is located at:
docs/database/schema.sql
```

3. Enable **Row Level Security** — all policies are included in the schema file.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> ⚠️ Never commit `.env.local` to version control. It's already in `.gitignore`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the login page.

---

## Project Structure

```
fintrack/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group — no sidebar layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                    # Route group — with sidebar layout
│   │   ├── layout.tsx            # Sidebar + Navbar (shared)
│   │   ├── dashboard/page.tsx    # Monthly overview
│   │   ├── transactions/
│   │   │   ├── page.tsx          # Expense list with filters
│   │   │   └── new/page.tsx      # New expense form
│   │   ├── cards/page.tsx        # Cards and invoices
│   │   ├── people/page.tsx       # Spending by person
│   │   └── categories/page.tsx   # Category management
│   ├── api/                      # API Routes (backend)
│   │   ├── transactions/route.ts
│   │   ├── cards/route.ts
│   │   ├── people/route.ts
│   │   └── categories/route.ts
│   ├── layout.tsx                # Root layout (providers)
│   └── page.tsx                  # Root — redirects to /dashboard
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── transactions/             # TransactionForm, TransactionList, etc.
│   ├── cards/                    # CardWidget, InvoiceCalendar, etc.
│   ├── dashboard/                # Charts, summary widgets
│   └── layout/                   # Sidebar, Navbar, MobileMenu
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client (API Routes + Server Components)
│   ├── installments.ts           # Core logic: generate installment rows from a purchase
│   ├── validations.ts            # Zod schemas for all forms
│   └── utils.ts                  # Currency formatting, date helpers
├── types/
│   └── database.ts               # Auto-generated Supabase types
├── docs/
│   ├── database/
│   │   └── schema.sql            # Full DB schema with RLS policies
│   ├── ARCHITECTURE.md           # Deep-dive into technical decisions
│   └── CONTRIBUTING.md           # How to contribute
├── middleware.ts                 # Auth guard — redirects unauthenticated users
├── .env.example                  # Environment variable template
└── README.md
```

---

## Database Schema

See the full schema with RLS policies in [`docs/database/schema.sql`](docs/database/schema.sql).

```
users ──< cards
users ──< categories
users ──< people
users ──< transactions >── cards
                       >── categories
                       >── people
transactions ──< installments
```

The key design decision: a purchase creates one `transaction` row and N `installment` rows (one per month). This keeps queries simple — to get "what's on my invoice for March", you just filter `installments` by `reference_month` and `reference_year`.

---

## Key Concepts

### Installment generation

When you add an expense with 5 installments starting in January:

```
transaction: { description: "iPhone case", total: 495.00, installments_count: 5 }

installments auto-generated:
  { number: 1, amount: 99.00, reference_month: 1, reference_year: 2025 }
  { number: 2, amount: 99.00, reference_month: 2, reference_year: 2025 }
  { number: 3, amount: 99.00, reference_month: 3, reference_year: 2025 }
  { number: 4, amount: 99.00, reference_month: 4, reference_year: 2025 }
  { number: 5, amount: 99.00, reference_month: 5, reference_year: 2025 }
```

### Invoice closing day logic

Each card has a `closing_day`. When you add an expense, the app determines which month's invoice it belongs to based on the purchase date and the card's closing day.

### Row Level Security (RLS)

Every table has RLS enabled. Users can only read and write their own data — enforced at the database level, not just in application code. This means even if there's a bug in the API, data from other users is never exposed.

---

## Roadmap

- [x] Project setup and documentation
- [ ] Authentication (login, register, session)
- [ ] Card management (CRUD)
- [ ] Category management (CRUD)
- [ ] People management (CRUD)
- [ ] Transaction launch with installment generation
- [ ] Monthly invoice view
- [ ] Dashboard with charts
- [ ] Spending by person report
- [ ] Mark installments as paid
- [ ] CSV export
- [ ] Email reminders (Resend)

---

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center" id="pt-br">

---

# 💸 FinTrack — Documentação em Português

</div>

> Aplicação web de finanças pessoais para controlar gastos no cartão de crédito, parcelamentos e despesas por pessoa.

## Funcionalidades

- 💳 **Gestão de cartões** — cadastre cartões com dia de fechamento, vencimento e limite
- 📦 **Controle de parcelas** — lance uma compra em N vezes e o app distribui cada parcela nos meses corretos automaticamente
- 🗂️ **Categorias** — crie categorias personalizadas com ícone e cor
- 👥 **Gastos por pessoa** — vincule despesas a uma pessoa específica (ex: familiar usando seu cartão) e veja quanto ela te deve
- 📊 **Dashboard mensal** — visão geral de faturas, totais por cartão e detalhamento de gastos
- 🔐 **Autenticação** — login seguro via Supabase Auth (email/senha e OAuth)
- 🌙 **Modo escuro** — suporte completo

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Uma conta gratuita no [Supabase](https://supabase.com/)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/fintrack.git
cd fintrack

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local com suas chaves do Supabase

# 4. Rode o banco de dados
# Acesse o SQL Editor do Supabase e execute: docs/database/schema.sql

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Stack utilizada

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack em um projeto, Server Components, API Routes |
| Linguagem | TypeScript | Tipagem, melhor DX, padrão do mercado |
| Estilização | Tailwind CSS | Utilitários, rápido de construir |
| Componentes | shadcn/ui | Acessíveis, customizáveis, sem dependência de estilo |
| Banco de dados | Supabase (PostgreSQL) | Free tier generoso, auth integrado, RLS |
| Deploy | Vercel | Deploy zero-config para Next.js, gratuito para projetos pessoais |

## Conceitos importantes para estudo

### Server Components vs Client Components

No Next.js 14 com App Router, componentes são **Server Components por padrão** — rodam no servidor, buscam dados direto no banco e enviam HTML pronto ao browser (sem JS extra). Só adicione `'use client'` quando precisar de interatividade (useState, useEffect, eventos de clique).

### API Routes

Os arquivos em `app/api/*/route.ts` são o backend da aplicação. Cada arquivo exporta funções `GET`, `POST`, `PATCH`, `DELETE` que respondem a requisições HTTP — exatamente como um servidor Express, mas dentro do mesmo projeto Next.js.

### Row Level Security (RLS)

Cada tabela no Supabase tem RLS ativado. Isso significa que as regras de acesso ficam no banco de dados — mesmo que haja um bug no código da API, nenhum usuário consegue ver dados de outro. É uma camada extra de segurança muito valorizada.

### Geração de parcelas

Uma compra parcelada cria **uma linha** em `transactions` e **N linhas** em `installments` (uma por mês). Para buscar "o que está na fatura de março", basta filtrar `installments` por `reference_month = 3`. Simples e eficiente.
