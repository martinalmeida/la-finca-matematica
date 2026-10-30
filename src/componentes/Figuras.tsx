// Figuras del pre-número (Inclusión): formas de colores, objetos grandes o pequeños, canastas con
// uno, muchos o ninguno, torres de cajas, lazos, velas, botellas y lápices. No llevan números:
// se comparan mirando. También la cara del dado y el marco de 10 (ver la cantidad sin contar).

import type { ReactNode } from 'react';
import type { ColorFigura, CosaAlta, Figura, FormaFigura, Objeto } from '../juego/tipos';
import { DibujoObjeto } from './Ilustraciones';
import Recipiente from './Recipiente';
import { claro, medio, oscuro, TONOS } from './paleta';

/** Claro, medio y oscuro de cada color (el rosado no está en la paleta general). */
const TONO_COLOR: Record<ColorFigura, readonly [string, string, string]> = {
  rojo: TONOS.r,
  azul: TONOS.a,
  amarillo: TONOS.y,
  verde: TONOS.v,
  anaranjado: TONOS.n,
  morado: TONOS.m,
  rosado: ['#fce7f3', '#f472b6', '#be185d'],
  cafe: TONOS.k,
};

export const NOMBRE_COLOR: Record<ColorFigura, { m: string; f: string }> = {
  rojo: { m: 'rojo', f: 'roja' },
  azul: { m: 'azul', f: 'azul' },
  amarillo: { m: 'amarillo', f: 'amarilla' },
  verde: { m: 'verde', f: 'verde' },
  anaranjado: { m: 'anaranjado', f: 'anaranjada' },
  morado: { m: 'morado', f: 'morada' },
  rosado: { m: 'rosado', f: 'rosada' },
  cafe: { m: 'café', f: 'café' },
};

function Forma({ forma, color, tamano }: { forma: FormaFigura; color?: ColorFigura; tamano: number }) {
  const [c, m, o] = color ? TONO_COLOR[color] : ['#e2e8f0', '#9aa5b3', '#5b6573'];
  const trazo = { fill: m, stroke: o, strokeWidth: 2, strokeLinejoin: 'round' as const };
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {forma === 'circulo' && <circle cx="20" cy="20" r="16" {...trazo} />}
      {forma === 'cuadrado' && <rect x="5" y="5" width="30" height="30" rx="4" {...trazo} />}
      {forma === 'triangulo' && <path d="M20 4 L37 35 H3 Z" {...trazo} />}
      {forma === 'rectangulo' && <rect x="2" y="10" width="36" height="20" rx="3" {...trazo} />}
      {forma === 'ovalo' && <ellipse cx="20" cy="20" rx="18" ry="11" {...trazo} />}
      {forma === 'estrella' && <path d="M20 3 L24.7 14.6 L37.2 15.4 L27.6 23.4 L30.6 35.6 L20 28.9 L9.4 35.6 L12.4 23.4 L2.8 15.4 L15.3 14.6 Z" {...trazo} />}
      {forma === 'corazon' && <path d="M20 35 C8 26 3 19 3 12.5 C3 7.5 7 4 11.5 4 C15 4 18 6 20 9.5 C22 6 25 4 28.5 4 C33 4 37 7.5 37 12.5 C37 19 32 26 20 35 Z" {...trazo} />}
      <ellipse cx={forma === 'rectangulo' || forma === 'ovalo' ? 11 : 14} cy="13" rx="5" ry="3" fill={c} opacity="0.7" />
    </svg>
  );
}

/** Vela, botella o lápiz parado, de alto 0,4 a 1. Todos se apoyan en la misma base. */
function CosaParada({ cosa, alto, tamano }: { cosa: CosaAlta; alto: number; tamano: number }) {
  const h = Math.max(24, Math.round(tamano * 1.1 * alto));
  const w = Math.round(tamano * 0.42);
  // Coordenadas en un lienzo de 20 de ancho y H de alto.
  const H = Math.round((20 * h) / w);
  const cuello = Math.min(Math.round(H * 0.3), 14);
  return (
    <svg width={w} height={h} viewBox={`0 0 20 ${H}`} aria-hidden="true" focusable="false">
      {cosa === 'vela' && (
        <>
          <path d={`M10 1 C13 5 13 8 10 10 C7 8 7 5 10 1 Z`} fill={medio('y')} stroke={oscuro('n')} strokeWidth="0.8" />
          <path d={`M10 10 V12`} stroke={oscuro('d')} strokeWidth="1" />
          <rect x="5" y="12" width="10" height={H - 13} rx="1.5" fill={claro('c')} stroke={oscuro('c')} strokeWidth="1" />
          <ellipse cx="10" cy={H - 1.5} rx="8" ry="1.5" fill={oscuro('k')} />
        </>
      )}
      {cosa === 'botella' && (
        <>
          <rect x="7.5" y="1" width="5" height="3" rx="1" fill={oscuro('r')} />
          <path d={`M8 4 H12 V${cuello} C12 ${cuello + 2} 17 ${cuello + 3} 17 ${cuello + 7} V${H - 2} Q17 ${H - 1} 15 ${H - 1} H5 Q3 ${H - 1} 3 ${H - 2} V${cuello + 7} C3 ${cuello + 3} 8 ${cuello + 2} 8 ${cuello} Z`} fill={claro('t')} stroke={oscuro('t')} strokeWidth="1" />
          <rect x="4" y={Math.round(H * 0.55)} width="12" height={Math.max(3, Math.round(H * 0.18))} fill={medio('t')} />
        </>
      )}
      {cosa === 'lapiz' && (
        <>
          <path d="M10 1 L14 8 H6 Z" fill={claro('k')} stroke={oscuro('k')} strokeWidth="0.8" />
          <path d="M10 1 L11.4 3.5 H8.6 Z" fill={oscuro('d')} />
          <rect x="6" y="8" width="8" height={H - 13} fill={medio('y')} stroke={oscuro('y')} strokeWidth="0.8" />
          <rect x="6" y={H - 5} width="8" height="2" fill={medio('g')} />
          <rect x="6" y={H - 3} width="8" height="2.5" rx="1" fill={medio('r')} />
        </>
      )}
    </svg>
  );
}

function Lazo({ largo, tamano }: { largo: number; tamano: number }) {
  const ancho = Math.round(tamano * (0.6 + 1.8 * largo));
  const fin = ancho - 10;
  // Trenza: rayitas inclinadas de un extremo al otro.
  const rayas = [];
  for (let x = 16; x <= fin - 6; x += 8) rayas.push(<path key={x} d={`M${x} 9 l-4 10`} stroke={oscuro('x')} strokeWidth="1.6" strokeLinecap="round" />);
  return (
    <svg width={ancho} height={28} viewBox={`0 0 ${ancho} 28`} aria-hidden="true" focusable="false">
      <path d={`M10 14 H${fin}`} stroke={oscuro('k')} strokeWidth="14" strokeLinecap="round" />
      <path d={`M10 14 H${fin}`} stroke={medio('x')} strokeWidth="10" strokeLinecap="round" />
      {rayas}
      <circle cx="10" cy="14" r="8" fill={oscuro('x')} />
      <circle cx={fin} cy="14" r="8" fill={oscuro('x')} />
    </svg>
  );
}

/** Puntos de cada cara del dado (lienzo de 40): esquinas, centro y los del medio a los lados. */
const PUNTOS_DADO: Record<number, [number, number][]> = {
  1: [[20, 20]],
  2: [[11, 11], [29, 29]],
  3: [[11, 11], [20, 20], [29, 29]],
  4: [[11, 11], [29, 11], [11, 29], [29, 29]],
  5: [[11, 11], [29, 11], [20, 20], [11, 29], [29, 29]],
  6: [[11, 11], [29, 11], [11, 20], [29, 20], [11, 29], [29, 29]],
};

/** Puntos de la cara del dado con n puntos (1 a 6). */
export function puntosDado(n: number): [number, number][] {
  return PUNTOS_DADO[Math.min(6, Math.max(1, Math.round(n)))];
}

function Dado({ puntos, tamano }: { puntos: number; tamano: number }) {
  return (
    <svg className="figura-dado" width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="#ffffff" stroke={oscuro('d')} strokeWidth="1.6" />
      <rect x="4" y="4" width="32" height="32" rx="6.5" fill="none" stroke="rgba(16, 32, 24, 0.08)" strokeWidth="2" />
      {puntosDado(puntos).map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r="4.2" fill="#1f2937" />
      ))}
    </svg>
  );
}

/** Orden de llenado del marco de 10: fila de arriba de izquierda a derecha, luego la de abajo. */
export const CASILLAS_MARCO = 10;

/** Ficha redonda de las casillas llenas cuando no hay objeto. */
export function FichaMarco({ tamano }: { tamano: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="16" fill={medio('r')} stroke={oscuro('r')} strokeWidth="2" />
      <ellipse cx="14" cy="13" rx="5" ry="3" fill={claro('r')} opacity="0.7" />
    </svg>
  );
}

/** Marco de 10: dos filas de cinco casillas; `casilla(k)` dibuja cada una (para hacerlas tocables). */
export function MarcoDiez({ llenas, objeto, celda, casilla, className = '' }: { llenas: number; objeto?: Objeto; celda: number; casilla?: (k: number, contenido: ReactNode) => ReactNode; className?: string }) {
  return (
    <span className={`marco-diez ${className}`} style={{ ['--celda' as string]: `${celda}px` }}>
      {Array.from({ length: CASILLAS_MARCO }, (_, k) => {
        const contenido = k < llenas ? objeto ? <DibujoObjeto objeto={objeto} tamano={Math.round(celda * 0.78)} etiqueta="" /> : <FichaMarco tamano={Math.round(celda * 0.78)} /> : null;
        return casilla ? casilla(k, contenido) : (
          <span key={k} className={`marco-casilla ${k < llenas ? 'llena' : ''}`}>
            {contenido}
          </span>
        );
      })}
    </span>
  );
}

/** Dibujo de una figura. `tamano` es el de la figura más grande (escala 1). */
export function DibujoFigura({ figura, tamano = 80 }: { figura: Figura; tamano?: number }) {
  if ('forma' in figura) return <Forma forma={figura.forma} color={figura.color} tamano={Math.round(tamano * (figura.escala ?? 1))} />;
  if ('lazo' in figura) return <Lazo largo={figura.lazo} tamano={tamano} />;
  if ('cosa' in figura) return <CosaParada cosa={figura.cosa} alto={figura.alto} tamano={tamano} />;
  if ('igual' in figura) {
    return (
      <span className="figura-igual" aria-hidden="true">
        <svg width={tamano * 0.6} height={tamano * 0.6} viewBox="0 0 40 40" focusable="false">
          <rect x="6" y="11" width="28" height="6" rx="3" fill={medio('m')} />
          <rect x="6" y="23" width="28" height="6" rx="3" fill={medio('m')} />
        </svg>
        <span>Igual</span>
      </span>
    );
  }
  if ('torre' in figura) {
    return (
      <span className="figura-torre" aria-hidden="true">
        {Array.from({ length: figura.torre }, (_, k) => (
          <DibujoObjeto key={k} objeto="caja" tamano={Math.round(tamano * 0.36)} etiqueta="" />
        ))}
      </span>
    );
  }
  if ('dado' in figura) return <Dado puntos={figura.dado} tamano={Math.round(tamano * 1.1)} />;
  if ('marco' in figura) return <MarcoDiez llenas={figura.marco} objeto={figura.objeto} celda={Math.max(22, Math.round(tamano * 0.36))} className="figura-marco" />;
  if (figura.cantidad !== undefined) {
    return (
      <Recipiente forma="canasta" pequeno className="figura-canasta" aria-hidden="true" style={{ width: Math.round(tamano * 1.5) }}>
        {Array.from({ length: figura.cantidad }, (_, k) => (
          <DibujoObjeto key={k} objeto={figura.objeto} tamano={Math.round(tamano * 0.34)} etiqueta="" />
        ))}
      </Recipiente>
    );
  }
  return <DibujoObjeto objeto={figura.objeto} tamano={Math.round(tamano * (figura.escala ?? 1))} etiqueta="" />;
}
