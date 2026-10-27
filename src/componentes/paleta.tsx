// Sistema de color de los iconos e ilustraciones: cada tono tiene tres pasos (luz, medio, sombra)
// y todos se iluminan igual, desde arriba a la izquierda. Así los dibujos se ven de una misma familia.

import { useId } from 'react';

export const TONOS = {
  v: ['#bbf7d0', '#22c55e', '#15803d'], // verde
  n: ['#fed7aa', '#fb923c', '#c2410c'], // naranja
  a: ['#bfdbfe', '#3b82f6', '#1e40af'], // azul
  m: ['#ddd6fe', '#8b5cf6', '#5b21b6'], // morado
  y: ['#fef3c7', '#fbbf24', '#d97706'], // amarillo
  r: ['#fecdd3', '#f43f5e', '#be123c'], // rojo
  k: ['#f5d0a6', '#b7793f', '#6b3f1d'], // madera, cacao
  g: ['#ffffff', '#d5dde6', '#7b8797'], // metal
  t: ['#a5f3fc', '#14b8a6', '#0f766e'], // turquesa
  c: ['#ffffff', '#fdf6e7', '#efdcb4'], // papel, crema
  d: ['#94a3b8', '#475569', '#1e293b'], // pizarra
  p: ['#fde7d2', '#f2b98a', '#c47f4e'], // piel
  o: ['#ffd65c', '#f59e23', '#c2410c'], // mazorca de cacao
  l: ['#ecfccb', '#a3e635', '#4d7c0f'], // limón, hoja tierna
  w: ['#a3c96b', '#4d7c0f', '#26400a'], // aguacate
  q: ['#f6b67a', '#c8682c', '#7c3412'], // plumas de gallina
  x: ['#f6e7c1', '#d9bb7c', '#9a7a3c'], // fique, bulto
  z: ['#fff1c9', '#f0c97c', '#c18a43'], // arepa (no usar b, s ni e: son brillo, sombra y reflejo)
} as const satisfies Record<string, readonly [string, string, string]>;

export type Tono = keyof typeof TONOS;

/** Color plano de un tono (para trazos y detalles pequeños). */
export const medio = (k: Tono) => TONOS[k][1];
export const oscuro = (k: Tono) => TONOS[k][2];
export const claro = (k: Tono) => TONOS[k][0];

export type U = (k: string) => string;

/** Identificador único por dibujo: los degradados de un SVG no chocan con los de otro. */
export function useDegradados(): { id: string; u: U } {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return { id, u: (k) => `url(#${id}${k})` };
}

/**
 * Degradados compartidos:
 * - uno por tono (luz arriba a la izquierda);
 * - b: brillo de vidrio arriba; s: sombra suave abajo; e: reflejo esférico.
 */
export function Degradados({ id }: { id: string }) {
  return (
    <defs>
      {Object.entries(TONOS).map(([k, [a, b, c]]) => (
        <linearGradient key={k} id={`${id}${k}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.5" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      ))}
      <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".8" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.45" stopColor="#0b1a12" stopOpacity="0" />
        <stop offset="1" stopColor="#0b1a12" stopOpacity=".22" />
      </linearGradient>
      <radialGradient id={`${id}e`} cx="0.34" cy="0.28" r="0.62">
        <stop offset="0" stopColor="#fff" stopOpacity=".85" />
        <stop offset="0.35" stopColor="#fff" stopOpacity=".18" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}
