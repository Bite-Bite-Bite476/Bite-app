import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ChatMessageDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

// Protegido por middleware (requiere sesión de admin — ver middleware.ts,
// /api/orders exige sesión en todos los métodos).

// Al leer el hilo desde el panel, se marcan como leídos todos los mensajes
// del cliente: así el contador de "sin leer" se limpia solo al abrir la
// orden, sin un endpoint aparte para eso.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });

  await prisma.chatMessage.updateMany({
    where: { orderId: params.id, sender: "CUSTOMER", readByAdmin: false },
    data: { readByAdmin: true }
  });

  const messages = await prisma.chatMessage.findMany({
    where: { orderId: params.id },
    orderBy: { createdAt: "asc" }
  });

  const dtos: ChatMessageDTO[] = messages.map((m) => ({
    id: m.id,
    sender: m.sender,
    body: m.body,
    createdAt: m.createdAt.toISOString()
  }));
  return NextResponse.json(dtos);
}

const schema = z.object({ body: z.string().trim().min(1, "Escribe un mensaje.").max(2000, "Ese mensaje es muy largo.") });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });

  const message = await prisma.chatMessage.create({
    data: { orderId: params.id, sender: "ADMIN", body: parsed.data.body, readByAdmin: true }
  });

  const dto: ChatMessageDTO = {
    id: message.id,
    sender: message.sender,
    body: message.body,
    createdAt: message.createdAt.toISOString()
  };
  return NextResponse.json({ message: dto });
}
