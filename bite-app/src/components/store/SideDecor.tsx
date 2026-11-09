"use client";
import { useState } from "react";
import { PackageIcon, DrinkIcon, CandyIcon, StarIcon } from "./SnackIcons";
import { playPopSound } from "@/lib/sound";

type IconComponent = typeof PackageIcon;
type Spec = {
  Icon: IconComponent;
  top: string;
  size: number; // diámetro del "chip" de fondo, no solo del ícono
  chipClass: string; // color de fondo (y, para algunos, borde) del chip
  iconClass: string; // color del trazo del ícono dentro del chip
  floatSeconds: number;
  floatDelay: number;
  rotate: number;
};

// Chips sólidos en vez de líneas sueltas: así se ven de verdad desde lejos,
// no solo decoración tenue perdida en el margen.
const LEFT: Spec[] = [
  { Icon: CandyIcon, top: "14%", size: 64, chipClass: "bg-bite-orange", iconClass: "text-bite-cream", floatSeconds: 3.2, floatDelay: 0, rotate: -14 },
  { Icon: DrinkIcon, top: "38%", size: 58, chipClass: "bg-bite-black", iconClass: "text-bite-orange", floatSeconds: 3.8, floatDelay: 0.4, rotate: 10 },
  { Icon: StarIcon, top: "61%", size: 46, chipClass: "bg-bite-cream border-[3px] border-bite-orange", iconClass: "text-bite-orange", floatSeconds: 2.8, floatDelay: 0.15, rotate: 0 },
  { Icon: PackageIcon, top: "85%", size: 60, chipClass: "bg-bite-sand", iconClass: "text-bite-black", floatSeconds: 3.5, floatDelay: 0.3, rotate: 14 }
];
const RIGHT: Spec[] = [
  { Icon: PackageIcon, top: "13%", size: 58, chipClass: "bg-bite-black", iconClass: "text-bite-cream", floatSeconds: 3.6, floatDelay: 0.2, rotate: 16 },
  { Icon: StarIcon, top: "35%", size: 44, chipClass: "bg-bite-cream border-[3px] border-bite-orange", iconClass: "text-bite-orange", floatSeconds: 2.7, floatDelay: 0.05, rotate: 0 },
  { Icon: CandyIcon, top: "58%", size: 64, chipClass: "bg-bite-orange", iconClass: "text-bite-cream", floatSeconds: 3.1, floatDelay: 0.45, rotate: -10 },
  { Icon: DrinkIcon, top: "82%", size: 56, chipClass: "bg-bite-sand", iconClass: "text-bite-black", floatSeconds: 3.7, floatDelay: 0.1, rotate: -14 }
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
      className={`relative grid place-items-center rounded-full shadow-[0_10px_20px_-6px_rgba(23,23,23,0.4)] ${spec.chipClass}`}
      style={{
        width: spec.size,
        height: spec.size,
        transform: `rotate(${spec.rotate}deg)`,
        animation: wobble ? "wobble 0.5s ease" : `float-big ${spec.floatSeconds}s ease-in-out ${spec.floatDelay}s infinite`
      }}
    >
      <spec.Icon className={`h-[58%] w-[58%] ${spec.iconClass}`} />
      {pops.map((id) => (
        <span
          key={id}
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 animate-pop-up text-base font-bold text-bite-orange"
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
 * angostas no hay espacio y no se muestra). Chips sólidos y grandes, bien
 * notorios, no solo íconos finitos. Cada snack es "tocable": al hacerlo
 * juega un pequeño gesto y un "pop" suave. Puramente decorativo — no toca
 * el carrito ni el catálogo para nada.
 */
export default function SideDecor() {
  return (
    <>
      <div className="pointer-events-none fixed inset-y-0 left-0 z-10 hidden w-28 xl:block">
        <div className="pointer-events-auto relative h-full">
          {LEFT.map((spec, i) => (
            <div key={i} className="absolute left-4" style={{ top: spec.top }}>
              <SideIcon spec={spec} />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none fixed inset-y-0 right-0 z-10 hidden w-28 xl:block">
        <div className="pointer-events-auto relative h-full">
          {RIGHT.map((spec, i) => (
            <div key={i} className="absolute right-4" style={{ top: spec.top }}>
              <SideIcon spec={spec} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
