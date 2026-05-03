import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { recurringTransactionCreateSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = recurringTransactionCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      ...parsed.data,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/recurring')
  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '10')))
  const offset = (page - 1) * limit

  let countQuery = supabase
    .from('recurring_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  let dataQuery = supabase
    .from('recurring_transactions')
    .select(`
      id,
      description,
      total_amount,
      installments_count,
      type,
      day_of_month,
      start_date,
      end_date,
      next_run_date,
      last_run_date,
      active,
      card_id,
      category_id,
      person_id,
      notes,
      cards ( id, name, color ),
      categories ( id, name, icon, color ),
      people ( id, name )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('active', { ascending: false })
    .order('next_run_date', { ascending: true })

  const { count: total } = await countQuery
  const { data, error } = await dataQuery.range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totalCount = total ?? 0
  const hasMore = (page * limit) < totalCount

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore,
    },
  })
}