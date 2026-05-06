import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type {
  Card,
  Category,
  Transaction,
  Installment,
} from '@/types/database'

type TransactionWithRelations = Transaction & {
  cards: Card[] | null
  categories: Category[] | null
}

type InstallmentWithRelations = Installment & {
  transactions: TransactionWithRelations[] | null
}

function getDateRangeFromParams(
  periodType: string | null,
  month: number,
  year: number,
  quarter?: number,
  dateFrom?: string | null,
  dateTo?: string | null
): { from: string; to: string } {
  if (periodType === 'custom' && dateFrom && dateTo) {
    return { from: dateFrom, to: dateTo }
  }

  if (periodType === 'quarterly') {
    const q = quarter ?? Math.ceil(month / 3)
    const startMonth = (q - 1) * 3 + 1
    const endMonth = q * 3
    const from = `${year}-${String(startMonth).padStart(2, '0')}-01`
    const to = new Date(year, endMonth, 0).toISOString().split('T')[0]
    return { from, to }
  }

  if (periodType === 'annual') {
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    }
  }

  // Default: monthly
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = new Date(year, month, 0).toISOString().split('T')[0]
  return { from, to }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())
  const cardId = searchParams.get('card_id') ?? 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit

  const periodType = searchParams.get('period_type') ?? 'monthly'
  const quarter = searchParams.get('quarter') ? Number(searchParams.get('quarter')) : undefined
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  const { from, to } = getDateRangeFromParams(periodType, month, year, quarter, dateFrom, dateTo)
  const isAll = cardId === 'all'

  // Busca total de parcelas
  let countQuery = supabase
    .from('installments')
    .select('id', { count: 'exact', head: true })
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
    .gte('transactions.purchase_date', from)
    .lte('transactions.purchase_date', to)

  if (!isAll) {
    countQuery = countQuery.eq('transactions.card_id', cardId)
  }

  const { count: total } = await countQuery

  // Busca parcelas do período com dados da transação
  let query = supabase
    .from('installments')
    .select(`
      id,
      number,
      amount,
      paid,
      reference_month,
      reference_year,
      transactions (
        id,
        description,
        installments_count,
        purchase_date,
        type,
        card_id,
        cards     ( id, name, color, closing_day, due_day ),
        categories ( id, name, icon, color )
      )
    `)
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
    .gte('transactions.purchase_date', from)
    .lte('transactions.purchase_date', to)
    .order('created_at', { ascending: true })

  if (!isAll) {
    query = query.eq('transactions.card_id', cardId)
  }

  const { data, error } = await query.range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const filtered = (data as InstallmentWithRelations[] ?? []).filter((i) => {
    if (isAll) return true
    const tx = i.transactions?.[0]
    return tx?.cards && tx.cards.length > 0
  })

  const totalCount = total ?? 0
  const hasMore = (page * limit) < totalCount

  return NextResponse.json({
    data: filtered,
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore,
    },
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())
  const cardId = searchParams.get('card_id') ?? 'all'
  const { paid } = await request.json()

  const periodType = searchParams.get('period_type') ?? 'monthly'
  const quarter = searchParams.get('quarter') ? Number(searchParams.get('quarter')) : undefined
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  const { from, to } = getDateRangeFromParams(periodType, month, year, quarter, dateFrom, dateTo)

  const { data: installments } = await supabase
    .from('installments')
    .select('id, transactions!inner( card_id, user_id, purchase_date )')
    .eq('transactions.user_id', user.id)
    .eq('transactions.status', 'posted')
    .gte('transactions.purchase_date', from)
    .lte('transactions.purchase_date', to)

  if (!installments?.length) return NextResponse.json({ updated: 0 })

  const ids = (installments as Array<{ id: string; transactions: Array<any> }>)
    .filter((i) => {
      const tx = i.transactions[0]
      return cardId === 'all' || tx?.card_id === cardId
    })
    .map((i) => i.id)

  const { error } = await supabase
    .from('installments')
    .update({ paid })
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: ids.length })
}
