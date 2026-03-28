import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { cardCreateSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = cardCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { error, data } = await supabase
    .from('cards')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/cards')
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

  // Get total count
  const { count: total } = await supabase
    .from('cards')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('user_id', user.id)

  // Get paginated data
  const { data } = await supabase
    .from('cards')
    .select('id, name, closing_day, color')
    .is('deleted_at', null)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

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