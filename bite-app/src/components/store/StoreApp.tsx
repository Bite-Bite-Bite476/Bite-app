"use client";
import { useEffect, useMemo, useState } from "react";
import type { LocationDTO, ProductDTO } from "@/lib/types";
import type { ScheduleStatus, UpcomingDay } from "@/lib/schedule";
import { useCart } from "@/store/cart";
import StoreNav from "./StoreNav";
import ScheduleBand from "./ScheduleBand";
import ProductGrid from "./ProductGrid";
import CartDrawer from "./CartDrawer";
import CheckoutFlow from "./CheckoutFlow";
import CatalogLoading from "./CatalogLoading";
import SideDecor from "./SideDecor";
import SuggestionBox from "./SuggestionBox";
import RandomSnackers from "./RandomSnackers";

const CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "PAQUETES", label: "Paquetes" },
  { id: "BEBIDAS", label: "Bebidas" },
  { id: "DULCES", label: "Dulces" }
];

export default function StoreApp() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [schedule, setSchedule] = useState<ScheduleStatus | null>(null);
  const [upcomingDays, setUpcomingDays] = useState<UpcomingDay[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("todos");
  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cart = useCart();

  async function loadProducts() {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (res.ok) setProducts(await res.json());
  }
  async function loadSchedule() {
    const res = await fetch("/api/schedule", { cache: "no-store" });
    if (res.ok) {
      const data: ScheduleStatus & { upcomingDays: UpcomingDay[] } = await res.json();
      setSchedule(data);
      setUpcomingDays(data.upcomingDays);
    }
  }
  async function loadLocations() {
    const res = await fetch("/api/locations", { cache: "no-store" });
    if (res.ok) {
      const all: LocationDTO[] = await res.json();
      setLocations(all.filter((l) => l.active));
    }
  }

  useEffect(() => {
    Promise.all([loadProducts(), loadSchedule(), loadLocations()]).finally(() => setLoading(false));
    const id = setInterval(loadSchedule, 30000);
    const id2 = setInterval(loadProducts, 30000);
    const id3 = setInterval(loadLocations, 30000);
    return () => {
      clearInterval(id);
      clearInterval(id2);
      clearInterval(id3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (products.length) cart.sanitize(products);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => (cat === "todos" || p.category === cat) && (!term || p.name.toLowerCase().includes(term)));
  }, [products, cat, q]);

  const lines = useMemo(
    () => cart.lines.map((l) => ({ product: products.find((p) => p.id === l.productId)!, qty: l.qty })).filter((l) => !!l.product),
    [cart.lines, products]
  );

  function addOne(p: ProductDTO) {
    cart.setQty(p.id, cart.qtyOf(p.id) + 1, p.stock);
  }
  function incOne(p: ProductDTO) {
    cart.setQty(p.id, cart.qtyOf(p.id) + 1, p.stock);
  }
  function decOne(p: ProductDTO) {
    cart.setQty(p.id, cart.qtyOf(p.id) - 1, p.stock);
  }
  function removeLine(p: ProductDTO) {
    cart.setQty(p.id, 0, p.stock);
  }

  const today = schedule?.dow ?? -1;

  return (
    <>
      <SideDecor />
      <SuggestionBox />
      <RandomSnackers />
      <StoreNav cartCount={cart.count()} onOpenCart={() => setCartOpen(true)} />
      <ScheduleBand status={schedule} />
      <main className="mx-auto max-w-6xl px-5 pb-14 pt-7">
        <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Snacks del día</h1>
            <p className="mt-1.5 max-w-[60ch] text-bite-stone">Arma tu pedido y elige dónde y cuándo lo recoges.</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar snack"
              className="min-w-[200px] flex-1 rounded-lg border-[1.5px] border-bite-sand bg-white px-3.5 py-2.5 sm:flex-none"
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  aria-pressed={cat === c.id}
                  className={`rounded-full border-[1.5px] border-bite-black px-3.5 py-1.5 text-sm font-bold ${
                    cat === c.id ? "bg-bite-black text-bite-cream" : ""
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <CatalogLoading />
        ) : (
          <ProductGrid products={filtered} qtyOf={(id) => cart.qtyOf(id)} onAdd={addOne} onInc={incOne} onDec={decOne} />
        )}

        <section id="horarios" className="mt-12 grid gap-6 border-t border-bite-sand pt-7 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="mb-2.5 text-xl font-bold">Horarios de entrega</h2>
            <table className="w-full border-collapse text-sm tabular">
              <tbody>
                <tr className={[1, 2, 3, 4].includes(today) ? "text-bite-orange" : ""}>
                  <td className="border-b border-bite-sand py-2">Lunes a jueves</td>
                  <td className="border-b border-bite-sand py-2 text-right font-bold">09:45 – 10:00 · 12:15 – 13:10</td>
                </tr>
                <tr className={today === 5 ? "text-bite-orange" : ""}>
                  <td className="border-b border-bite-sand py-2">Viernes</td>
                  <td className="border-b border-bite-sand py-2 text-right font-bold">10:00 – 10:15 · 12:30 – 13:15</td>
                </tr>
                <tr className={[0, 6].includes(today) ? "text-bite-orange" : ""}>
                  <td className="py-2">Sábado y domingo</td>
                  <td className="py-2 text-right font-bold">Cerrado</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="mb-2.5 text-xl font-bold">Cómo funciona</h2>
            <p className="mb-2 text-sm text-bite-stone">1. Agrega tus snacks y abre el carrito.</p>
            <p className="mb-2 text-sm text-bite-stone">2. Escribe tu correo y elige el punto, el día y la franja de entrega.</p>
            <p className="text-sm text-bite-stone">3. Al confirmar, te llega el resumen por correo.</p>
          </div>
        </section>
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={lines}
        schedule={schedule}
        onInc={incOne}
        onDec={decOne}
        onRemove={removeLine}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {checkoutOpen && schedule && (
        <CheckoutFlow
          lines={lines}
          upcomingDays={upcomingDays}
          locations={locations}
          onClose={() => setCheckoutOpen(false)}
          onOrderPlaced={() => {
            cart.clear();
            loadProducts();
          }}
        />
      )}
    </>
  );
}
