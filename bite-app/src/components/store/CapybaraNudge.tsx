"use client";
import { useState } from "react";
import { CapybaraIcon } from "./MascotIcons";
import { playPopSound } from "@/lib/sound";

/**
 * Capibara que aparece junto al botón de "Confirmar pedido" una vez que ya
 * se puede enviar (franja y punto elegidos). Flota y cada pocos segundos se
 * inclina hacia el botón, como invitando a tocarlo. Es "tocable" por sí
 * mismo (reacción simpática, igual que los snacks de los costados) pero
 * nunca envía el formulario — es puramente decorativo.
 */
export default function CapybaraNudge({ ready }: { ready: boolean }) {
  const [poked, setPoked] = useState(false);
  const [sparkles, setSparkles] = useState<number[]>([]);

  if (!ready) return null;

  function poke() {
    playPopSound();
    setPoked(true);
    setTimeout(() => setPoked(false), 500);
    const id = Date.now() + Math.random();
    setSparkles((s) => [...s, id]);
    setTimeout(() => setSparkles((s) => s.filter((x) => x !== id)), 700);
  }

  return (
    <button
      type="button"
      onClick={poke}
      aria-label="Un capibara te invita a confirmar el pedido"
      className="absolute -top-11 right-1 z-10 grid h-14 w-[68px] place-items-center rounded-2xl bg-bite-sand shadow-[0_8px_16px_-4px_rgba(23,23,23,0.35)]"
      style={{ animation: poked ? "wobble 0.5s ease" : "capy-nudge 5s ease-in-out infinite" }}
    >
      <CapybaraIcon className="h-7 w-14 text-bite-black" />
      {sparkles.map((id) => (
        <span key={id} aria-hidden="true" className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 animate-pop-up text-base">
          🦋
        </span>
      ))}
    </button>
  );
}
