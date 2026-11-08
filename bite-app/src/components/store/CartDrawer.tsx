"use client";
import type { ProductDTO } from "@/lib/types";
import type { ScheduleStatus } from "@/lib/schedule";
import { money } from "@/lib/money";

type Line = { product: ProductDTO; qty: number };

export default function CartDrawer({
  open,
  onClose,
  lines,
  schedule,
  onInc,
  onDec,
  onRemove,
  onCheckout
}: {
  open: boolean;
  onClose: () => void;
  lines: Line[];
  schedule: ScheduleStatus | null;
  onInc: (p: ProductDTO) => void;
  onDec: (p: ProductDTO) => void;
  onRemove: (p: ProductDTO) => void;
  onCheckout: () => void;
}) {
  const total = lines.reduce((a, l) => a + l.product.priceCop * l.qty, 0);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const canOrder = lines.length > 0 && !!schedule && schedule.openWindows.length > 0;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-bite-black/45 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col bg-bite-cream transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between bg-bite-orange px-5 py-4">
          <h2 className="font-display text-3xl font-extrabold">Tu carrito</h2>
          <button onClick={onClose} aria-label="Cerrar carrito" className="h-10 w-10 rounded-lg bg-bite-cream text-xl font-bold">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="rounded-bite border-2 border-dashed border-bite-sand p-10 text-center text-bite-stone">
              Tu carrito está vacío.
              <br />
              Agrega algo rico desde la tienda.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {lines.map(({ product: p, qty }) => (
                <div key={p.id} className="grid grid-cols-[72px_1fr_auto] gap-3 border-b border-bite-sand pb-4">
                  <div className="flex h-[72px] items-center justify-center rounded-lg bg-bite-card p-1.5">
                    <img src={p.imageUrl} alt="" className="h-full w-auto object-contain" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{p.name}</h3>
                    <div className="text-xs text-bite-stone">
                      {money(p.priceCop)} c/u · {p.stock} en tienda
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="inline-flex items-center overflow-hidden rounded-lg border-[1.5px] border-bite-black">
                        <button onClick={() => onDec(p)} aria-label="Quitar uno" className="h-9 w-9 font-bold hover:bg-bite-sand">
                          −
                        </button>
                        <span className="min-w-[28px] text-center font-bold tabular">{qty}</span>
                        <button
                          onClick={() => onInc(p)}
                          disabled={qty >= p.stock}
                          aria-label="Agregar uno"
                          className="h-9 w-9 font-bold hover:bg-bite-sand disabled:text-bite-sand"
                        >
                          +
                        </button>
                      </span>
                      <button onClick={() => onRemove(p)} className="text-xs text-bite-stone underline">
                        Quitar
                      </button>
                    </div>
                  </div>
                  <div className="font-display font-bold tabular">{money(p.priceCop * qty)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2.5 border-t border-bite-sand px-5 py-4">
          <div className="flex justify-between text-sm tabular">
            <span>
              Subtotal ({count} {count === 1 ? "producto" : "productos"})
            </span>
            <span>{money(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Entrega en punto asignado</span>
            <span>Sin costo</span>
          </div>
          <div className="flex justify-between border-t border-bite-sand pt-1.5 font-display text-2xl font-extrabold tabular">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          {schedule && schedule.openWindows.length === 0 && (
            <p className="rounded-lg bg-bite-sand px-3 py-2 text-sm">
              {schedule.isWeekend ? "Hoy no hay entregas." : "Las franjas de hoy ya cerraron."} Vuelve a intentarlo en el próximo horario de
              entrega.
            </p>
          )}
          <button
            onClick={onCheckout}
            disabled={!canOrder}
            className="w-full rounded-lg bg-bite-black py-3.5 font-display text-lg font-bold uppercase tracking-wide text-bite-cream disabled:bg-bite-sand disabled:text-bite-stone"
          >
            Continuar al pedido
          </button>
        </div>
      </aside>
    </>
  );
}
