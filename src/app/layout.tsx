import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import LogoutButton from "./LogoutButton";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "DATAVERA | Mapeamento de Dados",
  description: "Plataforma DATAVERA para gestão de atividades de tratamento de dados.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col text-gray-900">
        <header className="sticky top-0 z-10 border-b border-[#E7D6A2] bg-[#FAF7EF] text-[#111111] shadow-lg">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/datavera-logo.svg"
                alt="DATAVERA"
                width={360}
                height={75}
                priority
                className="h-[72px] w-auto"
              />
            </Link>
            <nav className="flex items-center gap-5 text-sm font-semibold text-[#2A2F36]">
              <Link
                href="/"
                className={`${user ? "hidden" : ""} transition hover:text-[#C79A4A]`}
              >
                Início
              </Link>
              {user ? (
                <>
                  <Link
                    href="/atividades-tratamento"
                    className="transition hover:text-[#C79A4A]"
                  >
                    Atividades
                  </Link>
                  <span className="hidden text-xs text-[#6B7280] md:inline">
                    {user.email}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="transition hover:text-[#C79A4A]">
                    Login
                  </Link>
                  <Link
                    href="/cadastro"
                    className="rounded-xl bg-[#111111] px-4 py-2 text-sm font-bold text-[#F4E7C1] transition hover:bg-black"
                  >
                    Criar cadastro
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mt-auto border-t border-[#2A2A2A] bg-[#111111] p-8 text-center text-sm text-[#D8C89D]">
          &copy; 2026 DATAVERA. Todos os direitos reservados.
        </footer>
      </body>
    </html>
  );
}
