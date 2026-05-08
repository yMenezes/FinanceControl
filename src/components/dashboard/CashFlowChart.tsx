'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CashFlowHistory } from './queries'

interface CashFlowChartProps {
  data: CashFlowHistory[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { theme } = useTheme()
  const [axisColor, setAxisColor] = useState('#999999')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Cores para modo light e dark
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setAxisColor(isDark ? '#9ca3af' : '#666666')
  }, [theme])

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 h-96 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  if (!mounted) return null

  const maxValue = Math.max(...data.flatMap(d => [d.income, d.expenses]))

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Fluxo de Caixa (6 meses)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Comparação entre Entradas e Saídas · Máximo: {formatCurrency(maxValue)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            stroke={axisColor}
            style={{ fontSize: '12px', fill: axisColor }}
          />
          <YAxis
            stroke={axisColor}
            style={{ fontSize: '12px', fill: axisColor }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: any) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              color: 'var(--foreground)',
              padding: '8px 12px',
            }}
            cursor={{ stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.3 }}
            labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', fontSize: '14px' }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorIncome)"
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Entradas"
            animationDuration={600}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorExpenses)"
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
            name="Saídas"
            animationDuration={600}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            } as React.CSSProperties}
            formatter={(value) => (
              <span style={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: '500' }}>
                {value}
              </span>
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function CashFlowChartSkeleton() {
  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-8 h-96 shadow-sm">
      <div className="h-7 w-48 bg-muted rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-64 bg-muted rounded animate-pulse mb-6" />
      <div className="h-80 bg-muted rounded-lg animate-pulse" />
    </div>
  )
}
