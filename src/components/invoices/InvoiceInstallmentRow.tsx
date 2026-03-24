'use client'

import { useEffect, useState } from 'react'

type Props = {
  id:                 string
  description:        string
  number:             number
  installmentsCount:  number
  amount:             number
  paid:               boolean
  onToggle:           (id: string, paid: boolean) => void
}

export function InvoiceInstallmentRow({
  id, description, number, installmentsCount, amount, paid, onToggle
}: Props) {
  const [optimisticPaid, setOptimisticPaid] = useState(paid)

  async function handleToggle() {
    const next = !optimisticPaid
    setOptimisticPaid(next) // atualiza UI imediatamente
    onToggle(id, next)      // propaga para o pai persistir
  }

  useEffect(() => {
    setOptimisticPaid(paid)
  }, [paid])

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-t border-border">
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          optimisticPaid
            ? 'bg-emerald-500 border-emerald-500 dark:bg-emerald-600'
            : 'border-border hover:border-emerald-400'
        }`}
      >
        {optimisticPaid && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Descrição */}
      <div className="flex flex-1 flex-col min-w-0">
        <span className={`text-sm truncate transition-colors ${optimisticPaid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {description}
        </span>
        <span className="text-xs text-muted-foreground">
          {number}/{installmentsCount}
        </span>
      </div>

      {/* Valor */}
      <span className={`text-sm font-medium shrink-0 transition-colors ${optimisticPaid ? 'text-muted-foreground line-through' : ''}`}>
        {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    </div>
  )
}