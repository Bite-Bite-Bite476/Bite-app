"use client";
// Pequeños helpers de fetch para el panel: lanzan con el mensaje del backend
// cuando la respuesta no es 2xx, para que cada página solo tenga que capturar
// el error y mostrarlo.

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || `Error al cargar ${url}`);
  return res.json();
}

export async function apiSend<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Ocurrió un error.");
  return data;
}
