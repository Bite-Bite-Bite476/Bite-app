"use client";
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/admin-api";
import type { LocationDTO } from "@/lib/types";

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationDTO[] | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [formError, setFormError] = useState("");

  async function load() {
    try {
      setLocations(await apiGet<LocationDTO[]>("/api/locations"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function toggle(l: LocationDTO) {
    try {
      await apiSend(`/api/locations/${l.id}`, "PATCH", { active: !l.active });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo actualizar.");
    }
  }
  async function remove(l: LocationDTO) {
    if (!confirm(`¿Eliminar "${l.name}"? Las órdenes ya asignadas conservan su punto.`)) return;
    try {
      await apiSend(`/api/locations/${l.id}`, "DELETE");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setFormError("Escribe el nombre del punto de entrega.");
    try {
      await apiSend("/api/locations", "POST", { name: name.trim(), detail: detail.trim() });
      setName("");
      setDetail("");
      setFormError("");
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }

  if (error) return <p className="text-bite-bad">{error}</p>;
  if (!locations) return <p className="text-bite-stone">Cargando…</p>;
  const activeCount = locations.filter((l) => l.active).length;

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">Ubicaciones de entrega</h1>
      <p className="mb-6 mt-1 text-bite-stone">
        Cada cliente elige uno de los {activeCount} puntos activos al confirmar su pedido.
      </p>

      <section className="mb-6 rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
        <h2 className="mb-3.5 text-xl font-bold">Agregar punto</h2>
        <form onSubmit={submit} className="grid items-end gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Ej. Coliseo"
              className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Referencia
            <input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={90}
              placeholder="Ej. Puerta 2, junto a la taquilla"
              className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal"
            />
          </label>
          <button type="submit" className="justify-self-start rounded-lg bg-bite-black px-4 py-2.5 text-sm font-bold text-bite-cream sm:col-span-2">
            Agregar ubicación
          </button>
          {formError && (
            <p role="alert" className="font-bold text-bite-bad sm:col-span-2">
              {formError}
            </p>
          )}
        </form>
      </section>

      <section className="rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
        <h2 className="mb-3.5 text-xl font-bold">Puntos registrados</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-bite-stone">
                <th className="border-b-[1.5px] border-bite-sand py-2">Activo</th>
                <th className="border-b-[1.5px] border-bite-sand py-2">Nombre</th>
                <th className="border-b-[1.5px] border-bite-sand py-2">Referencia</th>
                <th className="border-b-[1.5px] border-bite-sand py-2"></th>
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.id}>
                  <td className="border-b border-bite-sand py-2.5">
                    <label className="relative inline-block h-6 w-11 flex-none">
                      <input type="checkbox" checked={l.active} onChange={() => toggle(l)} className="peer sr-only" />
                      <span className="absolute inset-0 rounded-full bg-bite-sand transition peer-checked:bg-bite-ok" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </label>
                  </td>
                  <td className="border-b border-bite-sand py-2.5 font-bold">{l.name}</td>
                  <td className="border-b border-bite-sand py-2.5">{l.detail}</td>
                  <td className="border-b border-bite-sand py-2.5">
                    <button onClick={() => remove(l)} className="rounded-lg border-[1.5px] border-bite-bad px-2.5 py-1 text-xs font-bold text-bite-bad">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
