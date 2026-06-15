import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";
import { requireApiUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const activity = await prisma.processingActivity.findUnique({
      where: { id: params.id },
      include: { purposes: true, personalDataItems: true },
    });
    if (!activity) {
      return NextResponse.json({ message: "Não encontrado." }, { status: 404 });
    }
    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await request.json();
    const existing = await prisma.processingActivity.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ message: "Não encontrado." }, { status: 404 });

    const activityCodeProvided = Object.prototype.hasOwnProperty.call(body ?? {}, "activityCode");
    const activityCodeRaw = activityCodeProvided ? String(body?.activityCode ?? "").trim() : undefined;
    const activityCode = activityCodeProvided ? (activityCodeRaw ? activityCodeRaw : null) : undefined;

    const purposesProvided = Array.isArray(body?.purposes);
    const personalDataItemsProvided = Array.isArray(body?.personalDataItems);

    const updated = await prisma.$transaction(async tx => {
      await tx.processingActivity.update({
        where: { id: params.id },
        data: {
          activityName:
            body?.activityName === undefined ? undefined : String(body.activityName ?? "").trim(),
          activityCode,
          personalData:
            body?.personalData === undefined ? undefined : String(body.personalData ?? "").trim(),
          purpose: body?.purpose === undefined ? undefined : String(body.purpose ?? "").trim(),
          legalBasis:
            body?.legalBasis === undefined ? undefined : String(body.legalBasis ?? "").trim(),
          archived: body?.archived === undefined ? undefined : Boolean(body.archived),
        },
      });

      if (purposesProvided) {
        await tx.activityPurpose.deleteMany({ where: { processingActivityId: params.id } });
        const purposes = (body.purposes as any[])
          .map(p => ({
            id: String(p?.id || randomUUID()),
            processingActivityId: params.id,
            purpose: String(p?.purpose ?? "").trim(),
            retentionDeadline: String(p?.retentionDeadline ?? "Indeterminado").trim(),
            legalBasis: String(p?.legalBasis ?? "").trim(),
          }))
          .filter(p => p.purpose || p.legalBasis);
        if (purposes.length) await tx.activityPurpose.createMany({ data: purposes });
      }

      if (personalDataItemsProvided) {
        await tx.personalDataItem.deleteMany({ where: { processingActivityId: params.id } });
        const items = (body.personalDataItems as any[])
          .map(i => ({
            id: String(i?.id || randomUUID()),
            processingActivityId: params.id,
            category: String(i?.category ?? "Geral").trim() || "Geral",
            dataName: String(i?.dataName ?? "").trim(),
            sensitive: Boolean(i?.sensitive),
            subjectTypes: Array.isArray(i?.subjectTypes) ? i.subjectTypes.map((s: any) => String(s)) : [],
            sync: Boolean(i?.sync),
          }))
          .filter(i => i.dataName);
        if (items.length) await tx.personalDataItem.createMany({ data: items });
      }

      const activity = await tx.processingActivity.findUnique({
        where: { id: params.id },
        include: { purposes: true, personalDataItems: true },
      });
      return activity;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const existing = await prisma.processingActivity.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "NÃ£o encontrado." }, { status: 404 });
    }

    await prisma.processingActivity.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: getDatabaseErrorMessage(error) },
      { status: 503 }
    );
  }
}
