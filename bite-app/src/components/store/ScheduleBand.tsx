"use client";
import type { ScheduleStatus } from "@/lib/schedule";

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const CUTOFF = 5;

function hm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export default function ScheduleBand({ status }: { status: ScheduleStatus | null }) {
  if (!status) {
    return (
      <div className="border-b border-bite-sand bg-bite-cream">
        <div className="mx-auto max-w-6xl px-5 py-3 text-sm text-bite-stone">Consultando horario de entrega…</div>
      </div>
    );
  }

  let dotClass = "bg-bite-stone";
  let title = "";
  let text = "";

  if (status.openWindows.length > 0) {
    const firstOpen = status.openWindows[0]!;
    if (status.current && status.openWindows.some((w) => w.id === status.current!.id)) {
      dotClass = "bg-bite-orange shadow-[0_0_0_4px_rgba(255,100,45,0.2)]";
      title = "Entregando ahora";
      text = `Franja ${status.current.label}. Recibimos pedidos hasta las ${hm(status.current.end - CUTOFF)}.`;
    } else {
      dotClass = "bg-bite-ok shadow-[0_0_0_4px_rgba(47,125,79,0.15)]";
      title = "Abierto";
      text = `Próxima entrega hoy ${firstOpen.label}. Pide hasta las ${hm(firstOpen.end - CUTOFF)}.`;
    }
  } else if (status.isWeekend) {
    title = "Cerrado el fin de semana";
    text = status.next ? `Volvemos ${status.next.inDays === 1 ? "mañana" : "el " + DAY_NAMES[status.next.dow]} ${DAY_NAMES[status.next.dow]} a las ${hm(status.next.window.start)}.` : "";
  } else {
    title = "Cerrado por hoy";
    text = status.next
      ? `Próxima franja: ${status.next.inDays === 1 ? "mañana" : "el " + DAY_NAMES[status.next.dow]}, ${status.next.window.label}.`
      : "";
  }

  return (
    <div className="border-b border-bite-sand bg-bite-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm">
        <span className={`h-2.5 w-2.5 flex-none rounded-full ${dotClass}`} aria-hidden="true" />
        <strong className="font-display text-base font-bold">{title}</strong>
        <span>{text}</span>
        <a href="#horarios" className="ml-auto underline underline-offset-2">
          Ver horarios de entrega
        </a>
      </div>
    </div>
  );
}
