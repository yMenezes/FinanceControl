import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { cardId: string; year: string; month: string }

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { cardId, year, month } = params
  const isAll = cardId === 'all'

  // Busca parcelas do mês com dados da transação
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
    .eq('reference_month', Number(month))
    .eq('reference_year',  Number(year))

  // Filtra por cartão se não for "all"
  if (!isAll) {
    query = query.eq('transactions.card_id', cardId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filtra resultados onde a transação pertence ao usuário
  const filtered = (data ?? []).filter(
    (i: any) => i.transactions?.cards || isAll
  )

  return NextResponse.json(filtered)
}

// Marcar todas as parcelas do mês/cartão como pagas ou não pagas
export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { cardId, year, month } = params
  const { paid } = await request.json()

  // Busca os IDs das parcelas do mês/cartão
  const { data: installments } = await supabase
    .from('installments')
    .select('id, transactions!inner( card_id, user_id )')
    .eq('reference_month', Number(month))
    .eq('reference_year',  Number(year))
    .eq('transactions.user_id', user.id)

  if (!installments?.length) return NextResponse.json({ updated: 0 })

  const ids = installments
    .filter((i: any) => cardId === 'all' || i.transactions.card_id === cardId)
    .map((i: any) => i.id)

  const { error } = await supabase
    .from('installments')
    .update({ paid })
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: ids.length })
}