"use client";
/**
 * Sonidos cortos generados con la Web Audio API — sin archivos de audio
 * externos (nada que licenciar ni que pese en el repo). Si el navegador
 * bloquea el audio (por ejemplo, sin interacción previa del usuario) o no
 * soporta la API, simplemente no suena nada; esto nunca debe romper la app.
 */

type AudioCtor = typeof AudioContext;

function tone(ctx: AudioContext, freq: number, startAt: number, duration: number, peak: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function withAudioContext(play: (ctx: AudioContext, now: number) => void) {
  try {
    const Ctor: AudioCtor | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    play(ctx, ctx.currentTime);
    setTimeout(() => {
      ctx.close().catch(() => {
        // silencioso
      });
    }, 700);
  } catch {
    // silencioso: el audio nunca debe romper la experiencia
  }
}

/** Dos notas cortas y alegres, ascendentes — al confirmar un pedido. */
export function playSuccessSound() {
  withAudioContext((ctx, now) => {
    tone(ctx, 660, now, 0.14, 0.22);
    tone(ctx, 988, now + 0.1, 0.22, 0.22);
  });
}

/** Una sola nota corta y suave — cuando llega un mensaje nuevo en el chat. */
export function playPingSound() {
  withAudioContext((ctx, now) => {
    tone(ctx, 784, now, 0.16, 0.12);
  });
}
