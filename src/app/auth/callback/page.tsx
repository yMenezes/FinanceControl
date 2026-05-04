"use client";

// Página de callback OAuth — passo final do fluxo de login social
//
// Fluxo completo:
// 1. Usuário clica em "Continuar com Google/GitHub"
// 2. /api/auth/[provider] redireciona para o Supabase
// 3. Supabase redireciona para o Google/GitHub
// 4. Usuário autoriza o acesso
// 5. Google/GitHub redireciona de volta para esta página com o token no hash:
//    /auth/callback access_token=...&refresh_token=...
//
// O hash nunca é enviado ao servidor — por isso esta página é Client Component.
// Extraímos os tokens do hash e criamos a sessão manualmente com setSession().

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Finalizando login...");

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient();
      const hash = window.location.hash;

      if (!hash) {
        window.location.href = "/login?error=auth";
        return;
      }

      // Remove o '#' inicial e extrai os parâmetros do hash
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        window.location.href = "/login?error=auth";
        return;
      }

      // setSession cria a sessão com os tokens recebidos
      // Isso salva os tokens nos cookies para o middleware reconhecer
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        window.location.href = "/login?error=auth";
        return;
      }

      setStatus("Login realizado!");

      // Pequena espera para garantir que os cookies foram escritos
      // antes do middleware verificar a sessão no próximo request
      await new Promise((resolve) => setTimeout(resolve, 300));

      // window.location.href força um request HTTP completo — necessário
      // para o middleware ler os cookies de sessão recém-criados
      window.location.href = "/dashboard";
    }

    handleCallback();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
