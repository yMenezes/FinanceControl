import { z } from 'zod'

// ──────────────────────────────────────────────────────────────
// CARDS
// ──────────────────────────────────────────────────────────────

export const cardCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  brand: z.string().optional(),
  closing_day: z.number().int().min(1).max(31, 'Fechamento deve ser 1-31'),
  due_day: z.number().int().min(1).max(31, 'Vencimento deve ser 1-31'),
  limit_amount: z.number().positive('Limite deve ser positivo').optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex válida').default('#6366f1'),
})

export const cardUpdateSchema = cardCreateSchema.partial()

export type CardInput = z.infer<typeof cardCreateSchema>
export type CardUpdateInput = z.infer<typeof cardUpdateSchema>

// ──────────────────────────────────────────────────────────────
// CATEGORIES
// ──────────────────────────────────────────────────────────────

export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  icon: z.string().optional().default('📦'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex válida').optional().default('#6366f1'),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export type CategoryInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>

// ──────────────────────────────────────────────────────────────
// PEOPLE
// ──────────────────────────────────────────────────────────────

export const personCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  relationship: z.string().optional(),
})

export const personUpdateSchema = personCreateSchema.partial()

export type PersonInput = z.infer<typeof personCreateSchema>
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>

// ──────────────────────────────────────────────────────────────
// TRANSACTIONS
// ──────────────────────────────────────────────────────────────

export const transactionCreateSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória'),
  total_amount: z.number().positive('Valor deve ser positivo'),
  installments_count: z.number().int().min(1).max(60, 'Limite de parcelas: 1-60'),
  purchase_date: z.string().date('Data inválida'),
  type: z.enum(['credit', 'debit', 'pix', 'cash']),
  card_id: z.string().uuid('ID do cartão inválido').optional().nullable(),
  category_id: z.string().uuid('ID da categoria inválido').optional().nullable(),
  person_id: z.string().uuid('ID da pessoa inválido').optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const transactionUpdateSchema = transactionCreateSchema.partial()

export type TransactionInput = z.infer<typeof transactionCreateSchema>
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>

// ──────────────────────────────────────────────────────────────
// INSTALLMENTS
// ──────────────────────────────────────────────────────────────

export const installmentUpdateSchema = z.object({
  paid: z.boolean(),
})

export type InstallmentUpdateInput = z.infer<typeof installmentUpdateSchema>
