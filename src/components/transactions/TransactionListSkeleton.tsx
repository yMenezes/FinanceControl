import { Skeleton } from '@/components/ui/skeleton'

export function TransactionListSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Filtros skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-muted px-4 py-3">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>

      {/* Lista com grupos de datas */}
      <div className="space-y-4">
        {[1, 2, 3].map((dateGroup) => (
          <div key={dateGroup}>
            {/* Data header */}
            <Skeleton className="h-3 w-24 mb-3" />
            
            {/* Itens do grupo */}
            <div className="space-y-1.5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  {/* Ícone */}
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  
                  {/* Valor */}
                  <Skeleton className="h-5 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
