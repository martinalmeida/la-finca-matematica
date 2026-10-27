// Teclado numérico propio (nunca el teclado del sistema para respuestas numéricas).

import { num } from '../contenido/contexto';
import Icono from './Icono';

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
  /** Muestra la tecla «,» (el valor usa «.» internamente). */
  decimal?: boolean;
};

/** Muestra el valor con puntos de mil y coma decimal, aunque termine en coma («2,»). */
function mostrar(valor: string): string {
  const [ent, dec] = valor.split('.');
  return num(Number(ent || '0')) + (dec !== undefined ? ',' + dec : '');
}

export default function Teclado({ valor, onCambio, onListo, deshabilitado, unidad, maxCifras = 9, sinPantalla, textoListo = 'Listo', decimal }: Props) {
  const pulsar = (d: string) => {
    if (deshabilitado) return;
    if (valor.length >= maxCifras) return;
    // Máximo dos cifras después de la coma.
    if (valor.includes('.') && valor.split('.')[1].length >= 2) return;
    onCambio(valor === '0' ? d : valor + d);
  };
  const coma = () => {
    if (deshabilitado || valor.includes('.')) return;
    onCambio((valor || '0') + '.');
  };
  return (
    <div className="columna">
      {!sinPantalla && (
        <div className="pantalla-numero" aria-live="polite" aria-label={valor ? `Tu respuesta: ${mostrar(valor)}` : 'Escribe tu respuesta con el teclado'}>
          <span>{valor ? mostrar(valor) : ''}</span>
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
        {decimal ? (
          <div className="tecla-doble">
            <button type="button" className="tecla" onClick={() => pulsar('0')} disabled={deshabilitado}>
              0
            </button>
            <button type="button" className="tecla" onClick={coma} disabled={deshabilitado || valor.includes('.')} aria-label="Coma decimal">
              ,
            </button>
          </div>
        ) : (
          <button type="button" className="tecla" onClick={() => pulsar('0')} disabled={deshabilitado}>
            0
          </button>
        )}
        <button type="button" className="tecla listo" onClick={onListo} disabled={deshabilitado || !valor}>
          <Icono nombre="check" tamano={24} /> {textoListo}
        </button>
      </div>
    </div>
  );
}
