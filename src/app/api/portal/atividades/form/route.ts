import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ message: "Portal de Autoatendimento desativado." }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({ message: "Portal de Autoatendimento desativado." }, { status: 410 });
}
