# BITE. — Tienda de snacks

Aplicación de comercio electrónico para pedidos internos de snacks, con franjas de entrega estrictas, asignación aleatoria de punto de recogida y panel de administración. Next.js 14 (App Router) + TypeScript + Tailwind CSS + PostgreSQL (Prisma) + Resend.

## Arquitectura

```
src/
  app/
    page.tsx                     Tienda (pública)
    admin/
      login/page.tsx             Login del panel (código de 10 dígitos)
      (protected)/                Grupo de rutas protegido por middleware.ts
        page.tsx                 Resumen / dashboard
        orders/page.tsx          Gestión de órdenes
        products/page.tsx        Gestión de productos
        locations/page.tsx       Gestión de ubicaciones de entrega
        settings/page.tsx        Cambio de código de acceso
    api/
      schedule/route.ts          Estado del horario (lectura pública)
      products/…                 CRUD de productos (POST/PATCH/DELETE protegidos)
      locations/…                CRUD de ubicaciones (POST/PATCH/DELETE protegidos)
      checkout/route.ts          Checkout transaccional (stock, franja, ubicación, correo)
      orders/…                   Listado y cambio de estado (protegidos)
      admin/login, logout, code  Autenticación del panel
  components/                    UI (tienda y panel), todo en la paleta BITE.
  lib/
    schedule.ts                  Única fuente de verdad de las franjas de entrega
    auth.ts                      Hash del código (bcrypt) + sesión firmada (JWT, jose)
    email.ts                     Plantilla y envío con Resend
    prisma.ts                    Cliente de Prisma (singleton)
  middleware.ts                  Protege /admin y las escrituras de la API
prisma/
  schema.prisma                  Modelo de datos
  seed.ts                        Productos, ubicaciones y código inicial
```

### Decisiones clave de diseño

- **Trazabilidad real.** Cada `OrderItem` guarda `nameAtSale` y `priceAtSale`: si editas o borras un producto después, las órdenes históricas no cambian. Las ubicaciones y productos se borran "suave" (`active: false`) cuando ya tienen órdenes asociadas, en vez de romper el historial.
- **El horario se valida en el servidor.** `src/lib/schedule.ts` es la única fuente de verdad; el endpoint `/api/checkout` vuelve a calcular la franja con el reloj del servidor — nunca confía en la hora del navegador del cliente.
- **Checkout atómico.** Todo el pedido (validación de stock, descuento de inventario, asignación aleatoria de ubicación, creación de la orden) ocurre dentro de una transacción de Prisma. Si algo fallara a mitad de camino, no queda stock descontado sin una orden, ni una orden sin stock descontado.
- **Autenticación del panel.** Un único código de 10 dígitos (compartido por el equipo que gestiona pedidos), guardado como hash bcrypt — nunca en texto plano. Al validarse, se emite una cookie de sesión firmada (JWT, httpOnly, Secure, 8 h) que el middleware exige en toda ruta de `/admin` y en los métodos de escritura de la API. Incluye límite de 5 intentos fallidos por IP con bloqueo de 60 s.

## Puesta en marcha local

### 1. Instala dependencias

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env` y complétalo:

```bash
cp .env.example .env
```

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. |
| `ADMIN_ACCESS_CODE` | Código de 10 dígitos que se hashea al sembrar la base de datos (solo se usa una vez, en `db:seed`). |
| `ADMIN_SESSION_SECRET` | Secreto para firmar la cookie de sesión del panel. Genera uno con `openssl rand -base64 48`. |
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) para el correo de confirmación. |
| `RESEND_FROM` | Remitente verificado, ej. `BITE. <pedidos@tudominio.com>`. |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio. |
| `APP_TIMEZONE` | Zona horaria para calcular las franjas de entrega (`America/Bogota` por defecto). |

### 3. Base de datos

Necesitas una instancia de PostgreSQL. Las más rápidas de levantar gratis:

- **[Neon](https://neon.tech)** (recomendado con Vercel: serverless, tier gratuito generoso)
- **[Supabase](https://supabase.com)**
- **[Railway](https://railway.app)**

Con `DATABASE_URL` ya en `.env`:

```bash
npm run db:push    # crea las tablas a partir de prisma/schema.prisma
npm run db:seed    # crea productos, ubicaciones y el código de acceso inicial
```

### 4. Correo (Resend)

1. Crea una cuenta en [resend.com](https://resend.com) y genera una API key.
2. Mientras no verifiques un dominio propio, Resend solo deja enviar a la casilla con la que te registraste, usando `RESEND_FROM="BITE. <onboarding@resend.dev>"`. Para enviar a tus clientes reales, verifica tu dominio en Resend (registros DNS) y usa `RESEND_FROM="BITE. <pedidos@tudominio.com>"`.
3. Si `RESEND_API_KEY` no está configurada, el checkout sigue funcionando: el pedido se guarda igual y solo se omite el envío del correo (queda registrado en `Order.emailError`).

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Tienda: `http://localhost:3000` · Panel: `http://localhost:3000/admin` (código de `ADMIN_ACCESS_CODE`).

## Despliegue en producción (Vercel)

1. Sube este proyecto a un repositorio de GitHub/GitLab.
2. En [vercel.com](https://vercel.com), **Add New → Project** y selecciona el repositorio.
3. En **Environment Variables**, agrega todas las de `.env.example` con sus valores reales de producción (usa un `ADMIN_SESSION_SECRET` distinto al de desarrollo).
4. Antes del primer deploy (o desde tu máquina, apuntando a la base de producción), corre:
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. Despliega. `postinstall` ejecuta `prisma generate` automáticamente; `build` incluye `prisma generate` también.
6. Verifica `/admin` con el código sembrado y **cámbialo de inmediato** desde Ajustes → Código de acceso: el valor en `ADMIN_ACCESS_CODE` solo importa para ese primer `db:seed`.

### Fotos de producto en producción

El esquema guarda `imageUrl` como texto simple. En este proyecto, el panel de administración sube la foto como una imagen comprimida embebida (data URL) para que funcione sin configurar nada — está bien para un catálogo pequeño. Para un catálogo más grande, lo recomendable es:

1. Conectar [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (o S3/Cloudinary).
2. En `src/app/admin/(protected)/products/page.tsx`, reemplazar `readImageAsDataUrl` por una subida real que devuelva una URL pública, y guardar esa URL en `imageUrl` (el esquema no cambia).
3. Agregar el host de ese storage a `images.remotePatterns` en `next.config.mjs`.

### Límite de intentos de login

El límite de 5 intentos / 60 s en `src/lib/auth.ts` vive en memoria del proceso. Es una primera barrera razonable para el volumen de un panel interno, pero en un despliegue serverless con varias instancias cada una lleva su propio contador. Para un límite estrictamente global, muévelo a una tabla (`AdminLoginAttempt`) o a un store compartido como Upstash Redis.

## Flujo de negocio implementado

- **Horarios de entrega** (hora de Bogotá): lunes a jueves 09:45–10:00 y 12:15–13:10; viernes 10:00–10:15 y 12:30–13:15; fin de semana cerrado. Se dejan de aceptar pedidos 5 minutos antes del cierre de cada franja (`CUTOFF_MINUTES` en `src/lib/schedule.ts`).
- **Checkout:** correo del cliente + franja de hoy disponible → el servidor revalida stock y franja, descuenta inventario, asigna una ubicación activa al azar y envía el correo de confirmación.
- **Panel de administración**, protegido por el código de 10 dígitos:
  - **Resumen:** KPIs del día, cola de preparación, unidades vendidas.
  - **Órdenes:** filtro por estado, búsqueda, cambio de estado (Pendiente → Preparando → Lista → Entregada, o Cancelada — cancelar devuelve el stock), detalle con historial, exportar CSV.
  - **Productos:** alta/edición/baja, foto real, precio, stock, categoría y estado (Disponible/Próximamente).
  - **Ubicaciones:** alta/baja, activar o desactivar del sorteo de entrega.
  - **Ajustes:** cambio del código de acceso.

## Próximos pasos sugeridos

- Cuentas individuales para el equipo de administración (hoy es un código compartido), si se necesita trazabilidad por persona.
- Panel de reportes exportable a Excel (puede apoyarse en los mismos datos de `/api/orders`).
- Notificación por WhatsApp/SMS además del correo, para el aviso de "pedido listo".
