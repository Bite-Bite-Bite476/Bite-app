"use client";
import { useState } from "react";
import { apiSend } from "@/lib/admin-api";

export default function AdminSettingsPage() {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [rep, setRep] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    setSaving(true);
    try {
      await apiSend("/api/admin/code", "PATCH", { currentCode: cur, newCode: nw, repeatCode: rep });
      setCur("");
      setNw("");
      setRep("");
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar el código.");
    } finally {
      setSaving(false);
    }
  }

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 10);

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold">Ajustes</h1>
      <p className="mb-6 mt-1 text-bite-stone">Configuración operativa del panel.</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={submit} className="flex flex-col gap-3.5 rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
          <h2 className="text-xl font-bold">Código de acceso</h2>
          <p className="text-sm text-bite-stone">
            El código de 10 dígitos que usa tu equipo para entrar al panel. Se guarda siempre cifrado (bcrypt), nunca en texto plano.
          </p>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Código actual
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              value={cur}
              onChange={(e) => setCur(onlyDigits(e.target.value))}
              className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal tabular"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Nuevo código (10 dígitos)
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              value={nw}
              onChange={(e) => setNw(onlyDigits(e.target.value))}
              className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal tabular"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Repite el nuevo código
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              value={rep}
              onChange={(e) => setRep(onlyDigits(e.target.value))}
              className="rounded-lg border-[1.5px] border-bite-sand bg-white px-3 py-2.5 font-normal tabular"
            />
          </label>
          {error && (
            <p role="alert" className="font-bold text-bite-bad">
              {error}
            </p>
          )}
          {ok && <p className="font-bold text-bite-ok">Código actualizado.</p>}
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-lg bg-bite-black px-4 py-2.5 text-sm font-bold text-bite-cream disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Cambiar código"}
          </button>
        </form>

        <div className="rounded-bite border-[1.5px] border-bite-sand bg-white p-5">
          <h2 className="mb-2 text-xl font-bold">Horario de entrega</h2>
          <p className="mb-3 text-sm text-bite-stone">
            Definido en el código del servidor (src/lib/schedule.ts) para que ningún cliente pueda manipularlo. Para cambiarlo, edita las
            franjas ahí y vuelve a desplegar.
          </p>
          <table className="w-full border-collapse text-sm tabular">
            <tbody>
              <tr>
                <td className="border-b border-bite-sand py-2">Lunes a jueves</td>
                <td className="border-b border-bite-sand py-2 text-right font-bold">09:45–10:00 · 12:15–13:10</td>
              </tr>
              <tr>
                <td className="border-b border-bite-sand py-2">Viernes</td>
                <td className="border-b border-bite-sand py-2 text-right font-bold">10:00–10:15 · 12:30–13:15</td>
              </tr>
              <tr>
                <td className="py-2">Sábado y domingo</td>
                <td className="py-2 text-right font-bold">Cerrado</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
