// Figuras del pre-número (Inclusión): formas de colores, objetos grandes o pequeños, canastas con
// uno, muchos o ninguno, torres de cajas, lazos, velas, botellas y lápices. No llevan números:
// se comparan mirando.

import type { ColorFigura, CosaAlta, Figura, FormaFigura } from '../juego/tipos';
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
