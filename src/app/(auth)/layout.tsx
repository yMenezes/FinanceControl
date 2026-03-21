// Layout do grupo (auth) — sem sidebar, sem navbar
// Qualquer coisa aqui envolve TODAS as páginas de login e registro
// Por isso só passamos children direto — o estilo fica em cada page.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
