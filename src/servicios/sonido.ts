// Sonidos breves generados con Web Audio API (sin archivos de audio).

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tono(frecuencia: number, inicio: number, duracion: number, tipo: OscillatorType = 'sine', volumen = 0.15) {
  const c = contexto();
  if (!c) return;
  const osc = c.createOscillator();
  const gan = c.createGain();
  osc.type = tipo;
  osc.frequency.value = frecuencia;
  const t0 = c.currentTime + inicio;
  gan.gain.setValueAtTime(0.0001, t0);
  gan.gain.exponentialRampToValueAtTime(volumen, t0 + 0.02);
  gan.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);
  osc.connect(gan).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duracion + 0.05);
}

export type Sonido = 'acierto' | 'intento' | 'toque' | 'nivel' | 'cosecha';

export function sonar(s: Sonido, activo: boolean) {
  if (!activo) return;
  switch (s) {
    case 'acierto':
      tono(660, 0, 0.12);
      tono(880, 0.1, 0.18);
      break;
    case 'intento':
      // Suave, sin sonido de "castigo".
      tono(392, 0, 0.18, 'triangle', 0.1);
      break;
    case 'toque':
      tono(520, 0, 0.06, 'triangle', 0.08);
      break;
    case 'nivel':
      [523, 659, 784, 1047].forEach((f, i) => tono(f, i * 0.12, 0.2));
      break;
    case 'cosecha':
      [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tono(f, i * 0.1, 0.18, 'triangle'));
      break;
  }
}

export function vibrar(ms: number | number[], activo: boolean) {
  if (!activo) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // sin vibración disponible
  }
}
