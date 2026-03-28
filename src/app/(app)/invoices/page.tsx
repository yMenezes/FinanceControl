import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InvoicePage } from '@/components/invoices/InvoicePage'
import { InvoicePageSkeleton } from '@/components/invoices/InvoicePageSkeleton'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
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
      <InvoicePage
        cards={cardsData ?? []}
        month={month}
        year={year}
      />
    </Suspense>
  )
}