'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCheck, LayoutList, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvoiceInstallmentRow } from './InvoiceInstallmentRow'

type Installment = {
  id:     string
  number: number
  amount: number
  paid:   boolean
  transactions: {
    id:                 string
    description:        string
    installments_count: number
    card_id:            string
    purchase_date:      string
    cards:      { id: string; name: string; color: string; closing_day: number; due_day: number } | null
    categories: { id: string; name: string; icon: string; color: string } | null
  }
}

type Card = { id: string; name: string; color: string }

type GroupMode = 'category' | 'date'

type Props = {
  initialInstallments: Installment[]
  cards:               Card[]
  month:               number
  year:                number
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export function InvoicePage({ initialInstallments, cards, month, year }: Props) {
  const [installments, setInstallments] = useState(initialInstallments)
  const [activeCard, setActiveCard]     = useState<string>('all')
  const [groupMode, setGroupMode]       = useState<GroupMode>('category')
  const [currentMonth, setCurrentMonth] = useState(month)
  const [currentYear, setCurrentYear]   = useState(year)

  function prevMonth() {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }

  function nextMonth() {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  // Filtra por cartão ativo
  const filtered = installments.filter(i =>
    activeCard === 'all' || i.transactions.card_id === activeCard
  )

  // Total da fatura filtrada
  const total = filtered.reduce((acc, i) => acc + i.amount, 0)
  const totalPaid = filtered.filter(i => i.paid).reduce((acc, i) => acc + i.amount, 0)

  // Agrupa por categoria ou por data
  function groupInstallments() {
    const groups: Record<string, { label: string; icon?: string; color?: string; items: Installment[] }> = {}

    for (const inst of filtered) {
      let key: string
      let label: string
      let icon: string | undefined
      let color: string | undefined

      if (groupMode === 'category') {
        key   = inst.transactions.categories?.id ?? 'uncategorized'
        label = inst.transactions.categories?.name ?? 'Sem categoria'
        icon  = inst.transactions.categories?.icon
        color = inst.transactions.categories?.color
      } else {
        key   = inst.transactions.purchase_date
        label = new Date(inst.transactions.purchase_date + 'T12:00:00')
          .toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
      }

      if (!groups[key]) groups[key] = { label, icon, color, items: [] }
      groups[key].items.push(inst)
    }

    return Object.values(groups)
  }

  // Toggle individual
  const handleToggle = useCallback(async (id: string, paid: boolean) => {
    setInstallments(prev =>
      prev.map(i => i.id === id ? { ...i, paid } : i)
    )
    await fetch(`/api/installments/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ paid }),
    })
  }, [])

  // Marcar fatura inteira como paga
  async function markAllPaid() {
    const allPaid = filtered.every(i => i.paid)
    const next    = !allPaid

    setInstallments(prev =>
      prev.map(i =>
        activeCard === 'all' || i.transactions.card_id === activeCard
          ? { ...i, paid: next }
          : i
      )
    )

    await fetch(`/api/invoices/${activeCard}/${currentYear}/${currentMonth}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ paid: next }),
    })
  }

  const allPaid  = filtered.length > 0 && filtered.every(i => i.paid)
  const groups   = groupInstallments()
  const activeCardData = cards.find(c => c.id === activeCard)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-lg font-medium">Fatura mensal</h1>

      {/* Navegador de mês */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[140px] text-center text-sm font-medium">
          {MONTHS[currentMonth - 1]} de {currentYear}
        </span>
        <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs de cartão */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => setActiveCard(card.id)}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
            style={activeCard === card.id ? {
              background:   card.color,
              borderColor:  card.color,
              color:        'white',
            } : {}}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: activeCard === card.id ? 'rgba(255,255,255,0.6)' : card.color }}
            />
            {card.name}
          </button>
        ))}
        <button
          onClick={() => setActiveCard('all')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
            activeCard === 'all' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'
          }`}
        >
          Todos
        </button>
      </div>

      {/* Header da fatura */}
      <div
        className={`rounded-xl p-4 mb-4 flex items-center justify-between ${
            !activeCardData ? 'bg-muted' : ''
        }`}
        style={activeCardData ? { background: activeCardData.color } : {}}
        >
        <div>
            <p className={`text-sm font-medium ${activeCardData ? 'text-white' : 'text-foreground'}`}>
            {activeCardData?.name ?? 'Todos os cartões'}
            </p>
            <p className={`text-xs mt-0.5 ${activeCardData ? 'text-white/70' : 'text-muted-foreground'}`}>
            {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
            {totalPaid > 0 && ` · ${totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} pago`}
            </p>
        </div>
        <div className="text-right">
            <p className={`text-xs ${activeCardData ? 'text-white/70' : 'text-muted-foreground'}`}>Total</p>
            <p className={`text-xl font-medium ${activeCardData ? 'text-white' : 'text-foreground'}`}>
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        {/* Seletor de agrupamento */}
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setGroupMode('category')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
              groupMode === 'category' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutList className="h-3 w-3" />
            Categoria
          </button>
          <button
            onClick={() => setGroupMode('date')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
              groupMode === 'date' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            Data
          </button>
        </div>

        {/* Marcar fatura como paga */}
        <Button
          size="sm"
          variant={allPaid ? 'outline' : 'default'}
          className="gap-1.5 text-xs h-8"
          onClick={markAllPaid}
          disabled={filtered.length === 0}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          {allPaid ? 'Desmarcar fatura' : 'Marcar como paga'}
        </Button>
      </div>

      {/* Lista agrupada */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Nenhum lançamento nesta fatura</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group, idx) => {
            const groupTotal = group.items.reduce((acc, i) => acc + i.amount, 0)
            return (
              <div key={idx} className="rounded-xl border border-border overflow-hidden">
                {/* Header do grupo */}
                <div className="flex items-center justify-between bg-muted px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {group.icon && (
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md text-sm"
                        style={{ background: group.color ? group.color + '22' : undefined }}
                      >
                        {group.icon}
                      </span>
                    )}
                    <span className="text-xs font-medium">{group.label}</span>
                  </div>
                  <span className="text-xs font-medium">
                    {groupTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* Linhas */}
                {group.items.map(inst => (
                  <InvoiceInstallmentRow
                    key={inst.id}
                    id={inst.id}
                    description={inst.transactions.description}
                    number={inst.number}
                    installmentsCount={inst.transactions.installments_count}
                    amount={inst.amount}
                    paid={inst.paid}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}