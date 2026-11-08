import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Protegido por middleware (requiere sesión de admin). Devuelve las órdenes
// más recientes primero, con sus líneas, ubicación, historial de estados y
// cuántos mensajes de chat sin leer tiene cada una.
export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, location: true, statusEvents: { orderBy: { at: "asc" } } },
    take: 500
  });

  const unread = await prisma.chatMessage.groupBy({
    by: ["orderId"],
    where: { sender: "CUSTOMER", readByAdmin: false },
    _count: true
  });
  const unreadByOrder = new Map(unread.map((u) => [u.orderId, u._count]));

  const withUnread = orders.map((o) => ({ ...o, unreadCount: unreadByOrder.get(o.id) ?? 0 }));
  return NextResponse.json(withUnread);
}
