import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkSuggestionRateLimit, registerSuggestionAttempt } from "@/lib/suggestion-rate-limit";
import { clientIp } from "@/lib/chat-rate-limit";

export const dynamic = "force-dynamic";

// Endpoint público (no cae bajo ningún prefijo protegido por el
// middleware): el buzón "¿quieres algún producto en específico?" de la
// tienda. Sin login, sin dato de contacto — solo el texto y la fecha.
const schema = z.object({
  body: z.string().trim().min(1, "Escribe tu idea antes de enviarla.").max(500, "Máximo 500 caracteres.")
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = checkSuggestionRateLimit(ip);
  if (!limit.allowed) {
    const seconds = Math.ceil((limit.retryAfterMs || 0) / 1000);
    return NextResponse.json({ error: `Demasiados intentos. Espera ${seconds} segundos.` }, { status: 429 });
  }
  registerSuggestionAttempt(ip);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
  }

  try {
    await prisma.productSuggestion.create({ data: { body: parsed.data.body } });
  } catch (err) {
    // Si la tabla ProductSuggestion aún no existe en la base de datos
    // (falta el db push), esto deja un mensaje claro en los logs de
    // Vercel en vez de un 500 sin explicación.
    console.error("No se pudo guardar la sugerencia:", err);
    return NextResponse.json({ error: "No pudimos guardar tu idea en este momento. Intenta más tarde." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
