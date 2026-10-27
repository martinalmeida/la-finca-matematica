// Clasificar (Inclusión, pre-número): tocar una figura y luego la canasta donde va.
// Al ubicarlas todas se responde; si alguna quedó mal, solo esa vuelve a su sitio.

import { useState } from 'react';
import { DibujoFigura } from '../Figuras';
import { sonar } from '../../servicios/sonido';
import { useApp } from '../../estado';
import type { PropsInteraccion } from './tipos';

export default function Clasificar({ ej, bloqueado, onResponder }: PropsInteraccion) {
  const { ajustes } = useApp();
  const i = ej.interaccion;
  const total = i.tipo === 'clasificar' ? i.items.length : 0;
  const [ubicacion, setUbicacion] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [elegida, setElegida] = useState<number | null>(null);
  if (i.tipo !== 'clasificar') return null;

  const tocarFigura = (k: number) => {
    if (bloqueado) return;
    sonar('toque', ajustes.sonido);
    // Tocar una figura ya puesta la saca de la canasta.
    if (ubicacion[k] !== null) setUbicacion((u) => u.map((g, j) => (j === k ? null : g)));
    setElegida(elegida === k ? null : k);
  };

  const tocarCanasta = (g: number) => {
    if (bloqueado || elegida === null) return;
    sonar('toque', ajustes.sonido);
    const nueva = ubicacion.map((x, j) => (j === elegida ? g : x));
    setUbicacion(nueva);
    setElegida(null);
    if (nueva.every((x) => x !== null)) {
      const r = nueva.join(',');
      onResponder(r);
      if (!ej.validar(r)) {
        const bien = String(ej.respuesta).split(',').map(Number);
        setUbicacion(nueva.map((x, j) => (x === bien[j] ? x : null)));
      }
    }
  };

  const figura = (k: number) => (
    <button
      key={k}
      type="button"
      className={`figura-ficha ${elegida === k ? 'elegida' : ''}`}
      onClick={() => tocarFigura(k)}
      disabled={bloqueado}
      aria-pressed={elegida === k}
      aria-label={i.items[k].etiqueta}
    >
      <DibujoFigura figura={i.items[k].figura} tamano={48} />
    </button>
  );

  const sueltas = i.items.map((_, k) => k).filter((k) => ubicacion[k] === null);
  return (
    <div className="columna clasificar">
      <div className="clasificar-canastas">
        {i.grupos.map((g, n) => (
          <div key={g.id} className={`clasificar-canasta vidrio ${elegida !== null ? 'esperando' : ''}`}>
            <button type="button" className="clasificar-rotulo" onClick={() => tocarCanasta(n)} disabled={bloqueado} aria-label={`Poner en ${g.etiqueta}`}>
              <DibujoFigura figura={g.figura} tamano={40} />
              <span>{g.etiqueta}</span>
            </button>
            <div className="clasificar-dentro">{i.items.map((_, k) => k).filter((k) => ubicacion[k] === n).map(figura)}</div>
          </div>
        ))}
      </div>
      {sueltas.length > 0 && (
        <>
          <p className="instruccion" style={{ alignSelf: 'center', margin: 0 }}>
            {elegida === null ? 'Toca una figura' : 'Ahora toca su canasta'}
          </p>
          <div className="clasificar-sueltas" role="group" aria-label="Figuras por ubicar">
            {sueltas.map(figura)}
          </div>
        </>
      )}
    </div>
  );
}
