/**
 * Autenticación del panel de administración.
 *
 * Diseño: un único código de acceso de 10 dígitos (compartido por el equipo
 * que administra pedidos), guardado SIEMPRE como hash bcrypt en AppSettings,
 * nunca en texto plano. Al validarlo, se emite una cookie de sesión firmada
 * (JWT, httpOnly, Secure) con expiración corta. El middleware revisa esa
 * cookie en cada request a /admin y /api/admin/*.
 *
 * Esto es intencionalmente simple (un código compartido, no cuentas
 * individuales). Si más adelante AuditRed necesita trazabilidad por usuario
 * administrador, el siguiente paso natural es reemplazar el código único por
 * un login con correo + contraseña (o SSO) por persona.
 */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "bite_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET no está configurado o es muy corto. Genera uno con `openssl rand -base64 48`."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashAdminCode(code: string): Promise<string> {
  return bcrypt.hash(code, 12);
}

export async function verifyAdminCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function isValidCodeFormat(code: string): boolean {
  return /^\d{10}$/.test(code);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE = {
  name: COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/"
  }
};

// --- Límite de intentos por IP, en memoria. ---
// En un despliegue serverless multi-instancia esto se reinicia por instancia;
// es una primera línea de defensa, no la única. Para producción con tráfico
// real, muévelo a una tabla o a Upstash/Redis (ver nota en el README).
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const rec = attempts.get(ip);
  if (rec && rec.lockedUntil > Date.now()) {
    return { allowed: false, retryAfterMs: rec.lockedUntil - Date.now() };
  }
  return { allowed: true };
}

export function registerFailedAttempt(ip: string): void {
  const rec = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS;
    rec.count = 0;
  }
  attempts.set(ip, rec);
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}
