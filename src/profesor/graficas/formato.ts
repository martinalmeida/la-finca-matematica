// Formato de números, porcentajes, tiempos y fechas en español de Colombia:
// miles con «.», decimales con «,», «72 %», «1 h 20 min», «12 oct».

import type { Escala } from './tipos';

/** Espacio que no se parte entre el número y su unidad («72 %» nunca queda en dos líneas). */
const ESP = ' ';
/** Signo menos tipográfico (más legible que el guion). */
const MENOS = '−';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** 4000 → «4.000»; 3.25 con 1 decimal → «3,3». */
export function fmtNum(n: number, decimales = 0): string {
  if (!Number.isFinite(n)) return '—';
  const negativo = n < 0;
  const [entera, frac] = Math.abs(n).toFixed(decimales).split('.');
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const texto = frac ? `${conMiles},${frac}` : conMiles;
  // «-0» no existe: si al redondear queda en cero, va sin signo.
  return negativo && /[1-9]/.test(texto) ? `${MENOS}${texto}` : texto;
}

/** Porcentaje que ya viene en 0–100: 72 → «72 %». */
export function fmtPct(n: number, decimales = 0): string {
  return `${fmtNum(n, decimales)}${ESP}%`;
}

/** Minutos legibles: 0,67 → «40 s», 35 → «35 min», 80 → «1 h 20 min», 120 → «2 h». */
export function fmtMin(minutos: number): string {
  if (!Number.isFinite(minutos)) return '—';
  const signo = minutos < 0 ? MENOS : '';
  const m = Math.abs(minutos);
  if (m > 0 && m < 1) return `${signo}${Math.round(m * 60)}${ESP}s`;
  const total = Math.round(m);
  if (total < 60) return `${signo}${total}${ESP}min`;
  const h = Math.floor(total / 60);
  const resto = total % 60;
  return resto === 0 ? `${signo}${fmtNum(h)}${ESP}h` : `${signo}${fmtNum(h)}${ESP}h ${resto}${ESP}min`;
}

/** ¿El texto es una fecha ISO (AAAA-MM-DD, con o sin hora)? */
export function esFechaIso(texto: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(texto);
}

/** Lee la fecha sin correrla de día por la zona horaria (las fechas sin hora son de calendario). */
function leerFecha(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d);
  }
  return new Date(iso);
}

/** «2026-10-12» → «12 oct»; con `semana` → «sem. 12 oct». Si no es fecha, devuelve el texto tal cual. */
export function fmtFechaCorta(iso: string, semana = false): string {
  if (!esFechaIso(iso)) return iso;
  const f = leerFecha(iso);
  if (Number.isNaN(f.getTime())) return iso;
  const texto = `${f.getDate()}${ESP}${MESES[f.getMonth()]}`;
  return semana ? `sem.${ESP}${texto}` : texto;
}

/** Diferencia con signo: (4, 'pts') → «+4 pts», (−3,5, 'pts') → «−3,5 pts», (5, 'min') → «+5 min». */
export function fmtDelta(n: number, unidad = ''): string {
  if (!Number.isFinite(n)) return '—';
  const redondo = Math.round(n * 10) / 10;
  const signo = redondo > 0 ? '+' : redondo < 0 ? MENOS : '';
  const abs = Math.abs(redondo);
  if (unidad === 'min') return `${signo}${fmtMin(abs)}`;
  const num = fmtNum(abs, Number.isInteger(abs) ? 0 : 1);
  if (!unidad) return `${signo}${num}`;
  return unidad === '%' ? `${signo}${num}${ESP}%` : `${signo}${num}${ESP}${unidad}`;
}

/** Número corto para ejes y fichas: 950 → «950», 1200 → «1,2 mil», 3400000 → «3,4 M». */
export function compacto(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const corto = (v: number, sufijo: string) => {
    const dec = Math.abs(v) < 10 && !Number.isInteger(Math.round(v * 10) / 10) ? 1 : 0;
    return `${fmtNum(v, dec)}${ESP}${sufijo}`;
  };
  if (abs >= 1e6) return corto(n / 1e6, 'M');
  if (abs >= 1e3) return corto(n / 1e3, 'mil');
  return fmtNum(n, Number.isInteger(n) ? 0 : 1);
}

/** Un valor completo según su escala (tooltips, etiquetas directas, tablas). */
export function fmtValor(v: number | null | undefined, escala: Escala): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (escala === 'pct') return fmtPct(v);
  if (escala === 'min') return fmtMin(v);
  return fmtNum(v, Number.isInteger(v) ? 0 : 1);
}

/** Un valor corto para las marcas de un eje. */
export function fmtEje(v: number, escala: Escala): string {
  if (escala === 'pct') return fmtPct(v);
  if (escala === 'min') return fmtMin(v);
  return compacto(v);
}

/** Unidad de las diferencias según la escala: puntos porcentuales, minutos o nada. */
export function unidadDelta(escala: Escala): string {
  return escala === 'pct' ? 'pts' : escala === 'min' ? 'min' : '';
}
