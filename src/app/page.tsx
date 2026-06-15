import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/atividades-tratamento");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8">
      <section className="overflow-hidden rounded-[2rem] border border-[#D9C28A] bg-[#111111] text-white shadow-[0_30px_80px_rgba(17,17,17,0.18)]">
        <div className="grid gap-10 px-10 py-12 lg:grid-cols-[1.35fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-[#D4AF37]/30 bg-[#1A1A1A] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              DATAVERA
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white lg:text-5xl">
              Mapeamento de dados com identidade visual premium e foco em LGPD.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#E7D9B5]">
              Organize, importe e mantenha seu inventário de atividades de tratamento
              em uma interface segura, elegante e pronta para crescer com o seu processo.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-contix-primary px-6 py-3 font-bold text-[#111111] transition hover:brightness-110"
              >
                Fazer login
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/35 px-6 py-3 font-bold text-[#F2E8CF] transition hover:bg-white/5"
              >
                Criar cadastro
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center p-6">
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-32 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(246,240,224,0.92)_0%,rgba(246,240,224,0.58)_45%,rgba(246,240,224,0)_78%)] blur-2xl" />
            <Image
              src="/datavera-logo.svg"
              alt="Logo DATAVERA"
              width={1250}
              height={260}
              priority
              className="relative h-auto w-full max-w-[620px]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[#E8DAB0] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-contix-primary">
            Importação
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Envie planilhas no modelo definido e acelere o cadastro das
            atividades de tratamento.
          </p>
        </div>
        <div className="rounded-3xl border border-[#E8DAB0] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-contix-primary">
            Governança
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Centralize código, finalidade, dados pessoais e hipótese legal em
            um só fluxo.
          </p>
        </div>
        <div className="rounded-3xl border border-[#E8DAB0] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-contix-primary">
            Operação
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Trabalhe com uma base organizada, pronta para revisão interna e
            evolução do inventário.
          </p>
        </div>
      </section>

      <section className="hidden">
        <h2 className="text-2xl font-bold text-[#111111]">
          Ambiente DATAVERA para atividades de tratamento
        </h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          A aplicação concentra cadastro, autenticação e gestão das atividades
          em uma identidade alinhada ao logo enviado.
        </p>
        <div className="mt-8">
          <Link
            href={user ? "/atividades-tratamento" : "/login"}
            className="inline-flex items-center justify-center rounded-xl bg-[#111111] px-6 py-3 font-bold text-[#F2E8CF] transition hover:bg-black"
          >
            {user ? "Acessar Atividades de Tratamento" : "Entrar na plataforma"}
          </Link>
        </div>
      </section>
    </main>
  );
}
