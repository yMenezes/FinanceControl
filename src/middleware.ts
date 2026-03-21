import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// O middleware roda antes de cada request — é o guardião das rotas.
// Ele verifica se o usuário tem sessão válida e redireciona conforme necessário.
// Também é responsável por fazer o refresh automático do token quando expira.
export async function middleware(request: NextRequest) {
  // Começa com uma response padrão que pode ser substituída
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lê cookies do request atual
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        // Quando o Supabase precisa salvar um cookie (ex: refresh de token),
        // precisamos atualizá-lo tanto no request quanto na response
        // para que as próximas verificações já vejam o valor novo
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        // Remove cookie — necessário para o logout funcionar corretamente
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // getUser() faz uma chamada ao servidor Supabase para validar o token
  // É mais seguro que getSession() que apenas lê o cookie sem validar
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rotas públicas — acessíveis sem autenticação
  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/reset-password") ||
    request.nextUrl.pathname.startsWith("/auth") || // callback OAuth
    request.nextUrl.pathname.startsWith("/api/auth"); // API de login OAuth

  // Sem sessão tentando acessar rota protegida → redireciona para login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Com sessão tentando acessar rota pública → redireciona para dashboard
  // Evita que usuário logado acesse /login ou /register desnecessariamente
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Retorna a response com os cookies de sessão atualizados
  return response;
}

export const config = {
  // Roda em todas as rotas exceto arquivos estáticos
  // O padrão negativo (?!...) exclui _next, imagens e favicon
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
