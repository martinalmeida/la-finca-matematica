// Algoritmo guiado: completar cifra por cifra, de derecha a izquierda,
// con casillas opcionales para lo que se lleva (suma) o se presta (resta).

import { useState } from 'react';
import Teclado from '../Teclado';
import type { PropsInteraccion } from './tipos';

export default function Algoritmo({ ej, bloqueado, onResponder, correcta }: PropsInteraccion) {
  const i = ej.interaccion;
  const resultadoLargo = i.tipo === 'algoritmo' ? String(i.operacion === 'suma' ? i.a + i.b : i.operacion === 'resta' ? i.a : i.a * i.b).length : 1;
  const ancho = i.tipo === 'algoritmo' ? Math.max(String(i.a).length, String(i.b).length + 1, resultadoLargo) : 1;
  const [cifras, setCifras] = useState<string[]>(() => Array(ancho).fill(''));
  const [llevadas, setLlevadas] = useState<string[]>(() => Array(ancho).fill(''));
  const [foco, setFoco] = useState<{ fila: 'r' | 'l'; col: number }>({ fila: 'r', col: ancho - 1 });
  if (i.tipo !== 'algoritmo') return null;

  const signo = i.operacion === 'suma' ? '+' : i.operacion === 'resta' ? '−' : '×';
  const pad = (n: number) => String(n).padStart(ancho, ' ').split('');
  const filaA = pad(i.a);
  const filaB = pad(i.b);
  const reveladas = typeof correcta === 'number' ? String(correcta).padStart(ancho, ' ').split('') : null;

  const escribir = (d: string) => {
    if (foco.fila === 'r') {
      setCifras((c) => c.map((v, k) => (k === foco.col ? d : v)));
      if (foco.col > 0) setFoco({ fila: 'r', col: foco.col - 1 });
    } else {
      setLlevadas((c) => c.map((v, k) => (k === foco.col ? d : v)));
      setFoco({ fila: 'r', col: Math.min(ancho - 1, foco.col) });
    }
  };
  const borrarFoco = () => {
    if (foco.fila === 'r') {
      if (cifras[foco.col]) setCifras((c) => c.map((v, k) => (k === foco.col ? '' : v)));
      else if (foco.col < ancho - 1) {
        setFoco({ fila: 'r', col: foco.col + 1 });
        setCifras((c) => c.map((v, k) => (k === foco.col + 1 ? '' : v)));
      }
    } else setLlevadas((c) => c.map((v, k) => (k === foco.col ? '' : v)));
  };
  const valor = cifras.join('').replace(/^0+(?=\d)/, '');
  const completo = cifras.some((c) => c !== '') && cifras.every((c, k) => c !== '' || cifras.slice(0, k + 1).every((x) => x === ''));

  const celda = (contenido: string, k: number) => (
    <div key={k} className="celda-alg">
      {contenido.trim()}
    </div>
  );
  const etiquetaLlevar = i.operacion === 'resta' ? 'Lo que se presta' : 'Lo que se lleva';

  return (
    <div className="columna">
      <div className="algoritmo" style={{ gridTemplateColumns: `44px repeat(${ancho}, 44px)` }} role="group" aria-label={`${i.a} ${signo} ${i.b}`}>
        {/* Fila de llevadas */}
        <div className="celda-alg pequeno" style={{ fontSize: '0.6rem', fontWeight: 600 }} aria-hidden="true">
          {i.operacion === 'resta' ? 'presto' : 'llevo'}
        </div>
        {llevadas.map((v, k) =>
          k === ancho - 1 && i.operacion !== 'resta' ? (
            <div key={k} className="celda-alg" />
          ) : (
            <button
              key={k}
              type="button"
              className={`casilla llevar ${foco.fila === 'l' && foco.col === k ? 'foco' : ''}`}
              onClick={() => setFoco({ fila: 'l', col: k })}
              disabled={bloqueado}
              aria-label={`${etiquetaLlevar}, columna ${ancho - k}${v ? `: ${v}` : ''}`}
            >
              {v}
            </button>
          ),
        )}
        <div className="celda-alg" />
        {filaA.map(celda)}
        <div className="celda-alg">{signo}</div>
        {filaB.map(celda)}
        <div className="celda-alg raya" />
        {cifras.map((_, k) => (
          <div key={k} className="raya" />
        ))}
        <div className="celda-alg">=</div>
        {cifras.map((v, k) => (
          <button
            key={k}
            type="button"
            className={`celda-alg casilla ${foco.fila === 'r' && foco.col === k && !bloqueado ? 'foco' : ''}`}
            onClick={() => setFoco({ fila: 'r', col: k })}
            disabled={bloqueado}
            aria-label={`Resultado, columna ${ancho - k}${v ? `: ${v}` : ', vacía'}`}
          >
            {reveladas ? reveladas[k].trim() : v}
          </button>
        ))}
      </div>
      <p className="pequeno suave centro" style={{ margin: 0 }}>
        Empieza por la derecha (las unidades). Toca una casilla para escribir en ella. {i.operacion !== 'multiplicacion' ? `Las casillas pequeñas son para ${etiquetaLlevar.toLowerCase()}.` : ''}
      </p>
      <Teclado
        valor={valor}
        sinPantalla
        onCambio={(v) => {
          if (v.length < valor.length) borrarFoco();
          else escribir(v.slice(-1));
        }}
        onListo={() => {
          if (!completo) return;
          onResponder(Number(valor));
        }}
        deshabilitado={bloqueado}
        maxCifras={99}
      />
    </div>
  );
}
