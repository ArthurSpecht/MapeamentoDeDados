"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginForm({ initialError = "" }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // #region debug-point A:login-hydrated
    fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"A",location:"LoginForm.useEffect",msg:"[DEBUG] LoginForm hidratado no cliente",data:{href:window.location.href},ts:Date.now()})}).catch(()=>{});
    // #endregion
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      // #region debug-point A:login-submit
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"A",location:"LoginForm.handleSubmit",msg:"[DEBUG] Login submit iniciado",data:{email,hasPassword:Boolean(password)},ts:Date.now()})}).catch(()=>{});
      // #endregion
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      // #region debug-point E:login-response
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"E",location:"LoginForm.handleSubmit",msg:"[DEBUG] Resposta recebida do login",data:{status:response.status,ok:response.ok,message:data?.message||null,hasUser:Boolean(data?.user)},ts:Date.now()})}).catch(()=>{});
      // #endregion
      if (!response.ok) {
        setError(data?.message || "Não foi possível entrar.");
        return;
      }

      // #region debug-point C:login-redirect
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"C",location:"LoginForm.handleSubmit",msg:"[DEBUG] Navegando para atividades",data:{target:"/atividades-tratamento"},ts:Date.now()})}).catch(()=>{});
      // #endregion
      window.location.assign("/atividades-tratamento");
    } catch {
      // #region debug-point E:login-catch
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"E",location:"LoginForm.handleSubmit",msg:"[DEBUG] Login caiu no catch do cliente",data:{email},ts:Date.now()})}).catch(()=>{});
      // #endregion
      setError("Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-[#E7D6A2] bg-white p-8 shadow-[0_24px_60px_rgba(17,17,17,0.08)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111111]">Login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Acesse a plataforma DATAVERA com seu e-mail e senha.
        </p>
      </div>

      <form
        className="space-y-4"
        action="/auth/login"
        method="post"
        onSubmit={handleSubmit}
        onSubmitCapture={() => {
          // #region debug-point A:login-submit-capture
          fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"A",location:"LoginForm.form",msg:"[DEBUG] onSubmitCapture disparado",data:{emailFilled:Boolean(email),passwordFilled:Boolean(password)},ts:Date.now()})}).catch(()=>{});
          // #endregion
        }}
      >
        <div>
          <label className="text-sm font-semibold text-gray-700">E-mail</label>
          <input
            type="email"
            name="email"
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
            name="password"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#C79A4A]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          onClick={() => {
            // #region debug-point A:login-button-click
            fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"A",location:"LoginForm.button",msg:"[DEBUG] Botao Entrar clicado",data:{loading},ts:Date.now()})}).catch(()=>{});
            // #endregion
          }}
          className="w-full rounded-xl bg-[#111111] px-5 py-3 font-bold text-[#F4E7C1] transition hover:bg-black disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-600">
        Ainda não tem cadastro?{" "}
        <Link href="/cadastro" className="font-semibold text-[#C79A4A] hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
