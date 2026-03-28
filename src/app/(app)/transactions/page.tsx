/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionDataProvider } from '@/providers/TransactionDataProvider'
import { TransactionListSkeleton } from '@/components/transactions/TransactionListSkeleton'

type SearchParams = {
  month?:       string
  year?:        string
  card_id?:     string
  category_id?: string
  person_id?:   string
  type?:        string
}

async function TransactionContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now   = new Date()
  const month = searchParams.month ?? String(now.getMonth() + 1)
  const year  = searchParams.year  ?? String(now.getFullYear())

  // Buscar dados de referência (cards, categories, people) em paralelo
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
        <h1 className="mb-5 text-lg font-medium">Lançamentos</h1>
        <TransactionFilters
          cards={cardsRes.data ?? []}
          categories={catsRes.data ?? []}
          people={peopleRes.data ?? []}
        />
        <TransactionList 
          month={month}
          year={year}
          cardId={searchParams.card_id}
          categoryId={searchParams.category_id}
          personId={searchParams.person_id}
          type={searchParams.type}
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