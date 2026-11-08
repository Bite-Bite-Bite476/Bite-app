"use client";
import { useState } from "react";
import type { ProductDTO } from "@/lib/types";
import type { ScheduleStatus } from "@/lib/schedule";
import { money } from "@/lib/money";

type Line = { product: ProductDTO; qty: number };
type OrderResult = {
  code: string;
  total: number;
  windowDayName: string;
  windowLabel: string;
  location: { name: string; detail: string };
  items: Array<{ nameAtSale: string; priceAtSale: number; qty: number }>;
  emailSent: boolean;
};

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function CheckoutFlow({
  lines,
  schedule,
  onClose,
  onOrderPlaced
}: {
  lines: Line[];
  schedule: ScheduleStatus;
  onClose: () => void;
  onOrderPlaced: () => void;
}) {
  const [email, setEmail] = useState("");
  const [windowId, setWindowId] = useState(schedule.openWindows[0]?.id || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);

  const total = lines.reduce((a, l) => a + l.product.priceCop * l.qty, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          windowId,
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos procesar tu pedido.");
        setLoading(false);
        return;
      }
      setResult(data.order);
      onOrderPlaced();
    } catch {
      setError("Falló la conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-[60] grid place-items-center overflow-auto bg-bite-black/55 p-4">
      <div className="max-h-[calc(100%-8px)] w-full max-w-xl overflow-auto rounded-bite bg-bite-cream shadow-2xl">
        {!result ? (
          <>
            <div className="flex items-center justify-between px-6 pt-5">
              <h2 className="font-display text-3xl font-extrabold">Confirma tu pedido</h2>
              <button onClick={onClose} aria-label="Cerrar" className="h-10 w-10 rounded-lg text-xl font-bold hover:bg-bite-sand">
                ×
              </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4 px-6 pb-6 pt-4">
              <div className="flex flex-col gap-1.5 rounded-lg bg-bite-sand px-3.5 py-3 text-sm">
                {lines.map((l) => (
                  <div key={l.product.id} className="flex justify-between tabular">
                    <span>
                      {l.qty} × {l.product.name}
                    </span>
                    <span>{money(l.product.priceCop * l.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-bite-stone pt-1.5 font-bold tabular">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-bold" htmlFor="co-email">
                Correo electrónico
                <input
                  id="co-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 text-base font-normal focus:border-bite-black focus:outline-none"
                />
              </label>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-bold">Franja de entrega · hoy</legend>
                {schedule.openWindows.map((w) => (
                  <label
                    key={w.id}
                    htmlFor={`w-${w.id}`}
                    className={`flex items-center gap-3 rounded-lg border-[1.5px] bg-white px-3.5 py-3 ${
                      windowId === w.id ? "border-bite-black ring-1 ring-bite-black" : "border-bite-sand"
                    }`}
                  >
                    <input
                      type="radio"
                      id={`w-${w.id}`}
                      name="win"
                      value={w.id}
                      checked={windowId === w.id}
                      onChange={() => setWindowId(w.id)}
                      className="h-[18px] w-[18px] accent-bite-orange"
                    />
                    <span>
                      <b className="font-display text-lg tabular">{w.label}</b>
                      <br />
                      <span className="text-xs text-bite-stone">
                        Pedidos hasta las {String(Math.floor((w.end - 5) / 60)).padStart(2, "0")}:{String((w.end - 5) % 60).padStart(2, "0")}
                      </span>
                    </span>
                    {schedule.current?.id === w.id && (
                      <span className="ml-auto rounded-full bg-bite-orange px-2.5 py-1 text-xs font-bold">En curso</span>
                    )}
                  </label>
                ))}
              </fieldset>
              <p className="text-sm text-bite-stone">
                Al confirmar te asignamos un punto de entrega y te enviamos el resumen a tu correo.
              </p>
              {error && (
                <p role="alert" className="font-bold text-bite-bad">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-bite-orange py-4 font-display text-lg font-bold uppercase tracking-wide text-bite-black disabled:opacity-60"
              >
                {loading ? "Confirmando…" : `Confirmar pedido · ${money(total)}`}
              </button>
            </form>
          </>
        ) : (
          <SuccessPanel result={result} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function SuccessPanel({ result, onClose }: { result: OrderResult; onClose: () => void }) {
  return (
    <div className="px-6 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-extrabold">Pedido confirmado</h2>
        <button onClick={onClose} aria-label="Cerrar" className="h-10 w-10 rounded-lg text-xl font-bold hover:bg-bite-sand">
          ×
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3.5">
        <div className="grid h-16 w-16 flex-none place-items-center rounded-full bg-bite-orange">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <div>
          <div className="text-sm text-bite-stone">Tu código de pedido</div>
          <div className="font-display text-3xl font-extrabold tracking-wide">{result.code}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3.5 py-3">
          <small className="text-xs font-bold uppercase tracking-wide text-bite-stone">Punto de entrega</small>
          <div className="font-display text-lg font-bold">{result.location.name}</div>
          <span className="text-sm text-bite-stone">{result.location.detail}</span>
        </div>
        <div className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3.5 py-3">
          <small className="text-xs font-bold uppercase tracking-wide text-bite-stone">Franja</small>
          <div className="font-display text-lg font-bold tabular">{result.windowLabel}</div>
          <span className="text-sm text-bite-stone">Hoy {cap(result.windowDayName)}</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-bite-stone">
        {result.emailSent
          ? "Te enviamos el resumen a tu correo."
          : "Guardamos tu pedido, pero no pudimos enviar el correo de confirmación — conserva tu código."}
      </p>
      <button onClick={onClose} className="mt-4 w-full rounded-lg bg-bite-orange py-4 font-display text-lg font-bold uppercase tracking-wide text-bite-black">
        Seguir comprando
      </button>
    </div>
  );
}
