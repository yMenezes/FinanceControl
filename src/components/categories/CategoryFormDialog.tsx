'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COLORS = [
  { label: 'Roxo',   value: '#6366f1' },
  { label: 'Verde',  value: '#0f6e56' },
  { label: 'Azul',   value: '#003d82' },
  { label: 'Rosa',   value: '#993556' },
  { label: 'Coral',  value: '#993c1d' },
  { label: 'Âmbar',  value: '#854f0b' },
]

const ICONS = ['📦', '🍔', '💊', '🚗', '🎮', '✈️', '🏠', '👗', '📚', '💡', '🐾', '🎵']

type Category = {
  id:    string
  name:  string
  icon:  string
  color: string
}

type Props = {
  open:      boolean
  onClose:   () => void
  category?: Category
}

export function CategoryFormDialog({ open, onClose, category }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [form, setForm] = useState({
    name:  category?.name  ?? '',
    icon:  category?.icon  ?? '📦',
    color: category?.color ?? '#6366f1',
  })

  useEffect(() => {
    if (open) {
      setForm({
        name:  category?.name  ?? '',
        icon:  category?.icon  ?? '📦',
        color: category?.color ?? '#6366f1',
      })
      setError(null)
    }
  }, [open])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    if (!form.name.trim()) {
      setError('Nome é obrigatório')
      setLoading(false)
      return
    }

    try {
      const url    = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao salvar categoria')
        return
      }

      router.refresh()
      onClose()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Alimentação, Saúde..."
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          {/* Ícone */}
          <div className="flex flex-col gap-1.5">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => set('icon', icon)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors ${
                    form.icon === icon
                      ? 'border-primary bg-accent'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className="flex flex-col gap-1.5">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => set('color', c.value)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c.value,
                    outline: form.color === c.value ? `2px solid ${c.value}` : 'none',
                    outlineOffset: '2px',
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}