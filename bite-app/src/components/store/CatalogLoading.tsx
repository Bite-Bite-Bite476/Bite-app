"use client";
import { useEffect, useState } from "react";
import { PackageIcon, DrinkIcon, CandyIcon } from "./SnackIcons";

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
