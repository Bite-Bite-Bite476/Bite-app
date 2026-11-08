"use client";
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/admin-api";
import { money } from "@/lib/money";
import { CATEGORY_LABEL, type ProductCategory, type ProductDTO, type ProductStatus } from "@/lib/types";

function productState(p: ProductDTO) {
  if (p.status === "PROXIMAMENTE") return { label: "Próximamente", cls: "bg-bite-black text-bite-cream" };
  if (p.stock <= 0) return { label: "Fuera de stock", cls: "bg-bite-black text-bite-cream" };
  return { label: "Disponible", cls: "bg-[#DCEFE3] text-bite-ok" };
}

/** Comprime la foto subida a un data URL manejable. Para un catálogo grande,
 * cambia esto por una subida real a Vercel Blob/S3/Cloudinary y guarda la URL
 * pública resultante en `imageUrl` (el esquema ya lo admite sin cambios). */
function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("Usa una imagen PNG, JPG o WEBP."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("La imagen supera 8 MB."));
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 640;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/webp", 0.85));
      };
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = fr.result as string;
    };
    fr.onerror = () => reject(new Error("No se pudo leer el archivo."));
    fr.readAsDataURL(file);
  });
}

type FormState = {
  id?: string;
  name: string;
  category: ProductCategory;
  status: ProductStatus;
  priceCop: string;
  stock: string;
  imageUrl: string;
};
const BLANK: FormState = { name: "", category: "PAQUETES", status: "DISPONIBLE", priceCop: "", stock: "0", imageUrl: "" };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDTO[] | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setProducts(await apiGet<ProductDTO[]>("/api/products"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function adjustStock(p: ProductDTO, delta: number) {
    try {
      await apiSend(`/api/products/${p.id}`, "PATCH", { stock: Math.max(0, p.stock + delta) });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo actualizar el stock.");
    }
  }

  async function removeProduct(p: ProductDTO) {
    if (!confirm(`¿Eliminar "${p.name}" del catálogo? Las órdenes existentes no cambian.`)) return;
    try {
      await apiSend(`/api/products/${p.id}`, "DELETE");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }

  async function onImageChange(file: File | undefined) {
    if (!file || !form) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setForm({ ...form, imageUrl: dataUrl });
      setFormError("");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo leer la imagen.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const name = form.name.trim();
    const priceCop = Math.round(Number(form.priceCop));
    const stock = Math.floor(Number(form.stock));
    if (name.length < 2) return setFormError("Escribe el nombre del producto.");
    if (!Number.isFinite(priceCop) || priceCop < 100) return setFormError("El precio debe ser de al menos $100.");
    if (!Number.isFinite(stock) || stock < 0) return setFormError("Las unidades no pueden ser negativas.");
    if (!form.imageUrl) return setFormError("Sube una foto real del producto.");

    setSaving(true);
    try {
      const payload = { name, category: form.category, status: form.status, priceCop, stock, imageUrl: form.imageUrl };
      if (form.id) await apiSend(`/api/products/${form.id}`, "PATCH", payload);
      else await apiSend("/api/products", "POST", payload);
      setForm(null);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-bite-bad">{error}</p>;
  if (!products) return <p className="text-bite-stone">Cargando…</p>;

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">Productos</h1>
      <p className="mb-6 mt-1 text-bite-stone">Precios en pesos colombianos. 0 unidades = Fuera de stock automáticamente.</p>

      <section className="rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
        <div className="mb-3.5 flex items-center gap-2.5">
          <h2 className="text-xl font-bold">{products.length} productos</h2>
          <button
            onClick={() => {
              setForm(BLANK);
              setFormError("");
            }}
            className="ml-auto rounded-lg bg-bite-black px-3.5 py-2 text-sm font-bold text-bite-cream"
          >
            Nuevo producto
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-bite-stone">
                <th className="border-b-[1.5px] border-bite-sand py-2"></th>
                <th className="border-b-[1.5px] border-bite-sand py-2">Producto</th>
                <th className="border-b-[1.5px] border-bite-sand py-2">Categoría</th>
                <th className="border-b-[1.5px] border-bite-sand py-2 text-right">Precio</th>
                <th className="border-b-[1.5px] border-bite-sand py-2">Stock</th>
                <th className="border-b-[1.5px] border-bite-sand py-2">En tienda</th>
                <th className="border-b-[1.5px] border-bite-sand py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const s = productState(p);
                return (
                  <tr key={p.id} className="hover:bg-[#FBF8F3]">
                    <td className="border-b border-bite-sand py-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bite-card p-1">
                        <img src={p.imageUrl} alt="" className="h-full w-auto object-contain" />
                      </div>
                    </td>
                    <td className="border-b border-bite-sand py-2 font-bold">{p.name}</td>
                    <td className="border-b border-bite-sand py-2">{CATEGORY_LABEL[p.category]}</td>
                    <td className="border-b border-bite-sand py-2 text-right tabular">{money(p.priceCop)}</td>
                    <td className="border-b border-bite-sand py-2">
                      <span className="inline-flex items-center overflow-hidden rounded-lg border-[1.5px] border-bite-black">
                        <button onClick={() => adjustStock(p, -1)} disabled={p.stock <= 0} className="h-8 w-8 font-bold disabled:opacity-40">
                          −
                        </button>
                        <span className="min-w-[26px] text-center tabular">{p.stock}</span>
                        <button onClick={() => adjustStock(p, 1)} className="h-8 w-8 font-bold">
                          +
                        </button>
                      </span>
                    </td>
                    <td className="border-b border-bite-sand py-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="whitespace-nowrap border-b border-bite-sand py-2">
                      <button
                        onClick={() => {
                          setForm({
                            id: p.id,
                            name: p.name,
                            category: p.category,
                            status: p.status,
                            priceCop: String(p.priceCop),
                            stock: String(p.stock),
                            imageUrl: p.imageUrl
                          });
                          setFormError("");
                        }}
                        className="mr-1.5 rounded-lg border-[1.5px] border-bite-black px-2.5 py-1 text-xs font-bold"
                      >
                        Editar
                      </button>
                      <button onClick={() => removeProduct(p)} className="rounded-lg border-[1.5px] border-bite-bad px-2.5 py-1 text-xs font-bold text-bite-bad">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {form && (
        <div onClick={(e) => e.target === e.currentTarget && setForm(null)} className="fixed inset-0 z-[60] grid place-items-center overflow-auto bg-bite-black/55 p-4">
          <form onSubmit={submit} className="max-h-[calc(100%-8px)] w-full max-w-lg overflow-auto rounded-bite bg-bite-cream">
            <div className="flex items-center justify-between px-6 pt-5">
              <h2 className="font-display text-2xl font-extrabold">{form.id ? "Editar producto" : "Nuevo producto"}</h2>
              <button type="button" onClick={() => setForm(null)} className="h-10 w-10 rounded-lg text-xl font-bold hover:bg-bite-sand">
                ×
              </button>
            </div>
            <div className="flex flex-col gap-3.5 px-6 pb-6 pt-4">
              <div className="flex h-40 items-center justify-center rounded-lg bg-bite-card p-3">
                {form.imageUrl ? <img src={form.imageUrl} alt="" className="h-full w-auto object-contain" /> : <span className="text-bite-stone">Sin foto</span>}
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-bold">
                Foto real del producto (PNG, JPG o WEBP)
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onImageChange(e.target.files?.[0])} className="font-normal" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-bold">
                Nombre
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={80}
                  required
                  className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-bold">
                  Categoría
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                    className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal"
                  >
                    {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-bold">
                  Estado
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
                    className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal"
                  >
                    <option value="DISPONIBLE">Disponible (según stock)</option>
                    <option value="PROXIMAMENTE">Próximamente</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-bold">
                  Precio (COP)
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={form.priceCop}
                    onChange={(e) => setForm({ ...form, priceCop: e.target.value })}
                    required
                    className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal tabular"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-bold">
                  Unidades en tienda
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                    className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal tabular"
                  />
                </label>
              </div>
              {formError && (
                <p role="alert" className="font-bold text-bite-bad">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-bite-black py-3.5 font-display text-lg font-bold uppercase tracking-wide text-bite-cream disabled:opacity-60"
              >
                {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
