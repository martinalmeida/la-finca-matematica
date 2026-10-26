import { useState } from 'react';
import { DibujoObjeto } from '../Ilustraciones';
import Numerica from './Numerica';
import type { PropsInteraccion } from './tipos';

/** Arreglo de surcos: tocar una celda forma el rectángulo filas × columnas desde la esquina. */
export default function Arreglo(props: PropsInteraccion) {
  const i = props.ej.interaccion;
  const [sel, setSel] = useState<{ f: number; c: number } | null>(null);
  if (i.tipo !== 'arreglo') return null;
  const lado = Math.min(10, Math.max(i.filas, i.columnas) + 1);
  const listo = sel && sel.f === i.filas && sel.c === i.columnas;
  const tam = lado > 8 ? 26 : 30;
  return (
    <div className="columna">
      <div className="arreglo" style={{ gridTemplateColumns: `repeat(${lado}, ${tam}px)` }} role="grid" aria-label="Cuadrícula de surcos">
        {Array.from({ length: lado * lado }, (_, k) => {
          const f = Math.floor(k / lado);
          const c = k % lado;
          const activa = sel !== null && f < sel.f && c < sel.c;
          return (
            <button
              key={k}
              type="button"
              className={`celda ${activa ? 'activa' : ''}`}
              style={{ width: tam, height: tam }}
              disabled={props.bloqueado}
              onClick={() => setSel({ f: f + 1, c: c + 1 })}
              aria-label={`Formar ${f + 1} filas por ${c + 1} columnas`}
            >
              {activa && <DibujoObjeto objeto={i.objeto} tamano={tam - 6} etiqueta="" />}
            </button>
          );
        })}
      </div>
      <p className="centro" style={{ margin: 0, fontWeight: 700 }} aria-live="polite">
        {sel ? `${sel.f} ${sel.f === 1 ? 'fila' : 'filas'} de ${sel.c}` : 'Toca una celda para formar el arreglo'}
        {listo ? ' ✔ ¡Ese es el arreglo!' : ''}
      </p>
      <Numerica {...props} />
    </div>
  );
}
