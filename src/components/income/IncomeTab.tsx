'use client'

import { useState } from 'react'
import { IncomeList } from '@/components/income/IncomeList'
import { IncomeFormDialog } from '@/components/income/IncomeFormDialog'

type Props = {
  month: string
  year: string
  categoryId?: string
  personId?: string
  source?: string
  periodType?: string
  quarter?: string
  dateFrom?: string
  dateTo?: string
  dialogOpen?: boolean
  onDialogOpen?: () => void
  onDialogClose?: () => void
}

export function IncomeTab({ month, year, categoryId, personId, source, periodType, quarter, dateFrom, dateTo, dialogOpen = false, onDialogOpen, onDialogClose }: Props) {
  const [localDialogOpen, setLocalDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const isOpen = dialogOpen || localDialogOpen

  function handleSaved() {
    if (onDialogClose) {
      onDialogClose()
    }
    setLocalDialogOpen(false)
    setRefreshTrigger((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <IncomeList
        month={month}
        year={year}
        categoryId={categoryId}
        personId={personId}
        source={source}
        periodType={periodType}
        quarter={quarter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        refreshTrigger={refreshTrigger}
      />

      <IncomeFormDialog
        open={isOpen}
        onClose={() => {
          if (onDialogClose) {
            onDialogClose()
          }
          setLocalDialogOpen(false)
        }}
        onSaved={handleSaved}
      />
    </div>
  )
}
