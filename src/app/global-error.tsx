"use client";

import Image from "next/image";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen text-gray-900">
        <main className="mx-auto w-full max-w-3xl p-8">
          <div className="overflow-hidden rounded-3xl border border-[#D9C28A] bg-[#111111] p-8 shadow-[0_24px_60px_rgba(17,17,17,0.16)]">
            <div className="relative inline-flex items-center justify-center">
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(246,240,224,0.9)_0%,rgba(246,240,224,0.45)_48%,rgba(246,240,224,0)_78%)] blur-xl" />
              <Image
                src="/datavera-logo.svg"
                alt="DATAVERA"
                width={220}
                height={64}
                priority
                className="relative h-16 w-auto"
              />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">Erro inesperado</h1>
            <p className="mt-2 text-[#E7D9B5]">
              O aplicativo encontrou um problema. Você pode tentar novamente ou recarregar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-xl bg-contix-primary px-5 py-2.5 font-bold text-[#111111] hover:brightness-110"
                onClick={reset}
              >
                Tentar novamente
              </button>
              <button
                className="rounded-xl border border-[#D4AF37]/35 px-5 py-2.5 font-bold text-[#F4E7C1] hover:bg-white/5"
                onClick={() => window.location.reload()}
              >
                Recarregar
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
