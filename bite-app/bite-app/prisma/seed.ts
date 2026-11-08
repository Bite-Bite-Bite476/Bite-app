/**
 * Semilla de datos iniciales: productos, ubicaciones y el código de acceso
 * del panel (hasheado). Ejecuta con: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!code || !/^\d{10}$/.test(code)) {
    throw new Error("Define ADMIN_ACCESS_CODE en .env con exactamente 10 dígitos antes de sembrar datos.");
  }
  const adminCodeHash = await bcrypt.hash(code, 12);
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { adminCodeHash },
    create: { id: 1, adminCodeHash }
  });
  console.log("Código de acceso del panel configurado.");

  await prisma.location.createMany({
    data: [
      { name: "Portería principal", detail: "Junto al torniquete de ingreso", active: true },
      { name: "Cafetería · Bloque A", detail: "Mesa BITE, al lado de la caja", active: true },
      { name: "Biblioteca", detail: "Entrada norte, mostrador de préstamo", active: true },
      { name: "Cancha múltiple", detail: "Gradería oriental", active: true }
    ],
    skipDuplicates: true
  });
  console.log("Ubicaciones de entrega creadas.");

  // NOTA: imageUrl debe apuntar a una foto real del producto servida por
  // HTTPS (tu bucket, Vercel Blob o el storage que elijas). Reemplaza estas
  // rutas de ejemplo antes de ir a producción.
  const products = [
    {
      name: "Margarita Onduladas Tomate",
      category: "PAQUETES" as const,
      priceCop: 4500,
      stock: 5,
      status: "DISPONIBLE" as const,
      imageUrl: "/products/margarita-onduladas-tomate.png"
    },
    {
      name: "Takis Fuego",
      category: "PAQUETES" as const,
      priceCop: 5900,
      stock: 0,
      status: "DISPONIBLE" as const,
      imageUrl: "/products/takis-fuego.png"
    },
    {
      name: "Prime Hydration Blue Raspberry 500 ml",
      category: "BEBIDAS" as const,
      priceCop: 16000,
      stock: 0,
      status: "PROXIMAMENTE" as const,
      imageUrl: "/products/prime-hydration-blue-raspberry.png"
    }
  ];
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) await prisma.product.create({ data: p });
  }
  console.log("Productos creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
