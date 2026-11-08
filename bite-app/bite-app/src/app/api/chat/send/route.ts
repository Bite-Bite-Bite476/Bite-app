import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkChatRateLimit, registerChatAttempt, clientIp } from "@/lib/chat-rate-limit";
import { findOrderByLookup, CHAT_NOT_FOUND } from "@/lib/chat-lookup";
import type { ChatMessageDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email("Escribe un correo válido."),
  code: z.string().trim().min(1, "Escribe tu código de pedido."),
  body: z.string().trim().min(1, "Escribe un mensaje.").max(2000, "Ese mensaje es muy largo.")
});

/**
 * El cliente envía un mensaje. Sin login: cada request vuelve a probar
 * correo + código contra el pedido antes de guardar nada.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = checkChatRateLimit(ip);
  if (!limit.allowed) {
    const seconds = Math.ceil((limit.retryAfterMs || 0) / 1000);
    return NextResponse.json({ error: `Demasiados intentos. Espera ${seconds} segundos.` }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  }

  const order = await findOrderByLookup(parsed.data.email, parsed.data.code);
  if (!order) {
    registerChatAttempt(ip);
    return NextResponse.json({ error: CHAT_NOT_FOUND }, { status: 404 });
  }

  const message = await prisma.chatMessage.create({
    data: { orderId: order.id, sender: "CUSTOMER", body: parsed.data.body }
  });

  const dto: ChatMessageDTO = {
    id: message.id,
    sender: message.sender,
    body: message.body,
    createdAt: message.createdAt.toISOString()
  };
  return NextResponse.json({ message: dto });
}
