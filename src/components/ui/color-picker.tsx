'use client'

import { Label } from '@/components/ui/label'

const PRESET_COLORS = [
  { label: 'Roxo',     value: '#820ad1' },
  { label: 'Índigo',   value: '#4338ca' },
  { label: 'Azul',     value: '#003d82' },
  { label: 'Ciano',    value: '#0891b2' },
  { label: 'Verde',    value: '#0f6e56' },
  { label: 'Lima',     value: '#3b6d11' },
  { label: 'Âmbar',    value: '#854f0b' },
  { label: 'Coral',    value: '#993c1d' },
  { label: 'Rosa',     value: '#993556' },
  { label: 'Cinza',    value: '#444441' },
]

type Props = {
  value:    string
  onChange: (color: string) => void
  label?:   string
}

export function ColorPicker({ value, onChange, label = 'Cor' }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>

      {/* Cores pré-definidas */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map(c => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className="h-7 w-7 rounded-full transition-transform hover:scale-110"
            style={{
              background:    c.value,
              outline:       value === c.value ? `2px solid ${c.value}` : 'none',
              outlineOffset: '2px',
            }}
            title={c.label}
          />
        ))}

        {/* Separador */}
        <div className="w-px self-stretch bg-border" />

        {/* Input de cor personalizada */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded-full border border-border bg-transparent p-0.5"
            title="Cor personalizada"
          />
        </div>
      </div>

      {/* Cor selecionada atual */}
      <div className="flex items-center gap-2 mt-0.5">
        <div className="h-4 w-4 rounded-full border border-border" style={{ background: value }} />
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      </div>
    </div>
  )
}