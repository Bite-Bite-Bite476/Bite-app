/**
 * Límite de intentos por IP para el buzón público de sugerencias de
 * producto (/api/suggestions). Mismo patrón que chat-rate-limit.ts, en un
 * contador aparte: aquí no hay nada que adivinar, solo evitar que alguien
 * llene el buzón a punta de requests.
 *
 * En memoria, por instancia serverless — primera línea de defensa, no la
 * única (ver nota equivalente en auth.ts).
 */
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 6;
const LOCK_MS = 5 * 60_000;

export function checkSuggestionRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const rec = attempts.get(ip);
  if (rec && rec.lockedUntil > Date.now()) {
    return { allowed: false, retryAfterMs: rec.lockedUntil - Date.now() };
  }
  return { allowed: true };
}

export function registerSuggestionAttempt(ip: string): void {
  const rec = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS;
    rec.count = 0;
  }
  attempts.set(ip, rec);
}
