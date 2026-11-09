import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Protegido por middleware (cae bajo /api/admin). Liviano a propósito,
// igual que /api/orders/unread-count, para que AdminNav lo pueda consultar
// seguido sin pedir la lista completa de sugerencias.
export async function GET() {
  const count = await prisma.productSuggestion.count({ where: { readByAdmin: false } });
  return NextResponse.json({ count });
}
