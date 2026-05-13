import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { transactionCreateSchema } from "@/lib/validations";
import { generateInstallments } from "@/lib/installments";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = transactionCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const {
    description,
    total_amount,
    installments_count,
    purchase_date,
    type,
    status,
    scheduled_for,
    schedule_source,
    card_id,
    category_id,
    person_id,
    notes,
  } = parsed.data;

  const resolvedStatus = status ?? 'posted';
  const resolvedScheduledFor = scheduled_for ?? (resolvedStatus === 'scheduled' ? purchase_date : null);
  const resolvedScheduleSource = schedule_source ?? 'manual';
  const resolvedPostedAt = resolvedStatus === 'posted' ? new Date().toISOString() : null;
  const resolvedCancelledAt = null;

  // 1. Cria a transação
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      description,
      total_amount,
      installments_count,
      purchase_date,
      type,
      status: resolvedStatus,
      scheduled_for: resolvedScheduledFor,
      posted_at: resolvedPostedAt,
      cancelled_at: resolvedCancelledAt,
      schedule_source: resolvedScheduleSource,
      card_id: card_id ?? null,
      category_id: category_id ?? null,
      person_id: person_id ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (txError)
    return NextResponse.json({ error: txError.message }, { status: 500 });

  // 2. Apenas transações efetivamente postadas geram parcelas
  if (resolvedStatus === 'posted') {
    let closingDay = 1;
    if (card_id) {
      const { data: card } = await supabase
        .from("cards")
        .select("closing_day")
        .eq("id", card_id)
        .single();
      if (card) closingDay = card.closing_day;
    }

    const installments = generateInstallments(
      transaction.id,
      total_amount,
      installments_count,
      new Date(purchase_date),
      closingDay,
    );

    const { error: instError } = await supabase
      .from("installments")
      .insert(installments);

    if (instError)
      return NextResponse.json({ error: instError.message }, { status: 500 });
  }

  revalidatePath("/invoices");
  return NextResponse.json(transaction, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const periodType = searchParams.get('period_type') ?? 'monthly'
  const month    = searchParams.get('month')
  const year     = searchParams.get('year')
  const quarter  = searchParams.get('quarter')
  const dateFrom = searchParams.get('date_from')
  const dateTo   = searchParams.get('date_to')
  const cardId   = searchParams.get('card_id')
  const categoryId = searchParams.get('category_id')
  const personId = searchParams.get('person_id')
  const type     = searchParams.get('type')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '10')))
  const offset = (page - 1) * limit

  // Determinar date range baseado no period_type
  let dateRangeFrom = dateFrom
  let dateRangeTo = dateTo

  if (!dateRangeFrom || !dateRangeTo) {
    const now = new Date()
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1
    const currentYear = year ? parseInt(year) : now.getFullYear()

    switch (periodType) {
      case 'monthly':
        dateRangeFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
        dateRangeTo = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
        break

      case 'quarterly': {
        const q = quarter ? parseInt(quarter) : Math.ceil(currentMonth / 3)
        const startMonth = (q - 1) * 3 + 1
        const endMonth = q * 3
        dateRangeFrom = `${currentYear}-${String(startMonth).padStart(2, '0')}-01`
        dateRangeTo = new Date(currentYear, endMonth, 0).toISOString().split('T')[0]
        break
      }

      case 'annual':
        dateRangeFrom = `${currentYear}-01-01`
        dateRangeTo = `${currentYear}-12-31`
        break

      default:
        dateRangeFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
        dateRangeTo = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
    }
  }

  let countQuery = supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('purchase_date', dateRangeFrom)
    .lte('purchase_date', dateRangeTo)

  let dataQuery = supabase
    .from('transactions')
    .select(`
      id,
      description,
      total_amount,
      installments_count,
      purchase_date,
      type,
      status,
      scheduled_for,
      posted_at,
      cancelled_at,
      schedule_source,
      notes,
      card_id,
      category_id,
      person_id,
      cards   ( id, name, color ),
      categories ( id, name, icon, color ),
      people  ( id, name )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('purchase_date', dateRangeFrom)
    .lte('purchase_date', dateRangeTo)
    .order('purchase_date', { ascending: false })

  if (cardId)     countQuery = countQuery.eq('card_id', cardId)
  if (cardId)     dataQuery = dataQuery.eq('card_id', cardId)

  if (categoryId) countQuery = countQuery.eq('category_id', categoryId)
  if (categoryId) dataQuery = dataQuery.eq('category_id', categoryId)

  if (personId)   countQuery = countQuery.eq('person_id', personId)
  if (personId)   dataQuery = dataQuery.eq('person_id', personId)

  if (type)       countQuery = countQuery.eq('type', type)
  if (type)       dataQuery = dataQuery.eq('type', type)

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
