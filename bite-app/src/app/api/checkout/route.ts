import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateWindowId, DAY_NAMES } from "@/lib/schedule";
import { sendOrderConfirmationEmail } from "@/lib/email";

/**
 * Checkout. Reglas de negocio, todas revalidadas en el servidor:
 * 1. El correo debe tener forma válida.
 * 2. La franja elegida debe seguir abierta AHORA, según el reloj del
 *    servidor (nunca confiar en la hora del navegador del cliente).
 * 3. El carrito debe tener stock suficiente en el momento del checkout
 *    (puede haber cambiado desde que el cliente lo armó).
 * 4. Debe existir al menos una ubicación de entrega activa; se asigna una
 *    al azar.
 * 5. Todo ocurre dentro de una transacción de base de datos: o se
 *    descuenta el stock y se crea la orden completa, o no se crea nada.
 * 6. El correo de confirmación se envía DESPUÉS de confirmar la escritura;
 *    si el envío falla, la orden ya quedó guardada (se registra el error
 *    en la orden para que el panel pueda reintentar/avisar).
 */

const itemSchema = z.object({ productId: z.string().min(1), qty: z.number().int().min(1).max(50) });
const checkoutSchema = z.object({
  email: z.string().trim().email("Escribe un correo válido."),
  windowId: z.string().min(1, "Elige una franja de entrega."),
  items: z.array(itemSchema).min(1, "Tu carrito está vacío.")
});

function orderCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `BITE-${s}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  }
  const { email, windowId, items } = parsed.data;

  const win = validateWindowId(windowId);
  if (!win) {
    return NextResponse.json(
      { error: "Esa franja de entrega ya cerró o no es válida. Elige una franja disponible." },
      { status: 409 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Bloquea conceptualmente leyendo dentro de la transacción justo antes de escribir.
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds }, active: true } });
      const byId = new Map(products.map((p) => [p.id, p]));

      let total = 0;
      const lineData: Array<{ productId: string; nameAtSale: string; priceAtSale: number; qty: number }> = [];
      for (const item of items) {
        const p = byId.get(item.productId);
        if (!p) throw new CheckoutError("Uno de los productos de tu carrito ya no está disponible.");
        if (p.status !== "DISPONIBLE") throw new CheckoutError(`${p.name} ya no está disponible.`);
        if (p.stock < item.qty) throw new CheckoutError(`Solo quedan ${p.stock} unidades de ${p.name}.`);
        total += p.priceCop * item.qty;
        lineData.push({ productId: p.id, nameAtSale: p.name, priceAtSale: p.priceCop, qty: item.qty });
      }

      const activeLocations = await tx.location.findMany({ where: { active: true } });
      if (activeLocations.length === 0) {
        throw new CheckoutError("No hay puntos de entrega activos en este momento. Intenta más tarde.");
      }
      const location = activeLocations[Math.floor(Math.random() * activeLocations.length)]!;

      // Descuenta stock de forma atómica y condicional: si otra compra concurrente
      // ya lo consumió, `count` da 0 y abortamos todo con un mensaje claro.
      for (const line of lineData) {
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.qty } },
          data: { stock: { decrement: line.qty } }
        });
        if (updated.count === 0) {
          throw new CheckoutError(`${line.nameAtSale} se agotó mientras confirmabas tu pedido.`);
        }
      }

      const order = await tx.order.create({
        data: {
          code: orderCode(),
          customerEmail: email.toLowerCase(),
          status: "PENDIENTE",
          totalCop: total,
          windowDay: win.dow,
          windowLabel: win.label,
          windowStart: win.start,
          windowEnd: win.end,
          locationId: location.id,
          items: { create: lineData },
          statusEvents: { create: { status: "PENDIENTE" } }
        },
        include: { items: true, location: true }
      });

      return order;
    });

    // Envío de correo fuera de la transacción: nunca debe revertir el pedido.
    const emailResult = await sendOrderConfirmationEmail({
      code: result.code,
      customerEmail: result.customerEmail,
      totalCop: result.totalCop,
      windowDay: result.windowDay,
      windowLabel: result.windowLabel,
      location: { name: result.location.name, detail: result.location.detail },
      items: result.items
    });
    await prisma.order.update({
      where: { id: result.id },
      data: emailResult.sent
        ? { emailSentAt: new Date(), emailError: null }
        : { emailError: emailResult.error ?? "Error desconocido" }
    });

    return NextResponse.json({
      order: {
        code: result.code,
        total: result.totalCop,
        windowDay: result.windowDay,
        windowDayName: DAY_NAMES[result.windowDay],
        windowLabel: result.windowLabel,
        location: { name: result.location.name, detail: result.location.detail },
        items: result.items,
        emailSent: emailResult.sent
      }
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[checkout] error inesperado", err);
    return NextResponse.json({ error: "No pudimos procesar tu pedido. Intenta de nuevo." }, { status: 500 });
  }
}

class CheckoutError extends Error {}
