import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const loginUrl = new URL("/login", url.origin);
  const redirectToActivities = new URL("/atividades-tratamento", url.origin);

  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    // #region debug-point B:form-route-entry
    fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"post-fix",hypothesisId:"B",location:"auth/login route",msg:"[DEBUG] Rota de fallback do formulario acionada",data:{email,hasPassword:Boolean(password)},ts:Date.now()})}).catch(()=>{});
    // #endregion

    if (!email || !password) {
      loginUrl.searchParams.set("error", "E-mail e senha são obrigatórios.");
      return NextResponse.redirect(loginUrl);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      // #region debug-point B:form-route-invalid
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"post-fix",hypothesisId:"B",location:"auth/login route",msg:"[DEBUG] Fallback rejeitou credenciais",data:{userFound:Boolean(user)},ts:Date.now()})}).catch(()=>{});
      // #endregion
      loginUrl.searchParams.set("error", "Credenciais inválidas.");
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.redirect(redirectToActivities);
    response.cookies.set(
      "datavera_session",
      createSessionToken({ id: user.id, email: user.email }),
      getSessionCookieOptions()
    );
    // #region debug-point B:form-route-success
    fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"post-fix",hypothesisId:"B",location:"auth/login route",msg:"[DEBUG] Fallback autenticou e redirecionou",data:{userId:user.id,email:user.email},ts:Date.now()})}).catch(()=>{});
    // #endregion
    return response;
  } catch (error) {
    // #region debug-point D:form-route-error
    fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"post-fix",hypothesisId:"D",location:"auth/login route",msg:"[DEBUG] Excecao na rota de fallback do formulario",data:{message:error instanceof Error ? error.message : String(error)},ts:Date.now()})}).catch(()=>{});
    // #endregion
    loginUrl.searchParams.set("error", getDatabaseErrorMessage(error));
    return NextResponse.redirect(loginUrl);
  }
}
