"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";

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
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`whitespace-nowrap border-b-4 px-3.5 py-3.5 font-display text-sm font-bold sm:text-base ${
                  active ? "border-bite-orange text-bite-cream" : "border-transparent text-bite-sand"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
