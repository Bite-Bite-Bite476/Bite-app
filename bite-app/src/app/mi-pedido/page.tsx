"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { money } from "@/lib/money";
import { ORDER_STATUS_LABEL, type ChatMessageDTO, type OrderSummaryDTO } from "@/lib/types";
import { formatDeliveryDateLabel } from "@/lib/schedule";
import { playPingSound } from "@/lib/sound";

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const dtf = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * Página pública, sin login: el cliente escribe su correo + código de
 * pedido (el mismo que le llegó al confirmar la compra) para abrir un chat
 * privado con BITE. sobre ese pedido puntual.
 */
export default function MiPedidoPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderSummaryDTO | null>(null);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const credsRef = useRef({ email: "", code: "" });
  const seenMsgIdsRef = useRef<Set<string>>(new Set());

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos buscar tu pedido.");
        return;
      }
      credsRef.current = { email, code };
      setOrder(data.order);
      setMessages(data.messages);
      seenMsgIdsRef.current = new Set(data.messages.map((m: ChatMessageDTO) => m.id));
    } catch {
      setError("Falló la conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Sondeo cada 5s mientras el chat está abierto, para ver respuestas nuevas.
  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/chat/thread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credsRef.current)
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          const freshAdmin = data.messages.filter(
            (m: ChatMessageDTO) => m.sender === "ADMIN" && !seenMsgIdsRef.current.has(m.id)
          );
          data.messages.forEach((m: ChatMessageDTO) => seenMsgIdsRef.current.add(m.id));
          setMessages(data.messages);
          if (freshAdmin.length > 0) playPingSound();
        }
      } catch {
        // silencioso: el próximo sondeo lo intenta de nuevo
      }
    }
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [order]);

  async function sendMessage() {
    const body = newMsg.trim();
    if (!body) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...credsRef.current, body })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo enviar el mensaje.");
        return;
      }
      setNewMsg("");
      seenMsgIdsRef.current.add(data.message.id);
      setMessages((prev) => [...prev, data.message]);
    } catch {
      setError("Falló la conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setOrder(null);
    setMessages([]);
    setError("");
    setNewMsg("");
    seenMsgIdsRef.current = new Set();
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-bite-orange">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-3.5">
          <Link href="/">
            <Logo className="h-9 w-auto sm:h-11" />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-bite-cream px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-bite-black hover:bg-white sm:px-5 sm:text-sm"
          >
            Volver a la tienda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16 pt-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Mi pedido</h1>
        <p className="mt-1.5 text-bite-stone">
          Escribe el correo y el código con los que hiciste tu pedido para hablar con nosotros sobre él.
        </p>

        {!order ? (
          <form onSubmit={search} className="mt-6 flex flex-col gap-4 rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
            <label className="flex flex-col gap-1.5 text-sm font-bold" htmlFor="mp-email">
              Correo electrónico
              <input
                id="mp-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 text-base font-normal focus:border-bite-black focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-bold" htmlFor="mp-code">
              Código de pedido
              <input
                id="mp-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="BITE-7K2PQ"
                className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 text-base font-normal uppercase focus:border-bite-black focus:outline-none"
              />
              <span className="text-xs font-normal text-bite-stone">Lo encuentras en el correo de confirmación de tu pedido.</span>
            </label>
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
              {loading ? "Buscando…" : "Buscar mi pedido"}
            </button>
          </form>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-bite-stone">Pedido</div>
                  <div className="font-display text-2xl font-extrabold tracking-wide">{order.code}</div>
                </div>
                <span className="rounded-full bg-bite-sand px-2.5 py-1 text-xs font-bold">{ORDER_STATUS_LABEL[order.status]}</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-lg bg-bite-sand p-3">
                  <small className="text-xs font-bold uppercase tracking-wide text-bite-stone">Punto de entrega</small>
                  <div className="font-bold">{order.location.name}</div>
                  <span className="text-xs text-bite-stone">{order.location.detail}</span>
                </div>
                <div className="rounded-lg bg-bite-sand p-3">
                  <small className="text-xs font-bold uppercase tracking-wide text-bite-stone">Franja</small>
                  <div className="font-bold tabular">{order.windowLabel}</div>
                  <span className="text-xs text-bite-stone">
                    {cap(DAY_NAMES[order.windowDay] || "")} · {formatDeliveryDateLabel(new Date(order.createdAt), order.windowDay)}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-sm">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between tabular text-bite-stone">
                    <span>
                      {i.qty} × {i.nameAtSale}
                    </span>
                    <span>{money(i.priceAtSale * i.qty)}</span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t border-bite-sand pt-1.5 font-bold tabular">
                  <span>Total</span>
                  <span>{money(order.totalCop)}</span>
                </div>
              </div>
              <button onClick={reset} className="mt-3 text-sm font-bold text-bite-stone underline underline-offset-2">
                Buscar otro pedido
              </button>
            </div>

            <div className="rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
              <b className="text-sm">Habla con nosotros</b>
              <div className="mt-2 flex max-h-96 flex-col gap-2 overflow-y-auto rounded-lg bg-bite-cream p-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-bite-stone">Escríbenos si tienes alguna pregunta sobre tu pedido.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex animate-msg-in ${m.sender === "CUSTOMER" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          m.sender === "CUSTOMER" ? "bg-bite-orange text-bite-black" : "bg-bite-black text-bite-cream"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <span className={`mt-1 block text-[11px] tabular ${m.sender === "CUSTOMER" ? "text-bite-black/70" : "text-bite-sand"}`}>
                          {dtf.format(new Date(m.createdAt))}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {error && (
                <p role="alert" className="mt-1.5 text-sm font-bold text-bite-bad">
                  {error}
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
                  placeholder="Escribe tu mensaje…"
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
        )}
      </main>
    </>
  );
}
