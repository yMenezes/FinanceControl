import { createClient } from '@/lib/supabase/server'
import { recurringIncomeCreateSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import type { RecurringIncomeWithRelations } from '@/types/database'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '10')))
  const offset = (page - 1) * limit

  // Get total count
  const { count: total } = await supabase
    .from('recurring_income')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  // Get paginated data with joins
  const { data, error } = await supabase
    .from('recurring_income')
    .select(`
      id,
      user_id,
      description,
      amount,
      source,
      day_of_month,
      start_date,
      end_date,
      next_run_date,
      last_run_date,
      active,
      category_id,
      person_id,
      notes,
      created_at,
      updated_at,
      deleted_at,
      categories (id, name, icon, color),
      people (id, name)
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('active', { ascending: false })
    .order('next_run_date', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalCount = total ?? 0
  const hasMore = (page * limit) < totalCount

  // Normalize joined data: Supabase returns arrays for joins, we need single objects
  const normalizedData = data?.map(item => ({
    ...item,
    categories: Array.isArray(item.categories) && item.categories.length > 0 
      ? item.categories[0] 
      : null,
    people: Array.isArray(item.people) && item.people.length > 0 
      ? item.people[0] 
      : null,
  })) as RecurringIncomeWithRelations[]

  return NextResponse.json({
    data: normalizedData,
    pagination: {
      page,
      limit,
      total: totalCount,
      hasMore,
    },
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate with Zod
    const parsed = recurringIncomeCreateSchema.parse(body)

    // Insert into database
    const { data, error } = await supabase
      .from('recurring_income')
      .insert({
        user_id: user.id,
        description: parsed.description,
        amount: parsed.amount,
        source: parsed.source,
        day_of_month: parsed.day_of_month,
        start_date: parsed.start_date,
        end_date: parsed.end_date ?? null,
        next_run_date: parsed.next_run_date,
        active: parsed.active ?? true,
        category_id: parsed.category_id ?? null,
        person_id: parsed.person_id ?? null,
        notes: parsed.notes ?? null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePath('/recurring-income')
    revalidatePath('/dashboard')

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error.errors) {
      // Zod validation errors
      const fieldErrors: Record<string, string[]> = {}
      error.errors.forEach((err: any) => {
        const path = err.path.join('.')
        if (!fieldErrors[path]) {
          fieldErrors[path] = []
        }
        fieldErrors[path].push(err.message)
      })
      return NextResponse.json(
        { error: { fieldErrors } },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro ao criar entrada recorrente' }, { status: 500 })
  }
}
