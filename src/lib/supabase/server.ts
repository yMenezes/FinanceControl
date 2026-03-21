import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase para uso em Server Components e API Routes
// Usa a API get/set/remove do @supabase/ssr@0.1.0
// Versões mais novas usam getAll/setAll — cuidado ao atualizar
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lê um cookie pelo nome — o Supabase chama isso para verificar a sessão
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Salva um cookie — chamado após login, refresh de token, etc.
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components são read-only para cookies
            // O middleware cuida do refresh da sessão nesses casos
          }
        },
        // Remove um cookie — chamado no logout
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Mesmo motivo do set acima
          }
        },
      },
    },
  );
}
