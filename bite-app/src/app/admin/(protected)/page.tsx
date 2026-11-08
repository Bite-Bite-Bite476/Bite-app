"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiSend } from "@/lib/admin-api";
import { money } from "@/lib/money";
import { ACTIVE_STATUSES, ORDER_STATUS_LABEL, type OrderDTO, type OrderStatus } from "@/lib/types";

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default function AdminResumenPage() {
  const [orders, setOrders] = useState<OrderDTO[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setOrders(await apiGet<OrderDTO[]>("/api/orders"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id: string, status: OrderStatus) {
    try {
      await apiSend(`/api/orders/${id}/status`, "PATCH", { status });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
    }
  }

  if (error) return <p className="text-bite-bad">{error}</p>;
  if (!orders) return <p className="text-bite-stone">Cargando…</p>;

  const valid = orders.filter((o) => o.status !== "CANCELADA");
  const sales = valid.reduce((a, o) => a + o.totalCop, 0);
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const byProduct = new Map<string, number>();
  valid.forEach((o) => o.items.forEach((i) => byProduct.set(i.nameAtSale, (byProduct.get(i.nameAtSale) || 0) + i.qty)));
  const top = [...byProduct.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">Resumen</h1>
      <p className="mb-6 mt-1 text-bite-stone">Vista general de la operación de hoy.</p>

      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="rounded-bite border-[1.5px] border-bite-orange bg-bite-orange p-4">
          <small className="text-xs font-bold uppercase tracking-wide">Órdenes activas</small>
          <b className="mt-1 block font-display text-3xl font-extrabold tabular">{active.length}</b>
        </div>
        <div className="rounded-bite border-[1.5px] border-bite-sand bg-white p-4">
          <small className="text-xs font-bold uppercase tracking-wide text-bite-stone">Ventas registradas</small>
          <b className="mt-1 block font-display text-3xl font-extrabold tabular">{money(sales)}</b>
        </div>
        <div className="rounded-bite border-[1.5px] border-bite-sand bg-white p-4">
          <small className="text-xs font-bold uppercase tracking-wide text-bite-stone">Ticket promedio</small>
          <b className="mt-1 block font-display text-3xl font-extrabold tabular">{money(valid.length ? sales / valid.length : 0)}</b>
        </div>
        <div className="rounded-bite border-[1.5px] border-bite-sand bg-white p-4">
          <small className="text-xs font-bold uppercase tracking-wide text-bite-stone">Órdenes totales</small>
          <b className="mt-1 block font-display text-3xl font-extrabold tabular">{orders.length}</b>
        </div>
      </div>

      <section className="mb-6 rounded-bite border-[1.5px] border-bite-sand bg-white p-4.5 p-5">
        <div className="mb-3.5 flex items-center gap-2.5">
          <h2 className="text-xl font-bold">Cola de preparación</h2>
          <Link href="/admin/orders" className="ml-auto rounded-lg border-[1.5px] border-bite-black px-3 py-1.5 text-sm font-bold">
            Ver todas las órdenes
          </Link>
        </div>
        {active.length === 0 ? (
          <p className="rounded-bite border-2 border-dashed border-bite-sand p-8 text-center text-bite-stone">No hay órdenes por preparar.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((o) => (
              <div key={o.id} className="flex flex-col gap-1.5 rounded-lg border-[1.5px] border-bite-sand p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold">{o.code}</span>
                  <select
                    value={o.status}
                    onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                    className="rounded-full border-[1.5px] border-transparent bg-bite-orange px-2.5 py-1 text-xs font-bold"
                  >
                    {Object.entries(ORDER_STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-bite-stone">
                  {cap(DAY_NAMES[o.windowDay] || "")} {o.windowLabel} · {o.location.name}
                </div>
                <ul className="list-disc pl-4 text-sm">
                  {o.items.map((i) => (
                    <li key={i.id}>
                      {i.qty} × {i.nameAtSale}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
        <h2 className="mb-3.5 text-xl font-bold">Unidades vendidas</h2>
        {top.length === 0 ? (
          <p className="text-bite-stone">Aún no hay ventas.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b-[1.5px] border-bite-sand py-2 text-left text-xs uppercase tracking-wide text-bite-stone">Producto</th>
                <th className="border-b-[1.5px] border-bite-sand py-2 text-right text-xs uppercase tracking-wide text-bite-stone">Unidades</th>
              </tr>
            </thead>
            <tbody>
              {top.map(([name, qty]) => (
                <tr key={name}>
                  <td className="border-b border-bite-sand py-2">{name}</td>
                  <td className="border-b border-bite-sand py-2 text-right tabular">{qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
