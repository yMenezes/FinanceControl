import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PeriodNavigator } from '@/components/ui/period-navigator'
import { TransactionDataProvider } from '@/providers/TransactionDataProvider'
import { TransactionListSkeleton } from '@/components/transactions/TransactionListSkeleton'
import { TransactionsPageClient } from '@/components/transactions/TransactionsPageClient'

type SearchParams = {
  month?:       string
  year?:        string
  card_id?:     string
  category_id?: string
  person_id?:   string
  type?:        string
  tab?:         string
  period_type?: string
  quarter?:     string
  date_from?:   string
  date_to?:     string
  source?:      string
}

async function TransactionContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now   = new Date()
  const month = searchParams.month ?? String(now.getMonth() + 1)
  const year  = searchParams.year  ?? String(now.getFullYear())
  const tab   = searchParams.tab   ?? 'expenses'

  const [cardsRes, catsRes, peopleRes] = await Promise.all([
    supabase.from('cards').select('id, name').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('categories').select('id, name, icon').is('deleted_at', null).eq('user_id', user.id),
    supabase.from('people').select('id, name').is('deleted_at', null).eq('user_id', user.id),
  ])

  return (
    <TransactionDataProvider
      cards={cardsRes.data ?? []}
      categories={catsRes.data ?? []}
      people={peopleRes.data ?? []}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h1 className="text-lg font-medium">Lançamentos</h1>
          <PeriodNavigator />
        </div>

        <TransactionsPageClient
          cards={cardsRes.data ?? []}
          categories={catsRes.data ?? []}
          people={peopleRes.data ?? []}
          month={month}
          year={year}
          tab={tab}
          searchParams={searchParams}
        />
      </div>
    </TransactionDataProvider>
  )
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <Suspense fallback={<TransactionListSkeleton />}>
      <TransactionContent searchParams={searchParams} />
    </Suspense>
  )
}
