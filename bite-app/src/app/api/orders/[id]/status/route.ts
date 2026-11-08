import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FINAL_STATUSES } from "@/lib/types";

const schema = z.object({ status: z.enum(["PENDIENTE", "PREPARANDO", "LISTA", "ENTREGADA", "CANCELADA"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  if (FINAL_STATUSES.includes(order.status as any)) {
    return NextResponse.json({ error: `La orden ya está ${order.status.toLowerCase()} y no se puede modificar.` }, { status: 409 });
  }
  if (order.status === parsed.data.status) return NextResponse.json(order);

  const updated = await prisma.$transaction(async (tx) => {
    // Cancelar devuelve el inventario reservado al stock disponible.
    if (parsed.data.status === "CANCELADA") {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } }).catch(() => null);
        }
      }
    }
    return tx.order.update({
      where: { id: order.id },
      data: {
        status: parsed.data.status,
        statusEvents: { create: { status: parsed.data.status } }
      },
      include: { items: true, location: true, statusEvents: { orderBy: { at: "asc" } } }
    });
  });

  return NextResponse.json(updated);
}
