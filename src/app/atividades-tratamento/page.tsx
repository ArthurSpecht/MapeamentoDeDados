import AtividadesTratamentoClient from "./AtividadesTratamentoClient";
import { requireUser } from "@/lib/auth";

export default async function AtividadesTratamentoPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  await requireUser();
  const tabParam = (searchParams?.tab || "ativas").toLowerCase();
  const initialTab =
    tabParam === "arquivadas" || tabParam === "riscos" ? tabParam : "ativas";
  return <AtividadesTratamentoClient initialTab={initialTab} />;
}
