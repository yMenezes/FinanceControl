'use client'

import { useState } from 'react'
import { TransactionTabs } from '@/components/transactions/TransactionTabs'
import { TransactionList } from '@/components/transactions/TransactionList'
import { IncomeTab } from '@/components/income/IncomeTab'

type Card = { id: string; name: string; color?: string }
type Category = { id: string; name: string; icon?: string }
type Person = { id: string; name: string }

type Props = {
  cards: Card[]
  categories: Category[]
  people: Person[]
  month: string
  year: string
  tab: string
  searchParams: Record<string, string | undefined>
}

export function TransactionsPageClient({
  cards,
  categories,
  people,
  month,
  year,
  tab,
  searchParams,
}: Props) {
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)

  return (
    <>
      <TransactionTabs
        cards={cards}
        categories={categories}
        people={people}
        onNewIncome={() => setIncomeDialogOpen(true)}
      />

      {tab === 'income' ? (
        <IncomeTab
          month={month}
          year={year}
          categoryId={searchParams.category_id}
          personId={searchParams.person_id}
          source={searchParams.source}
          periodType={searchParams.period_type}
          quarter={searchParams.quarter}
          dateFrom={searchParams.date_from}
          dateTo={searchParams.date_to}
          onDialogOpen={() => setIncomeDialogOpen(true)}
          dialogOpen={incomeDialogOpen}
          onDialogClose={() => setIncomeDialogOpen(false)}
        />
      ) : (
        <TransactionList
          month={month}
          year={year}
          cardId={searchParams.card_id}
          categoryId={searchParams.category_id}
          personId={searchParams.person_id}
          type={searchParams.type}
          periodType={searchParams.period_type}
          quarter={searchParams.quarter}
          dateFrom={searchParams.date_from}
          dateTo={searchParams.date_to}
        />
      )}
    </>
  )
}
