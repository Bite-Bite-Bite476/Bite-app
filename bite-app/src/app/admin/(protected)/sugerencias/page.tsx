"use client";
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/admin-api";
import type { ProductSuggestionDTO } from "@/lib/types";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminSuggestionsPage() {
  const [items, setItems] = useState<ProductSuggestionDTO[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setItems(await apiGet<ProductSuggestionDTO[]>("/api/admin/suggestions"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    try {
      await apiSend("/api/admin/suggestions", "PATCH", { id });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo actualizar.");
    }
  }

  async function markAllRead() {
    try {
      await apiSend("/api/admin/suggestions", "PATCH", { all: true });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo actualizar.");
    }
  }

  if (error) return <p className="text-bite-bad">{error}</p>;
  if (!items) return <p className="text-bite-stone">Cargando…</p>;
  const unreadCount = items.filter((s) => !s.readByAdmin).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Sugerencias de producto</h1>
          <p className="mt-1 text-bite-stone">Lo que los clientes escriben en "¿quieres algún producto en específico?" de la tienda.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="rounded-lg border-[1.5px] border-bite-black px-3.5 py-2 text-sm font-bold">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-bite-stone">Todavía no hay sugerencias.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((s) => (
            <li
              key={s.id}
              className={`rounded-bite border-[1.5px] p-4 ${
                s.readByAdmin ? "border-bite-sand bg-white" : "border-bite-orange bg-bite-orange/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-bite-black">{s.body}</p>
                {!s.readByAdmin && (
                  <button
                    onClick={() => markRead(s.id)}
                    className="shrink-0 whitespace-nowrap rounded-lg bg-bite-black px-2.5 py-1 text-xs font-bold text-bite-cream"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-bite-stone">{formatWhen(s.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
