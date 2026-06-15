import { redirect } from "next/navigation";
import CadastroForm from "./CadastroForm";
import { getCurrentUser } from "@/lib/auth";

export default async function CadastroPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/atividades-tratamento");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl items-center justify-center p-8">
      <CadastroForm />
    </main>
  );
}
