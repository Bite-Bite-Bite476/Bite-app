import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const locations = await prisma.location.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(locations);
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  detail: z.string().trim().max(90).optional().default("")
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe el nombre del punto de entrega." }, { status: 400 });
  }
  const location = await prisma.location.create({
    data: { name: parsed.data.name, detail: parsed.data.detail || "Sin referencia", active: true }
  });
  return NextResponse.json(location, { status: 201 });
}
