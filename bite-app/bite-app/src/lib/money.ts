const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function money(n: number): string {
  return cop.format(Math.round(n || 0));
}
