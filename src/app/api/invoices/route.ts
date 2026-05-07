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

  const isAll = cardId === 'all'

  // Busca total de parcelas do mês/ano específico
  let countQuery = supabase
    .from('installments')
    .select('id', { count: 'exact', head: true })
    .eq('transactions.status', 'posted')
    .eq('transactions.user_id', user.id)
    .eq('reference_month', month)
    .eq('reference_year', year)

  if (!isAll) {
    countQuery = countQuery.eq('transactions.card_id', cardId)
  }

  const { count: total } = await countQuery

  // Busca parcelas do mês/ano com dados da transação
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
    .eq('reference_month', month)
    .eq('reference_year', year)
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

  const { data: installments } = await supabase
    .from('installments')
    .select('id, transactions!inner( card_id, user_id )')
    .eq('transactions.user_id', user.id)
    .eq('transactions.status', 'posted')
    .eq('reference_month', month)
    .eq('reference_year', year)

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
