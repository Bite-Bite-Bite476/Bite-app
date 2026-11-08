import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  checkRateLimit,
  clearAttempts,
  createSessionToken,
  isValidCodeFormat,
  registerFailedAttempt,
  verifyAdminCode
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({ code: z.string() });

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    const seconds = Math.ceil((limit.retryAfterMs || 0) / 1000);
    return NextResponse.json({ error: `Demasiados intentos. Espera ${seconds} segundos.` }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  const code = parsed.success ? parsed.data.code : "";

  if (!isValidCodeFormat(code)) {
    return NextResponse.json({ error: "El código debe tener exactamente 10 dígitos." }, { status: 400 });
  }

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    return NextResponse.json(
      { error: "El panel aún no está configurado. Ejecuta la siembra inicial (npm run db:seed)." },
      { status: 500 }
    );
  }

  const ok = await verifyAdminCode(code, settings.adminCodeHash);
  if (!ok) {
    registerFailedAttempt(ip);
    return NextResponse.json({ error: "Código incorrecto." }, { status: 401 });
  }

  clearAttempts(ip);
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE.name, token, { ...ADMIN_COOKIE.options, maxAge: ADMIN_COOKIE.maxAge });
  return res;
}
