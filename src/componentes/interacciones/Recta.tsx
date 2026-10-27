import { useEffect, useRef, useState } from 'react';
import { num } from '../../contenido/contexto';
import type { PropsInteraccion } from './tipos';
import Icono from '../Icono';

const ANCHO = 52;

export function RectaDibujo({ min, max, paso, inicio, elegido, onElegir, bloqueado, saltos }: {
  min: number;
  max: number;
  paso: number;
  inicio: number;
  elegido: number | null;
  onElegir?: (n: number) => void;
  bloqueado?: boolean;
  saltos?: number[];
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  // Desplaza la recta para que el punto de partida quede a la vista.
  useEffect(() => {
    const c = contenedor.current;
    if (c) c.scrollLeft = Math.max(0, 24 + ((inicio - min) / paso) * ANCHO - c.clientWidth / 2);
  }, [inicio, min, paso]);
  const marcas: number[] = [];
  for (let v = min; v <= max; v += paso) marcas.push(v);
  const ancho = (marcas.length - 1) * ANCHO + 48;
  const x = (v: number) => 24 + ((v - min) / paso) * ANCHO;
  // Arcos de los saltos: desde el inicio hasta el elegido (o según la pista).
  const arcos: [number, number][] = [];
  if (saltos) {
    let p = inicio;
    for (const s of saltos) {
      arcos.push([p, p + s * paso]);
      p += s * paso;
    }
  } else if (elegido !== null && elegido !== inicio) {
    const dir = elegido > inicio ? paso : -paso;
    for (let p = inicio; p !== elegido; p += dir) arcos.push([p, p + dir]);
  }
  return (
    <div className="recta-contenedor" ref={contenedor}>
      <div className="recta" style={{ width: ancho }}>
        <svg className="saltos" width={ancho} height="60" aria-hidden="true">
          {arcos.map(([d, h], k) => {
            const x1 = x(d);
            const x2 = x(h);
            return <path key={k} d={`M${x1} 58 Q${(x1 + x2) / 2} 12 ${x2} 58`} fill="none" stroke="#c8641a" strokeWidth="3" strokeDasharray="5 3" />;
          })}
        </svg>
        <div className="recta-linea" />
        {marcas.map((v) => (
          <button
            key={v}
            type="button"
            className={`recta-marca ${v === inicio ? 'inicio' : ''} ${v === elegido ? 'elegida' : ''}`}
            style={{ left: x(v) }}
            disabled={bloqueado || !onElegir}
            onClick={() => onElegir?.(v)}
            aria-label={`${num(v)}${v === inicio ? ', punto de partida' : ''}`}
            aria-pressed={v === elegido}
          >
            <span>{num(v)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Recta({ ej, bloqueado, onResponder, correcta }: PropsInteraccion) {
  const i = ej.interaccion;
  const [elegido, setElegido] = useState<number | null>(null);
  if (i.tipo !== 'recta') return null;
  const mostrado = typeof correcta === 'number' ? correcta : elegido;
  return (
    <div className="columna">
      <RectaDibujo min={i.min} max={i.max} paso={i.paso} inicio={i.inicio} elegido={mostrado} onElegir={setElegido} bloqueado={bloqueado} />
      <p className="pequeno suave" style={{ margin: 0 }}>
        Toca un número de la recta. Si no se ve completa, deslízala con el dedo.
      </p>
      <button type="button" className="boton principal" disabled={bloqueado || elegido === null} onClick={() => elegido !== null && onResponder(elegido)}>
        <Icono nombre="check" tamano={24} /> Listo{elegido !== null ? `: ${num(elegido)}` : ''}
      </button>
    </div>
  );
}
