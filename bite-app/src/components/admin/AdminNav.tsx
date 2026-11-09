"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { playPingSound } from "@/lib/sound";

const TABS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/orders", label: "Órdenes" },
  { href: "/admin/sugerencias", label: "Sugerencias" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/locations", label: "Ubicaciones" },
  { href: "/admin/settings", label: "Ajustes" }
];

// Pequeño helper: sondea un endpoint de conteo y avisa (sonido) solo cuando
// el número sube después de la primera carga — igual para órdenes y para
// sugerencias, cada una con su propia pestaña y su propia insignia.
function useUnreadBadge(url: string) {
  const [count, setCount] = useState(0);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (prevRef.current !== null && data.count > prevRef.current) playPingSound();
        prevRef.current = data.count;
        setCount(data.count);
      } catch {
        // silencioso: el próximo sondeo lo intenta de nuevo
      }
    }
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [url]);

  return count;
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Insignia tipo Teams en "Órdenes" (mensajes de clientes sin leer) y en
  // "Sugerencias" (ideas de producto sin leer) — cada una en toda la tienda.
  const unreadOrders = useUnreadBadge("/api/orders/unread-count");
  const unreadSuggestions = useUnreadBadge("/api/admin/suggestions/unread-count");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-bite-orange">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
          <Link href="/admin">
            <Logo className="h-9 w-auto sm:h-11" />
          </Link>
          <div className="ml-auto flex items-center gap-2.5">
            <Link
              href="/"
              className="rounded-lg bg-bite-cream px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-bite-black hover:bg-white sm:px-5 sm:text-sm"
            >
              Volver a la tienda
            </Link>
            <button
              onClick={logout}
              className="rounded-lg bg-bite-black px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-bite-cream hover:bg-black sm:px-5 sm:text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <nav className="bg-bite-black" aria-label="Secciones de administración">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5">
          {TABS.map((t) => {
            const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
            const badge =
              t.href === "/admin/orders" && unreadOrders > 0
                ? unreadOrders
                : t.href === "/admin/sugerencias" && unreadSuggestions > 0
                  ? unreadSuggestions
                  : null;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative whitespace-nowrap border-b-4 px-3.5 py-3.5 font-display text-sm font-bold sm:text-base ${
                  active ? "border-bite-orange text-bite-cream" : "border-transparent text-bite-sand"
                }`}
              >
                {t.label}
                {badge !== null && (
                  <span className="absolute right-0.5 top-1.5 grid h-5 min-w-[20px] animate-pulse place-items-center rounded-full bg-bite-orange px-1 text-[11px] font-bold text-bite-black tabular">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
