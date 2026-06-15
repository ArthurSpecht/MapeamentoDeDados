import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export async function GET() {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const risks = await prisma.$queryRaw`
      SELECT
        r."id",
        r."processingActivityId",
        r."title",
        r."description",
        r."impact",
        r."probability",
        r."source",
        r."createdAt",
        r."updatedAt",
        a."activityName",
        a."activityCode"
      FROM "ActivityRisk" r
      INNER JOIN "ProcessingActivity" a ON a."id" = r."processingActivityId"
      ORDER BY r."updatedAt" DESC
    `;

    return NextResponse.json(risks);
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
    const processingActivityId = asString(body?.processingActivityId).trim();
    const title = asString(body?.title).trim();
    const description = asString(body?.description).trim();
    const impact = asString(body?.impact).trim();
    const probability = asString(body?.probability).trim();
    const source = asString(body?.source).trim() || "manual";

    if (!processingActivityId) {
      return NextResponse.json(
        { message: "Selecione uma atividade de tratamento." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { message: "Informe o risco." },
        { status: 400 }
      );
    }

    if (!impact || !probability) {
      return NextResponse.json(
        { message: "Informe impacto e probabilidade." },
        { status: 400 }
      );
    }

    const existingActivity = await prisma.processingActivity.findUnique({
      where: { id: processingActivityId },
      select: { id: true },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { message: "Atividade de tratamento não encontrada." },
        { status: 404 }
      );
    }

    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "ActivityRisk"
        ("id", "processingActivityId", "title", "description", "impact", "probability", "source", "updatedAt")
      VALUES
        (${id}, ${processingActivityId}, ${title}, ${description}, ${impact}, ${probability}, ${source}, NOW())
    `;

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
