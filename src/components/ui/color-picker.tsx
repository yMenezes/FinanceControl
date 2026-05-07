'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PRESET_COLORS = [
  { label: 'Roxo',   value: '#820ad1' },
  { label: 'Índigo', value: '#4338ca' },
  { label: 'Azul',   value: '#003d82' },
  { label: 'Ciano',  value: '#0891b2' },
  { label: 'Verde',  value: '#0f6e56' },
  { label: 'Lima',   value: '#3b6d11' },
  { label: 'Âmbar',  value: '#854f0b' },
  { label: 'Coral',  value: '#993c1d' },
  { label: 'Rosa',   value: '#993556' },
  { label: 'Cinza',  value: '#444441' },
]

type Props = {
  value:    string
  onChange: (color: string) => void
  label?:   string
}

function normalizeHexColor(input: string, fallback = '#820ad1') {
  const cleaned = input.trim().replace('#', '').replace(/[^0-9a-fA-F]/g, '')

  if (cleaned.length === 3) {
    const expanded = cleaned
      .split('')
      .map(char => `${char}${char}`)
      .join('')
      .toLowerCase()

    return `#${expanded}`
  }

  if (cleaned.length === 6) {
    return `#${cleaned.toLowerCase()}`
  }

  return fallback
}

function toHexDraft(input: string) {
  const cleaned = input.trim().replace('#', '').replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
  return `#${cleaned.toUpperCase()}`
}

export function ColorPicker({ value, onChange, label = 'Cor' }: Props) {
  const [localColor, setLocalColor] = useState(() => normalizeHexColor(value))
  const [hexDraft, setHexDraft] = useState(() => normalizeHexColor(value).toUpperCase())

  useEffect(() => {
    const normalized = normalizeHexColor(value)
    setLocalColor(normalized)
    setHexDraft(normalized.toUpperCase())
  }, [value])

  function commitColor(next: string) {
    const normalized = normalizeHexColor(next, localColor)
    setLocalColor(normalized)
    setHexDraft(normalized.toUpperCase())
    onChange(normalized)
  }

  function handlePresetClick(color: string) {
    commitColor(color)
  }

  const isCustom = !PRESET_COLORS.some(c => c.value.toLowerCase() === localColor.toLowerCase())

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>

      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map(c => (
          <button
            key={c.value}
            type="button"
            onClick={() => handlePresetClick(c.value)}
            className="h-7 w-7 rounded-full transition-transform hover:scale-110"
            style={{
              background:    c.value,
              outline:       value.toLowerCase() === c.value.toLowerCase() ? `2px solid ${c.value}` : 'none',
              outlineOffset: '2px',
            }}
            title={c.label}
            aria-label={c.label}
          />
        ))}

        <div className="w-px self-stretch bg-border" />

        <div className="relative h-7 w-7">
          <input
            type="color"
            value={localColor}
            onChange={e => commitColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            title="Cor personalizada"
            aria-label="Cor personalizada"
          />
          <button
            type="button"
            className="absolute inset-0 rounded-full border border-border transition-transform hover:scale-110"
            style={{
              background: isCustom
                ? localColor
                : 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)',
              outline: value.toLowerCase() === localColor.toLowerCase() ? `2px solid ${localColor}` : 'none',
              outlineOffset: '2px',
            }}
            title="Cor personalizada"
            onClick={e => {
              e.preventDefault()
              e.currentTarget.parentElement?.querySelector('input[type="color"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            }}
          />
        </div>
      </div>

      <div className="sm:hidden">
        <Input
          type="text"
          value={hexDraft}
          onChange={e => {
            const draft = toHexDraft(e.target.value)
            setHexDraft(draft)

            if (draft.length === 7) {
              commitColor(draft)
            }
          }}
          onBlur={() => commitColor(hexDraft)}
          placeholder="#A1B2C3"
          maxLength={7}
          className="h-9 font-mono text-xs uppercase"
          title="Cor personalizada"
          aria-label="Cor personalizada em HEX"
        />
      </div>
    </div>
  )
}