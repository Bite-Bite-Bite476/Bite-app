"use client";
import { useState } from "react";
import type { ProductDTO } from "@/lib/types";
import { money } from "@/lib/money";
import { productState } from "@/lib/productState";

export default function ProductGrid({
  products,
  qtyOf,
  onAdd,
  onInc,
  onDec
}: {
  products: ProductDTO[];
  qtyOf: (id: string) => number;
  onAdd: (p: ProductDTO) => void;
  onInc: (p: ProductDTO) => void;
  onDec: (p: ProductDTO) => void;
}) {
  const [bumpId, setBumpId] = useState<string | null>(null);

  function bump(id: string) {
    setBumpId(id);
    setTimeout(() => setBumpId((cur) => (cur === id ? null : cur)), 420);
  }
  function handleAdd(p: ProductDTO) {
    onAdd(p);
    bump(p.id);
  }
  function handleInc(p: ProductDTO) {
    onInc(p);
    bump(p.id);
  }

  if (products.length === 0) {
    return (
      <div className="rounded-bite border-2 border-dashed border-bite-sand p-10 text-center text-bite-stone">
        No hay productos que coincidan. Prueba otra categoría o búsqueda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:gap-x-5 md:gap-y-7 lg:grid-cols-4">
      {products.map((p) => {
        const s = productState(p);
        const qty = qtyOf(p.id);
        return (
          <article key={p.id} className="flex flex-col gap-3">
            <div
              className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-bite-card p-4 md:rounded-bite md:p-6 ${
                bumpId === p.id ? "animate-bump" : ""
              }`}
            >
              <img
                src={p.imageUrl}
                alt={p.name}
                className={`h-full w-auto object-contain drop-shadow-[0_10px_14px_rgba(23,23,23,0.18)] transition-transform ${
                  s.key === "out" ? "grayscale opacity-70" : ""
                }`}
              />
              {s.key === "out" && (
                <span className="absolute left-3 top-3 rounded-full bg-bite-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-bite-cream">
                  Agotado
                </span>
              )}
              {s.key === "soon" && (
                <span className="absolute left-3 top-3 rounded-full bg-bite-cream px-3 py-1 text-xs font-bold uppercase tracking-wide text-bite-black">
                  Muy pronto
                </span>
              )}
            </div>
            <p className={`font-display text-xl font-bold md:text-2xl ${s.key === "ok" ? "" : "text-bite-stone"}`}>{s.label}</p>
            <h3 className="text-sm leading-snug md:text-base">{p.name}</h3>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="font-display text-lg font-bold tabular md:text-xl">{money(p.priceCop)}</span>
              {!s.buy ? (
                <button
                  disabled
                  className="rounded-lg bg-bite-sand px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-bite-stone"
                >
                  {s.key === "soon" ? "Pronto" : "Agotado"}
                </button>
              ) : qty > 0 ? (
                <span className="inline-flex items-center overflow-hidden rounded-lg border-[1.5px] border-bite-black">
                  <button onClick={() => onDec(p)} aria-label="Quitar uno" className="h-9 w-9 text-lg font-bold hover:bg-bite-sand">
                    −
                  </button>
                  <span className="min-w-[28px] text-center font-bold tabular">{qty}</span>
                  <button
                    onClick={() => handleInc(p)}
                    disabled={qty >= p.stock}
                    aria-label="Agregar uno"
                    className="h-9 w-9 text-lg font-bold hover:bg-bite-sand disabled:text-bite-sand"
                  >
                    +
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => handleAdd(p)}
                  className="rounded-lg bg-bite-orange px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-bite-black hover:bg-[#ff7a4a]"
                >
                  Agregar
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
