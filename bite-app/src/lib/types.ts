// Tipos compartidos entre cliente y servidor. Se mantienen separados del
// cliente de Prisma para que los componentes "use client" no intenten
// importar @prisma/client (que solo corre en el servidor).

export type ProductCategory = "PAQUETES" | "BEBIDAS" | "DULCES";
export type ProductStatus = "DISPONIBLE" | "PROXIMAMENTE";
export type OrderStatus = "PENDIENTE" | "PREPARANDO" | "LISTA" | "ENTREGADA" | "CANCELADA";

export type ProductDTO = {
  id: string;
  name: string;
  category: ProductCategory;
  priceCop: number;
  stock: number;
  status: ProductStatus;
  imageUrl: string;
  active: boolean;
};

export type LocationDTO = {
  id: string;
  name: string;
  detail: string;
  active: boolean;
};

export type OrderItemDTO = {
  id: string;
  productId: string | null;
  nameAtSale: string;
  priceAtSale: number;
  qty: number;
};

export type OrderDTO = {
  id: string;
  code: string;
  customerEmail: string;
  status: OrderStatus;
  totalCop: number;
  windowDay: number;
  windowLabel: string;
  location: { id: string; name: string; detail: string };
  items: OrderItemDTO[];
  statusEvents: Array<{ status: OrderStatus; at: string }>;
  createdAt: string;
  emailSentAt: string | null;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  PREPARANDO: "Preparando",
  LISTA: "Lista",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada"
};

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  PAQUETES: "Paquetes",
  BEBIDAS: "Bebidas",
  DULCES: "Dulces"
};

export const ACTIVE_STATUSES: OrderStatus[] = ["PENDIENTE", "PREPARANDO", "LISTA"];
export const FINAL_STATUSES: OrderStatus[] = ["ENTREGADA", "CANCELADA"];
