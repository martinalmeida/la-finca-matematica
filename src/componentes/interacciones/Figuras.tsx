// Tocar la figura que se pide (Inclusión, pre-número): la más alta, la de otro color, la canasta vacía…

import { DibujoFigura } from '../Figuras';
import Icono from '../Icono';
import type { PropsInteraccion } from './tipos';
import { letraOpcion, opcionDeTecla, useTeclas } from '../../servicios/teclas';

export default function Figuras({ ej, bloqueado, onResponder, fallidas, correcta }: PropsInteraccion) {
  const i = ej.interaccion;
  const opciones = i.tipo === 'figuras' ? i.opciones : [];
  useTeclas((e) => {
    const k = opcionDeTecla(e, opciones.length);
    if (k < 0 || fallidas.some((f) => String(f) === opciones[k].id)) return false;
    onResponder(opciones[k].id);
    return true;
  }, !bloqueado);
  if (i.tipo !== 'figuras') return null;
  // Los lazos son anchos: uno debajo del otro y desde la misma punta, para compararlos.
  const lazos = i.opciones.some((o) => 'lazo' in o.figura);
  return (
    <div className={`figuras ${lazos ? 'figuras-lazos' : ''}`} role="group" aria-label="Toca una figura">
      {i.opciones.map((o, k) => {
        const fallo = fallidas.some((f) => String(f) === o.id);
        const ok = correcta !== null && String(correcta) === o.id;
        return (
          <button
            key={o.id}
            type="button"
            className={`figura-opcion vidrio ${fallo ? 'fallida' : ''} ${ok ? 'correcta' : ''}`}
            disabled={bloqueado || fallo}
            onClick={() => onResponder(o.id)}
            aria-label={o.etiqueta}
            aria-keyshortcuts={letraOpcion(k)}
          >
            {!ok && !fallo && !bloqueado && <span className="letra-atajo" aria-hidden="true">{letraOpcion(k)}</span>}
            <DibujoFigura figura={o.figura} tamano={i.opciones.length > 3 ? 64 : 84} />
            {ok && <Icono nombre="check" tamano={26} />}
          </button>
        );
      })}
    </div>
  );
}
