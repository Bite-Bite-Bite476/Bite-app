"use client";
import { useEffect, useRef, useState } from "react";
import { CapybaraIcon, BirdIcon, PersonIcon } from "./MascotIcons";
import { CandyIcon } from "./SnackIcons";

type Critter = "capibara" | "ave" | "persona";
const CRITTERS: Critter[] = ["capibara", "ave", "persona"];
const VISIT_MS = 2800;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function CritterIcon({ critter, className }: { critter: Critter; className?: string }) {
  if (critter === "capibara") return <CapybaraIcon className={className} />;
  if (critter === "ave") return <BirdIcon className={className} />;
  return <PersonIcon className={className} />;
}

/**
 * Easter egg: cada cierto tiempo (al azar, sin patrón fijo) aparece "de la
 * nada" un personaje chiquito — persona, ave o capibara — mordisqueando un
 * snack en algún punto abajo de la pantalla, y a los pocos segundos
 * desaparece solo. Puramente decorativo (pointer-events-none): no bloquea
 * ni cambia nada del catálogo o el carrito.
 */
export default function RandomSnackers() {
  const [visit, setVisit] = useState<{ id: number; critter: Critter; leftPct: number } | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let hideId: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const delay = randomBetween(18000, 38000);
      timeoutId = setTimeout(() => {
        const critter = CRITTERS[Math.floor(Math.random() * CRITTERS.length)] ?? "capibara";
        const leftPct = randomBetween(30, 88); // deja libre la esquina donde vive el buzón de sugerencias
        const id = Date.now();
        setVisit({ id, critter, leftPct });
        hideId = setTimeout(() => setVisit((v) => (v?.id === id ? null : v)), VISIT_MS);
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(hideId);
    };
  }, []);

  if (!visit) return null;

  return (
    <div
      key={visit.id}
      aria-hidden="true"
      className="animate-snacker-visit pointer-events-none fixed bottom-3 z-10 hidden sm:block"
      style={{ left: `${visit.leftPct}%` }}
    >
      <div className="relative grid h-12 w-12 place-items-center rounded-full bg-white shadow-[0_8px_16px_-4px_rgba(23,23,23,0.3)]">
        <CritterIcon critter={visit.critter} className="h-7 w-7 text-bite-black" />
        <CandyIcon className="animate-nibble absolute -right-1.5 -top-1 h-4 w-4 text-bite-orange" />
      </div>
    </div>
  );
}
