import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getDatabaseErrorMessage } from "@/lib/databaseStatus";
import { requireApiUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ImportRow = {
  nomeAtividadeTratamento?: unknown;
  codigoAtividadeTratamento?: unknown;
  dadosPessoais?: unknown;
  finalidade?: unknown;
  hipoteseLegal?: unknown;
};

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function splitValues(input: string): string[] {
  return input
    .split(/[\n;,]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

async function createImportHistory(data: {
  fileName: string;
  status: string;
  message: string;
  inserted?: number;
  updated?: number;
  total?: number;
  errorDetails?: Array<{ rowIndex: number; message: string }>;
}) {
  await prisma.$executeRaw`
    INSERT INTO "ImportHistory"
      ("id", "fileName", "status", "message", "inserted", "updated", "total", "errorDetails")
    VALUES
      (
        ${randomUUID()},
        ${data.fileName},
        ${data.status},
        ${data.message},
        ${data.inserted ?? 0},
        ${data.updated ?? 0},
        ${data.total ?? 0},
        CAST(${JSON.stringify(data.errorDetails ?? [])} AS JSONB)
      )
  `;
}

export async function POST(request: Request) {
  const authUser = await requireApiUser();
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await request.json();
    const fileName = asString(body?.fileName).trim() || "Planilha sem nome";
    const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];

    if (rows.length === 0) {
      await createImportHistory({
        fileName,
        status: "ERRO",
        message: "Nenhuma linha para importar.",
      });
      return NextResponse.json(
        { message: "Nenhuma linha para importar." },
        { status: 400 }
      );
    }

    const normalizedRows: Array<{
      activityName: string;
      activityCode: string;
      personalData: string;
      purpose: string;
      legalBasis: string;
      rowIndex: number;
    }> = [];

    const errors: Array<{ rowIndex: number; message: string }> = [];

    rows.forEach((row, idx) => {
      const activityName = asString(row.nomeAtividadeTratamento).trim();
      const activityCode = asString(row.codigoAtividadeTratamento).trim();
      const personalData = asString(row.dadosPessoais).trim();
      const purpose = asString(row.finalidade).trim();
      const legalBasis = asString(row.hipoteseLegal).trim();

      const hasAny =
        activityName || activityCode || personalData || purpose || legalBasis;

      if (!hasAny) return;

      if (!activityName) {
        errors.push({
          rowIndex: idx + 2,
          message: "Nome da Atividade de Tratamento é obrigatório.",
        });
        return;
      }

      normalizedRows.push({
        activityName,
        activityCode,
        personalData,
        purpose,
        legalBasis,
        rowIndex: idx + 2,
      });
    });

    let inserted = 0;
    let updated = 0;

    await prisma.$transaction(async tx => {
      for (const row of normalizedRows) {
        const code = row.activityCode.trim();
        const codeOrNull = code ? code : null;

        const purposeCreate = row.purpose || row.legalBasis ? {
          id: randomUUID(),
          purpose: row.purpose,
          retentionDeadline: "Indeterminado",
          legalBasis: row.legalBasis,
        } : null;

        const personalDataItemsCreate = splitValues(row.personalData).map(v => ({
          id: randomUUID(),
          category: "Geral",
          dataName: v,
          sensitive: false,
          subjectTypes: ["Titular"],
          sync: false,
        }));

        if (!code) {
          await tx.processingActivity.create({
            data: {
              activityName: row.activityName,
              activityCode: null,
              personalData: row.personalData,
              purpose: row.purpose,
              legalBasis: row.legalBasis,
              archived: false,
              purposes: purposeCreate ? { create: [purposeCreate] } : undefined,
              personalDataItems: personalDataItemsCreate.length
                ? { create: personalDataItemsCreate }
                : undefined,
            },
          });
          inserted += 1;
          continue;
        }

        const existing = await tx.processingActivity.findUnique({
          where: { activityCode: code },
          include: { purposes: true, personalDataItems: true },
        });

        if (!existing) {
          await tx.processingActivity.create({
            data: {
              activityName: row.activityName,
              activityCode: codeOrNull,
              personalData: row.personalData,
              purpose: row.purpose,
              legalBasis: row.legalBasis,
              archived: false,
              purposes: purposeCreate ? { create: [purposeCreate] } : undefined,
              personalDataItems: personalDataItemsCreate.length
                ? { create: personalDataItemsCreate }
                : undefined,
            },
          });
          inserted += 1;
          continue;
        }

        await tx.processingActivity.update({
          where: { id: existing.id },
          data: {
            activityName: row.activityName,
            personalData: row.personalData,
            purpose: row.purpose,
            legalBasis: row.legalBasis,
          },
        });

        if (existing.purposes.length === 0 && purposeCreate) {
          await tx.activityPurpose.create({
            data: { ...purposeCreate, processingActivityId: existing.id },
          });
        }

        if (existing.personalDataItems.length === 0 && personalDataItemsCreate.length) {
          await tx.personalDataItem.createMany({
            data: personalDataItemsCreate.map(i => ({
              ...i,
              processingActivityId: existing.id,
            })),
          });
        }

        updated += 1;
      }
    });

    const total = inserted + updated;
    const hasOnlyErrors = total === 0 && errors.length > 0;
    const message = hasOnlyErrors
      ? "A planilha foi lida, mas nenhuma atividade foi importada."
      : errors.length > 0
        ? "Importação concluída com avisos em algumas linhas."
        : "Importação concluída.";

    await createImportHistory({
      fileName,
      status: hasOnlyErrors ? "ERRO" : "CONCLUIDO",
      message,
      inserted,
      updated,
      total,
      errorDetails: errors,
    });

    return NextResponse.json({
      inserted,
      updated,
      total,
      errors,
    });
  } catch (error) {
    const message = getDatabaseErrorMessage(error);
    return NextResponse.json(
      { message },
      { status: 503 }
    );
  }
}
