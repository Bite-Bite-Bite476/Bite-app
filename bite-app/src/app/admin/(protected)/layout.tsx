import AdminNav from "@/components/admin/AdminNav";

// La autenticación real ocurre en middleware.ts (cookie de sesión firmada):
// si no hay sesión válida, el middleware redirige a /admin/login antes de
// que este layout se renderice, así que todo lo que cuelga de este grupo
// de rutas ya está protegido.
export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bite-cream">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-5 py-7">{children}</main>
    </div>
  );
}
