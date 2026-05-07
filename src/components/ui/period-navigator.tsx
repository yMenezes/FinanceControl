'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type PeriodType = 'monthly' | 'quarterly' | 'annual' | 'custom'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const PERIOD_LABELS: Record<PeriodType, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
  custom: 'Personalizada',
}

function getDateRangeFromParams(
  periodType: PeriodType,
  month?: number,
  year?: number,
  quarter?: number,
  customFrom?: string,
  customTo?: string
): { from: string; to: string; label: string } {
  const now = new Date()
  const currentMonth = month ?? now.getMonth() + 1
  const currentYear = year ?? now.getFullYear()

  switch (periodType) {
    case 'monthly': {
      const from = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const to = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
      const label = `${MONTHS[currentMonth - 1]} ${currentYear}`
      return { from, to, label }
    }

    case 'quarterly': {
      const q = quarter ?? Math.ceil(currentMonth / 3)
      const startMonth = (q - 1) * 3 + 1
      const endMonth = q * 3
      const from = `${currentYear}-${String(startMonth).padStart(2, '0')}-01`
      const to = new Date(currentYear, endMonth, 0).toISOString().split('T')[0]
      const label = `Q${q} ${currentYear}`
      return { from, to, label }
    }

    case 'annual': {
      const from = `${currentYear}-01-01`
      const to = `${currentYear}-12-31`
      const label = `${currentYear}`
      return { from, to, label }
    }

    case 'custom': {
      if (!customFrom || !customTo) {
        const from = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
        const to = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
        const label = `${MONTHS[currentMonth - 1]} ${currentYear}`
        return { from, to, label }
      }
      const [fromYear, fromMonth] = customFrom.split('-')
      const [toYear, toMonth] = customTo.split('-')
      const label = `${MONTHS[parseInt(fromMonth) - 1]} ${fromYear} até ${MONTHS[parseInt(toMonth) - 1]} ${toYear}`
      return { from: customFrom, to: customTo, label }
    }
  }
}

function getNextPeriod(
  periodType: PeriodType,
  month: number,
  year: number,
  quarter?: number
): { month?: number; year?: number; quarter?: number } {
  switch (periodType) {
    case 'monthly':
      return month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year }

    case 'quarterly': {
      const q = quarter ?? Math.ceil(month / 3)
      return q === 4 ? { quarter: 1, year: year + 1 } : { quarter: q + 1, year }
    }

    case 'annual':
      return { year: year + 1 }

    default:
      return { month, year }
  }
}

function getPreviousPeriod(
  periodType: PeriodType,
  month: number,
  year: number,
  quarter?: number
): { month?: number; year?: number; quarter?: number } {
  switch (periodType) {
    case 'monthly':
      return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year }

    case 'quarterly': {
      const q = quarter ?? Math.ceil(month / 3)
      return q === 1 ? { quarter: 4, year: year - 1 } : { quarter: q - 1, year }
    }

    case 'annual':
      return { year: year - 1 }

    default:
      return { month, year }
  }
}

export function PeriodNavigator() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [openDropdown, setOpenDropdown] = useState(false)
  const [openCustom, setOpenCustom] = useState(false)

  const now = new Date()
  const periodType = (searchParams.get('period_type') ?? 'monthly') as PeriodType
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)
  const year = Number(searchParams.get('year') ?? now.getFullYear())
  const quarter = Number(searchParams.get('quarter') ?? 0) || undefined
  const customFrom = searchParams.get('date_from') ?? undefined
  const customTo = searchParams.get('date_to') ?? undefined

  // States para personalizada
  const [customStartMonth, setCustomStartMonth] = useState(month)
  const [customStartYear, setCustomStartYear] = useState(year)
  const [customEndMonth, setCustomEndMonth] = useState(month)
  const [customEndYear, setCustomEndYear] = useState(year)

  const { label } = getDateRangeFromParams(periodType, month, year, quarter, customFrom, customTo)

  function setPeriodType(newType: PeriodType) {
    if (newType === 'custom') {
      setOpenCustom(true)
      setOpenDropdown(false)
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set('period_type', newType)
    params.delete('date_from')
    params.delete('date_to')

    router.push(`${pathname}?${params.toString()}`)
    setOpenDropdown(false)
  }

  function applyCustom() {
    const dateFrom = `${customStartYear}-${String(customStartMonth).padStart(2, '0')}-01`
    const dateTo = new Date(customEndYear, customEndMonth, 0).toISOString().split('T')[0]

    const params = new URLSearchParams(searchParams.toString())
    params.set('period_type', 'custom')
    params.set('date_from', dateFrom)
    params.set('date_to', dateTo)

    router.push(`${pathname}?${params.toString()}`)
    setOpenCustom(false)
  }

  function navigatePeriod(direction: 'next' | 'prev') {
    if (periodType === 'custom') {
      // Para período customizado, não navega com setas
      return
    }

    const getNewPeriod = direction === 'next' ? getNextPeriod : getPreviousPeriod
    const newPeriod = getNewPeriod(periodType, month, year, quarter)

    const params = new URLSearchParams(searchParams.toString())
    if (newPeriod.month !== undefined) params.set('month', String(newPeriod.month))
    if (newPeriod.year !== undefined) params.set('year', String(newPeriod.year))
    if (newPeriod.quarter !== undefined) params.set('quarter', String(newPeriod.quarter))

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      <div className="relative flex items-center gap-1">
        {periodType !== 'custom' && (
          <button
            onClick={() => navigatePeriod('prev')}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="flex items-center gap-2 px-3 py-1 rounded hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium min-w-[110px] text-center">{label}</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </button>

          {openDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpenDropdown(false)}
              />
              <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPeriodType(type)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      periodType === type
                        ? 'bg-accent text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                  >
                    {PERIOD_LABELS[type]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {periodType !== 'custom' && (
          <button
            onClick={() => navigatePeriod('next')}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Modal de período personalizado */}
      {openCustom && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpenCustom(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Período Personalizado</h3>
              <button
                onClick={() => setOpenCustom(false)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Data de início */}
              <div>
                <Label className="text-xs mb-2 block">Data de Início</Label>
                <div className="flex gap-2">
                  <Select value={String(customStartMonth)} onValueChange={(v) => setCustomStartMonth(Number(v))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(customStartYear)} onValueChange={(v) => setCustomStartYear(Number(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Data de fim */}
              <div>
                <Label className="text-xs mb-2 block">Data de Fim</Label>
                <div className="flex gap-2">
                  <Select value={String(customEndMonth)} onValueChange={(v) => setCustomEndMonth(Number(v))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(customEndYear)} onValueChange={(v) => setCustomEndYear(Number(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setOpenCustom(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={applyCustom}>
                Aplicar
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
