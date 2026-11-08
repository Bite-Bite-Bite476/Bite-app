/**
 * Verificación compartida para el chat público del cliente: nunca hay
 * sesión, así que cada request a /api/chat/* prueba de nuevo que quien
 * escribe conoce el correo Y el código de ese pedido exacto.
 */
import { z } from "zod";
import { prisma } from "./prisma";

export const lookupSchema = z.object({
  email: z.string().trim().email("Escribe un correo válido."),
  code: z.string().trim().min(1, "Escribe tu código de pedido.")
});

export async function findOrderByLookup(email: string, code: string) {
  return prisma.order.findFirst({
    where: {
      customerEmail: email.trim().toLowerCase(),
      code: code.trim().toUpperCase()
    },
    include: { items: true, location: true }
  });
}

export const CHAT_NOT_FOUND =
  "No encontramos un pedido con ese correo y ese código. Revisa que estén escritos tal como en tu correo de confirmación.";
