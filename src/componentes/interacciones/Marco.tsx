// Llenar el marco de 10 (Inclusión): tocar una casilla vacía llena la siguiente (el marco queda
// siempre ordenado: fila de arriba primero); tocar una llena vacía la última. La voz cuenta.

import { useEffect, useState } from 'react';
import { MarcoDiez, CASILLAS_MARCO } from '../Figuras';
import Icono from '../Icono';
import type { PropsInteraccion } from './tipos';
import { palabraConteo, useDecir } from './contarEnVoz';
import { Cuenta, teclaMasMenos } from './Poner';
import { sonar } from '../../servicios/sonido';
import { useApp } from '../../estado';
import { focoEnControl, useTeclas } from '../../servicios/teclas';

export default function Marco({ ej, bloqueado, onResponder, correcta }: PropsInteraccion) {
  const { ajustes } = useApp();
  const decir = useDecir();
  const i = ej.interaccion;
  const [llenas, setLlenas] = useState(0);
  useEffect(() => {
    if (typeof correcta === 'number') setLlenas(Math.min(correcta, CASILLAS_MARCO));
  }, [correcta]);
  const cambiar = (d: 1 | -1) => {
    const n = llenas + d;
    if (bloqueado || n < 0 || n > CASILLAS_MARCO) return;
    sonar('toque', ajustes.sonido);
    setLlenas(n);
    decir(n ? palabraConteo(n) : 'Ninguna');
  };
  const listo = () => llenas > 0 && onResponder(llenas);
  useTeclas((e) => {
    if (e.key === 'Enter' && !focoEnControl()) {
      listo();
      return true;
    }
    const d = teclaMasMenos(e);
    if (!d) return false;
    cambiar(d);
    return true;
  }, !bloqueado);
  if (i.tipo !== 'marco') return null;
  return (
    <div className="columna marco">
      <MarcoDiez
        llenas={llenas}
        objeto={i.objeto}
        celda={64}
        className="marco-tocable"
        casilla={(k, contenido) => (
          <button
            key={k}
            type="button"
            className={`marco-casilla ${k < llenas ? 'llena' : ''}`}
            disabled={bloqueado}
            onClick={() => cambiar(k < llenas ? -1 : 1)}
            aria-label={k < llenas ? 'Casilla llena: tócala para quitar' : 'Casilla vacía: tócala para llenar'}
          >
            {contenido}
          </button>
        )}
      />
      <Cuenta n={llenas} />
      {!bloqueado && (
        <button type="button" className="boton principal" disabled={llenas === 0} onClick={listo} aria-keyshortcuts="Enter">
          <Icono nombre="check" tamano={26} /> Listo
        </button>
      )}
    </div>
  );
}
