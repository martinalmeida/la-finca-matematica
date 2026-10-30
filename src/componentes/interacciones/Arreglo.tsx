import { useState } from 'react';
import { DibujoObjeto } from '../Ilustraciones';
import Numerica from './Numerica';
import type { PropsInteraccion } from './tipos';
import { esComputador, useTeclas } from '../../servicios/teclas';

/** Arreglo de surcos: tocar una celda forma el rectángulo filas × columnas desde la esquina. */
export default function Arreglo(props: PropsInteraccion) {
  const i = props.ej.interaccion;
  const [sel, setSel] = useState<{ f: number; c: number } | null>(null);
  const [computador] = useState(esComputador);
  const lado = i.tipo === 'arreglo' ? Math.min(10, Math.max(i.filas, i.columnas) + 1) : 1;
  // En computador: las flechas agrandan o achican el arreglo (las cifras y Enter van al teclado).
  useTeclas((e) => {
    const cambio: Record<string, [number, number]> = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] };
    const d = cambio[e.key];
    if (!d) return false;
    setSel((s) => {
      const f = Math.min(lado, Math.max(1, (s?.f ?? 0) + d[0]));
      const c = Math.min(lado, Math.max(1, (s?.c ?? 0) + d[1]));
      return { f, c };
    });
    return true;
  }, !props.bloqueado);
  if (i.tipo !== 'arreglo') return null;
  const listo = sel && sel.f === i.filas && sel.c === i.columnas;
  // Celdas tan grandes como quepan (hasta 44 px, cómodas para el dedo) en el ancho de la pantalla.
  const celda = `min(44px, calc((min(100vw, 560px) - 48px - ${lado - 1} * 3px) / ${lado}))`;
  return (
    <div className="columna">
      <div className="arreglo" style={{ gridTemplateColumns: `repeat(${lado}, ${celda})` }} role="grid" aria-label="Cuadrícula de surcos">
        {Array.from({ length: lado * lado }, (_, k) => {
          const f = Math.floor(k / lado);
          const c = k % lado;
          const activa = sel !== null && f < sel.f && c < sel.c;
          return (
            <button
              key={k}
              type="button"
              className={`celda ${activa ? 'activa' : ''}`}
              disabled={props.bloqueado}
              onClick={() => setSel({ f: f + 1, c: c + 1 })}
              aria-label={`Formar ${f + 1} filas por ${c + 1} columnas`}
            >
              {activa && <DibujoObjeto objeto={i.objeto} tamano={34} etiqueta="" />}
            </button>
          );
        })}
      </div>
      <p className="centro" style={{ margin: 0, fontWeight: 700 }} aria-live="polite">
        {sel ? `${sel.f} ${sel.f === 1 ? 'fila' : 'filas'} de ${sel.c}` : computador ? 'Haz clic en una celda o usa las flechas para formar el arreglo' : 'Toca una celda para formar el arreglo'}
        {listo ? ' ¡Ese es el arreglo!' : ''}
      </p>
      <Numerica {...props} />
    </div>
  );
}
