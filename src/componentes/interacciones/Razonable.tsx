import { useState } from 'react';
import Opciones from './Opciones';
import type { PropsInteraccion } from './tipos';
import { num } from '../../contenido/contexto';
import Icono from '../Icono';
import { esFamilia } from '../../juego/motor';
import { focoEnControl, useTeclas } from '../../servicios/teclas';

/** ¿Es razonable? Elegir sí o no, y la mejor estimación. */
export default function Razonable({ ej, bloqueado, onResponder, correcta }: PropsInteraccion) {
  const i = ej.interaccion;
  const [sino, setSino] = useState<'si' | 'no' | null>(null);
  const [est, setEst] = useState<number | null>(null);
  const listo = () => {
    if (!bloqueado && sino && est !== null) onResponder(`${sino}:${est}`);
  };
  // En computador: S / N para sí o no, A, B, C… para la estimación (en Opciones) y Enter para terminar.
  useTeclas((e) => {
    const t = e.key.toLowerCase();
    if (t === 's' || t === 'n') {
      setSino(t === 's' ? 'si' : 'no');
      return true;
    }
    if (e.key === 'Enter' && !focoEnControl()) {
      listo();
      return true;
    }
    return false;
  }, !bloqueado);
  if (i.tipo !== 'razonable') return null;
  const adulto = esFamilia(ej.pista);
  const correctaEst = typeof correcta === 'string' ? Number(correcta.split(':')[1]) : null;
  return (
    <div className="columna">
      <p style={{ margin: 0, fontWeight: 700 }}>1. ¿Es razonable decir {num(i.propuesto)}?</p>
      <div className="opciones">
        {(['si', 'no'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`opcion texto ${sino === v ? 'seleccionado' : ''}`}
            onClick={() => setSino(v)}
            disabled={bloqueado}
            aria-pressed={sino === v}
            aria-keyshortcuts={v === 'si' ? 'S' : 'N'}
          >
            {!bloqueado && <span className="letra-atajo" aria-hidden="true">{v === 'si' ? 'S' : 'N'}</span>}
            {v === 'si' ? <><Icono nombre="check" tamano={26} /> Sí</> : <><Icono nombre="equis" tamano={26} /> No</>}
          </button>
        ))}
      </div>
      <p style={{ margin: 0, fontWeight: 700 }}>2. {adulto ? 'Elija' : 'Elige'} la mejor estimación:</p>
      <Opciones
        opciones={i.opciones}
        bloqueado={bloqueado}
        fallidas={[]}
        correcta={correctaEst}
        onElegir={(o) => setEst(Number(o))}
        etiqueta="Mejor estimación"
      />
      {est !== null && !bloqueado && <p className="centro" style={{ margin: 0 }}>Elegiste: <strong>{num(est)}</strong></p>}
      <button type="button" className="boton principal" disabled={bloqueado || !sino || est === null} onClick={listo}>
        <Icono nombre="check" tamano={24} /> Listo
      </button>
    </div>
  );
}
