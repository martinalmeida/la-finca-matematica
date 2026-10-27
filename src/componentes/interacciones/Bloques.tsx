import { useState } from 'react';
import Numerica from './Numerica';
import type { PropsInteraccion } from './tipos';
import Icono from '../Icono';
import { DibujoObjeto, esFemenino, pluralObjeto } from '../Ilustraciones';
import type { Objeto } from '../../juego/tipos';

type Dibujos = { unidad?: Objeto; decena?: Objeto; centena?: Objeto };

const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Rótulos de las tres columnas según lo que dice el enunciado («Cajas de 10», «Limones sueltos»). */
export function rotulosBloques({ unidad, decena, centena }: Dibujos) {
  return {
    // Sin objetos (kilos, metros, pesos…) los bloques son abstractos: centenas, decenas y unidades.
    c: unidad ? `${mayus(pluralObjeto(centena ?? 'canasta'))} de 100` : 'Centenas',
    d: unidad ? `${mayus(pluralObjeto(decena ?? 'caja'))} de 10` : 'Decenas',
    u: unidad ? `${mayus(pluralObjeto(unidad).split(' de ')[0])} ${esFemenino(unidad) ? 'sueltas' : 'sueltos'}` : 'Unidades',
  };
}

/** Un grupo dibujado (canasta, caja) con la cantidad que lleva. */
function Grupo({ objeto, cuanto }: { objeto: Objeto; cuanto: number }) {
  return (
    <span className="bloque-dibujo">
      <DibujoObjeto objeto={objeto} tamano={30} etiqueta="" />
      <span className="bloque-cuanto">{cuanto}</span>
    </span>
  );
}

/** Dibujo de bloques: canastas de 100, cajas de 10 y unidades (con el dibujo de lo que se cuenta). */
export function BloquesDibujo({ c, d, u, unidad, decena, centena, conCientos = c > 0 }: { c: number; d: number; u: number; conCientos?: boolean } & Dibujos) {
  const r = rotulosBloques({ unidad, decena, centena });
  // Sin centenas no se muestra la columna: en números menores que 100 el enunciado no habla de canastas.
  return (
    <div className={`bloques ${conCientos ? '' : 'sin-cientos'}`} aria-hidden="true">
      {conCientos && (
        <div className="bloque-columna">
          <h4>{r.c}</h4>
          <div className="bloque-items">
            {Array.from({ length: c }, (_, k) => (unidad ? <Grupo key={k} objeto={centena ?? 'canasta'} cuanto={100} /> : <span key={k} className="bloque-cien">100</span>))}
          </div>
        </div>
      )}
      <div className="bloque-columna">
        <h4>{r.d}</h4>
        <div className="bloque-items">
          {Array.from({ length: d }, (_, k) => (unidad ? <Grupo key={k} objeto={decena ?? 'caja'} cuanto={10} /> : <span key={k} className="bloque-diez" />))}
        </div>
      </div>
      <div className="bloque-columna">
        <h4>{r.u}</h4>
        <div className="bloque-items">
          {Array.from({ length: u }, (_, k) => (unidad ? <DibujoObjeto key={k} objeto={unidad} tamano={24} etiqueta="" /> : <span key={k} className="bloque-uno" />))}
        </div>
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
  const r = rotulosBloques(i);

  if (i.modo === 'leer') {
    const { c, d, u } = descomponer(i.valor);
    return (
      <div className="columna">
        <BloquesDibujo c={c} d={d} u={u} unidad={i.unidad} decena={i.decena} centena={i.centena} />
        <p className="oculto-visual">
          {c} {r.c.toLowerCase()}, {d} {r.d.toLowerCase()} y {u} {r.u.toLowerCase()}.
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
      <BloquesDibujo c={cant.c} d={cant.d} u={cant.u} unidad={i.unidad} decena={i.decena} centena={i.centena} conCientos={usaCientos} />
      <div className={`bloques ${usaCientos ? '' : 'sin-cientos'}`}>
        {usaCientos && control('c', r.c)}
        {control('d', r.d)}
        {control('u', r.u)}
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
