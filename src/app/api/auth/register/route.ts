import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionCookieOptions,
  hashPassword,
} from "@/lib/auth";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nome, e-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Já existe um cadastro com este e-mail." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(
      "datavera_session",
      createSessionToken(user),
      getSessionCookieOptions()
    );
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
