// Tocar la figura que se pide (Inclusión, pre-número): la más alta, la de otro color, la canasta vacía…

import { DibujoFigura } from '../Figuras';
import Icono from '../Icono';
import type { PropsInteraccion } from './tipos';

export default function Figuras({ ej, bloqueado, onResponder, fallidas, correcta }: PropsInteraccion) {
  const i = ej.interaccion;
  if (i.tipo !== 'figuras') return null;
  // Los lazos son anchos: uno debajo del otro y desde la misma punta, para compararlos.
  const lazos = i.opciones.some((o) => 'lazo' in o.figura);
  return (
    <div className={`figuras ${lazos ? 'figuras-lazos' : ''}`} role="group" aria-label="Toca una figura">
      {i.opciones.map((o) => {
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
          >
            <DibujoFigura figura={o.figura} tamano={i.opciones.length > 3 ? 64 : 84} />
            {ok && <Icono nombre="check" tamano={26} />}
          </button>
        );
      })}
    </div>
  );
}
