"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiSend } from "@/lib/admin-api";
import { money } from "@/lib/money";
import { ACTIVE_STATUSES, FINAL_STATUSES, ORDER_STATUS_LABEL, type ChatMessageDTO, type OrderDTO, type OrderStatus } from "@/lib/types";
import { formatDeliveryDateLabel } from "@/lib/schedule";
import { playPingSound } from "@/lib/sound";

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
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [newUnreadFlash, setNewUnreadFlash] = useState(false);
  const prevUnreadRef = useRef<number | null>(null);

  // Carga la lista y, si aparecieron mensajes sin leer nuevos desde la
  // última carga (no en la primera, para no avisar de lo que ya había al
  // abrir la página), muestra un aviso breve. El sonido de aviso lo pone la
  // barra de navegación (AdminNav), que vive en todas las páginas del
  // panel — así no suena dos veces si ya estás viendo Órdenes.
  async function load() {
    try {
      const data = await apiGet<OrderDTO[]>("/api/orders");
      setOrders(data);
      const totalUnread = data.reduce((a, o) => a + o.unreadCount, 0);
      if (prevUnreadRef.current !== null && totalUnread > prevUnreadRef.current) {
        setNewUnreadFlash(true);
        setTimeout(() => setNewUnreadFlash(false), 2600);
      }
      prevUnreadRef.current = totalUnread;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    }
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mientras el detalle de una orden está abierto, carga su chat y lo
  // refresca cada 5s. Abrir el detalle también marca como leídos los
  // mensajes del cliente (lo hace el GET en el servidor), así que al cerrar
  // refrescamos la lista para que desaparezca la insignia de "sin leer".
  // Si llega un mensaje nuevo del cliente mientras el detalle está abierto
  // (después del primer sondeo), también avisa con sonido.
  useEffect(() => {
    if (!detail) return;
    let cancelled = false;
    let seen: Set<string> | null = null;
    async function poll() {
      try {
        const data = await apiGet<ChatMessageDTO[]>(`/api/orders/${detail!.id}/messages`);
        if (cancelled) return;
        if (seen) {
          const fresh = data.some((m) => m.sender === "CUSTOMER" && !seen!.has(m.id));
          if (fresh) playPingSound();
        }
        seen = new Set(data.map((m) => m.id));
        setMessages(data);
      } catch {
        // silencioso: el próximo sondeo lo intenta de nuevo
      }
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
      load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id]);

  async function sendMessage() {
    const body = newMsg.trim();
    if (!body || !detail) return;
    setSending(true);
    setChatError("");
    try {
      await apiSend(`/api/orders/${detail.id}/messages`, "POST", { body });
      setNewMsg("");
      setMessages(await apiGet<ChatMessageDTO[]>(`/api/orders/${detail.id}/messages`));
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

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
        `${DAY_NAMES[o.windowDay]} ${formatDeliveryDateLabel(new Date(o.createdAt), o.windowDay)} ${o.windowLabel}`,
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

  function closeDetail() {
    setDetail(null);
    setMessages([]);
    setNewMsg("");
    setChatError("");
  }

  if (error) return <p className="text-bite-bad">{error}</p>;
  if (!orders) return <p className="text-bite-stone">Cargando…</p>;

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">Órdenes</h1>
      <p className="mb-2 mt-1 text-bite-stone">Cambia el estado desde la tabla. Cancelar una orden devuelve sus unidades al inventario.</p>
      {newUnreadFlash && (
        <p className="mb-4 animate-msg-in rounded-lg bg-bite-orange px-3.5 py-2 text-sm font-bold text-bite-black">
          📬 Tienes un mensaje nuevo de un cliente.
        </p>
      )}

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
                    <td className="border-b border-bite-sand py-2.5 font-display font-bold">
                      <span className="inline-flex items-center gap-1.5">
                        {o.code}
                        {o.unreadCount > 0 && (
                          <span
                            className="grid h-5 min-w-[20px] animate-pulse place-items-center rounded-full bg-bite-orange px-1 text-[11px] font-bold text-bite-black tabular"
                            title={`${o.unreadCount} mensaje(s) sin leer`}
                          >
                            {o.unreadCount}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="border-b border-bite-sand py-2.5 tabular">{dtf.format(new Date(o.createdAt))}</td>
                    <td className="border-b border-bite-sand py-2.5">{o.customerEmail}</td>
                    <td className="border-b border-bite-sand py-2.5 tabular">
                      {cap(DAY_NAMES[o.windowDay] || "")} · {formatDeliveryDateLabel(new Date(o.createdAt), o.windowDay)}
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
        <div onClick={(e) => e.target === e.currentTarget && closeDetail()} className="fixed inset-0 z-[60] grid place-items-center overflow-auto bg-bite-black/55 p-4">
          <div className="max-h-[calc(100%-8px)] w-full max-w-xl overflow-auto rounded-bite bg-bite-cream">
            <div className="flex items-center justify-between px-6 pt-5">
              <h2 className="font-display text-2xl font-extrabold">Orden {detail.code}</h2>
              <button onClick={closeDetail} className="h-10 w-10 rounded-lg text-xl font-bold hover:bg-bite-sand">
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
                    {cap(DAY_NAMES[detail.windowDay] || "")} · {formatDeliveryDateLabel(new Date(detail.createdAt), detail.windowDay)} ·{" "}
                    {detail.windowLabel}
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

              <div>
                <b className="text-sm">Mensajes con el cliente</b>
                <div className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto rounded-lg border-[1.5px] border-bite-sand bg-white p-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-bite-stone">Todavía no hay mensajes en este pedido.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={`flex animate-msg-in ${m.sender === "ADMIN" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            m.sender === "ADMIN" ? "bg-bite-black text-bite-cream" : "bg-bite-sand text-bite-black"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <span className={`mt-1 block text-[11px] tabular ${m.sender === "ADMIN" ? "text-bite-sand" : "text-bite-stone"}`}>
                            {dtf.format(new Date(m.createdAt))}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {chatError && (
                  <p role="alert" className="mt-1.5 text-sm font-bold text-bite-bad">
                    {chatError}
                  </p>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="mt-2 flex gap-2"
                >
                  <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Escribe un mensaje para el cliente…"
                    className="flex-1 rounded-lg border-[1.5px] border-bite-sand bg-white px-3.5 py-2.5"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMsg.trim()}
                    className="rounded-lg bg-bite-orange px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-bite-black disabled:opacity-60"
                  >
                    {sending ? "Enviando…" : "Enviar"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
