// Paquete de iconos animados propio (SVG en línea, sin archivos ni red).
// Sistema común (ver paleta.tsx): rejilla de 48, luz desde arriba a la izquierda, cada forma con
// degradado de tres tonos, sombra suave abajo (s), brillo de vidrio (b) o reflejo esférico (e).
// Los trazos rectos usan colores planos: un degradado no se pinta sobre una línea sin alto o sin ancho.
// anim="una" (por defecto) anima al aparecer y al soltar un botón; "siempre" en bucle; "no" quieto.

import type { ReactElement } from 'react';
import type { Objeto } from '../juego/tipos';
import { DibujoObjeto } from './Ilustraciones';
import { claro, Degradados, medio, oscuro, useDegradados, type U } from './paleta';

/** Brillo de vidrio en la parte de arriba de una forma. */
const reflejo = (u: U, d: string) => <path d={d} fill={u('b')} />;

/** Una forma con su degradado, su sombra inferior y, si se pide, reflejo esférico. */
function Volumen({ u, d, c, esfera = false, borde }: { u: U; d: string; c: string; esfera?: boolean; borde?: string }) {
  return (
    <>
      <path d={d} fill={u(c)} stroke={borde} strokeWidth={borde ? 1 : undefined} />
      <path d={d} fill={u('s')} />
      {esfera && <path d={d} fill={u('e')} />}
    </>
  );
}

const circulo = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

/** Contorno de un engranaje de n dientes. */
function engranaje(cx: number, cy: number, rExt: number, rInt: number, n: number): string {
  const paso = (2 * Math.PI) / n;
  const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  let d = '';
  for (let k = 0; k < n; k++) {
    const c = k * paso - Math.PI / 2;
    d += `${k ? 'L' : 'M'}${p(rInt, c - 0.32 * paso)}L${p(rExt, c - 0.17 * paso)}L${p(rExt, c + 0.17 * paso)}L${p(rInt, c + 0.32 * paso)}`;
  }
  return `${d}Z`;
}

const ESTRELLA = 'M24 5.5 29.2 16.3 41 17.9 32.4 26.1 34.5 37.9 24 32.2 13.5 37.9 15.6 26.1 7 17.9 18.8 16.3Z';
const CORAZON = 'M24 41.5S5.5 30.5 5.5 17.5A9.6 9.6 0 0 1 24 13a9.6 9.6 0 0 1 18.5 4.5C42.5 30.5 24 41.5 24 41.5Z';

const iconos: Record<string, (u: U) => ReactElement> = {
  casa: (u) => (
    <>
      <g className="a-humo">
        <circle cx="34" cy="7.5" r="2.4" fill="#e2e8f0" />
        <circle cx="37" cy="4" r="1.8" fill="#f1f5f9" />
      </g>
      <path d="M31 9.5h5v10h-5Z" fill={u('k')} />
      <Volumen u={u} c="c" d="M10 22 24 10.5 38 22v17.5a3.5 3.5 0 0 1-3.5 3.5h-21a3.5 3.5 0 0 1-3.5-3.5Z" borde="#ead2a3" />
      <path d="M3.6 23.8 24 6.5l20.4 17.3a2.6 2.6 0 0 1-3.4 4L24 13.4 7 27.8a2.6 2.6 0 0 1-3.4-4Z" fill={u('n')} />
      {reflejo(u, 'M5 23.5 24 7.5l2 1.8L6.5 26Z')}
      <path d="M19.5 43V32.5a4.5 4.5 0 0 1 9 0V43Z" fill={u('v')} />
      <circle cx="26" cy="37.5" r="1" fill="#fef3c7" />
      {[12, 30].map((x) => (
        <g key={x}>
          <rect x={x} y="26.5" width="6.5" height="6.5" rx="1.6" fill={u('a')} />
          <path d={`M${x + 3.25} 26.5v6.5M${x} 29.75h6.5`} stroke="#fff" strokeOpacity=".7" strokeWidth="1" />
        </g>
      ))}
    </>
  ),
  mapa: (u) => (
    <>
      <path d="M5 12.5 17 7.5v30.5L5 43Z" fill={u('t')} />
      <path d="M17 7.5 31 12.5V43l-14-5Z" fill={u('v')} />
      <path d="M17 7.5 31 12.5V43l-14-5Z" fill={u('s')} />
      <path d="M31 12.5 43 7.5V38l-12 5Z" fill={u('t')} />
      <path className="a-trazo" d="M9.5 35c4-6 8-2 12-8s9-5 12-10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 3.5" pathLength={60} />
      <ellipse cx="34" cy="22" rx="3.2" ry="1.2" fill="#0b1a12" opacity=".2" />
      <g className="a-rebote">
        <path d="M34 3.5a6.5 6.5 0 0 1 6.5 6.5c0 5.2-6.5 11.5-6.5 11.5s-6.5-6.3-6.5-11.5A6.5 6.5 0 0 1 34 3.5Z" fill={u('r')} />
        <circle cx="34" cy="10" r="2.4" fill="#fff" />
        <ellipse cx="31.3" cy="7.3" rx="1.2" ry="2" fill="#fff" opacity=".55" transform="rotate(35 31.3 7.3)" />
      </g>
    </>
  ),
  libro: (u) => (
    <>
      <path d="M3 13c7-3 15-3 21 1.5 6-4.5 14-4.5 21-1.5v28c-7-3-15-3-21 1.5-6-4.5-14-4.5-21-1.5Z" fill={u('a')} />
      <path d="M6 13.2c6-1.8 13-1.3 18 2.3V39c-5-3.2-12-3.6-18-2Z" fill={u('c')} />
      <g className="a-pagina">
        <path d="M24 15.5c5-3.6 12-4.1 18-2.3V37c-6-1.6-13-1.2-18 2Z" fill={u('c')} />
        <path d="M28 20.5c3.5-1.4 7-1.6 10-1M28 25c3.5-1.4 7-1.6 10-1M28 29.5c2.5-1 5-1.2 7-.8" stroke={claro('m')} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>
      <path d="M10 19.5c3-.6 7-.4 10 1M10 24c3-.6 7-.4 10 1M10 28.5c2.5-.5 5-.3 7 .6" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M24 15.5V39" stroke="#0b1a12" strokeOpacity=".12" strokeWidth="1.6" />
    </>
  ),
  cuaderno: (u) => (
    <>
      <Volumen u={u} c="a" d={rect(9, 5, 28, 38, 4)} />
      {reflejo(u, 'M13 5h20a4 4 0 0 1 4 4v5H9V9a4 4 0 0 1 4-4Z')}
      <rect x="15.5" y="12" width="15" height="9" rx="2" fill="#fff" fillOpacity=".92" />
      <path d="M18.5 15.5h9M18.5 18h6" stroke={medio('a')} strokeWidth="1.3" strokeLinecap="round" />
      {[11, 17, 23, 29, 35].map((y) => (
        <rect key={y} x="5.5" y={y} width="7.5" height="2.8" rx="1.4" fill={u('g')} stroke={oscuro('g')} strokeWidth=".6" />
      ))}
      <g className="a-escribir">
        <g transform="rotate(45 37 29)">
          <rect x="34" y="17" width="6" height="18" rx="1" fill={u('y')} />
          <rect x="34" y="15" width="6" height="3.5" rx="1" fill={u('r')} />
          <rect x="34" y="18" width="6" height="1.6" fill={u('g')} />
          <path d="M34 35h6l-3 5Z" fill="#f5d0a6" />
          <path d="M36.2 38.6h1.6L37 40Z" fill="#334155" />
        </g>
      </g>
    </>
  ),
  engrane: (u) => (
    <g className="a-girar">
      <path d={engranaje(24, 24, 20.5, 15.5, 9)} fill={u('g')} stroke={u('g')} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={engranaje(24, 24, 20.5, 15.5, 9)} fill={u('s')} />
      <circle cx="24" cy="24" r="9" fill={oscuro('g')} />
      <circle cx="24" cy="24" r="7.5" fill="#fff" />
      <circle cx="24" cy="24" r="4.5" fill={u('a')} />
      <path d="M10 18a15 15 0 0 1 10-9" stroke="#fff" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  ),
  brote: (u) => (
    <>
      <path d="M9 42c0-4 7-7 15-7s15 3 15 7Z" fill={u('k')} />
      <path d="M12 39c3-1.8 7-2.6 12-2.6" stroke="#fff" strokeOpacity=".3" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <g className="a-crecer">
        <path d="M24 37V21" stroke={medio('v')} strokeWidth="3.2" strokeLinecap="round" />
        <g className="a-balanceo">
          <path d="M24 27c-2-9-9-12-17.5-11 1 8.5 7.5 13.5 17.5 11Z" fill={u('v')} />
          <path d="M23.5 26.5C19 22 14 19 8.5 17.5" stroke={oscuro('v')} strokeOpacity=".4" strokeWidth="1" fill="none" />
        </g>
        <g className="a-balanceo-inv">
          <path d="M24 22c1-9.5 8.5-14.5 17.5-14 -1 9.5-7.5 15-17.5 14Z" fill={u('l')} />
          <path d="M24.5 21.5C29 16 34 12 40 9" stroke={oscuro('l')} strokeOpacity=".4" strokeWidth="1" fill="none" />
        </g>
      </g>
    </>
  ),
  estrella: (u) => (
    <g className="a-latir">
      <path d={ESTRELLA} fill={u('y')} stroke={u('y')} strokeWidth="4" strokeLinejoin="round" />
      <path d="M24 5.5 29.2 16.3 41 17.9 24 24Z" fill="#fff" opacity=".22" />
      <path d="M24 24 34.5 37.9 24 32.2Z" fill={oscuro('y')} opacity=".25" />
      <path d={ESTRELLA} fill={u('s')} />
      {reflejo(u, 'M24 8.5 27.8 16.8 19 18.5Z')}
      <path className="a-destello" d="M40 4c.5 2 1.5 3 3.5 3.5-2 .5-3 1.5-3.5 3.5-.5-2-1.5-3-3.5-3.5 2-.5 3-1.5 3.5-3.5Z" fill="#fff7cc" />
    </g>
  ),
  candado: (u) => (
    <>
      <path className="a-candado" d="M15 22v-6.5a9 9 0 0 1 18 0V22" fill="none" stroke={medio('g')} strokeWidth="5" strokeLinecap="round" />
      <path d="M16.5 15a7.5 7.5 0 0 1 5-6.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <Volumen u={u} c="y" d={rect(8.5, 20.5, 31, 23, 6)} />
      {reflejo(u, 'M14.5 20.5h19a6 6 0 0 1 6 6h-31a6 6 0 0 1 6-6Z')}
      <circle cx="24" cy="30.5" r="3.2" fill="#7c2d12" />
      <path d="M24 31.5v5.5" stroke="#7c2d12" strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),
  jugar: (u) => (
    <g className="a-latir">
      <Volumen u={u} c="v" d={circulo(24, 24, 20)} />
      {reflejo(u, 'M8 20a16 16 0 0 1 32 0c-8-4-24-4-32 0Z')}
      <path d="M19.5 15.5v17l14-8.5Z" fill="#fff" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    </g>
  ),
  altavoz: (u) => (
    <>
      <Volumen u={u} c="a" d="M6.5 17.5h7.5l10.5-8.5a1.5 1.5 0 0 1 2.5 1.2v27.6a1.5 1.5 0 0 1-2.5 1.2L14 30.5H6.5a2.5 2.5 0 0 1-2.5-2.5v-8a2.5 2.5 0 0 1 2.5-2.5Z" />
      {reflejo(u, 'M14 17.5 24.5 9a1.5 1.5 0 0 1 2.5 1.2V15Z')}
      <path className="a-onda1" d="M32 18.5a8 8 0 0 1 0 11" fill="none" stroke={medio('t')} strokeWidth="3.4" strokeLinecap="round" />
      <path className="a-onda2" d="M36.5 13.5a15 15 0 0 1 0 21" fill="none" stroke={medio('t')} strokeWidth="3.4" strokeLinecap="round" />
      <path className="a-onda3" d="M41 8.5a22 22 0 0 1 0 31" fill="none" stroke={medio('t')} strokeWidth="3.4" strokeLinecap="round" />
    </>
  ),
  bombillo: (u) => (
    <>
      <circle className="a-halo" cx="24" cy="18.5" r="17" fill="#fde68a" opacity=".45" />
      <Volumen u={u} c="y" d="M24 3.5a14 14 0 0 1 8.5 25.1V32.5h-17v-3.9A14 14 0 0 1 24 3.5Z" />
      {reflejo(u, 'M16.5 10a10.5 10.5 0 0 1 9-3.6c-5 2-8 5.4-9 10.6Z')}
      <path d="M20 21.5l4 4 4-4M24 25.5v7" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="15.5" y="32.5" width="17" height="4.5" rx="2" fill={u('g')} />
      <rect x="17" y="37" width="14" height="4.5" rx="2" fill={u('g')} />
      <path d="M17 35h14M18.5 39.5h11" stroke={oscuro('g')} strokeOpacity=".5" strokeWidth=".8" />
      <path d="M21 43.5h6" stroke={medio('d')} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  solucion: (u) => (
    <>
      <Volumen u={u} c="k" d={rect(8, 7, 32, 37.5, 5)} />
      <rect x="11.5" y="11" width="25" height="30" rx="3" fill={u('c')} />
      <path d="M16 3.5h16a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" fill={u('g')} stroke={oscuro('g')} strokeWidth=".8" />
      <path className="a-trazo" d="m16 26 6 6 11-12" fill="none" stroke={medio('v')} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={60} strokeDasharray="60" />
    </>
  ),
  repetir: (u) => (
    <g className="a-girar-una">
      <path d="M38.5 19A15.5 15.5 0 0 0 12 13.5" fill="none" stroke={medio('v')} strokeWidth="5" strokeLinecap="round" />
      <path d="M6.5 7.5 8.4 18.2 18.8 15Z" fill={u('v')} stroke={medio('v')} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 29A15.5 15.5 0 0 0 36 34.5" fill="none" stroke={medio('t')} strokeWidth="5" strokeLinecap="round" />
      <path d="M41.5 40.5 39.6 29.8 29.2 33Z" fill={u('t')} stroke={medio('t')} strokeWidth="2" strokeLinejoin="round" />
    </g>
  ),
  diana: (u) => (
    <>
      <Volumen u={u} c="r" d={circulo(22, 26, 18.5)} />
      <circle cx="22" cy="26" r="13" fill="#fff" />
      <circle cx="22" cy="26" r="8" fill={u('r')} />
      <circle cx="22" cy="26" r="3.2" fill="#fff" />
      {reflejo(u, 'M7 22a15 15 0 0 1 30 0c-8-4-22-4-30 0Z')}
      <g className="a-flecha">
        <path d="M22 26 41 7" stroke={medio('k')} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M36.5 4.5 43.5 4.5 43.5 11.5 40 8Z" fill={u('y')} />
        <path d="M34 7 38 3M41 14l4-4" stroke={medio('y')} strokeWidth="2" strokeLinecap="round" />
      </g>
    </>
  ),
  dato: (u) => (
    <>
      <Volumen u={u} c="m" d="M9 6h30a6 6 0 0 1 6 6v17a6 6 0 0 1-6 6H22.5L13 43v-8H9a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z" />
      {reflejo(u, 'M9 6h30a6 6 0 0 1 6 6v3H3v-3a6 6 0 0 1 6-6Z')}
      <g className="a-rebote">
        <path d="M18.5 15.5a5.5 5.5 0 1 1 7.8 5c-1.5.7-2.3 1.6-2.3 3.2" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
        <circle cx="24" cy="29" r="2.3" fill="#fff" />
      </g>
    </>
  ),
  medalla: (u) => (
    <g className="a-pendulo">
      <path d="M13 2.5h8.5l4.5 17h-8.5Z" fill={u('a')} />
      <path d="M35 2.5h-8.5l-4.5 17h8.5Z" fill={u('r')} />
      <path d="M16.5 2.5h2.5l4.5 17H21Z" fill="#fff" opacity=".5" />
      <path d="M31.5 2.5H29l-4.5 17H27Z" fill="#fff" opacity=".5" />
      <circle cx="24" cy="31.5" r="13" fill={oscuro('y')} />
      <circle cx="24" cy="31" r="12.5" fill={u('y')} />
      <circle cx="24" cy="31" r="9" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" />
      <path d="m24 24.5 2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7Z" fill="#fff" />
      <circle cx="24" cy="31" r="12.5" fill={u('e')} />
    </g>
  ),
  trofeo: (u) => (
    <>
      <path d="M12.5 9H6v3.5a8 8 0 0 0 8 8M35.5 9H42v3.5a8 8 0 0 1-8 8" fill="none" stroke={medio('y')} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M21 26h6v8h-6Z" fill={u('y')} />
      <Volumen u={u} c="y" d="M12 5h24v10.5a12 12 0 0 1-24 0Z" />
      {reflejo(u, 'M12 5h24v4H12Z')}
      <path d="m24 9.5 1.6 3.3 3.6.5-2.6 2.5.6 3.6L24 17.7l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5Z" fill="#fff" opacity=".85" />
      <Volumen u={u} c="k" d={rect(14, 34, 20, 9, 3)} />
      <rect x="19" y="37" width="10" height="3" rx="1" fill={u('y')} />
      <clipPath id={u('clip').slice(5, -1)}>
        <path d="M12 5h24v10.5a12 12 0 0 1-24 0Z" />
      </clipPath>
      <rect className="a-barrido" x="8" y="0" width="7" height="30" fill="#fff" opacity="0" transform="skewX(-20)" clipPath={u('clip')} />
    </>
  ),
  silo: (u) => (
    <>
      <path d="M2.5 26 11 18l8.5 8Z" fill={u('r')} />
      <Volumen u={u} c="r" d="M4.5 25h13v18h-13Z" />
      <path d="M8.5 43v-8h5v8" fill="#fff" fillOpacity=".85" />
      <path d="M8.5 35l5 8M13.5 35l-5 8" stroke={medio('r')} strokeWidth="1" />
      <path d="M20 15a11 9 0 0 1 22 0Z" fill={u('g')} stroke={oscuro('g')} strokeWidth=".8" />
      <circle cx="31" cy="5.5" r="1.6" fill={medio('d')} />
      <Volumen u={u} c="g" d="M20 15h22v28H20Z" />
      <path d="M20 21h22M20 27h22M20 33h22M20 39h22" stroke={oscuro('g')} strokeOpacity=".35" strokeWidth="1" />
      <path d="M23 16v26" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" />
      <rect x="27" y="22" width="9" height="17" rx="2" fill={u('d')} />
      <rect className="a-llenar" x="27" y="22" width="9" height="17" rx="2" fill={u('y')} />
      <path d="M1.5 43.5h45" stroke={medio('k')} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  pareja: (u) => (
    <>
      <g className="a-saltito">
        <path d="M3 43a12 12 0 0 1 24 0Z" fill={u('v')} />
        <circle cx="15" cy="15" r="7" fill={u('p')} />
        <path d="M8 14a7 7 0 0 1 14-1c-3 0-7-1-9-3-1 2-3 3.5-5 4Z" fill={u('k')} />
        <circle cx="15" cy="15" r="7" fill={u('e')} />
      </g>
      <g className="a-saltito-2">
        <path d="M21 43a12 12 0 0 1 24 0Z" fill={u('a')} />
        <circle cx="33" cy="15" r="7" fill={u('p')} />
        <path d="M26 15a7 7 0 1 1 14 0c-1-2-3-4-7-4s-6 2-7 4Z" fill={u('d')} />
        <circle cx="33" cy="15" r="7" fill={u('e')} />
      </g>
      <path d="M20.5 33.5h7" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),
  corazon: (u) => (
    <g className="a-latir">
      <Volumen u={u} c="r" d={CORAZON} />
      {reflejo(u, 'M9.5 13.5a6.5 6.5 0 0 1 9-1.5c-4.5 1-7 3.5-8 8Z')}
    </g>
  ),
  'corazon-vacio': () => <path d={CORAZON} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />,
  fiesta: (u) => (
    <>
      <path d="M5.5 43.5 15 14.5l19 19Z" fill={u('m')} />
      <path d="M8.5 34.5 15 41M11.5 25.5l12.5 12.5" stroke={u('y')} strokeWidth="3" />
      <path d="M5.5 43.5 15 14.5l19 19Z" fill={u('s')} />
      <path d="M15 14.5 34 33.5" stroke="#fff" strokeOpacity=".4" strokeWidth="1.5" />
      <g className="a-confeti">
        <circle cx="30" cy="8" r="2.5" fill={medio('r')} />
        <circle cx="41" cy="16" r="2.5" fill={medio('v')} />
        <rect x="35" y="25" width="5" height="3" rx="1" fill={medio('y')} transform="rotate(30 37 26)" />
        <rect x="22" y="5" width="5" height="3" rx="1" fill={medio('a')} transform="rotate(-30 24 6)" />
        <path d="M27 18c4-2 4-6 9-7" fill="none" stroke={medio('n')} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </>
  ),
  check: (u) => (
    <>
      <Volumen u={u} c="v" d={circulo(24, 24, 20)} />
      {reflejo(u, 'M8 20a16 16 0 0 1 32 0c-8-4-24-4-32 0Z')}
      <path className="a-trazo" d="m14 25 7 7 14-15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={60} strokeDasharray="60" />
    </>
  ),
  pensar: (u) => (
    <>
      <circle cx="8" cy="41" r="2.5" fill={u('y')} />
      <circle cx="13" cy="35.5" r="3.5" fill={u('y')} />
      <Volumen u={u} c="y" d="M12 6h24a8 8 0 0 1 8 8v10a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8Z" />
      {reflejo(u, 'M12 6h24a8 8 0 0 1 8 8v1H4v-1a8 8 0 0 1 8-8Z')}
      <circle className="a-punto1" cx="15" cy="19.5" r="3" fill="#92400e" />
      <circle className="a-punto2" cx="24" cy="19.5" r="3" fill="#92400e" />
      <circle className="a-punto3" cx="33" cy="19.5" r="3" fill="#92400e" />
    </>
  ),
  numeros: (u) => (
    <>
      <Volumen u={u} c="a" d={rect(4, 6, 40, 36, 10)} />
      {reflejo(u, 'M14 6h20a10 10 0 0 1 10 10H4A10 10 0 0 1 14 6Z')}
      <g className="a-rebote" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" textAnchor="middle">
        <g fill={oscuro('a')} opacity=".45" transform="translate(.6 1)">
          <text x="14" y="30.5">1</text>
          <text x="24" y="30.5">2</text>
          <text x="34" y="30.5">3</text>
        </g>
        <g fill="#fff">
          <text x="14" y="30.5">1</text>
          <text x="24" y="30.5">2</text>
          <text x="34" y="30.5">3</text>
        </g>
      </g>
    </>
  ),
  cero: (u) => (
    <>
      <Volumen u={u} c="m" d={rect(6, 6, 36, 36, 11)} />
      {reflejo(u, 'M17 6h14a11 11 0 0 1 11 11H6A11 11 0 0 1 17 6Z')}
      <ellipse className="a-latir" cx="24" cy="24.5" rx="7.5" ry="10" fill="none" stroke="#fff" strokeWidth="4.5" />
    </>
  ),
  mas: (u) => <Operador u={u} c="v" d="M24 14v20M14 24h20" />,
  menos: (u) => <Operador u={u} c="n" d="M14 24h20" />,
  por: (u) => <Operador u={u} c="m" d="m16.5 16.5 15 15M31.5 16.5l-15 15" />,
  entre: (u) => (
    <Operador u={u} c="a" d="M14 24h20">
      <circle cx="24" cy="15.5" r="3" fill="#fff" />
      <circle cx="24" cy="32.5" r="3" fill="#fff" />
    </Operador>
  ),
  calendario: (u) => (
    <>
      <Volumen u={u} c="c" d={rect(5.5, 8.5, 37, 35, 6)} borde="#e2e8f0" />
      <path d="M11.5 8.5h25a6 6 0 0 1 6 6v5h-37v-5a6 6 0 0 1 6-6Z" fill={u('r')} />
      {reflejo(u, 'M11.5 8.5h25a6 6 0 0 1 6 6v1h-37v-1a6 6 0 0 1 6-6Z')}
      <rect x="13.5" y="4" width="4.5" height="9.5" rx="2.2" fill={u('d')} />
      <rect x="30" y="4" width="4.5" height="9.5" rx="2.2" fill={u('d')} />
      {[0, 1, 2, 3].map((k) => (
        <circle key={k} cx={12.5 + k * 7.6} cy="28" r="2.4" fill={k < 3 ? medio('v') : '#e2e8f0'} />
      ))}
      <path d="M10.5 36h12" stroke="#e2e8f0" strokeWidth="2.4" strokeLinecap="round" />
      <path className="a-trazo" d="m31.5 35 3 3 5.5-6" fill="none" stroke={medio('v')} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" pathLength={60} strokeDasharray="60" />
    </>
  ),
  brujula: (u) => (
    <>
      <Volumen u={u} c="t" d={circulo(24, 24, 20.5)} />
      <circle cx="24" cy="24" r="15.5" fill="#fff" />
      {[0, 90, 180, 270].map((g) => (
        <path key={g} d="M24 10.5v3" stroke={medio('d')} strokeWidth="2" strokeLinecap="round" transform={`rotate(${g} 24 24)`} />
      ))}
      <g className="a-aguja">
        <path d="m24 11.5 4.2 12.5h-8.4Z" fill={u('r')} />
        <path d="m24 36.5-4.2-12.5h8.4Z" fill={u('g')} stroke={oscuro('g')} strokeWidth=".6" />
      </g>
      <circle cx="24" cy="24" r="2.6" fill={medio('d')} />
      <circle cx="24" cy="24" r="20.5" fill={u('e')} />
    </>
  ),
  tortuga: (u) => (
    <g className="a-caminar">
      <path d="M10 31.5h5.5v7a2.2 2.2 0 0 1-2.2 2.2h-1.1a2.2 2.2 0 0 1-2.2-2.2ZM28.5 31.5H34v7a2.2 2.2 0 0 1-2.2 2.2h-1.1a2.2 2.2 0 0 1-2.2-2.2Z" fill={u('l')} />
      <path d="M4.5 32c-2 .2-3 1.8-1.6 3" stroke={medio('l')} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M33 28c1.5-5 5-7.5 8.5-6.8 3 .7 4.2 4 2.7 6.8-1.5 2.8-5.5 4-11.2 2.5Z" fill={u('l')} />
      <circle cx="41.6" cy="25.4" r="1.4" fill="#1f2937" />
      <circle cx="42" cy="25" r=".45" fill="#fff" />
      <path d="M41 29.2c1 .4 2 .4 2.8-.2" stroke={oscuro('l')} strokeWidth=".9" strokeLinecap="round" fill="none" />
      <Volumen u={u} c="v" d="M4 33a18 16.5 0 0 1 36 0Z" esfera />
      <path d="M16 33l2-8h8l2 8M18 25l-6.5-5.5M26 25l6.5-5.5M22 16.5V25M9 30.5l7 2.5M35 30.5l-7 2.5" fill="none" stroke={oscuro('v')} strokeOpacity=".4" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M3.5 33h37" stroke={oscuro('v')} strokeWidth="3" strokeLinecap="round" />
      <path d="M5 32.4h34" stroke={claro('l')} strokeOpacity=".7" strokeWidth="1" strokeLinecap="round" />
    </g>
  ),
  mochila: (u) => (
    <>
      <path d="M17.5 10.5a6.5 6.5 0 0 1 13 0" fill="none" stroke={medio('d')} strokeWidth="3" strokeLinecap="round" />
      <Volumen u={u} c="r" d={rect(9, 10, 30, 33.5, 9)} />
      {reflejo(u, 'M18 10h12a9 9 0 0 1 9 9H9a9 9 0 0 1 9-9Z')}
      <path d="M14 10v8M34 10v8" stroke={oscuro('r')} strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
      <g className="a-rebote">
        <Volumen u={u} c="n" d={rect(13.5, 26.5, 21, 13, 4)} />
        <path d="M19 31h10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </>
  ),
  campana: (u) => (
    <g className="a-campana">
      <circle cx="24" cy="6.5" r="3" fill="none" stroke={medio('y')} strokeWidth="2.4" />
      <Volumen u={u} c="y" d="M24 8.5a12.5 12.5 0 0 1 12.5 12.5v9l4 5.5H7.5l4-5.5v-9A12.5 12.5 0 0 1 24 8.5Z" />
      {reflejo(u, 'M16.5 14.5a9 9 0 0 1 9-4.5c-4.5 2-7.5 5-8 9.5Z')}
      <rect x="6.5" y="33.5" width="35" height="4" rx="2" fill={u('y')} />
      <circle cx="24" cy="40.5" r="4" fill={u('n')} />
    </g>
  ),
  vibrar: (u) => (
    <>
      <g className="a-vibrar">
        <Volumen u={u} c="d" d={rect(15, 4.5, 18, 39, 5)} />
        <rect x="17.5" y="9" width="13" height="27" rx="2" fill={u('a')} />
        {reflejo(u, 'M17.5 9h13v10Z')}
        <rect x="21" y="39" width="6" height="1.8" rx=".9" fill="#fff" fillOpacity=".7" />
      </g>
      <path d="M9 17v14M4.5 20.5v7M39 17v14M43.5 20.5v7" stroke={medio('t')} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  bateria: (u) => (
    <>
      <rect x="3.5" y="13.5" width="37" height="21" rx="6" fill="#fff" stroke={medio('d')} strokeWidth="2.5" />
      <rect x="41.5" y="19.5" width="4" height="9" rx="2" fill={medio('d')} />
      <rect className="a-cargar" x="7.5" y="17.5" width="29" height="13" rx="3" fill={u('v')} />
      {reflejo(u, 'M10.5 17.5h23a3 3 0 0 1 3 3v1h-29v-1a3 3 0 0 1 3-3Z')}
    </>
  ),
  chispas: (u) => (
    <>
      <path className="a-destello" d="M20 5c2 8.5 5 11.5 13.5 13.5C25 20.5 22 23.5 20 32c-2-8.5-5-11.5-13.5-13.5C15 16.5 18 13.5 20 5Z" fill={u('m')} />
      <path className="a-destello-2" d="M37 25.5c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8Z" fill={u('y')} />
      <path className="a-destello-3" d="M10 31.5c1 3 2 4 5 5-3 1-4 2-5 5-1-3-2-4-5-5 3-1 4-2 5-5Z" fill={u('a')} />
    </>
  ),
  celular: (u) => (
    <>
      <Volumen u={u} c="d" d={rect(12, 3, 24, 42, 6)} />
      <rect x="14.5" y="7.5" width="19" height="31" rx="2.5" fill={u('c')} />
      <rect x="20" y="4.6" width="8" height="1.6" rx=".8" fill="#0f172a" />
      <g className="a-bajar">
        <path d="M24 12v15" stroke={medio('v')} strokeWidth="3.4" strokeLinecap="round" />
        <path d="m18 21.5 6 6 6-6" fill="none" stroke={medio('v')} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M18.5 33h11" stroke={medio('v')} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="20" y="40.5" width="8" height="1.8" rx=".9" fill="#fff" fillOpacity=".6" />
    </>
  ),
  guardar: (u) => (
    <>
      <Volumen u={u} c="a" d="M9 5.5h25l8.5 8.5v24.5a4.5 4.5 0 0 1-4.5 4.5H10a4.5 4.5 0 0 1-4.5-4.5V9A3.5 3.5 0 0 1 9 5.5Z" />
      <path d="M13.5 5.5h18v11a1.5 1.5 0 0 1-1.5 1.5H15a1.5 1.5 0 0 1-1.5-1.5Z" fill={u('g')} />
      <rect x="25" y="8" width="4" height="7.5" rx="1" fill={medio('d')} />
      <g className="a-rebote">
        <rect x="11.5" y="24.5" width="25" height="14" rx="2.5" fill={u('c')} />
        <path d="M15.5 29h17M15.5 33.5h12" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </>
  ),
  carpeta: (u) => (
    <>
      <path d="M4 12a4 4 0 0 1 4-4h10.5l4 5H40a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" fill={oscuro('y')} />
      <rect className="a-asomar" x="10.5" y="13.5" width="27" height="17" rx="2" fill="#fff" stroke="#e2e8f0" strokeWidth=".8" />
      <Volumen u={u} c="y" d="M4 20.5a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3V38a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
      {reflejo(u, 'M7 17.5h34a3 3 0 0 1 3 3v3H4v-3a3 3 0 0 1 3-3Z')}
    </>
  ),
  personas: (u) => (
    <>
      <g className="a-saltito-2">
        <path d="M23 41a10 10 0 0 1 20 0Z" fill={u('t')} />
        <circle cx="33" cy="15" r="6" fill={u('p')} />
        <path d="M27 14a6 6 0 0 1 12 0c-2-1.6-4-2.4-6-2.4S29 12.4 27 14Z" fill={u('k')} />
      </g>
      <g className="a-saltito">
        <path d="M5 43a13 13 0 0 1 26 0Z" fill={u('a')} />
        <circle cx="18" cy="17" r="7.5" fill={u('p')} />
        <path d="M10.5 16a7.5 7.5 0 0 1 15-1c-3 .3-7-.7-9.5-3-1.5 2.2-3.3 3.4-5.5 4Z" fill={u('d')} />
        <circle cx="18" cy="17" r="7.5" fill={u('e')} />
      </g>
    </>
  ),
  ojo: (u) => (
    <>
      <path d="M3 24S11 10.5 24 10.5 45 24 45 24s-8 13.5-21 13.5S3 24 3 24Z" fill="#fff" stroke={medio('a')} strokeWidth="3" strokeLinejoin="round" />
      <g className="a-mirar">
        <circle cx="24" cy="24" r="8" fill={u('a')} />
        <circle cx="24" cy="24" r="3.8" fill="#0f172a" />
        <circle cx="26.3" cy="21.7" r="1.7" fill="#fff" />
      </g>
    </>
  ),
  carrito: (u) => (
    <g className="a-rodar">
      <path d="M3 8h6l5 23h24.5" fill="none" stroke={medio('d')} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="18.5" cy="12.5" r="5" fill={u('n')} />
      <circle cx="27" cy="11.5" r="4.5" fill={u('l')} />
      <Volumen u={u} c="v" d="M11.5 14.5h32a1 1 0 0 1 1 1.3L39.3 31H14.6Z" />
      <path d="M17 19h23M18 25h20" stroke="#fff" strokeOpacity=".45" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="17.5" cy="38" r="3.8" fill={u('d')} />
      <circle cx="35" cy="38" r="3.8" fill={u('d')} />
      <circle cx="17.5" cy="38" r="1.3" fill={claro('g')} />
      <circle cx="35" cy="38" r="1.3" fill={claro('g')} />
    </g>
  ),
  bus: (u) => (
    <g className="a-rodar">
      <Volumen u={u} c="y" d={rect(3.5, 8, 41, 28.5, 7)} />
      {reflejo(u, 'M10.5 8h27a7 7 0 0 1 7 7h-41a7 7 0 0 1 7-7Z')}
      <rect x="7.5" y="13.5" width="9.5" height="9" rx="2" fill={u('a')} />
      <rect x="19.5" y="13.5" width="9.5" height="9" rx="2" fill={u('a')} />
      <rect x="31.5" y="13.5" width="9" height="9" rx="2" fill={u('a')} />
      <path d="M3.5 27h41" stroke={oscuro('y')} strokeWidth="2" />
      <circle cx="40.5" cy="31" r="1.8" fill="#fff7cc" />
      <circle cx="14" cy="37" r="4.8" fill={u('d')} />
      <circle cx="34" cy="37" r="4.8" fill={u('d')} />
      <circle cx="14" cy="37" r="1.7" fill={claro('g')} />
      <circle cx="34" cy="37" r="1.7" fill={claro('g')} />
    </g>
  ),
  caja: (u) => (
    <>
      <path d="M6 15 24 23v20L6 35Z" fill={u('k')} />
      <path d="M42 15 24 23v20l18-8Z" fill={oscuro('k')} />
      <path d="M24 23v20" stroke="#fff" strokeOpacity=".25" strokeWidth="1" />
      <g className="a-tapa">
        <path d="M24 6.5 42 15l-18 8-18-8Z" fill={claro('k')} />
        <path d="m15 10.8 18 8" stroke={medio('k')} strokeOpacity=".8" strokeWidth="3.6" />
      </g>
      <path d="M33 18.8v8.4" stroke={medio('k')} strokeOpacity=".7" strokeWidth="3.6" />
    </>
  ),
  balanza: (u) => (
    <>
      <path d="M24 7v33" stroke={medio('d')} strokeWidth="3" strokeLinecap="round" />
      <path d="M14 43h20a2 2 0 0 0-2-3H16a2 2 0 0 0-2 3Z" fill={u('d')} />
      <g className="a-balanza">
        <path d="M7 14h34" stroke={medio('d')} strokeWidth="3" strokeLinecap="round" />
        <path d="M7 14 2 26M7 14l5 12M41 14l-5 12M41 14l5 12" stroke={medio('g')} strokeWidth="1.3" />
        <path d="M.5 26a6.5 4.5 0 0 0 13 0Z" fill={u('y')} />
        <path d="M34.5 26a6.5 4.5 0 0 0 13 0Z" fill={u('a')} />
      </g>
      <circle cx="24" cy="7" r="3.2" fill={u('y')} />
    </>
  ),
  escalera: (u) => (
    <>
      {[10, 18, 26, 34].map((y, k) => (
        <path key={y} className="a-escalon" style={{ animationDelay: `${k * 0.1}s` }} d={`M14 ${y}h20`} stroke={medio('n')} strokeWidth="3.6" strokeLinecap="round" />
      ))}
      <rect x="10.5" y="3.5" width="5" height="41" rx="2.5" fill={u('k')} />
      <rect x="32.5" y="3.5" width="5" height="41" rx="2.5" fill={u('k')} />
      <path d="M12 6v36M34 6v36" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  grafico: (u) => (
    <>
      <Volumen u={u} c="c" d={rect(4, 4, 40, 40, 10)} borde="#e2e8f0" />
      <path d="M10 38.5h28" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
      <rect className="a-barra" x="11" y="26" width="7" height="12" rx="2" fill={u('a')} />
      <rect className="a-barra" style={{ animationDelay: '.12s' }} x="21" y="18.5" width="7" height="19.5" rx="2" fill={u('t')} />
      <rect className="a-barra" style={{ animationDelay: '.24s' }} x="31" y="11" width="7" height="27" rx="2" fill={u('v')} />
      <path className="a-trazo" d="M10 21l9-6 7 3 11-9" fill="none" stroke={medio('n')} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" pathLength={60} strokeDasharray="60" />
    </>
  ),
  etiqueta: (u) => (
    <g className="a-balanceo">
      <path d="M14 13.5C10 8 6 6 3 7" stroke={medio('k')} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <Volumen u={u} c="n" d="M7 10a4 4 0 0 1 4-4h12.6a4 4 0 0 1 2.8 1.2l15.4 15.4a2 2 0 0 1 0 2.8L27.2 40a2 2 0 0 1-2.8 0L8.2 23.8A4 4 0 0 1 7 21Z" />
      {reflejo(u, 'M11 6h12.6a4 4 0 0 1 2.8 1.2L30 11H7v-1a4 4 0 0 1 4-4Z')}
      <circle cx="14.5" cy="13.5" r="3.3" fill="#fff" />
      <path d="M21 26h11M24.5 31.5h5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" transform="rotate(45 26 28)" />
    </g>
  ),
  mano: (u) => (
    <g className="a-saludo">
      <Volumen
        u={u}
        c="p"
        d="M16 25V10.5a3 3 0 0 1 6 0V22 7.5a3 3 0 0 1 6 0V22 9.5a3 3 0 0 1 6 0V26l2.3-5.2a3 3 0 0 1 5.5 2.4L36 36.5A10 10 0 0 1 27 43h-3a10 10 0 0 1-10-10v-8a2.2 2.2 0 0 1 2 0Z"
        borde={oscuro('p')}
      />
      {reflejo(u, 'M17 10a2 2 0 0 1 4 0v6.5c-2-1-3.2-3.2-4-6.5Z')}
      <path d="M8 9.5c-2 2-3 4.5-3 7M43 9.5c2 2 3 4.5 3 7" stroke={medio('t')} strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  ),
  dinero: (u) => (
    <g className="a-balanceo">
      <rect x="6" y="9" width="40" height="24" rx="5" fill={oscuro('v')} transform="rotate(-6 26 21)" />
      <Volumen u={u} c="v" d={rect(3, 13, 40, 24, 5)} />
      <rect x="7" y="17" width="32" height="16" rx="3" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" />
      <circle cx="23" cy="25" r="6.3" fill="#fff" fillOpacity=".9" />
      <text x="23" y="29.6" textAnchor="middle" fontSize="11.5" fontWeight="900" fill={oscuro('v')} fontFamily="system-ui, sans-serif">
        $
      </text>
      {reflejo(u, 'M8 13h30a5 5 0 0 1 5 5H3a5 5 0 0 1 5-5Z')}
    </g>
  ),
  video: (u) => (
    <g className="a-latir">
      <Volumen u={u} c="r" d={rect(3, 9, 42, 30, 9)} />
      {reflejo(u, 'M12 9h24a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z')}
      <path d="M20 17.5v13l11-6.5Z" fill="#fff" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
    </g>
  ),
  cerrar: () => <path d="M14 14l20 20M34 14 14 34" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />,
  // Íconos de los menús del navegador, tal como se ven en Safari y Chrome.
  compartir: () => (
    <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 19h-5v24h24V19h-5M24 5v24M17 12l7-7 7 7" />
    </g>
  ),
  agregar: () => (
    <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
      <rect x="7" y="7" width="34" height="34" rx="9" />
      <path d="M24 16v16M16 24h16" />
    </g>
  ),
  puntos: () => (
    <g fill="currentColor">
      <circle cx="24" cy="10" r="4" />
      <circle cx="24" cy="24" r="4" />
      <circle cx="24" cy="38" r="4" />
    </g>
  ),
  atras: () => <path d="M30 10 16 24l14 14" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />,
  siguiente: () => (
    <g className="a-empujar">
      <path d="M10 24h26M26 13l11 11-11 11" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  'jugar-simple': () => <path d="M15 10v28l23-14Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />,
  equis: (u) => (
    <>
      <Volumen u={u} c="r" d={circulo(24, 24, 20)} />
      {reflejo(u, 'M8 20a16 16 0 0 1 32 0c-8-4-24-4-32 0Z')}
      <path d="M17 17l14 14M31 17 17 31" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </>
  ),
  aviso: (u) => (
    <g className="a-latir">
      <path d="M21.4 6.5a3 3 0 0 1 5.2 0l17.8 31a3 3 0 0 1-2.6 4.5H6.2a3 3 0 0 1-2.6-4.5Z" fill={u('y')} />
      <path d="M21.4 6.5a3 3 0 0 1 5.2 0l17.8 31a3 3 0 0 1-2.6 4.5H6.2a3 3 0 0 1-2.6-4.5Z" fill={u('s')} />
      {reflejo(u, 'M21.4 6.5a3 3 0 0 1 5.2 0L33 17.5H15Z')}
      <path d="M24 17.5v11" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="35" r="2.5" fill="#78350f" />
    </g>
  ),
  grado: (u) => (
    <>
      <Volumen u={u} c="m" d="M12 22.5v9.5c0 4 5.5 7 12 7s12-3 12-7v-9.5l-12 6Z" />
      <path d="M24 7.5 45 18 24 28.5 3 18Z" fill={u('d')} />
      {reflejo(u, 'M24 7.5 45 18l-5 2.5L24 12.5 8 20.5 3 18Z')}
      <g className="a-balanceo">
        <path d="M24 18 40.5 21v10" stroke={medio('y')} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M38.5 30.5h4l1 6h-6Z" fill={u('y')} />
      </g>
      <circle cx="24" cy="18" r="2" fill={u('y')} />
    </>
  ),
};

function Operador({ u, c, d, children }: { u: U; c: string; d: string; children?: ReactElement[] }) {
  return (
    <g className="a-latir">
      <Volumen u={u} c={c} d={rect(5, 5, 38, 38, 12)} />
      {reflejo(u, 'M17 5h14a12 12 0 0 1 12 12H5A12 12 0 0 1 17 5Z')}
      <g transform="translate(.6 1)" opacity=".25">
        <path d={d} stroke="#0b1a12" strokeWidth="5" strokeLinecap="round" />
      </g>
      <path d={d} stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {children}
    </g>
  );
}

/** Objetos de la finca (mismos dibujos de los ejercicios) con animación de balanceo. */
const objetos: Record<string, Objeto> = {
  huevo: 'huevo',
  mazorca: 'mazorca',
  naranja: 'naranja',
  canasta: 'canasta',
  arbol: 'arbol',
  gallina: 'gallina',
  moneda: 'moneda',
  arepa: 'arepa',
  aguacate: 'aguacate',
  cafe: 'cafe',
  platano: 'platano',
  limon: 'limon',
  mandarina: 'mandarina',
  bulto: 'bulto',
};

export type NombreIcono = keyof typeof iconos | keyof typeof objetos;

/** Lista de todos los iconos (catálogo y pruebas). */
export const NOMBRES_ICONOS = [...Object.keys(iconos), ...Object.keys(objetos)];

type Props = {
  nombre: NombreIcono | string;
  tamano?: number;
  anim?: 'una' | 'siempre' | 'no';
  /** Texto para lectores de pantalla; sin él, el ícono es decorativo. */
  etiqueta?: string;
  className?: string;
};

/** Iconos de línea: toman el color del texto y no llevan relieve. */
const DE_LINEA = new Set(['cerrar', 'compartir', 'agregar', 'puntos', 'atras', 'siguiente', 'jugar-simple', 'corazon-vacio']);

export default function Icono({ nombre, tamano = 28, anim = 'una', etiqueta, className = '' }: Props) {
  const { id, u, usados } = useDegradados();
  const accesible = etiqueta ? { role: 'img', 'aria-label': etiqueta } : { 'aria-hidden': true };
  // Relieve (sombra proyectada) solo en tamaños grandes: en los pequeños ensucia el contorno.
  const relieve = DE_LINEA.has(nombre) ? 'de-linea' : tamano >= 40 ? 'con-relieve' : '';
  const clase = `icono anim-${anim} ${relieve} ${className}`;

  if (nombre in objetos) {
    return (
      <span className={`${clase} icono-objeto`} style={{ width: tamano, height: tamano }} {...accesible}>
        <span className="a-balanceo">
          <DibujoObjeto objeto={objetos[nombre]} tamano={tamano} etiqueta="" />
        </span>
      </span>
    );
  }
  const dibujo = iconos[nombre];
  if (!dibujo) return null;
  return (
    <svg className={clase} width={tamano} height={tamano} viewBox="0 0 48 48" focusable="false" {...accesible}>
      {dibujo(u)}
      {!DE_LINEA.has(nombre) && <Degradados id={id} usados={usados} />}
    </svg>
  );
}

/** Íconos para los emojis que vienen en los datos (lecciones, insignias, datos curiosos). */
const desdeEmoji: Record<string, NombreIcono> = {
  '🏆': 'trofeo',
  '👋': 'mano',
  '➗': 'entre',
  '✖️': 'por',
  '✖': 'por',
  '➕': 'mas',
  '➖': 'menos',
  '🍫': 'mazorca',
  '0️⃣': 'cero',
  '🥚': 'huevo',
  '🤝': 'pareja',
  '🛒': 'carrito',
  '🚌': 'bus',
  '🔢': 'numeros',
  '🔟': 'numeros',
  '📦': 'caja',
  '📒': 'cuaderno',
  '📊': 'grafico',
  '💵': 'dinero',
  '🐔': 'gallina',
  '🏷️': 'etiqueta',
  '🏷': 'etiqueta',
  '🍊': 'naranja',
  '🌳': 'arbol',
  '🌱': 'brote',
  '⚖️': 'balanza',
  '⚖': 'balanza',
  '🧺': 'canasta',
  '🪙': 'moneda',
  '🪜': 'escalera',
  '🧠': 'dato',
  '✅': 'check',
  '🥖': 'arepa',
  '🎯': 'diana',
  '🧭': 'brujula',
  '🐢': 'tortuga',
  '⭐': 'estrella',
  '📅': 'calendario',
  '💡': 'bombillo',
  '🧮': 'numeros',
  '🔁': 'repetir',
  '📖': 'libro',
  '🍋': 'limon',
  '🥑': 'aguacate',
  '🍌': 'platano',
  '☕': 'cafe',
};

export function iconoDeEmoji(emoji: string): NombreIcono | null {
  return desdeEmoji[emoji] ?? desdeEmoji[emoji.replace(/️/g, '')] ?? null;
}

/** Muestra el ícono que corresponde a un emoji de los datos; si no hay, el emoji. */
export function IconoEmoji({ emoji, tamano = 28, anim = 'una' }: { emoji: string; tamano?: number; anim?: Props['anim'] }) {
  const n = iconoDeEmoji(emoji);
  return n ? (
    <Icono nombre={n} tamano={tamano} anim={anim} />
  ) : (
    <span aria-hidden="true" style={{ fontSize: tamano * 0.8 }}>
      {emoji}
    </span>
  );
}
