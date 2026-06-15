import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/atividades-tratamento");
  }

  const initialError = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : "";

  return (
    <main className="mx-auto flex w-full max-w-6xl items-center justify-center p-8">
      <LoginForm initialError={initialError} />
    </main>
  );
}
