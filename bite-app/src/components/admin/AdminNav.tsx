"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { playPingSound } from "@/lib/sound";

const TABS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/orders", label: "Órdenes" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/locations", label: "Ubicaciones" },
  { href: "/admin/settings", label: "Ajustes" }
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef<number | null>(null);

  // Insignia tipo Teams en la pestaña "Órdenes": cuántos mensajes de
  // clientes hay sin leer, en toda la tienda. No suena en la primera
  // carga de la página — solo cuando el número sube mientras ya está abierta.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/orders/unread-count", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { count } = await res.json();
        if (prevUnreadRef.current !== null && count > prevUnreadRef.current) playPingSound();
        prevUnreadRef.current = count;
        setUnreadCount(count);
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
  }, []);

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
            const badge = t.href === "/admin/orders" && unreadCount > 0 ? unreadCount : null;
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
