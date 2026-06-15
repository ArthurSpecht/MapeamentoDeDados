import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export async function GET() {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const history = await prisma.$queryRaw`
      SELECT
        "id",
        "fileName",
        "status",
        "message",
        "inserted",
        "updated",
        "total",
        "errorDetails",
        "createdAt"
      FROM "ImportHistory"
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await request.json();
    const fileName = asString(body?.fileName).trim() || "Planilha sem nome";
    const message = asString(body?.message).trim() || "Não foi possível importar a planilha.";

    await prisma.$executeRaw`
      INSERT INTO "ImportHistory"
        ("id", "fileName", "status", "message", "errorDetails")
      VALUES
        (
          ${randomUUID()},
          ${fileName},
          ${"ERRO"},
          ${message},
          CAST(${JSON.stringify([{ rowIndex: 0, message }])} AS JSONB)
        )
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
