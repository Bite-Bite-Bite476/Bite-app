import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Protegido por middleware (requiere sesión de admin). Devuelve las órdenes
// más recientes primero, con sus líneas, ubicación e historial de estados.
export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, location: true, statusEvents: { orderBy: { at: "asc" } } },
    take: 500
  });
  return NextResponse.json(orders);
}
