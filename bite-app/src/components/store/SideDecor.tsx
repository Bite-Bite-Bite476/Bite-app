"use client";
import { useState } from "react";
import { PackageIcon, DrinkIcon, CandyIcon, StarIcon } from "./SnackIcons";
import { playPopSound } from "@/lib/sound";

type IconComponent = typeof PackageIcon;
type Spec = { Icon: IconComponent; top: string; size: number; color: string; floatSeconds: number; floatDelay: number; rotate: number };

const LEFT: Spec[] = [
  { Icon: CandyIcon, top: "16%", size: 44, color: "text-bite-card", floatSeconds: 3.4, floatDelay: 0, rotate: -16 },
  { Icon: DrinkIcon, top: "40%", size: 38, color: "text-bite-sand", floatSeconds: 4, floatDelay: 0.5, rotate: 10 },
  { Icon: StarIcon, top: "62%", size: 28, color: "text-bite-orange/70", floatSeconds: 3, floatDelay: 0.2, rotate: 0 },
  { Icon: PackageIcon, top: "84%", size: 40, color: "text-bite-card", floatSeconds: 3.7, floatDelay: 0.3, rotate: 14 }
];
const RIGHT: Spec[] = [
  { Icon: PackageIcon, top: "14%", size: 38, color: "text-bite-sand", floatSeconds: 3.6, floatDelay: 0.2, rotate: 16 },
  { Icon: StarIcon, top: "36%", size: 26, color: "text-bite-orange/70", floatSeconds: 2.9, floatDelay: 0.1, rotate: 0 },
  { Icon: CandyIcon, top: "58%", size: 44, color: "text-bite-card", floatSeconds: 3.3, floatDelay: 0.4, rotate: -10 },
  { Icon: DrinkIcon, top: "82%", size: 36, color: "text-bite-sand", floatSeconds: 3.9, floatDelay: 0.15, rotate: -14 }
];

function SideIcon({ spec }: { spec: Spec }) {
  const [wobble, setWobble] = useState(false);
  const [pops, setPops] = useState<number[]>([]);

  function poke() {
    playPopSound();
    setWobble(true);
    setTimeout(() => setWobble(false), 500);
    const id = Date.now() + Math.random();
    setPops((p) => [...p, id]);
    setTimeout(() => setPops((p) => p.filter((x) => x !== id)), 700);
  }

  return (
    <button
      type="button"
      onClick={poke}
      aria-label="Snack decorativo — tócalo"
      className="relative block"
      style={{
        width: spec.size,
        height: spec.size,
        transform: `rotate(${spec.rotate}deg)`,
        animation: wobble ? "wobble 0.5s ease" : `float ${spec.floatSeconds}s ease-in-out ${spec.floatDelay}s infinite`
      }}
    >
      <spec.Icon className={`h-full w-full ${spec.color}`} />
      {pops.map((id) => (
        <span
          key={id}
          className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 animate-pop-up text-sm font-bold text-bite-orange"
        >
          +1
        </span>
      ))}
    </button>
  );
}

/**
 * Decoración (y un mini gesto interactivo) en los márgenes vacíos a los
 * costados del catálogo, en pantallas anchas (xl en adelante — en pantallas
 * angostas no hay espacio y no se muestra). Cada snack es "tocable": al
 * hacerlo juega un pequeño gesto y un "pop" suave. Puramente decorativo —
 * no toca el carrito ni el catálogo para nada.
 */
export default function SideDecor() {
  return (
    <>
      <div className="pointer-events-none fixed inset-y-0 left-0 z-10 hidden w-24 xl:block">
        <div className="pointer-events-auto relative h-full">
          {LEFT.map((spec, i) => (
            <div key={i} className="absolute left-3" style={{ top: spec.top }}>
              <SideIcon spec={spec} />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none fixed inset-y-0 right-0 z-10 hidden w-24 xl:block">
        <div className="pointer-events-auto relative h-full">
          {RIGHT.map((spec, i) => (
            <div key={i} className="absolute right-3" style={{ top: spec.top }}>
              <SideIcon spec={spec} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
