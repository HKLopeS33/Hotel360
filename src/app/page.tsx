import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

const DEFAULT_ROUTE: Record<string, string> = {
  master:        '/dashboard',
  admin:         '/dashboard',
  recepcionista: '/quartos',
  camareira:     '/limpeza',
  manutencao:    '/manutencao',
}

export default async function Home() {
  const profile = await getProfile();
  if (profile) redirect(DEFAULT_ROUTE[profile.role] ?? '/quartos');
  redirect("/login");
}
