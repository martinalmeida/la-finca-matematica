import { num } from '../../contenido/contexto';
import type { Respuesta } from '../../juego/tipos';

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
  const esTexto = opciones.some((o) => typeof o === 'string' && o.length > 6);
  return (
    <div className="opciones" role="group" aria-label={etiqueta} style={esTexto ? { gridTemplateColumns: '1fr' } : undefined}>
      {opciones.map((o) => {
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
          >
            {ok ? '✔ ' : fallo ? '✗ ' : ''}
            {textoOpcion(o)}
          </button>
        );
      })}
    </div>
  );
}
