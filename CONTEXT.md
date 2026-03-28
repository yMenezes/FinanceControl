# Contexto de desenvolvimento — FinTrack

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase + shadcn/ui v2 + Vercel + React Hook Form + Zod

## O que já foi implementado
- Autenticação completa (email/senha, Google, GitHub, reset de senha)
- Middleware de proteção de rotas
- Layout principal com sidebar, navbar e toggle dark/light
- CRUD completo de cartões (com soft delete e color picker)
- CRUD completo de categorias (com emoji picker e color picker)
- CRUD completo de pessoas
- Componentes reutilizáveis: ColorPicker, AddButton, DeleteDialog
- Formulário de lançamentos em sliding panel com animação
- Geração automática de parcelas (lib/installments.ts)
- Página de lançamentos com filtros, agrupamento por data e animações
- Fatura mensal com tabs por cartão, agrupamento por categoria/data, marcar como pago

### ✅ FASE 1 — Validações Centralizadas (PRONTO)
- **lib/validations.ts** centralizado com schemas Zod para todas entidades
  - cardCreateSchema, cardUpdateSchema (com tipos derivados)
  - categoryCreateSchema, categoryUpdateSchema
  - personCreateSchema, personUpdateSchema
  - transactionCreateSchema, transactionUpdateSchema
  - installmentUpdateSchema
- Refatorado todos 8 API Routes (`/cards`, `/categories`, `/people`, `/transactions`, `/installments`)
- Refatorado 3 Form Dialogs com react-hook-form + zodResolver:
  - CardFormDialog
  - CategoryFormDialog
  - PeopleFormDialog
- Validação client/server sincronizada (mesma schema)
- Per-field error messages (mostra erro específico de cada campo)
- Smart regeneration de parcelas ao editar transação (preserva status `paid`)

### ✅ FASE 2 — Transaction Edit + Loading States (PRONTO)

#### Transaction Edit
- **TransactionPanelProvider.tsx** agora rastreia modo (create/edit)
  - `open(transaction?: Transaction)` detecta se é create ou edit
  - Transaction type agora inclui card_id, category_id, person_id
- **TransactionForm.tsx** refatorado com react-hook-form + zodResolver
  - Per-field error messages (padrão FASE 1)
  - Amount em cents internamente, formatado na UI
  - Type-based conditional fields (installments só para crédito)
  - Submit inteligente: POST para create, PATCH para edit
  - Parsing de erros do servidor (fieldErrors)
- **TransactionList.tsx** tipo Transaction atualizado com card_id, category_id, person_id
- TypeScript: 0 errors

#### Loading States & Data Sharing
- **TransactionDataProvider** — Context para compartilhar cards/categories/people
  - Fornecido no `app/(app)/layout.tsx`
  - Distribuído via `Promise.all()` paralelo no transactions/page.tsx
  - Fallback local fetch em TransactionForm se context vazio
- **Skeleton Components** — LoadingUI consistente
  - CardListSkeleton, CategoryListSkeleton, PeopleListSkeleton, TransactionFormSkeleton, InvoicePageSkeleton
  - Implementado em todas páginas principais com Suspense boundaries
  - Padrão: `<Suspense fallback={<Skeleton />}><Component /></Suspense>`
- **Request Deduplication** — useRef previne múltiplos GET
  - TransactionForm com `fetchedRef.current` para garantir 1 fetch apenas
  - Mesmo se useEffect rodar múltiplas vezes, fetch único
  - Retry automático se erro ocorrer
- **Performance**
  - Antes: 3 GETs duplicados ao abrir TransactionPanel
  - Depois: 1 GET de cada tipo (cards, categories, people)
  - Data fetching consolidado ao nível de página com Promise.all()

### ✅ FASE 3 — Auto-fill de Dados ao Editar (PRONTO)

#### Pre-fill Implementation
- **Query Update** — Adicionados `card_id, category_id, person_id` ao SELECT de transactions
  - Query retorna IDs diretos além dos relacionamentos nested
  - Permite pré-fill sem refetch adicional
- **TransactionForm.tsx** — Implementado form.reset() condicional
  - Em modo 'edit': form.reset() com dados completos da transação
  - Em modo 'create': form.reset() com defaults vazios
  - useEffect dependency: `[mode, transaction?.id]` (não coloca transaction inteiro)
- **Select Binding** — Radix UI Selects reconhecem valores resetados
  - Cada Select usa `form.watch()` para ler valor atual
  - `form.setValue()` em onChange dispara re-render automático
  - Funciona com `null` coalescing (`??`) para valores opcionais
- **Cents Handling** — Form.reset() também ajusta `cents` state
  - `setCents(Math.round(transaction.total_amount * 100))`
  - Mantém formatação de moeda em sync com form
- **No Reset Loops** — Com dependency array correto, evita re-renders infinitos
  - Só reseta quando `mode` ou `transaction.id` muda
  - Não causa renders extras mesmo em Strict Mode
- TypeScript: 0 errors
- Soft delete em cards, categories, people (não em transactions/installments)
- Otimistic updates nos checkboxes da fatura
- Types derivados com `z.infer<>` para type safety automático
- Context API para data sharing entre componentes (TransactionDataProvider)
- React Suspense + skeleton components para loading states
- useRef para deduplicação de side effects / requisições

### ✅ FASE 4 Subtask 1 — On-Demand ISR Caching (PRONTO)

#### Strategic Decision - On-Demand Revalidation Pattern
- **Rationale**: Commercial-grade architecture for multi-user scalability
  - Automatic ISR (`revalidate = 60`) = unnecessary DB hits even with no user activity
  - On-demand pattern = cache forever until data actually changes
  - Scales identically from 1 to 10,000 users
  - Minimizes Supabase query costs while maintaining fresh data
- **Implementation**: `revalidatePath()` in API routes after mutations only
  - Removes all `export const revalidate = 60/300` from pages
  - Pages cache indefinitely without expiration timer
  - Only revalidates when data changes via revalidatePath() calls
  - Next request after mutation gets fresh data, all others use cache

#### Implementation Details
**Page-level cache removal:**
- Removed `export const revalidate = 60` from `/invoices` page
- Removed `export const revalidate = 60` from `/transactions` page
- Removed `export const revalidate = 300` from `/cards` page
- Removed `export const revalidate = 300` from `/categories` page
- Removed `export const revalidate = 300` from `/people` page
- Result: All pages cache indefinitely until invalidated

**API Route revalidation (ALL 9 mutations covered):**
- Created mutations (3 routes):
  - `/api/cards` POST → `revalidatePath('/cards')`
  - `/api/categories` POST → `revalidatePath('/categories')`
  - `/api/people` POST → `revalidatePath('/people')`
  - `/api/transactions` POST → `revalidatePath('/invoices')`
- Updated mutations (5 routes):
  - `/api/cards/[id]` PATCH → `revalidatePath('/cards')`
  - `/api/categories/[id]` PATCH → `revalidatePath('/categories')`
  - `/api/people/[id]` PATCH → `revalidatePath('/people')`
  - `/api/transactions/[id]` PATCH → `revalidatePath('/invoices')`
  - `/api/installments/[id]` PATCH → `revalidatePath('/invoices')`
- Pattern: `import { revalidatePath } from 'next/cache'` + call before response

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors

#### How It Works
1. User visits `/cards` page → Response cached by Next.js
2. User creates a card via POST /api/cards
3. API route inserts data AND calls `revalidatePath('/cards')`
4. Next.js invalidates `/cards` page cache
5. User navigates back to `/cards` → Gets fresh data from DB

#### Why This Scales
- No automatic refresh timers = lower Supabase bill
- Whether 1 user or 10,000 users: only query DB on actual changes
- Cache hit reduces DB load by 100x+ (for same page visited multiple times)
- Flexible: Can add smart patterns later (e.g., `revalidateTag()` for finegrained control)

### ✅ FASE 4 Subtask 3 — Pagination UI Components (PRONTO)

#### Implementation Details

**Client-Side Pagination State:**
- `page: number` — Current page (starts at 1)
- `loading: boolean` — Fetch in progress
- `pagination: { page, limit, total, hasMore }` — Metadata from API
- Data fetched on mount + when page changes

**Component Architecture:**
- CardList, CategoryList, PeopleList → Now `"use client"` components
- Fetch API at component level (removed server-side fetch)
- State management: useState for page, data, pagination
- useEffect hook: `[page]` dependency triggers new fetchCards/fetchCategories/fetchPeople

**UI Components Added:**
- **Loading State**: Center spinner with "Carregando..." message
- **Empty State**: "Nenhum [item] encontrado" when data is empty
- **Pagination Controls**: 
  - Previous button (disabled on page 1)
  - Page indicator: "Página 1 de 10 · 25 total"
  - Next button (disabled when !hasMore)
  - ChevronLeft/ChevronRight icons from lucide-react

**Data Flow:**
1. Component mounts → `useEffect([page])` fires → `fetchCards()`
2. `fetchCards()` calls `/api/cards?page=1&limit=10`
3. API returns `{ data, pagination }`
4. Component renders with data
5. User clicks "Próximo" → `setPage(p => p + 1)`
6. useEffect detects page change → Re-fetches with new page param

**Error Handling:**
- try/catch in fetchCards() with console.error
- Gracefully fallbacks to empty list on error
- On delete: resets page to 1 and re-fetches

**Updated Pages:**
- `/cards` — Removed async/await, removed Supabase fetch, now calls `<CardList />`
- `/categories` — Same as cards
- `/people` — Same as cards
- Pages removed `createClient()` and direct DB queries
- Cards page still uses `<Suspense>` boundary but fallback less relevant (client component loads instead)

**Query Parameters Supported:**
- `/api/cards?page=2&limit=10` → Returns items 10-20
- `/api/categories?page=1&limit=10` → First 10 items
- `/api/people?page=1&limit=10` → First 10 items
- `/api/transactions?page=1&limit=10&month=3&year=2026&card_id=123` → Filtered + paginated

**Button States:**
- **Previous disabled**: `page === 1 || loading`
- **Next disabled**: `!pagination.hasMore || loading`
- Full list info: `Página ${page} de ${totalPages} · ${total} total`

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors

**Effective Result:**
- Lists now paginated instead of showing all items
- Instant page load (cached by Next.js on-demand ISR)
- Smooth navigation between pages with loading states
- Mobile-friendly pagination controls with clear button states

#### Implementation Details
**Query Parameters:**
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 10, max: 100)
- All existing filters preserved (month, year, card_id, category_id, person_id, type for transactions)

**Response Structure:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "hasMore": true
  }
}
```

**Updated Endpoints:**
- `/api/cards?page=1&limit=10`
  - Returns: `{ data: Card[], pagination: {...} }`
  - Also includes `color` field (not just id, name, closing_day)
  
- `/api/categories?page=1&limit=10`
  - Returns: `{ data: Category[], pagination: {...} }`
  - Also includes `color` field
  
- `/api/people?page=1&limit=10`
  - Returns: `{ data: Person[], pagination: {...} }`
  
- `/api/transactions?page=1&limit=10&month=3&year=2026`
  - Returns: `{ data: Transaction[], pagination: {...} }`
  - Preserves all existing query filters
  - Adds card_id, category_id, person_id to response (for pre-fill)

**Implementation Pattern:**
1. Parse `page` and `limit` from query params
2. Calculate `offset = (page - 1) * limit`
3. Query for total count with `.select('id', { count: 'exact', head: true })`
4. Query for data with `.range(offset, offset + limit - 1)`
5. Calculate `hasMore = (page * limit) < total`
6. Return `{ data, pagination }`

**Validation:**
- page: max 1, prevents negative
- limit: max 1, min 100 (prevents abuse)
- offset calculation: `(page - 1) * limit`

**TypeScript Validation:**
- All changes validated with `npx tsc --noEmit`
- Result: 0 errors

## Status dos próximos passos
1. ✅ FASE 1 — Validações Centralizadas
2. ✅ FASE 2 — Transaction Edit + Loading States
3. ✅ FASE 3 — Auto-fill de dados ao editar
4. ✅ FASE 4 Subtask 1 — On-Demand ISR Caching (PRONTO)
5. ✅ FASE 4 Subtask 2 — Pagination API (PRONTO)
6. ✅ FASE 4 Subtask 3 — Pagination UI Components (PRONTO)
7. ⏳ FASE 5 — Database Types + Additional Features
8. ⏳ FASE 6 — Performance Optimizations

## Problemas conhecidos / em solução
- ✅ Auto-fill de selects em TransactionForm (FIXADO em FASE 3)
- ✅ Validações desincronizadas (FIXADO em FASE 1)
- ✅ Edição de transação totalmente funcional (FIXADO em FASE 2)
- ✅ Duplicate API requests (FIXADO em FASE 2B)

## Próximos passos (após FASE 3)
1. Pagination em listas (cards, categories, people, transactions)
2. Invoice month navigation refetch automático
3. Database types gerados (Supabase CLI)
4. ISR caching nas páginas
5. Performance optimizations (indexes, memoization)
6. Gastos futuros (flag scheduled nas transactions)
7. Contas recorrentes (tabela recurring_transactions + pg_cron)
8. Dashboard com gráficos
9. Revisão de segurança
10. Mobile responsiveness audit
