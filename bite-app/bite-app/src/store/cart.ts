"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductDTO } from "@/lib/types";

type CartLine = { productId: string; qty: number };

type CartState = {
  lines: CartLine[];
  setQty: (productId: string, qty: number, maxStock: number) => void;
  clear: () => void;
  count: () => number;
  total: (products: ProductDTO[]) => number;
  qtyOf: (productId: string) => number;
  sanitize: (products: ProductDTO[]) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      setQty: (productId, qty, maxStock) => {
        const clamped = Math.max(0, Math.min(qty, maxStock));
        set((s) => {
          const rest = s.lines.filter((l) => l.productId !== productId);
          return { lines: clamped > 0 ? [...rest, { productId, qty: clamped }] : rest };
        });
      },
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((a, l) => a + l.qty, 0),
      qtyOf: (productId) => get().lines.find((l) => l.productId === productId)?.qty || 0,
      total: (products) =>
        get().lines.reduce((sum, l) => {
          const p = products.find((x) => x.id === l.productId);
          return p ? sum + p.priceCop * l.qty : sum;
        }, 0),
      sanitize: (products) =>
        set((s) => ({
          lines: s.lines
            .map((l) => {
              const p = products.find((x) => x.id === l.productId);
              if (!p || p.status !== "DISPONIBLE" || p.stock <= 0) return null;
              return { productId: l.productId, qty: Math.min(l.qty, p.stock) };
            })
            .filter((l): l is CartLine => !!l)
        }))
    }),
    { name: "bite-cart" }
  )
);
