import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET es público (lo usa la tienda). POST requiere sesión de admin
// (aplicado en middleware.ts para cualquier método != GET bajo /api/products).

export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json(products);
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.enum(["PAQUETES", "BEBIDAS", "DULCES"]),
  priceCop: z.number().int().min(100),
  stock: z.number().int().min(0),
  status: z.enum(["DISPONIBLE", "PROXIMAMENTE"]),
  imageUrl: z.string().trim().min(1, "Falta la foto real del producto.")
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  }
  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
