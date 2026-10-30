// Tocar la figura que se pide (Inclusión, pre-número): la más alta, la de otro color, la canasta vacía…
// Con modelo, el dibujo de arriba dice «Igual a este» y se toca el que es igual.

import { DibujoFigura } from '../Figuras';
import Icono from '../Icono';
import type { Figura } from '../../juego/tipos';
import type { PropsInteraccion } from './tipos';
import { guiaInclusion } from './contarEnVoz';
import { letraOpcion, opcionDeTecla, useTeclas } from '../../servicios/teclas';

/** Figuras anchas (marcos de 10, canastas): una por fila en celular. */
const esAncha = (f: Figura) => 'marco' in f;

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
  const guia = guiaInclusion(ej, fallidas, bloqueado);
  // Los lazos son anchos: uno debajo del otro y desde la misma punta, para compararlos.
  const lazos = i.opciones.some((o) => 'lazo' in o.figura);
  const anchas = i.opciones.some((o) => esAncha(o.figura));
  const lista = (
    <div className={`figuras ${lazos ? 'figuras-lazos' : ''} ${anchas ? 'figuras-anchas' : ''}`} role="group" aria-label="Toca una figura">
      {i.opciones.map((o, k) => {
        const fallo = fallidas.some((f) => String(f) === o.id);
        const ok = correcta !== null && String(correcta) === o.id;
        const guiar = guia !== null && !fallo && !ok && String(guia) === o.id;
        return (
          <button
            key={o.id}
            type="button"
            className={`figura-opcion vidrio ${fallo ? 'fallida' : ''} ${ok ? 'correcta' : ''} ${guiar ? 'guia' : ''}`}
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
  if (!i.modelo) return lista;
  return (
    <div className="columna figuras-con-modelo">
      <div className="figuras-modelo" role="img" aria-label="Igual a este">
        <span className="figuras-modelo-rotulo">Igual a este</span>
        <span className="figuras-modelo-dibujo">
          <DibujoFigura figura={i.modelo} tamano={esAncha(i.modelo) ? 96 : 120} />
        </span>
      </div>
      {lista}
    </div>
  );
}
