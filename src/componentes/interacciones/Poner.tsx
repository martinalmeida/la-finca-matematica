// Poner en la canasta (Inclusión): tocar un objeto lo mete en el recipiente y la voz cuenta
// («uno», «dos»…); tocar uno de adentro lo saca. Sin arrastrar (motricidad fina). «Listo» responde.

import { useEffect, useState } from 'react';
import { DibujoObjeto, DibujoRecipiente, nombreObjeto } from '../Ilustraciones';
import ContenedorRecipiente, { formaRecipiente } from '../Recipiente';
import Icono from '../Icono';
import type { PropsInteraccion } from './tipos';
import { palabraConteo, useDecir } from './contarEnVoz';
import { sonar } from '../../servicios/sonido';
import { useApp } from '../../estado';
import { focoEnControl, useTeclas } from '../../servicios/teclas';

/** Teclas para sumar o quitar uno (Poner y Marco). */
export function teclaMasMenos(e: KeyboardEvent): 1 | -1 | 0 {
  if (['+', 'ArrowUp', 'ArrowRight'].includes(e.key)) return 1;
  if (['-', 'ArrowDown', 'ArrowLeft', 'Backspace'].includes(e.key)) return -1;
  return 0;
}

/** Contador grande: puntos, la cifra y la palabra («tres»). */
export function Cuenta({ n }: { n: number }) {
  return (
    <div className="cuenta-viva" aria-live="polite">
      <span className="cuenta-puntos" aria-hidden="true">
        {Array.from({ length: n }, (_, k) => (
          <span key={k} className="cuenta-punto" />
        ))}
      </span>
      <span className="cuenta-cifra" aria-hidden="true">{n}</span>
      <span className="cuenta-palabra">{n === 0 ? 'Todavía nada' : palabraConteo(n)}</span>
    </div>
  );
}

export default function Poner({ ej, bloqueado, onResponder, correcta }: PropsInteraccion) {
  const { ajustes } = useApp();
  const decir = useDecir();
  const i = ej.interaccion;
  // Lugares de afuera que ya están dentro, en el orden en que entraron.
  const [dentro, setDentro] = useState<number[]>([]);
  const disponibles = i.tipo === 'poner' ? i.disponibles : 0;
  // Al ver la solución, quedan dentro justo los que eran.
  useEffect(() => {
    if (typeof correcta === 'number') setDentro((d) => (d.length === correcta ? d : Array.from({ length: Math.min(correcta, disponibles) }, (_, k) => k)));
  }, [correcta, disponibles]);
  const meter = (k: number) => {
    if (bloqueado || dentro.includes(k)) return;
    sonar('toque', ajustes.sonido);
    setDentro([...dentro, k]);
    decir(palabraConteo(dentro.length + 1));
  };
  const sacar = (k: number) => {
    if (bloqueado) return;
    sonar('toque', ajustes.sonido);
    const resto = dentro.filter((x) => x !== k);
    setDentro(resto);
    decir(resto.length ? palabraConteo(resto.length) : 'Ninguno');
  };
  const listo = () => dentro.length > 0 && onResponder(dentro.length);
  useTeclas((e) => {
    if (e.key === 'Enter' && !focoEnControl()) {
      listo();
      return true;
    }
    const d = teclaMasMenos(e);
    if (d > 0) {
      const libre = Array.from({ length: disponibles }, (_, k) => k).find((k) => !dentro.includes(k));
      if (libre !== undefined) meter(libre);
      return true;
    }
    if (d < 0) {
      if (dentro.length) sacar(dentro[dentro.length - 1]);
      return true;
    }
    return false;
  }, !bloqueado);
  if (i.tipo !== 'poner') return null;
  const nombre = nombreObjeto(i.objeto);
  const forma = formaRecipiente(i.recipiente.dibujo);
  return (
    <div className="columna poner">
      <ContenedorRecipiente
        forma={forma}
        className="poner-recipiente destino"
        role="group"
        aria-label={i.recipiente.nombre}
        rotulo={
          <div className="recipiente-rotulo">
            {!forma && <DibujoRecipiente dibujo={i.recipiente.dibujo} tamano={24} />}
            <span className="rotulo-texto">{i.recipiente.nombre}</span>
          </div>
        }
      >
        {dentro.map((k) => (
          <button key={k} type="button" className="ficha-poner entra" disabled={bloqueado} onClick={() => sacar(k)} aria-label={`${nombre}: sácalo`}>
            <DibujoObjeto objeto={i.objeto} tamano={48} etiqueta="" />
          </button>
        ))}
      </ContenedorRecipiente>
      <Cuenta n={dentro.length} />
      <div className="objetos poner-afuera" role="group" aria-label={`Toca para poner en ${i.recipiente.nombre}`}>
        {Array.from({ length: i.disponibles }, (_, k) =>
          dentro.includes(k) ? (
            <span key={k} className="ficha-poner hueco-poner" aria-hidden="true" />
          ) : (
            <button key={k} type="button" className="ficha-poner" disabled={bloqueado} onClick={() => meter(k)} aria-label={`${nombre}: ponlo`}>
              <DibujoObjeto objeto={i.objeto} tamano={48} etiqueta="" />
            </button>
          ),
        )}
      </div>
      {!bloqueado && (
        <button type="button" className="boton principal" disabled={dentro.length === 0} onClick={listo} aria-keyshortcuts="Enter">
          <Icono nombre="check" tamano={26} /> Listo
        </button>
      )}
    </div>
  );
}
