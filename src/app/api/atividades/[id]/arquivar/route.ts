import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";
import { requireApiUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const updated = await prisma.processingActivity.update({
      where: { id: params.id },
      data: { archived: true },
      include: { purposes: true, personalDataItems: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ message: "Não encontrado." }, { status: 404 });
    }
    return NextResponse.json(
      { message: getDatabaseErrorMessage(e) },
      { status: 503 }
    );
  }
}

