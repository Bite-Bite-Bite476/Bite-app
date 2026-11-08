import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashAdminCode, isValidCodeFormat, verifyAdminCode } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({ currentCode: z.string(), newCode: z.string(), repeatCode: z.string() });

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { currentCode, newCode, repeatCode } = parsed.data;

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (!settings) return NextResponse.json({ error: "El panel no está configurado." }, { status: 500 });

  const ok = await verifyAdminCode(currentCode, settings.adminCodeHash);
  if (!ok) return NextResponse.json({ error: "El código actual no coincide." }, { status: 401 });
  if (!isValidCodeFormat(newCode)) return NextResponse.json({ error: "El nuevo código debe tener 10 dígitos." }, { status: 400 });
  if (newCode !== repeatCode) return NextResponse.json({ error: "Los códigos nuevos no coinciden." }, { status: 400 });

  const adminCodeHash = await hashAdminCode(newCode);
  await prisma.appSettings.update({ where: { id: 1 }, data: { adminCodeHash } });
  return NextResponse.json({ ok: true });
}
