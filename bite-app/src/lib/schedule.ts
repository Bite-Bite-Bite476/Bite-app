/**
 * Lógica de horarios de entrega de BITE.
 * Única fuente de verdad: se usa tanto en el servidor (validación real del
 * checkout) como en el cliente (mostrar franjas). Nunca confíes en la hora
 * que mande el navegador para decidir si se acepta un pedido: el servidor
 * vuelve a calcular todo con su propio reloj.
 */

export const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Bogota";

// Minutos antes del cierre de cada franja en que se deja de aceptar pedidos nuevos,
// para dar tiempo de preparar y entregar dentro de la ventana.
export const CUTOFF_MINUTES = 5;

export type DeliveryWindow = {
  id: string; // `${dow}-${index}`
  dow: number; // 0=domingo … 6=sábado
  start: number; // minutos desde medianoche
  end: number;
  label: string; // "09:45 – 10:00"
};

// Lunes(1) a jueves(4): 09:45–10:00 y 12:15–13:10. Viernes(5): 10:00–10:15 y 12:30–13:15.
// Sábado(6) y domingo(0): cerrado.
const RAW_SCHEDULE: Record<number, Array<[number, number]>> = {
  1: [[585, 600], [735, 790]],
  2: [[585, 600], [735, 790]],
  3: [[585, 600], [735, 790]],
  4: [[585, 600], [735, 790]],
  5: [[600, 615], [750, 795]]
};

export const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];
const MONTH_NAMES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function minutesToLabel(min: number): string {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}

export function windowsForDay(dow: number): DeliveryWindow[] {
  const raw = RAW_SCHEDULE[dow] || [];
  return raw.map(([start, end], i) => ({
    id: `${dow}-${i}`,
    dow,
    start,
    end,
    label: `${minutesToLabel(start)} – ${minutesToLabel(end)}`
  }));
}

/** Hora y día actuales en la zona horaria de la operación (Bogotá por defecto). */
export function nowInAppTimezone(date: Date = new Date()): { dow: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dowMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dow = dowMap.indexOf(get("weekday"));
  const minutes = (Number(get("hour")) % 24) * 60 + Number(get("minute"));
  return { dow, minutes };
}

/** Día y mes (en la zona horaria de la operación) de una fecha dada, para armar etiquetas como "10 nov". */
function dayMonthInAppTimezone(date: Date): { day: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "numeric"
  }).formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1");
  return { day, month };
}

// El cliente puede elegir el día de entrega dentro de esta cantidad de días
// (hoy incluido). Se deja fija en 7 (una semana exacta) a propósito: así,
// dado el día de la semana (windowDay, 0-6) y la fecha en que se creó la
// orden (createdAt), la fecha real de entrega se puede reconstruir sin
// ambigüedad (ver resolveDeliveryDate) — cada día de la semana aparece una
// sola vez en cualquier tramo de 7 días consecutivos. Esto evita tener que
// guardar la fecha exacta en la base de datos.
export const DAY_SELECTION_HORIZON_DAYS = 7;

export type UpcomingDay = {
  dow: number;
  dateLabel: string; // "Hoy · lunes 10 nov", "Mañana · martes 11 nov", "Miércoles 12 nov"
  windows: DeliveryWindow[];
};

/**
 * Próximos días en los que se puede elegir entregar (hoy + los siguientes
 * `DAY_SELECTION_HORIZON_DAYS - 1`), cada uno con las franjas que todavía
 * se pueden pedir para ese día. Los fines de semana (sin franjas
 * configuradas) se excluyen, igual que hoy si ya cerraron todas sus franjas.
 */
export function upcomingDeliveryDays(date: Date = new Date()): UpcomingDay[] {
  const { dow: todayDow, minutes: nowMinutes } = nowInAppTimezone(date);
  const days: UpcomingDay[] = [];
  for (let i = 0; i < DAY_SELECTION_HORIZON_DAYS; i++) {
    const dow = (todayDow + i) % 7;
    const all = windowsForDay(dow);
    if (all.length === 0) continue; // fin de semana u otro día sin franjas
    const windows = i === 0 ? all.filter((w) => nowMinutes < w.end - CUTOFF_MINUTES) : all;
    if (windows.length === 0) continue; // hoy, pero ya cerraron todas las franjas de hoy
    const { day, month } = dayMonthInAppTimezone(new Date(date.getTime() + i * 86400000));
    const prefix = i === 0 ? "Hoy · " : i === 1 ? "Mañana · " : "";
    days.push({ dow, dateLabel: `${prefix}${cap(DAY_NAMES[dow] || "")} ${day} ${MONTH_NAMES_SHORT[month - 1]}`, windows });
  }
  return days;
}

/**
 * Reconstruye la fecha real de entrega de una orden ya creada, a partir de
 * cuándo se creó y qué día de la semana eligió el cliente. Funciona porque
 * el cliente solo pudo elegir dentro de los `DAY_SELECTION_HORIZON_DAYS`
 * días siguientes a `createdAt` (ver arriba) — único día posible con ese
 * día de la semana en ese tramo.
 */
export function resolveDeliveryDate(createdAt: Date, windowDay: number): Date {
  const { dow: createdDow } = nowInAppTimezone(createdAt);
  const diffDays = ((windowDay - createdDow) % 7 + 7) % 7;
  return new Date(createdAt.getTime() + diffDays * 86400000);
}

/** Etiqueta legible de la fecha real de entrega, ej. "10 de noviembre". */
export function formatDeliveryDateLabel(createdAt: Date, windowDay: number): string {
  const resolved = resolveDeliveryDate(createdAt, windowDay);
  const { day, month } = dayMonthInAppTimezone(resolved);
  return `${day} de ${MONTH_NAMES[month - 1]}`;
}

export type ScheduleStatus = {
  dow: number;
  minutes: number;
  todayWindows: DeliveryWindow[];
  openWindows: DeliveryWindow[]; // franjas de hoy que todavía reciben pedidos
  current: DeliveryWindow | null; // franja en curso ahora mismo, si existe
  next: { dow: number; window: DeliveryWindow; inDays: number } | null;
  isWeekend: boolean;
};

export function getScheduleStatus(date: Date = new Date()): ScheduleStatus {
  const { dow, minutes } = nowInAppTimezone(date);
  const todayWindows = windowsForDay(dow);
  const openWindows = todayWindows.filter((w) => minutes < w.end - CUTOFF_MINUTES);
  const current = todayWindows.find((w) => minutes >= w.start && minutes < w.end) || null;

  let next: ScheduleStatus["next"] = null;
  if (openWindows.length === 0) {
    for (let i = 1; i <= 7; i++) {
      const d = (dow + i) % 7;
      const ws = windowsForDay(d);
      if (ws.length > 0 && ws[0]) {
        next = { dow: d, window: ws[0], inDays: i };
        break;
      }
    }
  }

  return { dow, minutes, todayWindows, openWindows, current, next, isWeekend: !RAW_SCHEDULE[dow] };
}

/**
 * Valida un windowId contra el reloj del servidor — nunca confíes en la
 * franja que mande el cliente sin revalidarla aquí. El cliente elige tanto
 * el día (dentro de los próximos DAY_SELECTION_HORIZON_DAYS) como la
 * franja de ese día; aquí se revisa que esa combinación siga siendo válida
 * ahora mismo (por ejemplo, que no haya cerrado justo mientras confirmaba).
 */
export function validateWindowId(windowId: string, date: Date = new Date()): DeliveryWindow | null {
  for (const day of upcomingDeliveryDays(date)) {
    const match = day.windows.find((w) => w.id === windowId);
    if (match) return match;
  }
  return null;
}
