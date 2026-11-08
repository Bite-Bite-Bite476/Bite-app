import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  category: z.enum(["PAQUETES", "BEBIDAS", "DULCES"]).optional(),
  priceCop: z.number().int().min(100).optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(["DISPONIBLE", "PROXIMAMENTE"]).optional(),
  imageUrl: z.string().trim().min(1).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  }
  try {
    const product = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
}

// Borrado suave: el producto deja de verse en la tienda y en /api/products,
// pero las órdenes que ya lo incluyen conservan su copia (nameAtSale, priceAtSale).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.product.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
}
