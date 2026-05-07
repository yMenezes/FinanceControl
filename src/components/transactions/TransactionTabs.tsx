'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { SlidersHorizontal, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { INCOME_SOURCES, INCOME_SOURCE_LABELS } from '@/types/database'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Card = { id: string; name: string }
type Category = { id: string; name: string; icon: string }
type Person = { id: string; name: string }

type Props = {
  cards: Card[]
  categories: Category[]
  people: Person[]
  onNewIncome?: () => void
}

const TYPES = [
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'cash', label: 'Dinheiro' },
]

export function TransactionTabs({ cards, categories, people, onNewIncome }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'expenses'
  const [open, setOpen] = useState(false)

  // Local state para filtros
  const [localCard, setLocalCard] = useState('all')
  const [localCategory, setLocalCategory] = useState('all')
  const [localType, setLocalType] = useState('all')
  const [localPerson, setLocalPerson] = useState('all')
  const [localSource, setLocalSource] = useState('all')

  const activeCount = [
    searchParams.get('card_id'),
    searchParams.get('category_id'),
    searchParams.get('type'),
    searchParams.get('person_id'),
    searchParams.get('source'),
  ].filter(Boolean).length

  function openModal() {
    setLocalCard(searchParams.get('card_id') ?? 'all')
    setLocalCategory(searchParams.get('category_id') ?? 'all')
    setLocalType(searchParams.get('type') ?? 'all')
    setLocalPerson(searchParams.get('person_id') ?? 'all')
    setLocalSource(searchParams.get('source') ?? 'all')
    setOpen(true)
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString())

    if (localCard !== 'all') params.set('card_id', localCard)
    else params.delete('card_id')

    if (localCategory !== 'all') params.set('category_id', localCategory)
    else params.delete('category_id')

    if (localType !== 'all') params.set('type', localType)
    else params.delete('type')

    if (localPerson !== 'all') params.set('person_id', localPerson)
    else params.delete('person_id')

    if (localSource !== 'all') params.set('source', localSource)
    else params.delete('source')

    window.location.href = `${pathname}?${params.toString()}`
    setOpen(false)
  }

  function clearFilters() {
    setLocalCard('all')
    setLocalCategory('all')
    setLocalType('all')
    setLocalPerson('all')
    setLocalSource('all')
  }

  function buildHref(newTab: string) {
    const params = new URLSearchParams()
    if (searchParams.get('month')) params.set('month', searchParams.get('month')!)
    if (searchParams.get('year')) params.set('year', searchParams.get('year')!)
    if (searchParams.get('category_id')) params.set('category_id', searchParams.get('category_id')!)
    if (searchParams.get('person_id')) params.set('person_id', searchParams.get('person_id')!)
    if (newTab !== 'expenses') params.set('tab', newTab)
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }

  return (
    <>
      {/* Tabs + Action Buttons */}
      <div className="flex items-center justify-between gap-2 mb-5 border-b border-border">
        {/* Tabs */}
        <div className="flex gap-1">
          <Link
            href={buildHref('expenses')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab !== 'income'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Saídas
          </Link>
          <Link
            href={buildHref('income')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'income'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Entradas
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {tab === 'income' && (
            <button
              onClick={onNewIncome}
              className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova entrada
            </button>
          )}

          {/* Filter Button - Show on both tabs */}
          <button
            onClick={openModal}
            className="relative flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrar
            {activeCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto pointer-events-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold">Filtros</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
                aria-label="Fechar filtros"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {tab !== 'income' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Cartão</Label>
                    <Select value={localCard} onValueChange={setLocalCard}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os cartões" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os cartões</SelectItem>
                        {cards.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={localType} onValueChange={setLocalType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={localCategory} onValueChange={setLocalCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Pessoa</Label>
                <Select value={localPerson} onValueChange={setLocalPerson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as pessoas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as pessoas</SelectItem>
                    {people.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tab === 'income' && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Fonte</Label>
                  <Select value={localSource} onValueChange={setLocalSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as fontes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as fontes</SelectItem>
                      {INCOME_SOURCES.map(s => (
                        <SelectItem key={s} value={s}>{INCOME_SOURCE_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 pt-5 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={clearFilters}>
                Limpar
              </Button>
              <Button className="flex-1" onClick={applyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
