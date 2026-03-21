import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components ('use client')
// Configurado para usar cookies ao invés de localStorage
// para que o middleware do servidor consiga ler a sessão
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
