import { redirect } from "next/navigation";

// Página raiz — apenas redireciona para o dashboard
// O middleware já garante que quem não está logado vai para /login
// Quem está logado vai para /dashboard
export default function RootPage() {
  redirect("/dashboard");
}
