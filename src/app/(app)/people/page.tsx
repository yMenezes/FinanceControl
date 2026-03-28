import { Suspense } from 'react'
import { PeopleList } from '@/components/people/PeopleList'
import { PeopleListSkeleton } from '@/components/people/PeopleListSkeleton'

export default function PeoplePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-medium">Pessoas</h1>
      <Suspense fallback={<PeopleListSkeleton />}>
        <PeopleList />
      </Suspense>
    </div>
  )
}