"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  LayoutList,
  CalendarDays,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InvoiceInstallmentRow } from "./InvoiceInstallmentRow";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Card = { id: string; name: string; color: string };

type Installment = {
  id: string;
  number: number;
  amount: number;
  paid: boolean;
  transactions: {
    id: string;
    description: string;
    installments_count: number;
    card_id: string;
    purchase_date: string;
    cards: {
      id: string;
      name: string;
      color: string;
      closing_day: number;
      due_day: number;
    } | null;
    categories: {
      id: string;
      name: string;
      icon: string;
      color: string;
    } | null;
  };
};

type GroupMode = "category" | "date";

type Props = {
  cards: Card[];
  month: number;
  year: number;
  cardId?: string;
  periodType?: string;
  quarter?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function InvoicePage({
  cards,
  month,
  year,
  cardId,
  periodType,
  quarter,
  dateFrom,
  dateTo,
}: Props) {
  const [page, setPage] = useState(1);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [activeCard, setActiveCard] = useState<string>(cardId || "all");
  const [groupMode, setGroupMode] = useState<GroupMode>("category");
  const [filterOpen, setFilterOpen] = useState(false);
  const [localCard, setLocalCard] = useState(cardId || "all");
  const currentMonth = month;
  const currentYear = year;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fetch parcelas com paginação
  const fetchInstallments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('month', String(currentMonth));
      params.append('year', String(currentYear));
      params.append('page', String(page));
      params.append('limit', '20');
      params.append('card_id', activeCard);

      if (periodType) params.append('period_type', periodType);
      if (quarter) params.append('quarter', String(quarter));
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/invoices?${params.toString()}`);
      const result = await response.json();

      setInstallments(result.data || []);
      setPagination(result.pagination || { page: 1, limit: 20, total: 0, hasMore: false });
    } catch (error) {
      console.error("Erro ao buscar parcelas:", error);
      setInstallments([]);
      setPagination({ page: 1, limit: 20, total: 0, hasMore: false });
    } finally {
      setLoading(false);
    }
  }, [activeCard, currentMonth, currentYear, page, periodType, quarter, dateFrom, dateTo]);

  // Buscar parcelas quando mês/ano/cartão/page mudam
  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  // Reset página ao mudar cartão
  useEffect(() => {
    setPage(1);
  }, [activeCard, currentMonth, currentYear]);

  // Sincronizar cardId com activeCard quando props mudam
  useEffect(() => {
    if (cardId !== undefined) {
      setActiveCard(cardId);
      setLocalCard(cardId);
    }
  }, [cardId]);

  // Total da fatura filtrada
  const total = installments.reduce((acc, i) => acc + i.amount, 0);
  const totalPaid = installments
    .filter((i) => i.paid)
    .reduce((acc, i) => acc + i.amount, 0);

  // Agrupa por categoria ou por data
  function groupInstallments() {
    const groups: Record<
      string,
      { label: string; icon?: string; color?: string; items: Installment[] }
    > = {};

    for (const inst of installments) {
      let key: string;
      let label: string;
      let icon: string | undefined;
      let color: string | undefined;

      if (groupMode === "category") {
        key = inst.transactions?.categories?.id ?? "uncategorized";
        label = inst.transactions?.categories?.name ?? "Sem categoria";
        icon = inst.transactions?.categories?.icon;
        color = inst.transactions?.categories?.color;
      } else {
        key = inst.transactions?.purchase_date ?? "unknown";
        label = inst.transactions?.purchase_date 
          ? new Date(
              inst.transactions?.purchase_date + "T12:00:00",
            ).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
          : "Data desconhecida";
      }

      if (!groups[key]) groups[key] = { label, icon, color, items: [] };
      groups[key].items.push(inst);
    }

    return Object.values(groups);
  }

  // Toggle individual
  const handleToggle = useCallback(async (id: string, paid: boolean) => {
    setInstallments((prev) =>
      prev.map((i) => (i.id === id ? { ...i, paid } : i)),
    );
    await fetch(`/api/installments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid }),
    });
  }, []);

  // Marcar fatura inteira como paga
  async function markAllPaid() {
    const allPaid = installments.every((i) => i.paid);
    const next = !allPaid;

    setInstallments((prev) =>
      prev.map((i) => ({ ...i, paid: next })),
    );

    await fetch(`/api/invoices/${activeCard}/${currentYear}/${currentMonth}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: next }),
    });
  }

  const allPaid = installments.length > 0 && installments.every((i) => i.paid);
  const groups = groupInstallments();
  const activeCardData = cards.find((c) => c.id === activeCard);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Carregando fatura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          Lançamentos agendados não entram na fatura até serem executados.
        </p>
      </div>

      {/* Filtro minimalista */}
      <div className="flex items-center justify-end mb-5">
        <button
          onClick={() => { setLocalCard(activeCard); setFilterOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrar
          {activeCard !== "all" && (
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
              1
            </span>
          )}
        </button>
      </div>

      {/* Modal de filtro */}
      {filterOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setFilterOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto pointer-events-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold">Filtros</h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
                aria-label="Fechar filtros"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Cartão</Label>
              <Select value={localCard} onValueChange={setLocalCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cartões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cartões</SelectItem>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 mt-6 pt-5 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocalCard("all")}
              >
                Limpar
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setActiveCard(localCard);
                  setPage(1);
                  setFilterOpen(false);
                }}
              >
                Aplicar filtros
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Header da fatura */}
      <div
        className={`rounded-xl p-4 mb-4 flex items-center justify-between ${
          !activeCardData ? "bg-muted" : ""
        }`}
        style={activeCardData ? { background: activeCardData.color } : {}}
      >
        <div>
          <p
            className={`text-sm font-medium ${activeCardData ? "text-white" : "text-foreground"}`}
          >
            {activeCardData?.name ?? "Todos os cartões"}
          </p>
          <p
            className={`text-xs mt-0.5 ${activeCardData ? "text-white/70" : "text-muted-foreground"}`}
          >
            {installments.length} lançamento{installments.length !== 1 ? "s" : ""}
            {totalPaid > 0 &&
              ` · ${totalPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} pago`}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-xs ${activeCardData ? "text-white/70" : "text-muted-foreground"}`}
          >
            Total
          </p>
          <p
            className={`text-xl font-medium ${activeCardData ? "text-white" : "text-foreground"}`}
          >
            {total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        {/* Seletor de agrupamento */}
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setGroupMode("category")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
              groupMode === "category"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutList className="h-3 w-3" />
            Categoria
          </button>
          <button
            onClick={() => setGroupMode("date")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
              groupMode === "date"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            Data
          </button>
        </div>

        {/* Marcar fatura como paga */}
        <Button
          size="sm"
          variant={allPaid ? "outline" : "default"}
          className="gap-1.5 text-xs h-8"
          onClick={markAllPaid}
          disabled={installments.length === 0}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          {allPaid ? "Desmarcar fatura" : "Marcar como paga"}
        </Button>
      </div>

      {/* Lista agrupada */}
      {installments.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            Nenhum lançamento nesta fatura
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-6">
            {groups.map((group, idx) => {
              const groupTotal = group.items.reduce(
                (acc, i) => acc + i.amount,
                0,
              );
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  {/* Header do grupo */}
                  <div className="flex items-center justify-between bg-muted px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {group.icon && (
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-md text-sm"
                          style={{
                            background: group.color
                              ? group.color + "22"
                              : undefined,
                          }}
                        >
                          {group.icon}
                        </span>
                      )}
                      <span className="text-xs font-medium">{group.label}</span>
                    </div>
                    <span className="text-xs font-medium">
                      {groupTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>

                  {/* Linhas */}
                  {group.items.map((inst) => (
                    inst.transactions ? (
                      <InvoiceInstallmentRow
                        key={inst.id}
                        id={inst.id}
                        description={inst.transactions.description}
                        number={inst.number}
                        installmentsCount={inst.transactions.installments_count}
                        amount={inst.amount}
                        paid={inst.paid}
                        onToggle={handleToggle}
                      />
                    ) : null
                  ))}
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit) || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasMore}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
