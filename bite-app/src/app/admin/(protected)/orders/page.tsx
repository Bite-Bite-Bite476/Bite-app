"use client";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/admin-api";
import { money } from "@/lib/money";
import { ACTIVE_STATUSES, FINAL_STATUSES, ORDER_STATUS_LABEL, type OrderDTO, type OrderStatus } from "@/lib/types";

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const dtf = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

const FILTERS: Array<{ id: string; label: string }> = [
  { id: "activas", label: "Activas" },
  { id: "todas", label: "Todas" },
  ...Object.entries(ORDER_STATUS_LABEL).map(([id, label]) => ({ id, label }))
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("activas");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<OrderDTO | null>(null);

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
      if (detail?.id === id) setDetail((d) => (d ? { ...d, status } : d));
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
    }
  }

  function countFor(id: string, list: OrderDTO[]) {
    if (id === "todas") return list.length;
    if (id === "activas") return list.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
    return list.filter((o) => o.status === id).length;
  }

  const filtered = useMemo(() => {
    if (!orders) return [];
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesFilter = filter === "todas" ? true : filter === "activas" ? ACTIVE_STATUSES.includes(o.status) : o.status === filter;
      const matchesQ = !term || o.code.toLowerCase().includes(term) || o.customerEmail.includes(term);
      return matchesFilter && matchesQ;
    });
  }, [orders, filter, q]);

  function exportCsv() {
    if (!orders) return;
    const rows = [
      ["codigo", "creada", "correo", "productos", "franja", "ubicacion", "total_cop", "estado"],
      ...orders.map((o) => [
        o.code,
        o.createdAt,
        o.customerEmail,
        o.items.map((i) => `${i.qty}x ${i.nameAtSale}`).join(" | "),
        `${DAY_NAMES[o.windowDay]} ${o.windowLabel}`,
        o.location.name,
        String(o.totalCop),
        o.status
      ])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    navigator.clipboard?.writeText(csv).then(
      () => alert("CSV copiado al portapapeles."),
      () => alert("No se pudo copiar automáticamente. Selecciona y copia desde la consola del navegador.")
    );
  }

  if (error) return <p className="text-bite-bad">{error}</p>;
  if (!orders) return <p className="text-bite-stone">Cargando…</p>;

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">Órdenes</h1>
      <p className="mb-6 mt-1 text-bite-stone">Cambia el estado desde la tabla. Cancelar una orden devuelve sus unidades al inventario.</p>

      <section className="rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`rounded-full border-[1.5px] border-bite-black px-3.5 py-1.5 text-sm font-bold ${
                  filter === f.id ? "bg-bite-black text-bite-cream" : ""
                }`}
              >
                {f.label} <span className="tabular">{countFor(f.id, orders)}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Código o correo"
              className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3.5 py-2"
            />
            <button onClick={exportCsv} className="rounded-lg border-[1.5px] border-bite-black px-3.5 py-2 text-sm font-bold">
              Copiar CSV
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-bite border-2 border-dashed border-bite-sand p-8 text-center text-bite-stone">No hay órdenes con este filtro.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-bite-stone">
                  <th className="border-b-[1.5px] border-bite-sand py-2">Código</th>
                  <th className="border-b-[1.5px] border-bite-sand py-2">Creada</th>
                  <th className="border-b-[1.5px] border-bite-sand py-2">Cliente</th>
                  <th className="border-b-[1.5px] border-bite-sand py-2">Franja</th>
                  <th className="border-b-[1.5px] border-bite-sand py-2">Ubicación</th>
                  <th className="border-b-[1.5px] border-bite-sand py-2 text-right">Total</th>
                  <th className="border-b-[1.5px] border-bite-sand py-2">Estado</th>
                  <th className="border-b-[1.5px] border-bite-sand py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FBF8F3]">
                    <td className="border-b border-bite-sand py-2.5 font-display font-bold">{o.code}</td>
                    <td className="border-b border-bite-sand py-2.5 tabular">{dtf.format(new Date(o.createdAt))}</td>
                    <td className="border-b border-bite-sand py-2.5">{o.customerEmail}</td>
                    <td className="border-b border-bite-sand py-2.5 tabular">
                      {cap(DAY_NAMES[o.windowDay] || "")}
                      <br />
                      {o.windowLabel}
                    </td>
                    <td className="border-b border-bite-sand py-2.5">{o.location.name}</td>
                    <td className="border-b border-bite-sand py-2.5 text-right tabular">{money(o.totalCop)}</td>
                    <td className="border-b border-bite-sand py-2.5">
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                        disabled={FINAL_STATUSES.includes(o.status)}
                        className="rounded-full border-[1.5px] border-transparent bg-bite-sand px-2.5 py-1 text-xs font-bold disabled:opacity-70"
                      >
                        {Object.entries(ORDER_STATUS_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-bite-sand py-2.5">
                      <button onClick={() => setDetail(o)} className="rounded-lg border-[1.5px] border-bite-black px-2.5 py-1 text-xs font-bold">
                        Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detail && (
        <div onClick={(e) => e.target === e.currentTarget && setDetail(null)} className="fixed inset-0 z-[60] grid place-items-center overflow-auto bg-bite-black/55 p-4">
          <div className="max-h-[calc(100%-8px)] w-full max-w-xl overflow-auto rounded-bite bg-bite-cream">
            <div className="flex items-center justify-between px-6 pt-5">
              <h2 className="font-display text-2xl font-extrabold">Orden {detail.code}</h2>
              <button onClick={() => setDetail(null)} className="h-10 w-10 rounded-lg text-xl font-bold hover:bg-bite-sand">
                ×
              </button>
            </div>
            <div className="flex flex-col gap-3.5 px-6 pb-6 pt-4">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-lg border-[1.5px] border-bite-sand bg-white p-3">
                  <small className="text-xs uppercase text-bite-stone">Cliente</small>
                  <div className="break-all font-bold">{detail.customerEmail}</div>
                  <span className="text-xs text-bite-stone">{dtf.format(new Date(detail.createdAt))}</span>
                </div>
                <div className="rounded-lg border-[1.5px] border-bite-sand bg-white p-3">
                  <small className="text-xs uppercase text-bite-stone">Entrega</small>
                  <div className="font-bold">{detail.location.name}</div>
                  <span className="text-xs text-bite-stone">
                    {cap(DAY_NAMES[detail.windowDay] || "")} {detail.windowLabel}
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-bite-sand p-3 text-sm">
                {detail.items.map((i) => (
                  <div key={i.id} className="flex justify-between tabular">
                    <span>
                      {i.qty} × {i.nameAtSale}
                    </span>
                    <span>{money(i.priceAtSale * i.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-bite-stone pt-1.5 font-bold tabular">
                  <span>Total</span>
                  <span>{money(detail.totalCop)}</span>
                </div>
              </div>
              <div>
                <b className="text-sm">Historial</b>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                  {detail.statusEvents.map((h, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="rounded-full bg-bite-sand px-2.5 py-0.5 text-xs font-bold">{ORDER_STATUS_LABEL[h.status]}</span>
                      <span className="tabular text-bite-stone">{dtf.format(new Date(h.at))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
