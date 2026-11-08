/**
 * Límite de intentos por IP para los endpoints públicos del chat
 * (/api/chat/thread y /api/chat/send). Mismo patrón que el limitador del
 * login de administración en auth.ts, pero en un contador aparte: aquí no
 * se trata de adivinar una contraseña sino de evitar que alguien recorra
 * combinaciones de correo + código de pedido al azar.
 *
 * En memoria, por instancia serverless — primera línea de defensa, no la
 * única (ver nota equivalente en auth.ts).
 */
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 12;
const LOCK_MS = 60_000;

export function checkChatRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const rec = attempts.get(ip);
  if (rec && rec.lockedUntil > Date.now()) {
    return { allowed: false, retryAfterMs: rec.lockedUntil - Date.now() };
  }
  return { allowed: true };
}

export function registerChatAttempt(ip: string): void {
  const rec = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS;
    rec.count = 0;
  }
  attempts.set(ip, rec);
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
