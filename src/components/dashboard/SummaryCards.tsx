import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, Zap } from 'lucide-react'
import { getCashFlowSummary, type CashFlowSummary } from './queries'

async function getDashboardSummary(): Promise<CashFlowSummary> {
  return getCashFlowSummary()
}

export async function SummaryCards() {
  const { income, expenses, expensesPaid, recurringTotal, scheduledTotal, recurringIncomeTotal } = await getDashboardSummary()

  // Saldo Atual: only real money that has already happened
  const currentBalance = income - expensesPaid
  // Saldo Previsto: includes recurring income and all planned expenses
  const forecastBalance = (income + recurringIncomeTotal) - (expenses + recurringTotal + scheduledTotal)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Entradas (Income) */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 p-6 hover:shadow-md transition-all overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Entradas</p>
            <p className="text-3xl font-bold mt-3 text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(income)}</p>
            <p className="text-xs text-muted-foreground mt-3">Este mês</p>
          </div>
          <div className="opacity-10 shrink-0">
            <TrendingUp className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Card 2: Saídas (Expenses) */}
      <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 rounded-xl border border-rose-200/50 dark:border-rose-800/50 p-6 hover:shadow-md transition-all overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Saídas</p>
            <p className="text-3xl font-bold mt-3 text-rose-600 dark:text-rose-400 truncate">{formatCurrency(expenses)}</p>
            <p className="text-xs text-muted-foreground mt-3">Despesas postadas</p>
          </div>
          <div className="opacity-10 shrink-0">
            <TrendingDown className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Card 3: Saldo Atual (Current Balance - Only Paid) */}
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-200/50 dark:border-purple-800/50 p-6 hover:shadow-md transition-all overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
            <p className={`text-3xl font-bold mt-3 truncate ${currentBalance >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(currentBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-3">Entradas - Saídas pagas</p>
          </div>
          <div className="opacity-10 shrink-0">
            <Wallet className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Card 4: Saldo Previsto (Forecast Balance) */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-6 hover:shadow-md transition-all overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Saldo Previsto</p>
            <p className={`text-3xl font-bold mt-3 truncate ${forecastBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(forecastBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-3">Se pagar tudo planejado</p>
          </div>
          <div className="opacity-10 shrink-0">
            <Zap className="w-10 h-10" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-6">
          <div className="flex flex-col gap-4">
            <div className="h-4 w-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
