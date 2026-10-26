// Teclado numérico propio (nunca el teclado del sistema para respuestas numéricas).

import { num } from '../contenido/contexto';

type Props = {
  valor: string;
  onCambio: (v: string) => void;
  onListo: () => void;
  deshabilitado?: boolean;
  unidad?: string;
  maxCifras?: number;
  /** Oculta la pantalla del número (cuando el valor se muestra en otro lugar, p. ej. el algoritmo). */
  sinPantalla?: boolean;
  textoListo?: string;
};

export default function Teclado({ valor, onCambio, onListo, deshabilitado, unidad, maxCifras = 9, sinPantalla, textoListo = 'Listo' }: Props) {
  const pulsar = (d: string) => {
    if (deshabilitado) return;
    if (valor.length >= maxCifras) return;
    onCambio(valor === '0' ? d : valor + d);
  };
  return (
    <div className="columna">
      {!sinPantalla && (
        <div className="pantalla-numero" aria-live="polite" aria-label={valor ? `Tu respuesta: ${valor}` : 'Escribe tu respuesta con el teclado'}>
          <span>{valor ? num(Number(valor)) : ''}</span>
          {!deshabilitado && <span className="cursor" aria-hidden="true" />}
          {unidad && valor && <span className="unidad">{unidad}</span>}
        </div>
      )}
      <div className="teclado" role="group" aria-label="Teclado numérico">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className="tecla" onClick={() => pulsar(d)} disabled={deshabilitado}>
            {d}
          </button>
        ))}
        <button type="button" className="tecla borrar" onClick={() => onCambio(valor.slice(0, -1))} disabled={deshabilitado || !valor} aria-label="Borrar">
          ⌫ Borrar
        </button>
        <button type="button" className="tecla" onClick={() => pulsar('0')} disabled={deshabilitado}>
          0
        </button>
        <button type="button" className="tecla listo" onClick={onListo} disabled={deshabilitado || !valor}>
          ✔ {textoListo}
        </button>
      </div>
    </div>
  );
}
