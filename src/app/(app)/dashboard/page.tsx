// Server Component — sem 'use client'
// Roda no servidor: busca dados direto do banco sem expor nada ao browser
//
// TODO: este é um placeholder — será substituído pelo dashboard completo
// com resumo mensal, faturas por cartão e gráficos de gastos

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Dupla verificação de sessão — boa prática mesmo com middleware ativo
  // O middleware protege a rota, mas aqui confirmamos e já pegamos
  // os dados do usuário para usar na página
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Logado como{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </div>
    </div>
  );
}
