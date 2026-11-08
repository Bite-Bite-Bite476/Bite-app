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
 * Valida que un windowId siga siendo una franja abierta AHORA MISMO, según el
 * reloj del servidor. Se llama desde el endpoint de checkout — nunca confíes
 * en la franja que mande el cliente sin revalidarla aquí.
 */
export function validateWindowId(windowId: string, date: Date = new Date()): DeliveryWindow | null {
  const status = getScheduleStatus(date);
  return status.openWindows.find((w) => w.id === windowId) || null;
}
