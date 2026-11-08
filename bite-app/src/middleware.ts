import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";

// Protege /admin/* (excepto /admin/login) y /api/admin/* (excepto el propio
// endpoint de login) exigiendo una cookie de sesión firmada y válida.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    pathname !== "/api/admin/login" &&
    !pathname.startsWith("/api/admin/login/");
  // Catálogo y ubicaciones: solo las escrituras requieren sesión (la lectura
  // es pública, la necesita la tienda). Órdenes: TODO requiere sesión,
  // incluida la lectura — ahí viven correos y pedidos de clientes.
  const isProtectedWriteApi =
    (pathname.startsWith("/api/products") || pathname.startsWith("/api/locations")) && req.method !== "GET";
  const isProtectedOrdersApi = pathname.startsWith("/api/orders");

  if (!isAdminPage && !isAdminApi && !isProtectedWriteApi && !isProtectedOrdersApi) return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE.name)?.value;
  const valid = token ? await verifySessionToken(token) : false;

  if (!valid) {
    if (isAdminPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: "No autorizado. Inicia sesión en el panel de administración." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/products/:path*", "/api/locations/:path*", "/api/orders/:path*"]
};
