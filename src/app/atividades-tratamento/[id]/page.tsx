import AtividadeDetalheClient from "./AtividadeDetalheClient";
import { requireUser } from "@/lib/auth";

export default async function AtividadeDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { tab?: string };
}) {
  await requireUser();
  const tabParam = (searchParams?.tab || "informacoes").toLowerCase();
  const initialTab =
    tabParam === "finalidades"
      ? "finalidades"
      : tabParam === "dados-pessoais"
        ? "dados-pessoais"
        : "informacoes";
  return <AtividadeDetalheClient id={params.id} initialTab={initialTab} />;
}

