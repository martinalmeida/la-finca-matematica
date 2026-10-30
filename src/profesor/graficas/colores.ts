// Paleta de las gráficas (paleta de referencia del método de visualización, modo claro).
// Validada con validate_palette.js: ranuras 1–5 pasan las pruebas de daltonismo en pares vecinos
// y las ranuras 1–3 en todos los pares. Aguamarina, amarillo y magenta quedan bajo 3:1 contra la
// superficie: por eso toda gráfica trae etiquetas visibles o su «Ver tabla».
// Los mismos valores viven como variables CSS en `.viz` (graficas.css); aquí están para el SVG
// y para calcular el color del texto dentro de una celda.

import type { Tono } from './tipos';

/** Ranuras categóricas en orden fijo: se asignan en secuencia, nunca se reciclan. */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
/** Variables CSS de cada ranura (para estilos en línea). */
export const VAR_SERIES = SERIES.map((_, i) => `var(--viz-serie-${i + 1})`);

/** Identidades fijas en todo el panel: naranja = prueba de entrada, azul = prueba final. */
export const COLOR_ENTRADA = 'var(--viz-serie-2)';
export const COLOR_FINAL = 'var(--viz-serie-1)';
/** Acento (lo que importa) y gris de contexto (lo demás). */
export const COLOR_ACENTO = 'var(--viz-serie-1)';
export const COLOR_GRIS = 'var(--viz-gris)';

/** Rampa secuencial azul, pasos 100 → 700 (claro → oscuro). */
export const RAMPA_AZUL = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];

/** Colores de estado (reservados: nunca se usan como «serie 4»). */
export const ESTADO: Record<Tono, string> = {
  neutro: '#898781',
  bien: '#0ca30c',
  aviso: '#fab219',
  grave: '#ec835a',
  critico: '#d03b3b',
};
/** Ícono que acompaña siempre a cada tono. */
export const ICONO_TONO: Record<Tono, string> = { neutro: '•', bien: '✓', aviso: '!', grave: '▲', critico: '●' };
/** Nombre del tono para lectores de pantalla. */
export const NOMBRE_TONO: Record<Tono, string> = { neutro: 'Neutro', bien: 'Bien', aviso: 'Atención', grave: 'Grave', critico: 'Crítico' };

const TINTA = '#0b0b0b';

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function hex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

function luminancia(color: string): number {
  const [r, g, b] = rgb(color).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Texto dentro de un relleno: blanco o casi negro, el que más contraste dé. */
export function textoSobre(fondo: string): string {
  return contraste(fondo, '#ffffff') >= contraste(fondo, TINTA) ? '#ffffff' : TINTA;
}

/** Texto dentro de un relleno categórico o de estado (regla de la paleta): blanco, salvo sobre
 *  el amarillo, el aviso y el gris claro, donde va casi negro. */
export function textoEnRelleno(fondo: string): string {
  return ['#eda100', '#fab219', '#c3c2b7'].includes(fondo.toLowerCase()) ? TINTA : '#ffffff';
}

/** Color de la rampa azul para t en [0, 1] (0 = paso 100, 1 = paso 700), interpolado entre pasos. */
export function colorRampa(t: number): string {
  const tt = Math.max(0, Math.min(1, t)) * (RAMPA_AZUL.length - 1);
  const i = Math.min(RAMPA_AZUL.length - 2, Math.floor(tt));
  const f = tt - i;
  const a = rgb(RAMPA_AZUL[i]);
  const b = rgb(RAMPA_AZUL[i + 1]);
  return hex(a.map((c, k) => c + (b[k] - c) * f));
}
