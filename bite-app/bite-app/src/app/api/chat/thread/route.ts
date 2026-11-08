import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkChatRateLimit, registerChatAttempt, clientIp } from "@/lib/chat-rate-limit";
import { lookupSchema, findOrderByLookup, CHAT_NOT_FOUND } from "@/lib/chat-lookup";
import type { ChatMessageDTO, OrderSummaryDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Busca un pedido por correo + código y devuelve su resumen y el hilo
 * completo del chat. Público (sin login): el cliente lo usa primero para
 * encontrar su pedido, y luego se vuelve a llamar cada pocos segundos
 * (sondeo) para refrescar la conversación mientras tiene la página abierta.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = checkChatRateLimit(ip);
  if (!limit.allowed) {
    const seconds = Math.ceil((limit.retryAfterMs || 0) / 1000);
    return NextResponse.json({ error: `Demasiados intentos. Espera ${seconds} segundos.` }, { status: 429 });
  }

  const parsed = lookupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  }

  const order = await findOrderByLookup(parsed.data.email, parsed.data.code);
  if (!order) {
    registerChatAttempt(ip);
    return NextResponse.json({ error: CHAT_NOT_FOUND }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "asc" }
  });

  const summary: OrderSummaryDTO = {
    code: order.code,
    status: order.status,
    totalCop: order.totalCop,
    windowDay: order.windowDay,
    windowLabel: order.windowLabel,
    location: { name: order.location.name, detail: order.location.detail },
    items: order.items.map((i) => ({ nameAtSale: i.nameAtSale, priceAtSale: i.priceAtSale, qty: i.qty })),
    createdAt: order.createdAt.toISOString()
  };
  const messageDtos: ChatMessageDTO[] = messages.map((m) => ({
    id: m.id,
    sender: m.sender,
    body: m.body,
    createdAt: m.createdAt.toISOString()
  }));

  return NextResponse.json({ order: summary, messages: messageDtos });
}
