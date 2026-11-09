"use client";
import { useState } from "react";
import { playPopSound, playSuccessSound } from "@/lib/sound";

type Phase = "closed" | "open" | "sending" | "sent";

/**
 * Buzón flotante abajo a la izquierda: "¿quieres algún producto en
 * específico?". Cerrado por defecto (una pastilla chiquita) para no tapar
 * el catálogo; al tocarla se abre la cajita para escribir. Sin login, sin
 * correo — solo el texto va a /api/suggestions, que lo guarda para que el
 * panel de administración lo vea en "Sugerencias".
 */
export default function SuggestionBox() {
  const [phase, setPhase] = useState<Phase>("closed");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function openBox() {
    playPopSound();
    setPhase("open");
  }

  function closeBox() {
    setPhase("closed");
    setError("");
  }

  async function send() {
    const body = text.trim();
    if (!body) return setError("Escribe tu idea antes de enviarla.");
    setPhase("sending");
    setError("");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar. Intenta de nuevo.");
      playSuccessSound();
      setPhase("sent");
      setText("");
      setTimeout(() => setPhase("closed"), 2600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar. Intenta de nuevo.");
      setPhase("open");
    }
  }

  if (phase === "closed") {
    return (
      <button
        type="button"
        onClick={openBox}
        className="fixed bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-bite-orange px-4 py-3 font-display text-sm font-bold text-bite-cream shadow-[0_10px_24px_-6px_rgba(23,23,23,0.45)] hover:brightness-105 sm:bottom-5 sm:left-5"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          💬
        </span>
        ¿Buscas algo en especial?
      </button>
    );
  }

  return (
    <div className="animate-msg-in fixed bottom-4 left-4 z-20 w-[min(22rem,calc(100vw-2rem))] rounded-bite border-[1.5px] border-bite-sand bg-white p-4 shadow-[0_14px_32px_-8px_rgba(23,23,23,0.45)] sm:bottom-5 sm:left-5">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <p className="font-display text-sm font-bold leading-snug text-bite-black">
          ¿Quieres algún producto en específico? Escríbelo aquí y veremos qué podemos hacer
        </p>
        <button
          type="button"
          onClick={closeBox}
          aria-label="Cerrar"
          className="shrink-0 rounded-full px-1.5 text-lg leading-none text-bite-stone hover:text-bite-black"
        >
          ×
        </button>
      </div>

      {phase === "sent" ? (
        <p className="animate-pop-up py-2 text-center font-bold text-bite-ok">¡Gracias! Ya la tenemos en cuenta 🎉</p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Ej. ¿Tendrán gomitas sin azúcar?"
            disabled={phase === "sending"}
            className="w-full resize-none rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2 text-sm focus:border-bite-orange focus:outline-none"
          />
          {error && (
            <p role="alert" className="mt-1.5 text-sm font-bold text-bite-bad">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={send}
            disabled={phase === "sending"}
            className="mt-2.5 w-full rounded-lg bg-bite-black px-4 py-2.5 text-sm font-bold text-bite-cream disabled:opacity-60"
          >
            {phase === "sending" ? "Enviando…" : "Enviar"}
          </button>
        </>
      )}
    </div>
  );
}
