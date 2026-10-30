import { num } from '../../contenido/contexto';
import type { Respuesta } from '../../juego/tipos';
import Icono from '../Icono';
import { letraOpcion, opcionDeTecla, useTeclas } from '../../servicios/teclas';

type Props = {
  opciones: Respuesta[];
  bloqueado: boolean;
  fallidas: Respuesta[];
  correcta: Respuesta | null;
  onElegir: (r: Respuesta) => void;
  etiqueta?: string;
};

export function textoOpcion(o: Respuesta): string {
  return typeof o === 'number' ? num(o) : o;
}

export default function Opciones({ opciones, bloqueado, fallidas, correcta, onElegir, etiqueta = 'Elige una respuesta' }: Props) {
  // Textos o cifras largas ($1.020.000) van en una sola columna: en dos no caben con letra grande.
  const esTexto = opciones.some((o) => (typeof o === 'string' && o.length > 6) || textoOpcion(o).length > 7);
  const fallo = (o: Respuesta) => fallidas.some((f) => String(f) === String(o));
  // En computador: A, B, C… eligen la opción (letras y no números, para no confundirlas con las respuestas).
  useTeclas((e) => {
    const k = opcionDeTecla(e, opciones.length);
    if (k < 0 || fallo(opciones[k])) return false;
    onElegir(opciones[k]);
    return true;
  }, !bloqueado);
  return (
    <div className="opciones" role="group" aria-label={etiqueta} style={esTexto ? { gridTemplateColumns: '1fr' } : undefined}>
      {opciones.map((o, k) => {
        const fallo = fallidas.some((f) => String(f) === String(o));
        const ok = correcta !== null && String(correcta) === String(o);
        return (
          <button
            key={String(o)}
            type="button"
            className={`opcion ${typeof o === 'string' ? 'texto' : ''} ${fallo ? 'incorrecta' : ''} ${ok ? 'correcta' : ''}`}
            disabled={bloqueado || fallo}
            onClick={() => onElegir(o)}
            aria-label={`${textoOpcion(o)}${fallo ? ', ya lo intentaste' : ''}${ok ? ', correcta' : ''}`}
            aria-keyshortcuts={letraOpcion(k)}
          >
            {!ok && !fallo && !bloqueado && <span className="letra-atajo" aria-hidden="true">{letraOpcion(k)}</span>}
            {ok ? <Icono nombre="check" tamano={26} /> : fallo ? <Icono nombre="equis" tamano={22} anim="no" /> : null}
            {textoOpcion(o)}
          </button>
        );
      })}
    </div>
  );
}
