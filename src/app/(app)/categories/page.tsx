import { Suspense } from 'react'
import { CategoryList } from '@/components/categories/CategoryList'
import { CategoryListSkeleton } from '@/components/categories/CategoryListSkeleton'

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-medium">Categorias</h1>
      <Suspense fallback={<CategoryListSkeleton />}>
        <CategoryList />
      </Suspense>
    </div>
  )
}