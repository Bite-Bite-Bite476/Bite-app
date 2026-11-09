"use client";
import { useEffect, useState } from "react";

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8l1-4h10l1 4" />
      <path d="M5 8h14l-1.3 11.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 8z" />
      <path d="M9 12c1 .8 2 .8 3 0s2-.8 3 0" />
    </svg>
  );
}

function DrinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 3l2 2-2.4 2.4" />
      <path d="M7 8h11l-1.4 11.3A2 2 0 0 1 14.6 21H9.4a2 2 0 0 1-2-1.7L6 8z" />
      <path d="M9 12h6" />
    </svg>
  );
}

function CandyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 9l-4-2v10l4-2z" />
      <path d="M15 9l4-2v10l-4-2z" />
      <rect x="9" y="8.5" width="6" height="7" rx="1.4" />
    </svg>
  );
}

const STEPS = [
  { Icon: PackageIcon, label: "Armando los paquetes…" },
  { Icon: DrinkIcon, label: "Enfriando las bebidas…" },
  { Icon: CandyIcon, label: "Empacando los dulces…" }
];

/**
 * Pantalla de carga del catálogo: un ícono central va cambiando entre
 * paquetes, bebidas y dulces (las categorías de la tienda) mientras carga,
 * con un poco de decoración flotante a los costados para que no se sienta
 * tan vacía.
 */
export default function CatalogLoading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 900);
    return () => clearInterval(id);
  }, []);

  const { Icon, label } = STEPS[step]!;

  return (
    <div className="relative flex items-center justify-center overflow-hidden py-16">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 sm:block" aria-hidden="true">
        <CandyIcon className="absolute left-2 top-2 h-10 w-10 rotate-[-18deg] text-bite-card [animation:float_3.2s_ease-in-out_infinite]" />
        <DrinkIcon className="absolute left-8 top-24 h-9 w-9 rotate-[10deg] text-bite-sand [animation:float_3.6s_ease-in-out_0.4s_infinite]" />
        <PackageIcon className="absolute left-0 top-44 h-8 w-8 rotate-[12deg] text-bite-card [animation:float_3s_ease-in-out_0.2s_infinite]" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-28 sm:block" aria-hidden="true">
        <PackageIcon className="absolute right-2 top-4 h-9 w-9 rotate-[16deg] text-bite-sand [animation:float_3.4s_ease-in-out_0.3s_infinite]" />
        <CandyIcon className="absolute right-6 top-28 h-10 w-10 rotate-[-10deg] text-bite-card [animation:float_3.1s_ease-in-out_0.1s_infinite]" />
        <DrinkIcon className="absolute right-0 top-48 h-8 w-8 rotate-[-14deg] text-bite-sand [animation:float_3.8s_ease-in-out_0.5s_infinite]" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div key={step} className="grid h-20 w-20 animate-msg-in place-items-center rounded-bite bg-bite-sand">
          <Icon className="h-10 w-10 text-bite-black" />
        </div>
        <p className="font-display text-lg font-bold text-bite-stone">{label}</p>
      </div>
    </div>
  );
}
