import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { NewRecurringButton } from './NewRecurringButton'

type UpcomingItem = {
  id: string
  description: string
  amount: number
  day_of_month: number
  next_run_date: string
  category_color: string | null
  category_icon: string | null
  kind: 'income' | 'expense'
}

export async function UpcomingRecurring({ month, year }: { month?: string; year?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not found')

  const baseDate = month && year ? new Date(Number(year), Number(month) - 1, 1) : new Date()
  const monthStart = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).toISOString().split('T')[0]

  const [expenseRes, incomeRes, cardsRes, catsRes, peopleRes] = await Promise.all([
    supabase
      .from('recurring_transactions')
      .select('id, description, total_amount, day_of_month, next_run_date, categories(color, icon)')
      .eq('user_id', user.id)
      .eq('active', true)
      .is('deleted_at', null)
      .gte('next_run_date', monthStart)
      .lte('next_run_date', monthEnd)
      .order('next_run_date', { ascending: true })
      .limit(5),
    supabase
      .from('recurring_income')
      .select('id, description, amount, day_of_month, next_run_date, categories(color, icon)')
      .eq('user_id', user.id)
      .eq('active', true)
      .is('deleted_at', null)
      .gte('next_run_date', monthStart)
      .lte('next_run_date', monthEnd)
      .order('next_run_date', { ascending: true })
      .limit(5),
    supabase.from('cards').select('id, name').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('categories').select('id, name, icon').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('people').select('id, name').is('deleted_at', null).eq('user_id', user.id),
  ])

  const expenseItems: UpcomingItem[] = (expenseRes.data ?? []).map((item: any) => ({
    id: item.id,
    description: item.description,
    amount: item.total_amount,
    day_of_month: item.day_of_month,
    next_run_date: item.next_run_date,
    category_color: item.categories?.color ?? null,
    category_icon: item.categories?.icon ?? null,
    kind: 'expense',
  }))

  const incomeItems: UpcomingItem[] = (incomeRes.data ?? []).map((item: any) => ({
    id: item.id,
    description: item.description,
    amount: item.amount,
    day_of_month: item.day_of_month,
    next_run_date: item.next_run_date,
    category_color: item.categories?.color ?? null,
    category_icon: item.categories?.icon ?? null,
    kind: 'income',
  }))

  const items = [...expenseItems, ...incomeItems]
    .sort((a, b) => new Date(`${a.next_run_date}T12:00:00`).getTime() - new Date(`${b.next_run_date}T12:00:00`).getTime())
    .slice(0, 5)

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">Próximos lançamentos recorrentes</h3>
        {items.length > 0 && (
          <Link href="/recurring" className="text-xs text-primary hover:underline">
            Ver todas
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground flex-1 flex items-center">
          Nenhuma conta recorrente cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Day badge */}
              <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${item.kind === 'income' ? 'bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-800/50' : 'bg-rose-500/10 border-rose-200/50 dark:border-rose-800/50'}`}>
                <span className={`text-base font-bold leading-none ${item.kind === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{item.day_of_month}</span>
                <span className={`text-[10px] leading-none ${item.kind === 'income' ? 'text-emerald-600/60 dark:text-emerald-400/60' : 'text-rose-600/60 dark:text-rose-400/60'}`}>dia</span>
              </div>
              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {item.kind === 'income' ? 'Entrada' : 'Saída'} · {item.category_icon ?? '📦'} · {new Date(`${item.next_run_date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              {/* Amount */}
              <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${item.kind === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <NewRecurringButton
        cards={cardsRes.data ?? []}
        categories={catsRes.data ?? []}
        people={peopleRes.data ?? []}
      />
    </div>
  )
}

export function UpcomingRecurringSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm h-full flex flex-col">
      <div className="h-6 w-52 bg-muted rounded-lg animate-pulse mb-5" />
      <div className="flex flex-col gap-4 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1.5" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-10 bg-muted rounded-xl animate-pulse" />
    </div>
  )
}
