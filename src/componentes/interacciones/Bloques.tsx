import { useState } from 'react';
import Numerica from './Numerica';
import type { PropsInteraccion } from './tipos';
import Icono from '../Icono';

/** Dibujo de bloques: canastas de 100, cajas de 10 y unidades. */
export function BloquesDibujo({ c, d, u }: { c: number; d: number; u: number }) {
  return (
    <div className="bloques" aria-hidden="true">
      <div className="bloque-columna">
        <h4>Canastas de 100</h4>
        <div className="bloque-items">{Array.from({ length: c }, (_, k) => <span key={k} className="bloque-cien">100</span>)}</div>
      </div>
      <div className="bloque-columna">
        <h4>Cajas de 10</h4>
        <div className="bloque-items">{Array.from({ length: d }, (_, k) => <span key={k} className="bloque-diez" />)}</div>
      </div>
      <div className="bloque-columna">
        <h4>Sueltas</h4>
        <div className="bloque-items">{Array.from({ length: u }, (_, k) => <span key={k} className="bloque-uno" />)}</div>
      </div>
    </div>
  );
}

export function descomponer(v: number) {
  return { c: Math.floor(v / 100), d: Math.floor((v % 100) / 10), u: v % 10 };
}

export default function Bloques(props: PropsInteraccion) {
  const i = props.ej.interaccion;
  const [cant, setCant] = useState({ c: 0, d: 0, u: 0 });
  if (i.tipo !== 'bloques') return null;

  if (i.modo === 'leer') {
    const { c, d, u } = descomponer(i.valor);
    return (
      <div className="columna">
        <BloquesDibujo c={c} d={d} u={u} />
        <p className="oculto-visual">
          {c} canastas de 100, {d} cajas de 10 y {u} sueltas.
        </p>
        <Numerica {...props} />
      </div>
    );
  }

  const usaCientos = i.valor >= 100;
  const cambiar = (k: 'c' | 'd' | 'u', delta: number) => setCant((s) => ({ ...s, [k]: Math.max(0, Math.min(19, s[k] + delta)) }));
  const control = (k: 'c' | 'd' | 'u', nombre: string) => (
    <div className="bloque-columna">
      <h4>{nombre}</h4>
      <div className="fila" style={{ justifyContent: 'center' }}>
        <button type="button" className="boton icono" disabled={props.bloqueado || cant[k] === 0} onClick={() => cambiar(k, -1)} aria-label={`Quitar ${nombre}`}>
          −
        </button>
        <strong aria-live="polite" style={{ minWidth: 24, textAlign: 'center' }}>
          {cant[k]}
        </strong>
        <button type="button" className="boton icono" disabled={props.bloqueado} onClick={() => cambiar(k, 1)} aria-label={`Agregar ${nombre}`}>
          +
        </button>
      </div>
    </div>
  );
  return (
    <div className="columna">
      <BloquesDibujo c={cant.c} d={cant.d} u={cant.u} />
      <div className="bloques">
        {usaCientos ? control('c', 'Canastas de 100') : <div />}
        {control('d', 'Cajas de 10')}
        {control('u', 'Sueltas')}
      </div>
      <button
        type="button"
        className="boton principal"
        disabled={props.bloqueado || cant.c + cant.d + cant.u === 0}
        onClick={() => props.onResponder(cant.c * 100 + cant.d * 10 + cant.u)}
      >
        <Icono nombre="check" tamano={24} /> Listo
      </button>
    </div>
  );
}
