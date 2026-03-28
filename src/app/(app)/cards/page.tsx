import { Suspense } from 'react'
import { CardList } from '@/components/cards/CardList'
import { CardListSkeleton } from '@/components/cards/CardListSkeleton'

export default function CartoesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-medium">Cartões</h1>
      <Suspense fallback={<CardListSkeleton />}>
        <CardList />
      </Suspense>
    </div>
  )
}