// Ordenar (Inclusión): tocar las figuras en orden, del más bajo al más alto. Cada una muestra
// puntos según su turno (sin números). Si el orden no es el correcto, se empieza de nuevo.

import { useState } from 'react';
import { DibujoFigura } from '../Figuras';
import { sonar } from '../../servicios/sonido';
import { useApp } from '../../estado';
import type { PropsInteraccion } from './tipos';

export default function Ordenar({ ej, bloqueado, onResponder }: PropsInteraccion) {
  const { ajustes } = useApp();
  const i = ej.interaccion;
  const [orden, setOrden] = useState<string[]>([]);
  if (i.tipo !== 'ordenar') return null;

  const tocar = (id: string) => {
    if (bloqueado) return;
    sonar('toque', ajustes.sonido);
    if (orden.includes(id)) {
      // Tocar de nuevo deshace desde esa figura.
      setOrden(orden.slice(0, orden.indexOf(id)));
      return;
    }
    const nuevo = [...orden, id];
    setOrden(nuevo);
    if (nuevo.length === i.items.length) {
      const r = nuevo.join('|');
      onResponder(r);
      if (!ej.validar(r)) setOrden([]);
    }
  };

  return (
    <div className="ordenar" role="group" aria-label="Toca en orden">
      {i.items.map((o) => {
        const turno = orden.indexOf(o.id);
        return (
          <button
            key={o.id}
            type="button"
            className={`figura-opcion ordenar-ficha vidrio ${turno >= 0 ? 'marcada' : ''}`}
            onClick={() => tocar(o.id)}
            disabled={bloqueado}
            aria-pressed={turno >= 0}
            aria-label={`${o.etiqueta}${turno >= 0 ? `, tocado de ${['primero', 'segundo', 'tercero', 'cuarto'][turno] ?? 'último'}` : ''}`}
          >
            <DibujoFigura figura={o.figura} tamano={84} />
            <span className="ordenar-puntos" aria-hidden="true">
              {turno >= 0 ? Array.from({ length: turno + 1 }, (_, k) => <span key={k} className="punto-turno" />) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
