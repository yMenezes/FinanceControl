import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

type SummaryData = {
  income: number
  expenses: number
  recurringExpenses: number
  recurringIncome: number
  scheduled: number
  currentBalance: number
  forecastBalance: number
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function getMonthlySummaryData(): Promise<SummaryData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not found')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthStart = toLocalDateString(new Date(currentYear, currentMonth - 1, 1))
  const monthEnd = toLocalDateString(new Date(currentYear, currentMonth, 0))

  const [incomeResult, expensesResult, recurringExpensesResult, recurringIncomeResult, scheduledResult] = await Promise.all([
    supabase
      .from('income')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .is('deleted_at', null),

    supabase
      .from('installments')
      .select('amount, transactions!inner(status, user_id)')
      .eq('transactions.status', 'posted')
      .eq('transactions.user_id', user.id)
      .eq('reference_month', currentMonth)
      .eq('reference_year', currentYear),

    supabase
      .from('recurring_transactions')
      .select('total_amount, day_of_month, start_date, end_date')
      .eq('user_id', user.id)
      .eq('active', true)
      .is('deleted_at', null)
      .lte('start_date', monthEnd)
      .or(`end_date.is.null,end_date.gte.${monthStart}`),

    supabase
      .from('recurring_income')
      .select('amount, day_of_month, start_date, end_date')
      .eq('user_id', user.id)
      .eq('active', true)
      .is('deleted_at', null)
      .lte('start_date', monthEnd)
      .or(`end_date.is.null,end_date.gte.${monthStart}`),

    supabase
      .from('transactions')
      .select('total_amount')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_for', monthStart)
      .lte('scheduled_for', monthEnd),
  ])

  const income = (incomeResult.data ?? []).reduce((sum, item: any) => sum + item.amount, 0)
  const expenses = (expensesResult.data ?? []).reduce((sum, item) => sum + item.amount, 0)
  const recurringExpenses = (recurringExpensesResult.data ?? []).reduce((sum, item: any) => sum + item.total_amount, 0)
  const recurringIncome = (recurringIncomeResult.data ?? []).reduce((sum, item: any) => sum + item.amount, 0)
  const scheduled = (scheduledResult.data ?? []).reduce((sum, item: any) => sum + item.total_amount, 0)
  const currentBalance = income - expenses
  const forecastBalance = (income + recurringIncome) - (expenses + recurringExpenses + scheduled)

  return { income, expenses, recurringExpenses, recurringIncome, scheduled, currentBalance, forecastBalance }
}

export async function MonthlySummary() {
  const { income, expenses, recurringExpenses, recurringIncome, scheduled, currentBalance, forecastBalance } = await getMonthlySummaryData()

  const items = [
    { label: 'Entradas reais', value: income, color: '#10b981' },
    { label: 'Saídas reais', value: expenses, color: '#ef4444' },
    { label: 'Entradas recorrentes', value: recurringIncome, color: '#22c55e' },
    { label: 'Saídas recorrentes', value: recurringExpenses, color: '#f97316' },
    { label: 'Programados', value: scheduled, color: '#3b82f6' },
  ]

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold mb-5">Resumo do mês</h3>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.value)}</span>
          </div>
        ))}

        <div className="mt-2 rounded-xl border border-border/50 bg-muted/20 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saldo atual</span>
            <span className={`font-semibold tabular-nums ${currentBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saldo previsto</span>
            <span className={`font-semibold tabular-nums ${forecastBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(forecastBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MonthlySummarySkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6 shadow-sm">
      <div className="h-6 w-36 bg-muted rounded-lg animate-pulse mb-5" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
        <div className="mt-2 h-20 rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  )
}
