"use client";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function StoreNav({ cartCount, onOpenCart }: { cartCount: number; onOpenCart: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-bite-orange">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
        <Logo className="h-9 w-auto sm:h-11" />
        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg bg-bite-cream px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-bite-black hover:bg-white sm:px-5 sm:text-sm"
          >
            Administración
          </Link>
          <button
            onClick={onOpenCart}
            aria-label={`Abrir carrito, ${cartCount} productos`}
            className="inline-flex items-center gap-2.5 rounded-lg bg-bite-black px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-bite-cream hover:bg-black sm:px-5 sm:text-sm"
          >
            Carrito
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-bite-orange px-1.5 text-xs text-bite-black tabular">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
