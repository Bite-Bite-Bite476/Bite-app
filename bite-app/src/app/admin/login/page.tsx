"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión.");
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Falló la conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bite-cream">
      <header className="bg-bite-orange px-5 py-4">
        <Logo className="h-10 w-auto" />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-sm rounded-bite bg-white p-7 shadow-sm">
          <h1 className="font-display text-3xl font-extrabold">Administración</h1>
          <p className="mt-1.5 text-sm text-bite-stone">Ingresa el código de acceso de 10 dígitos.</p>
          <label htmlFor="adm-code" className="sr-only">
            Código de acceso
          </label>
          <input
            ref={inputRef}
            id="adm-code"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="mt-5 w-full rounded-lg border-[1.5px] border-bite-sand bg-white px-3.5 py-3.5 text-center font-display text-2xl tracking-[0.4em] focus:border-bite-black focus:outline-none"
          />
          {error && (
            <p role="alert" className="mt-3 font-bold text-bite-bad">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || code.length !== 10}
            className="mt-5 w-full rounded-lg bg-bite-black py-3.5 font-display text-lg font-bold uppercase tracking-wide text-bite-cream disabled:bg-bite-sand disabled:text-bite-stone"
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
