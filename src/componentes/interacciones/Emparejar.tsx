// Número y cantidad (Inclusión): tocar el grupo de dibujos que tiene la cantidad pedida.

import { DibujoObjeto } from '../Ilustraciones';
import type { PropsInteraccion } from './tipos';
import { letraOpcion, opcionDeTecla, useTeclas } from '../../servicios/teclas';

export default function Emparejar({ ej, bloqueado, onResponder, fallidas, correcta }: PropsInteraccion) {
  const i = ej.interaccion;
  const opciones = i.tipo === 'emparejar' ? i.opciones : [];
  useTeclas((e) => {
    const k = opcionDeTecla(e, opciones.length);
    if (k < 0 || fallidas.some((f) => Number(f) === opciones[k])) return false;
    onResponder(opciones[k]);
    return true;
  }, !bloqueado);
  if (i.tipo !== 'emparejar') return null;
  return (
    <div className="emparejar" role="group" aria-label="Elige un grupo">
      {i.opciones.map((n, k) => {
        const fallo = fallidas.some((f) => Number(f) === n);
        const ok = correcta !== null && Number(correcta) === n;
        return (
          <button
            key={n}
            type="button"
            className={`grupo-emparejar vidrio ${fallo ? 'fallida' : ''} ${ok ? 'correcta' : ''}`}
            disabled={bloqueado || fallo}
            onClick={() => onResponder(n)}
            aria-label={`Grupo de ${n}`}
            aria-keyshortcuts={letraOpcion(k)}
          >
            {!ok && !fallo && !bloqueado && <span className="letra-atajo" aria-hidden="true">{letraOpcion(k)}</span>}
            {Array.from({ length: n }, (_, k) => (
              <DibujoObjeto key={k} objeto={i.objeto} tamano={40} etiqueta="" />
            ))}
          </button>
        );
      })}
    </div>
  );
}
