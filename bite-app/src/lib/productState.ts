// Clasificación de disponibilidad de un producto — la usan tanto ProductGrid
// (para la etiqueta y el botón) como StoreApp (para el orden del catálogo),
// así nunca se desalinean entre sí.
import type { ProductDTO } from "./types";

export type AvailabilityKey = "ok" | "out" | "soon";

export function productState(p: ProductDTO): { key: AvailabilityKey; label: string; buy: boolean } {
  if (p.status === "PROXIMAMENTE") return { key: "soon", label: "Próximamente", buy: false };
  if (p.stock <= 0) return { key: "out", label: "Fuera de stock", buy: false };
  return { key: "ok", label: `${p.stock} en tienda`, buy: true };
}

// Orden del catálogo: primero lo que se puede comprar ya mismo, luego lo
// agotado, y al final lo que todavía no está disponible.
const AVAILABILITY_ORDER: Record<AvailabilityKey, number> = { ok: 0, out: 1, soon: 2 };

export function availabilityRank(p: ProductDTO): number {
  return AVAILABILITY_ORDER[productState(p).key];
}
