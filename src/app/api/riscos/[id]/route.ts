import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const deleted = await prisma.$executeRaw`
      DELETE FROM "ActivityRisk"
      WHERE "id" = ${params.id}
    `;

    if (deleted === 0) {
      return NextResponse.json({ message: "Risco não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
