"use client";

import Link from "next/link";
import { useState } from "react";

export default function CadastroForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("A confirmação de senha não confere.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.message || "Não foi possível criar o cadastro.");
        return;
      }

      window.location.assign("/atividades-tratamento");
    } catch {
      setError("Não foi possível criar o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-[#E7D6A2] bg-white p-8 shadow-[0_24px_60px_rgba(17,17,17,0.08)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111111]">Criar cadastro</h1>
        <p className="mt-2 text-sm text-gray-600">
          Cadastre um usuário para acessar a ferramenta DATAVERA.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold text-gray-700">Nome</label>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#C79A4A]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">E-mail</label>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#C79A4A]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Senha</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#C79A4A]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Confirmar senha</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#C79A4A]"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#111111] px-5 py-3 font-bold text-[#F4E7C1] transition hover:bg-black disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar cadastro"}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-600">
        Já tem acesso?{" "}
        <Link href="/login" className="font-semibold text-[#C79A4A] hover:underline">
          Fazer login
        </Link>
      </div>
    </div>
  );
}
