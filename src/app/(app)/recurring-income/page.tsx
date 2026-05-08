import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TransactionDataProvider } from '@/providers/TransactionDataProvider'
import { RecurringIncomeList } from '@/components/recurring-income/RecurringIncomeList'
import { RecurringListSkeleton } from '@/components/recurring/RecurringListSkeleton'

async function RecurringIncomeContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [catsRes, peopleRes] = await Promise.all([
    supabase.from('categories').select('id, name, icon').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('people').select('id, name').is('deleted_at', null).eq('user_id', user.id),
  ])

  return (
    <TransactionDataProvider
      cards={[]}
      categories={catsRes.data ?? []}
      people={peopleRes.data ?? []}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-lg font-medium">Entradas Recorrentes</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Cadastre regras que geram entradas de forma repetida automaticamente.
        </p>
        <RecurringIncomeList />
      </div>
    </TransactionDataProvider>
  )
}

export default function RecurringIncomePage() {
  return (
    <Suspense fallback={<RecurringListSkeleton />}>
      <RecurringIncomeContent />
    </Suspense>
  )
}
