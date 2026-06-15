import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";
import { requireApiUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function splitValues(input: string): string[] {
  return input
    .split(/[\n;,]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const url = new URL(request.url);
    const archivedParam = url.searchParams.get("archived");
    const archived =
      archivedParam === null ? null : archivedParam === "1" || archivedParam === "true";

    const activities = await prisma.processingActivity.findMany({
      where: archived === null ? undefined : { archived },
      include: { purposes: true, personalDataItems: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(activities);
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
    const activityName = String(body?.activityName ?? "").trim();
    const activityCodeRaw = String(body?.activityCode ?? "").trim();
    const personalData = String(body?.personalData ?? "").trim();
    const purpose = String(body?.purpose ?? "").trim();
    const legalBasis = String(body?.legalBasis ?? "").trim();

    if (!activityName) {
      return NextResponse.json(
        { message: "Nome da Atividade de Tratamento é obrigatório." },
        { status: 400 }
      );
    }

    const activityCode = activityCodeRaw ? activityCodeRaw : null;

    const personalDataItems = splitValues(personalData).map(v => ({
      id: randomUUID(),
      category: "Geral",
      dataName: v,
      sensitive: false,
      subjectTypes: ["Titular"],
      sync: false,
    }));

    const purposes = purpose || legalBasis ? [{
      id: randomUUID(),
      purpose,
      retentionDeadline: "Indeterminado",
      legalBasis,
    }] : [];

    const created = await prisma.processingActivity.create({
      data: {
        activityName,
        activityCode,
        personalData,
        purpose,
        legalBasis,
        archived: false,
        purposes: purposes.length ? { create: purposes } : undefined,
        personalDataItems: personalDataItems.length ? { create: personalDataItems } : undefined,
      },
      include: { purposes: true, personalDataItems: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
