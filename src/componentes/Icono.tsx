// Paquete de iconos animados propio (SVG en línea, sin archivos ni red): formas con degradado,
// reflejo de vidrio y una animación por ícono (rebote, giro, latido, trazo, ondas…).
// anim="una" (por defecto) anima al aparecer y al soltar un botón; "siempre" en bucle; "no" quieto.

import { useId, type ReactElement } from 'react';
import type { Objeto } from '../juego/tipos';
import { DibujoObjeto } from './Ilustraciones';

const DEGRADADOS: Record<string, [string, string]> = {
  v: ['#86efac', '#059669'],
  n: ['#fed7aa', '#ea580c'],
  a: ['#bae6fd', '#2563eb'],
  m: ['#e9d5ff', '#7c3aed'],
  y: ['#fef08a', '#f59e0b'],
  r: ['#fecdd3', '#e11d48'],
  k: ['#e7b98a', '#7a4a24'],
  g: ['#f3f4f6', '#9ca3af'],
  t: ['#99f6e4', '#0d9488'],
  c: ['#ffffff', '#fde9c4'],
};

type U = (k: string) => string;

/** Reflejo de vidrio en la parte de arriba de una forma. */
const reflejo = (u: U, d: string) => <path d={d} fill={u('b')} />;

const iconos: Record<string, (u: U) => ReactElement> = {
  casa: (u) => (
    <>
      <g className="a-humo">
        <circle cx="34" cy="8" r="2.4" fill="#e5e7eb" />
        <circle cx="36.5" cy="4.5" r="1.8" fill="#f3f4f6" />
      </g>
      <rect x="31" y="10" width="5" height="9" rx="1.5" fill={u('k')} />
      <path d="M8 24 24 10l16 14v15a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Z" fill={u('c')} stroke="#e8c48f" strokeWidth="1" />
      <path d="M4 25 24 8l20 17" fill="none" stroke={u('n')} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="29" width="8" height="13" rx="2" fill={u('v')} />
      <rect x="12" y="27" width="6" height="6" rx="1.5" fill={u('a')} />
      <rect x="30" y="27" width="6" height="6" rx="1.5" fill={u('a')} />
    </>
  ),
  mapa: (u) => (
    <>
      <path d="M5 12 17 7l14 5 12-5v29l-12 5-14-5-12 5Z" fill={u('t')} />
      <path d="M17 7v29M31 12v29" stroke="#ffffff" strokeOpacity=".5" strokeWidth="1.5" />
      <path className="a-trazo" d="M10 34c4-6 8-2 12-8s9-5 12-10" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 4" pathLength={60} />
      <g className="a-rebote">
        <path d="M34 4a6 6 0 0 1 6 6c0 5-6 11-6 11s-6-6-6-11a6 6 0 0 1 6-6Z" fill={u('r')} />
        <circle cx="34" cy="10" r="2.2" fill="#fff" />
      </g>
    </>
  ),
  libro: (u) => (
    <>
      <path d="M24 12C19 8 11 8 5 10v27c6-2 14-2 19 2Z" fill={u('a')} />
      <path d="M24 12c5-4 13-4 19-2v27c-6-2-14-2-19 2Z" fill={u('m')} />
      <g className="a-pagina">
        <path d="M24 13c4-3 10-3 15-2v22c-5-1-11-1-15 2Z" fill="#fff" />
        <path d="M28 18h7M28 22h7M28 26h5" stroke="#c4b5fd" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <path d="M9 18h9M9 22h9M9 26h7" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  cuaderno: (u) => (
    <>
      <rect x="9" y="5" width="28" height="38" rx="4" fill={u('a')} />
      {reflejo(u, 'M13 5h20a4 4 0 0 1 4 4v6H9V9a4 4 0 0 1 4-4Z')}
      {[11, 17, 23, 29, 35].map((y) => (
        <rect key={y} x="6" y={y} width="7" height="2.6" rx="1.3" fill="#64748b" />
      ))}
      <path d="M17 16h14M17 22h14M17 28h9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <g className="a-escribir">
        <path d="m34 30 8-8 3 3-8 8-4 1Z" fill={u('y')} />
        <path d="m42 22 3 3" stroke={u('r')} strokeWidth="2" />
      </g>
    </>
  ),
  engrane: (u) => (
    <g className="a-girar">
      <path
        d="M21 4h6l1 5 4 2 4-3 4 4-3 4 2 4 5 1v6l-5 1-2 4 3 4-4 4-4-3-4 2-1 5h-6l-1-5-4-2-4 3-4-4 3-4-2-4-5-1v-6l5-1 2-4-3-4 4-4 4 3 4-2Z"
        fill={u('g')}
        stroke="#6b7280"
        strokeWidth="1"
      />
      <circle cx="24" cy="24" r="7" fill="#fff" />
      <circle cx="24" cy="24" r="4" fill={u('a')} />
    </g>
  ),
  brote: (u) => (
    <>
      <ellipse cx="24" cy="41" rx="14" ry="4" fill={u('k')} />
      <g className="a-crecer">
        <path d="M24 40V22" stroke={u('v')} strokeWidth="3.5" strokeLinecap="round" />
        <path className="a-balanceo" d="M24 26c-2-9-9-12-17-11 1 8 7 13 17 11Z" fill={u('v')} />
        <path className="a-balanceo-inv" d="M24 22c1-9 8-14 17-14-1 9-7 15-17 14Z" fill={u('t')} />
      </g>
    </>
  ),
  estrella: (u) => (
    <g className="a-latir">
      <path d="m24 4 6 12.5 13.5 2-9.8 9.4 2.4 13.4L24 35l-12.1 6.3 2.4-13.4-9.8-9.4 13.5-2Z" fill={u('y')} stroke="#f59e0b" strokeWidth="1" strokeLinejoin="round" />
      {reflejo(u, 'M24 7 29 17l-10 2Z')}
      <circle className="a-destello" cx="38" cy="8" r="2" fill="#fff7cc" />
    </g>
  ),
  candado: (u) => (
    <>
      <path className="a-candado" d="M15 22v-6a9 9 0 0 1 18 0v6" fill="none" stroke={u('g')} strokeWidth="5" strokeLinecap="round" />
      <rect x="9" y="21" width="30" height="22" rx="6" fill={u('y')} />
      {reflejo(u, 'M15 21h18a6 6 0 0 1 6 6H9a6 6 0 0 1 6-6Z')}
      <circle cx="24" cy="31" r="3" fill="#92400e" />
      <path d="M24 32v5" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  jugar: (u) => (
    <g className="a-latir">
      <circle cx="24" cy="24" r="20" fill={u('v')} />
      {reflejo(u, 'M8 20a16 16 0 0 1 32 0c-8-4-24-4-32 0Z')}
      <path d="M19 15v18l15-9Z" fill="#fff" strokeLinejoin="round" stroke="#fff" strokeWidth="2" />
    </g>
  ),
  altavoz: (u) => (
    <>
      <path d="M6 18h8l11-9v30l-11-9H6a2 2 0 0 1-2-2V20a2 2 0 0 1 2-2Z" fill={u('a')} />
      {reflejo(u, 'M14 18 25 9v6Z')}
      <path className="a-onda1" d="M31 18a8 8 0 0 1 0 12" fill="none" stroke={u('t')} strokeWidth="3.5" strokeLinecap="round" />
      <path className="a-onda2" d="M36 13a15 15 0 0 1 0 22" fill="none" stroke={u('t')} strokeWidth="3.5" strokeLinecap="round" />
      <path className="a-onda3" d="M41 8a22 22 0 0 1 0 32" fill="none" stroke={u('t')} strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  bombillo: (u) => (
    <>
      <circle className="a-halo" cx="24" cy="19" r="17" fill="#fde68a" opacity=".45" />
      <path d="M24 4a14 14 0 0 1 8 25.5V33H16v-3.5A14 14 0 0 1 24 4Z" fill={u('y')} />
      {reflejo(u, 'M17 10a10 10 0 0 1 9-3c-5 2-8 5-9 10Z')}
      <path d="M20 22l4 4 4-4M24 26v7" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="16" y="34" width="16" height="4" rx="2" fill={u('g')} />
      <rect x="18" y="39" width="12" height="4" rx="2" fill={u('g')} />
    </>
  ),
  solucion: (u) => (
    <>
      <rect x="8" y="7" width="32" height="37" rx="5" fill={u('a')} />
      <rect x="12" y="11" width="24" height="29" rx="3" fill="#fff" />
      <rect x="17" y="4" width="14" height="7" rx="3" fill={u('g')} />
      <path className="a-trazo" d="m16 26 6 6 11-12" fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={60} strokeDasharray="60" />
    </>
  ),
  repetir: (u) => (
    <g className="a-girar-una">
      <path d="M38 20A15 15 0 0 0 11 15" fill="none" stroke={u('v')} strokeWidth="5" strokeLinecap="round" />
      <path d="m6 9 5 8 8-4" fill="none" stroke={u('v')} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 28a15 15 0 0 0 27 5" fill="none" stroke={u('t')} strokeWidth="5" strokeLinecap="round" />
      <path d="m42 39-5-8-8 4" fill="none" stroke={u('t')} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  diana: (u) => (
    <>
      <circle cx="22" cy="26" r="18" fill={u('r')} />
      <circle cx="22" cy="26" r="12.5" fill="#fff" />
      <circle cx="22" cy="26" r="7.5" fill={u('r')} />
      <circle cx="22" cy="26" r="3" fill="#fff" />
      <g className="a-flecha">
        <path d="M22 26 42 6" stroke="#7a4a24" strokeWidth="3" strokeLinecap="round" />
        <path d="m36 4 6 2 2 6-5-1-1-5Z" fill={u('y')} />
      </g>
    </>
  ),
  dato: (u) => (
    <>
      <path d="M8 6h32a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5H22l-9 8v-8H8a5 5 0 0 1-5-5V11a5 5 0 0 1 5-5Z" fill={u('m')} />
      {reflejo(u, 'M8 6h32a5 5 0 0 1 5 5v3H3v-3a5 5 0 0 1 5-5Z')}
      <g className="a-rebote">
        <path d="M19 15a5 5 0 1 1 7 4.6c-1.4.6-2 1.4-2 2.9" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="24" cy="28" r="2.2" fill="#fff" />
      </g>
    </>
  ),
  medalla: (u) => (
    <g className="a-pendulo">
      <path d="M14 3h8l4 16h-8ZM34 3h-8l-4 16h8Z" fill={u('a')} />
      <circle cx="24" cy="31" r="13" fill={u('y')} stroke="#d97706" strokeWidth="1.5" />
      <circle cx="24" cy="31" r="8.5" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.5" />
      <path d="m24 25 2 4 4.4.6-3.2 3 .8 4.4L24 35l-4 2 .8-4.4-3.2-3 4.4-.6Z" fill="#fff" />
    </g>
  ),
  trofeo: (u) => (
    <>
      <path d="M12 8H5v4a8 8 0 0 0 8 8M36 8h7v4a8 8 0 0 1-8 8" fill="none" stroke={u('y')} strokeWidth="3.5" />
      <path d="M12 5h24v10a12 12 0 0 1-24 0Z" fill={u('y')} />
      <rect x="21" y="26" width="6" height="8" fill="#d97706" />
      <rect x="14" y="34" width="20" height="8" rx="3" fill={u('k')} />
      <clipPath id={u('clip').slice(4, -1)}>
        <path d="M12 5h24v10a12 12 0 0 1-24 0Z" />
      </clipPath>
      <rect className="a-barrido" x="8" y="0" width="7" height="30" fill="#fff" opacity=".6" transform="skewX(-20)" clipPath={u('clip')} />
    </>
  ),
  silo: (u) => (
    <>
      <path d="M10 18a14 12 0 0 1 28 0v24H10Z" fill={u('a')} />
      {reflejo(u, 'M12 16a12 10 0 0 1 24 0Z')}
      <rect x="13" y="22" width="22" height="18" rx="2" fill="#fff" fillOpacity=".35" />
      <rect className="a-llenar" x="13" y="22" width="22" height="18" rx="2" fill={u('y')} />
      <path d="M10 26h28M10 34h28" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
    </>
  ),
  pareja: (u) => (
    <>
      <g className="a-saltito">
        <circle cx="15" cy="14" r="7" fill={u('n')} />
        <path d="M3 42a12 12 0 0 1 24 0Z" fill={u('v')} />
      </g>
      <g className="a-saltito-2">
        <circle cx="33" cy="14" r="7" fill={u('k')} />
        <path d="M21 42a12 12 0 0 1 24 0Z" fill={u('a')} />
      </g>
      <path d="M20 33h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  corazon: (u) => (
    <g className="a-latir">
      <path d="M24 42S5 30 5 17A10 10 0 0 1 24 12a10 10 0 0 1 19 5c0 13-19 25-19 25Z" fill={u('r')} />
      {reflejo(u, 'M10 13a6 6 0 0 1 8-1c-4 1-6 3-7 7Z')}
    </g>
  ),
  'corazon-vacio': () => <path d="M24 40S6 29 6 17A9 9 0 0 1 24 13a9 9 0 0 1 18 4c0 12-18 23-18 23Z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />,
  fiesta: (u) => (
    <>
      <path d="M6 43 15 15l18 18Z" fill={u('m')} />
      <path d="m9 34 4 4M12 25l10 10" stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" />
      <g className="a-confeti">
        <circle cx="30" cy="8" r="2.5" fill="#f43f5e" />
        <circle cx="41" cy="16" r="2.5" fill="#22c55e" />
        <rect x="35" y="25" width="5" height="3" rx="1" fill="#f59e0b" transform="rotate(30 37 26)" />
        <rect x="22" y="5" width="5" height="3" rx="1" fill="#3b82f6" transform="rotate(-30 24 6)" />
        <path d="M27 18c4-2 4-6 9-7" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </>
  ),
  check: (u) => (
    <>
      <circle cx="24" cy="24" r="20" fill={u('v')} />
      {reflejo(u, 'M8 20a16 16 0 0 1 32 0c-8-4-24-4-32 0Z')}
      <path className="a-trazo" d="m14 25 7 7 14-15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={60} strokeDasharray="60" />
    </>
  ),
  pensar: (u) => (
    <>
      <path d="M10 8h28a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H18l-8 7v-7a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Z" fill={u('y')} />
      {reflejo(u, 'M10 8h28a6 6 0 0 1 6 6v2H4v-2a6 6 0 0 1 6-6Z')}
      <circle className="a-punto1" cx="15" cy="20" r="3" fill="#92400e" />
      <circle className="a-punto2" cx="24" cy="20" r="3" fill="#92400e" />
      <circle className="a-punto3" cx="33" cy="20" r="3" fill="#92400e" />
    </>
  ),
  numeros: (u) => (
    <>
      <rect x="4" y="6" width="40" height="36" rx="9" fill={u('a')} />
      {reflejo(u, 'M13 6h22a9 9 0 0 1 9 9H4a9 9 0 0 1 9-9Z')}
      <g className="a-rebote" fill="#fff" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" textAnchor="middle">
        <text x="14" y="30">1</text>
        <text x="24" y="30">2</text>
        <text x="34" y="30">3</text>
      </g>
    </>
  ),
  cero: (u) => (
    <>
      <rect x="6" y="6" width="36" height="36" rx="10" fill={u('m')} />
      {reflejo(u, 'M16 6h16a10 10 0 0 1 10 10H6A10 10 0 0 1 16 6Z')}
      <ellipse className="a-latir" cx="24" cy="24" rx="7.5" ry="10" fill="none" stroke="#fff" strokeWidth="4.5" />
    </>
  ),
  mas: (u) => <Operador u={u} c="v" d="M24 14v20M14 24h20" />,
  menos: (u) => <Operador u={u} c="n" d="M14 24h20" />,
  por: (u) => <Operador u={u} c="m" d="m16 16 16 16M32 16 16 32" />,
  entre: (u) => (
    <Operador u={u} c="a" d="M14 24h20">
      <circle cx="24" cy="16" r="2.8" fill="#fff" />
      <circle cx="24" cy="32" r="2.8" fill="#fff" />
    </Operador>
  ),
  calendario: (u) => (
    <>
      <rect x="6" y="9" width="36" height="34" rx="6" fill="#fff" stroke="#e5e7eb" />
      <path d="M12 9h24a6 6 0 0 1 6 6v4H6v-4a6 6 0 0 1 6-6Z" fill={u('r')} />
      <rect x="14" y="4" width="4" height="9" rx="2" fill="#64748b" />
      <rect x="30" y="4" width="4" height="9" rx="2" fill="#64748b" />
      {[0, 1, 2, 3].map((k) => (
        <circle key={k} cx={13 + k * 7.3} cy="28" r="2.3" fill={k < 3 ? '#22c55e' : '#e5e7eb'} />
      ))}
      <path className="a-trazo" d="m33 34 3 3 5-6" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" pathLength={60} strokeDasharray="60" />
    </>
  ),
  brujula: (u) => (
    <>
      <circle cx="24" cy="24" r="20" fill={u('t')} />
      <circle cx="24" cy="24" r="15" fill="#fff" />
      <g className="a-aguja">
        <path d="m24 11 4 13h-8Z" fill="#ef4444" />
        <path d="m24 37-4-13h8Z" fill="#94a3b8" />
      </g>
      <circle cx="24" cy="24" r="2.5" fill="#334155" />
    </>
  ),
  tortuga: (u) => (
    <g className="a-caminar">
      <ellipse cx="39" cy="28" rx="6" ry="5" fill={u('v')} />
      <circle cx="41" cy="27" r="1.2" fill="#14532d" />
      <path d="M9 34h4v5h-4ZM30 34h4v5h-4Z" fill={u('v')} />
      <path d="M5 34a17 15 0 0 1 32 0Z" fill={u('k')} />
      <path d="M13 34l3-9h10l3 9M16 25l5-6 5 6" fill="none" stroke="#fde68a" strokeWidth="1.6" />
      {reflejo(u, 'M10 26a14 12 0 0 1 18-7c-8 1-13 4-18 7Z')}
    </g>
  ),
  mochila: (u) => (
    <>
      <path d="M17 10a7 7 0 0 1 14 0" fill="none" stroke="#475569" strokeWidth="3" />
      <rect x="9" y="10" width="30" height="33" rx="9" fill={u('r')} />
      {reflejo(u, 'M18 10h12a9 9 0 0 1 9 9H9a9 9 0 0 1 9-9Z')}
      <rect className="a-rebote" x="14" y="27" width="20" height="12" rx="4" fill={u('n')} />
      <path d="M19 31h10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  campana: (u) => (
    <g className="a-campana">
      <path d="M24 5a3 3 0 0 1 3 3v1a12 12 0 0 1 9 12v9l4 5H8l4-5v-9a12 12 0 0 1 9-12V8a3 3 0 0 1 3-3Z" fill={u('y')} />
      {reflejo(u, 'M17 14a9 9 0 0 1 9-4c-4 2-7 5-8 9Z')}
      <circle cx="24" cy="40" r="4" fill={u('n')} />
    </g>
  ),
  vibrar: (u) => (
    <>
      <g className="a-vibrar">
        <rect x="15" y="5" width="18" height="38" rx="5" fill={u('a')} />
        <rect x="18" y="10" width="12" height="25" rx="2" fill="#fff" fillOpacity=".85" />
      </g>
      <path d="M8 17v14M4 20v8M40 17v14M44 20v8" stroke={u('t')} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  bateria: (u) => (
    <>
      <rect x="4" y="14" width="36" height="20" rx="6" fill="#fff" stroke="#94a3b8" strokeWidth="2.5" />
      <rect x="41" y="20" width="4" height="8" rx="2" fill="#94a3b8" />
      <rect className="a-cargar" x="8" y="18" width="28" height="12" rx="3" fill={u('v')} />
    </>
  ),
  chispas: (u) => (
    <>
      <path className="a-destello" d="M20 6c2 8 5 11 13 13-8 2-11 5-13 13-2-8-5-11-13-13 8-2 11-5 13-13Z" fill={u('m')} />
      <path className="a-destello-2" d="M37 26c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8Z" fill={u('y')} />
      <path className="a-destello-3" d="M10 32c1 3 2 4 5 5-3 1-4 2-5 5-1-3-2-4-5-5 3-1 4-2 5-5Z" fill={u('a')} />
    </>
  ),
  celular: (u) => (
    <>
      <rect x="12" y="3" width="24" height="42" rx="6" fill={u('g')} />
      <rect x="15" y="8" width="18" height="30" rx="2" fill="#fff" />
      <g className="a-bajar">
        <path d="M24 12v15" stroke={u('v')} strokeWidth="3.5" strokeLinecap="round" />
        <path d="m18 22 6 6 6-6" fill="none" stroke={u('v')} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect x="20" y="40" width="8" height="2" rx="1" fill="#fff" />
    </>
  ),
  guardar: (u) => (
    <>
      <path d="M8 6h26l8 8v24a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2Z" fill={u('a')} />
      <rect x="14" y="6" width="17" height="11" rx="1.5" fill="#fff" />
      <rect x="25" y="8" width="4" height="7" rx="1" fill={u('a')} />
      <rect className="a-rebote" x="12" y="25" width="24" height="13" rx="2" fill="#fff" fillOpacity=".9" />
    </>
  ),
  carpeta: (u) => (
    <>
      <path d="M4 12a4 4 0 0 1 4-4h10l4 5h18a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" fill={u('y')} />
      <rect className="a-asomar" x="11" y="14" width="26" height="16" rx="2" fill="#fff" />
      <path d="M4 20h40v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" fill={u('n')} />
    </>
  ),
  personas: (u) => (
    <>
      <g className="a-saltito-2" opacity=".85">
        <circle cx="33" cy="15" r="6" fill={u('t')} />
        <path d="M23 40a10 10 0 0 1 20 0Z" fill={u('t')} />
      </g>
      <g className="a-saltito">
        <circle cx="18" cy="17" r="7" fill={u('a')} />
        <path d="M5 43a13 13 0 0 1 26 0Z" fill={u('a')} />
      </g>
    </>
  ),
  ojo: (u) => (
    <>
      <path d="M3 24S11 11 24 11s21 13 21 13-8 13-21 13S3 24 3 24Z" fill="#fff" stroke={u('a')} strokeWidth="3" />
      <g className="a-mirar">
        <circle cx="24" cy="24" r="7.5" fill={u('a')} />
        <circle cx="24" cy="24" r="3.5" fill="#0f172a" />
        <circle cx="26" cy="22" r="1.5" fill="#fff" />
      </g>
    </>
  ),
  carrito: (u) => (
    <g className="a-rodar">
      <path d="M3 8h6l5 23h24l5-17H12" fill="none" stroke="#475569" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12 14h31l-5 17H14Z" fill={u('v')} />
      <circle cx="17" cy="38" r="3.5" fill="#334155" />
      <circle cx="35" cy="38" r="3.5" fill="#334155" />
      <circle cx="24" cy="12" r="5" fill={u('n')} />
    </g>
  ),
  bus: (u) => (
    <g className="a-rodar">
      <rect x="4" y="8" width="40" height="28" rx="7" fill={u('y')} />
      {reflejo(u, 'M11 8h26a7 7 0 0 1 7 7H4a7 7 0 0 1 7-7Z')}
      <rect x="8" y="14" width="9" height="9" rx="2" fill={u('a')} />
      <rect x="20" y="14" width="9" height="9" rx="2" fill={u('a')} />
      <rect x="32" y="14" width="8" height="9" rx="2" fill={u('a')} />
      <circle cx="14" cy="37" r="4.5" fill="#334155" />
      <circle cx="34" cy="37" r="4.5" fill="#334155" />
    </g>
  ),
  caja: (u) => (
    <>
      <path d="M24 6 42 14v20l-18 8-18-8V14Z" fill={u('k')} />
      <path d="M6 14l18 8 18-8" fill="none" stroke="#fde68a" strokeOpacity=".6" strokeWidth="1.5" />
      <path d="M24 22v20" stroke="#5b3417" strokeOpacity=".5" strokeWidth="1.5" />
      <path className="a-tapa" d="M24 6 42 14l-18 8-18-8Z" fill={u('n')} />
    </>
  ),
  balanza: (u) => (
    <>
      <path d="M24 6v34M14 42h20" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <g className="a-balanza">
        <path d="M7 14h34" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <path d="M7 14 2 26h10ZM41 14l-5 12h10Z" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M1 26a6 4 0 0 0 12 0Z" fill={u('y')} />
        <path d="M35 26a6 4 0 0 0 12 0Z" fill={u('a')} />
      </g>
      <circle cx="24" cy="7" r="3" fill={u('y')} />
    </>
  ),
  escalera: (u) => (
    <>
      <path d="M13 4v40M33 4v40" stroke={u('k')} strokeWidth="4" strokeLinecap="round" />
      {[10, 18, 26, 34, 42].map((y, k) => (
        <path key={y} className="a-escalon" style={{ animationDelay: `${k * 0.1}s` }} d={`M13 ${y - 2}h20`} stroke={u('n')} strokeWidth="3.5" strokeLinecap="round" />
      ))}
    </>
  ),
  grafico: (u) => (
    <>
      <rect x="4" y="4" width="40" height="40" rx="9" fill="#fff" stroke="#e5e7eb" />
      <rect className="a-barra" x="11" y="26" width="7" height="12" rx="2" fill={u('a')} />
      <rect className="a-barra" style={{ animationDelay: '.12s' }} x="21" y="18" width="7" height="20" rx="2" fill={u('t')} />
      <rect className="a-barra" style={{ animationDelay: '.24s' }} x="31" y="11" width="7" height="27" rx="2" fill={u('v')} />
    </>
  ),
  etiqueta: (u) => (
    <g className="a-balanceo">
      <path d="M6 10a4 4 0 0 1 4-4h14l18 18-18 18L6 24Z" fill={u('n')} />
      <circle cx="14" cy="14" r="3.5" fill="#fff" />
      <path d="M20 26h12M24 32h6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  mano: (u) => (
    <g className="a-saludo">
      <path d="M16 25V10a3 3 0 0 1 6 0v12V7a3 3 0 0 1 6 0v15V9a3 3 0 0 1 6 0v16l2-5a3 3 0 0 1 5.5 2.3L36 36a10 10 0 0 1-9 7h-3a10 10 0 0 1-10-10v-8a3 3 0 0 1 2 0Z" fill={u('y')} stroke="#d97706" strokeWidth="1" />
      {reflejo(u, 'M17 9a2 2 0 0 1 4 0v6c-2-1-3-3-4-6Z')}
    </g>
  ),
  dinero: (u) => (
    <>
      <rect className="a-balanceo" x="4" y="12" width="40" height="24" rx="5" fill={u('v')} />
      <rect x="8" y="16" width="32" height="16" rx="3" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="6" fill="#fff" fillOpacity=".85" />
      <text x="24" y="28.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="#047857" fontFamily="system-ui, sans-serif">
        $
      </text>
    </>
  ),
  cerrar: () => <path d="M14 14l20 20M34 14 14 34" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />,
  atras: () => <path d="M30 10 16 24l14 14" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />,
  siguiente: () => (
    <g className="a-empujar">
      <path d="M10 24h26M26 13l11 11-11 11" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  'jugar-simple': () => <path d="M15 10v28l23-14Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />,
  equis: (u) => (
    <>
      <circle cx="24" cy="24" r="20" fill={u('r')} />
      <path d="M17 17l14 14M31 17 17 31" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </>
  ),
  aviso: (u) => (
    <g className="a-latir">
      <path d="M24 5 45 41H3Z" fill={u('y')} stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 17v12" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="35" r="2.5" fill="#78350f" />
    </g>
  ),
  grado: (u) => (
    <>
      <path d="M24 8 45 18 24 28 3 18Z" fill={u('a')} />
      <path d="M12 23v9c0 4 6 7 12 7s12-3 12-7v-9l-12 6Z" fill={u('m')} />
      <path className="a-balanceo" d="M41 19v12" stroke={u('y')} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
};

function Operador({ u, c, d, children }: { u: U; c: string; d: string; children?: ReactElement[] }) {
  return (
    <g className="a-latir">
      <rect x="5" y="5" width="38" height="38" rx="12" fill={u(c)} />
      {reflejo(u, 'M17 5h14a12 12 0 0 1 12 12H5A12 12 0 0 1 17 5Z')}
      <path d={d} stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      {children}
    </g>
  );
}

/** Objetos de la finca (dibujos ya existentes) con animación de balanceo. */
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
};

export type NombreIcono = keyof typeof iconos | keyof typeof objetos;

type Props = {
  nombre: NombreIcono | string;
  tamano?: number;
  anim?: 'una' | 'siempre' | 'no';
  /** Texto para lectores de pantalla; sin él, el ícono es decorativo. */
  etiqueta?: string;
  className?: string;
};

export default function Icono({ nombre, tamano = 28, anim = 'una', etiqueta, className = '' }: Props) {
  const id = useId().replace(/:/g, '');
  const u: U = (k) => `url(#${id}${k})`;
  const accesible = etiqueta ? { role: 'img', 'aria-label': etiqueta } : { 'aria-hidden': true };
  const clase = `icono anim-${anim} ${className}`;

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
      <defs>
        {Object.entries(DEGRADADOS).map(([k, [a, b]]) => (
          <linearGradient key={k} id={`${id}${k}`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        ))}
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {dibujo(u)}
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
