import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  detail: z.string().trim().max(90).optional(),
  active: z.boolean().optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  try {
    const location = await prisma.location.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(location);
  } catch {
    return NextResponse.json({ error: "Ubicación no encontrada." }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ordersUsingIt = await prisma.order.count({ where: { locationId: params.id } });
  if (ordersUsingIt > 0) {
    // No rompemos trazabilidad histórica: en vez de borrar, desactivamos.
    await prisma.location.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ ok: true, softDeleted: true });
  }
  try {
    await prisma.location.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ubicación no encontrada." }, { status: 404 });
  }
}
