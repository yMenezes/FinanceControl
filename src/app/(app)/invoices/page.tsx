import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InvoicePage } from '@/components/invoices/InvoicePage'
import { InvoicePageSkeleton } from '@/components/invoices/InvoicePageSkeleton'
import { PeriodNavigator } from '@/components/ui/period-navigator'

type SearchParams = {
  month?: string
  year?: string
  card_id?: string
  period_type?: string
  quarter?: string
  date_from?: string
  date_to?: string
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now   = new Date()
  const month = Number(searchParams.month ?? now.getMonth() + 1)
  const year  = Number(searchParams.year  ?? now.getFullYear())

  // Buscar apenas os cartões do usuário (dados de referência for os filtros)
  const { data: cardsData } = await supabase
    .from('cards')
    .select('id, name, color')
    .is('deleted_at', null)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <Suspense fallback={<InvoicePageSkeleton />}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h1 className="text-lg font-medium">Fatura mensal</h1>
          <PeriodNavigator />
        </div>
      </div>
      <InvoicePage
        cards={cardsData ?? []}
        month={month}
        year={year}
        cardId={searchParams.card_id}
        periodType={searchParams.period_type}
        quarter={searchParams.quarter}
        dateFrom={searchParams.date_from}
        dateTo={searchParams.date_to}
      />
    </Suspense>
  )
}