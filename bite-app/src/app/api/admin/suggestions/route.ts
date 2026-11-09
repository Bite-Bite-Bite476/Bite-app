import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Protegido por middleware (cae bajo /api/admin). Lista las sugerencias de
// producto más recientes primero.
export async function GET() {
  const suggestions = await prisma.productSuggestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 300
  });
  return NextResponse.json(
    suggestions.map((s) => ({
      id: s.id,
      body: s.body,
      readByAdmin: s.readByAdmin,
      createdAt: s.createdAt.toISOString()
    }))
  );
}

const patchSchema = z.union([z.object({ id: z.string().min(1) }), z.object({ all: z.literal(true) })]);

// Marca una sugerencia como leída ({ id }) o todas de una vez ({ all: true }).
export async function PATCH(req: NextRequest) {
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  if ("all" in parsed.data) {
    await prisma.productSuggestion.updateMany({ where: { readByAdmin: false }, data: { readByAdmin: true } });
  } else {
    await prisma.productSuggestion.update({ where: { id: parsed.data.id }, data: { readByAdmin: true } });
  }
  return NextResponse.json({ ok: true });
}
