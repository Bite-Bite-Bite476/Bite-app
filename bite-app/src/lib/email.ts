/**
 * Envío de correo transaccional con Resend.
 * Si RESEND_API_KEY no está configurada (por ejemplo en desarrollo local),
 * el envío se omite silenciosamente y se registra en consola — el checkout
 * nunca debe fallar porque el correo no salió; el pedido ya quedó guardado.
 */
import { Resend } from "resend";
import { money } from "./money";
import { DAY_NAMES, formatDeliveryDateLabel } from "./schedule";

type OrderForEmail = {
  code: string;
  customerEmail: string;
  totalCop: number;
  windowDay: number;
  windowLabel: string;
  createdAt: Date;
  location: { name: string; detail: string };
  items: Array<{ nameAtSale: string; priceAtSale: number; qty: number }>;
};

function renderEmailHtml(order: OrderForEmail): string {
  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;color:#171717;font-family:Arial,sans-serif;font-size:14px;">${i.qty} × ${escapeHtml(
          i.nameAtSale
        )}</td>
        <td style="padding:8px 0;color:#171717;font-family:Arial,sans-serif;font-size:14px;text-align:right;">${money(
          i.priceAtSale * i.qty
        )}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es"><body style="margin:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#F5F0E8;">
    <tr><td style="background:#FF642D;padding:22px 24px;">
      <span style="font-family:Arial,sans-serif;font-weight:900;font-size:26px;color:#171717;letter-spacing:-0.02em;">BITE.</span>
    </td></tr>
    <tr><td style="padding:24px;">
      <h1 style="font-size:20px;color:#171717;margin:0 0 6px;">¡Tu pedido está confirmado!</h1>
      <p style="color:#77736D;font-size:14px;margin:0 0 18px;">Código de pedido <b style="color:#171717;">${escapeHtml(
        order.code
      )}</b></p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1.5px solid #E5D9C8;border-radius:14px;padding:14px 16px;margin-bottom:18px;">
        <tr><td style="font-size:13px;color:#77736D;">Recoge tu pedido</td></tr>
        <tr><td style="font-size:16px;color:#171717;font-weight:700;padding-top:2px;">${cap(
          DAY_NAMES[order.windowDay] || ""
        )} ${escapeHtml(formatDeliveryDateLabel(order.createdAt, order.windowDay))} · ${escapeHtml(order.windowLabel)}</td></tr>
        <tr><td style="font-size:15px;color:#171717;padding-top:8px;">${escapeHtml(order.location.name)}</td></tr>
        <tr><td style="font-size:13px;color:#77736D;">${escapeHtml(order.location.detail)}</td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rows}
        <tr><td style="padding-top:10px;border-top:1.5px solid #171717;font-weight:700;font-size:15px;color:#171717;">Total</td>
            <td style="padding-top:10px;border-top:1.5px solid #171717;font-weight:700;font-size:15px;color:#171717;text-align:right;">${money(
              order.totalCop
            )}</td></tr>
      </table>
      <p style="color:#77736D;font-size:12px;margin-top:24px;">Si no reconoces este pedido, responde a este correo.</p>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function sendOrderConfirmationEmail(
  order: OrderForEmail
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "BITE. <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY no configurada; se omite el envío a ${order.customerEmail}.`);
    return { sent: false, error: "RESEND_API_KEY no configurada" };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: order.customerEmail,
      subject: `Tu pedido ${order.code} está confirmado — BITE.`,
      html: renderEmailHtml(order)
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Error desconocido al enviar el correo" };
  }
}

// Correo de aviso de seguridad — SOLO para notificar un cambio del código
// de acceso del panel de administración. No se usa para ningún otro fin.
const ADMIN_RECOVERY_EMAIL = "nicolasrodriguez0409@gmail.com";

/**
 * Avisa por correo cada vez que alguien cambia el código de administrador,
 * para que se note de inmediato si no fuiste tú. No bloquea ni revierte el
 * cambio — solo notifica. Nunca lanza: si falla, queda en consola.
 */
export async function sendAdminCodeChangedAlert(changedAt: Date, ip: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "BITE. <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada; no se pudo avisar del cambio de código de administrador.");
    return;
  }
  const when = changedAt.toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" });
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: ADMIN_RECOVERY_EMAIL,
      subject: "Aviso de seguridad: se cambió el código de administrador de BITE.",
      html: `<!DOCTYPE html>
<html lang="es"><body style="margin:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#F5F0E8;">
    <tr><td style="background:#171717;padding:20px 24px;">
      <span style="font-family:Arial,sans-serif;font-weight:900;font-size:22px;color:#FF642D;">BITE.</span>
    </td></tr>
    <tr><td style="padding:24px;">
      <h1 style="font-size:18px;color:#171717;margin:0 0 10px;">Se cambió el código de administrador</h1>
      <p style="color:#171717;font-size:14px;margin:0 0 6px;">${escapeHtml(when)}</p>
      <p style="color:#77736D;font-size:13px;margin:0 0 18px;">Dirección de origen: ${escapeHtml(ip)}</p>
      <p style="color:#171717;font-size:14px;margin:0;">Si fuiste tú, ignora este correo. Si no reconoces este cambio, escríbele a quien administra el sitio cuanto antes.</p>
    </td></tr>
  </table>
</body></html>`
    });
  } catch (err) {
    console.error("[email] No se pudo enviar el aviso de cambio de código de administrador:", err);
  }
}
