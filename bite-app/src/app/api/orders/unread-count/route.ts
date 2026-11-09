import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Protegido por middleware (cae bajo /api/orders, requiere sesión de
// admin). Devuelve solo el total de mensajes sin leer entre todas las
// órdenes — liviano a propósito, para que la barra de navegación lo pueda
// consultar seguido sin pedir cada vez la lista completa de órdenes.
export async function GET() {
  const unread = await prisma.chatMessage.groupBy({
    by: ["orderId"],
    where: { sender: "CUSTOMER", readByAdmin: false },
    _count: true
  });
  const count = unread.reduce((a, u) => a + u._count, 0);
  return NextResponse.json({ count });
}
