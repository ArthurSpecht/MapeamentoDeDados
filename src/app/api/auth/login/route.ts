import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    // #region debug-point B:api-entry
    fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"B",location:"api/auth/login",msg:"[DEBUG] API de login acionada",data:{email,hasPassword:Boolean(password)},ts:Date.now()})}).catch(()=>{});
    // #endregion

    if (!email || !password) {
      // #region debug-point B:api-validation
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"B",location:"api/auth/login",msg:"[DEBUG] Login rejeitado por campos obrigatorios",data:{emailPresent:Boolean(email),passwordPresent:Boolean(password)},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { message: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      // #region debug-point B:api-invalid-credentials
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"B",location:"api/auth/login",msg:"[DEBUG] Credenciais invalidas no login",data:{userFound:Boolean(user)},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
    response.cookies.set(
      "datavera_session",
      createSessionToken({ id: user.id, email: user.email }),
      getSessionCookieOptions()
    );
    // #region debug-point B:api-success
    fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"B",location:"api/auth/login",msg:"[DEBUG] Login autenticado e cookie emitido",data:{userId:user.id,email:user.email},ts:Date.now()})}).catch(()=>{});
    // #endregion
    return response;
  } catch (error) {
    // #region debug-point D:api-error
    fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"login-refresh-loop",runId:"pre-fix",hypothesisId:"D",location:"api/auth/login",msg:"[DEBUG] Excecao na API de login",data:{message:error instanceof Error ? error.message : String(error)},ts:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
