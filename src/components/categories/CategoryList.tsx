'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { CategoryFormDialog } from './CategoryFormDialog'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteCategory } from '@/lib/actions/categories'

type Category = {
  id:    string
  name:  string
  icon:  string
  color: string
}

export function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [formOpen, setFormOpen]         = useState(false)
  const [editCategory, setEditCategory] = useState<Category | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  function openCreate() {
    setEditCategory(undefined)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditCategory(category)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteCategory(deleteTarget.id)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {categories.map(category => (
          <div
            key={category.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            {/* Ícone com cor da categoria */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
              style={{ background: category.color + '22' }}
            >
              {category.icon}
            </div>

            {/* Nome */}
            <span className="flex-1 text-sm font-medium">{category.name}</span>

            {/* Bolinha de cor */}
            <div
              className="h-3 w-3 rounded-full"
              style={{ background: category.color }}
            />

            {/* Ações */}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(category)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(category)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {/* Adicionar */}
        <button
          onClick={openCreate}
          className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
            <Plus className="h-4 w-4" />
          </div>
          Adicionar categoria
        </button>
      </div>

      <CategoryFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editCategory}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
              Transações vinculadas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}