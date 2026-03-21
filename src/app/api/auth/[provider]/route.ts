import { NextResponse, type NextRequest } from "next/server";

// Inicia o fluxo OAuth redirecionando diretamente para o endpoint do Supabase
// Isso evita problemas com PKCE ao usar o SDK no servidor
// Fluxo: /api/auth/google → Supabase → Google → /auth/callback
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = params.provider;

  // Só aceita providers configurados
  if (!["google", "github"].includes(provider)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const origin = new URL(request.url).origin;

  // Monta a URL de autorização do Supabase diretamente
  // O Supabase cuida do redirecionamento para o Google/GitHub
  const url = new URL(
    "/auth/v1/authorize",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", `${origin}/auth/callback`);

  return NextResponse.redirect(url.toString());
}
