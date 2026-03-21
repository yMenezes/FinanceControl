"use client";

// Fluxo "esqueci minha senha":
// 1. Usuário informa o email aqui
// 2. Supabase envia email com link mágico
// 3. Link redireciona para /reset-password com o token no hash da URL
// 4. Usuário define nova senha na página /reset-password

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Após clicar no link do email, o usuário vai para esta URL
      // O Supabase anexa o token no hash: /reset-password access_token=...
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("Erro ao enviar email. Tente novamente.");
      setLoading(false);
      return;
    }

    // Boa prática de segurança: sempre mostrar "email enviado"
    // mesmo que o email não exista — evita que alguém descubra
    // quais emails estão cadastrados no sistema
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="text-4xl">📬</div>
          <h1 className="text-xl font-semibold">Verifique seu email</h1>
          <p className="text-sm text-muted-foreground">
            Se esse email estiver cadastrado, você receberá um link para
            redefinir sua senha em breve.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Esqueci minha senha
          </h1>
          <p className="text-sm text-muted-foreground">
            Informe seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2
                         focus:ring-ring focus:ring-offset-2"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium
                       text-primary-foreground hover:bg-primary/90 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Enviando..." : "Enviar link de redefinição"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
