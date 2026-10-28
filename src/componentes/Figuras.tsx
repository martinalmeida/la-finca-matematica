// Figuras del pre-número (Inclusión): formas de colores, objetos grandes o pequeños, canastas con
// uno, muchos o ninguno, torres de cajas y lazos. No llevan números: se comparan mirando.

import type { ColorFigura, Figura } from '../juego/tipos';
import { DibujoObjeto } from './Ilustraciones';
import Recipiente from './Recipiente';
import { claro, medio, oscuro, type Tono } from './paleta';

const TONO_COLOR: Record<ColorFigura, Tono> = { rojo: 'r', azul: 'a', amarillo: 'y', verde: 'v' };

export const NOMBRE_COLOR: Record<ColorFigura, { m: string; f: string }> = {
  rojo: { m: 'rojo', f: 'roja' },
  azul: { m: 'azul', f: 'azul' },
  amarillo: { m: 'amarillo', f: 'amarilla' },
  verde: { m: 'verde', f: 'verde' },
};

function Forma({ forma, color, tamano }: { forma: 'circulo' | 'cuadrado' | 'triangulo'; color?: ColorFigura; tamano: number }) {
  const t: Tono = color ? TONO_COLOR[color] : 'g';
  const relleno = color ? medio(t) : '#9aa5b3';
  const borde = color ? oscuro(t) : '#5b6573';
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {forma === 'circulo' && <circle cx="20" cy="20" r="16" fill={relleno} stroke={borde} strokeWidth="2" />}
      {forma === 'cuadrado' && <rect x="5" y="5" width="30" height="30" rx="4" fill={relleno} stroke={borde} strokeWidth="2" />}
      {forma === 'triangulo' && <path d="M20 4 L37 35 H3 Z" fill={relleno} stroke={borde} strokeWidth="2" strokeLinejoin="round" />}
      <ellipse cx="14" cy="13" rx="5" ry="3" fill={color ? claro(t) : '#e2e8f0'} opacity="0.7" />
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
