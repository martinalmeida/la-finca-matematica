// Arrastrar y soltar con Pointer Events (no la API de arrastre de HTML5).
// También se puede tocar una ficha para moverla (más fácil para manos pequeñas).

import { useEffect, useRef, useState } from 'react';
import { DibujoObjeto, nombreObjeto } from '../Ilustraciones';
import Numerica from './Numerica';
import type { PropsInteraccion } from './tipos';
import { sonar } from '../../servicios/sonido';
import { useApp } from '../../estado';

type Zona = string; // 'origen', 'origen2', 'destino', 'canasta-0', …

export default function Arrastrar(props: PropsInteraccion) {
  const { ajustes } = useApp();
  const i = props.ej.interaccion;
  const modo = i.tipo === 'arrastrar' ? i.modo : 'juntar';
  const a = i.tipo === 'arrastrar' ? i.a : 0;
  const b = i.tipo === 'arrastrar' ? i.b : 0;

  const inicial = (): Zona[] => {
    if (modo === 'juntar') return [...Array(a).fill('origen'), ...Array(b).fill('origen2')];
    return Array(a).fill('origen');
  };
  const [zonas, setZonas] = useState<Zona[]>(inicial);
  const [arrastre, setArrastre] = useState<{ ficha: number; x: number; y: number } | null>(null);
  const [sobre, setSobre] = useState<Zona | null>(null);
  const movido = useRef(false);

  const destinos: Zona[] = modo === 'repartir' ? Array.from({ length: b }, (_, k) => `canasta-${k}`) : ['destino'];

  const zonaEn = (x: number, y: number): Zona | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-zona]') as HTMLElement | null;
    return el?.dataset.zona ?? null;
  };

  useEffect(() => {
    if (!arrastre) return;
    const mover = (e: PointerEvent) => {
      movido.current = true;
      setArrastre((s) => (s ? { ...s, x: e.clientX, y: e.clientY } : s));
      setSobre(zonaEn(e.clientX, e.clientY));
    };
    const soltar = (e: PointerEvent) => {
      const z = zonaEn(e.clientX, e.clientY);
      setArrastre((s) => {
        if (s && z) {
          setZonas((zs) => zs.map((v, k) => (k === s.ficha ? z : v)));
          sonar('toque', ajustes.sonido);
        }
        return null;
      });
      setSobre(null);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
    };
  }, [arrastre, ajustes.sonido]);

  if (i.tipo !== 'arrastrar') return null;

  /** Tocar sin arrastrar: mueve la ficha al destino (o a la canasta con menos). */
  const tocar = (k: number) => {
    if (movido.current) return;
    setZonas((zs) => {
      const actual = zs[k];
      if (destinos.includes(actual)) return zs.map((v, j) => (j === k ? (modo === 'juntar' ? (k < a ? 'origen' : 'origen2') : 'origen') : v));
      const conteo = destinos.map((d) => zs.filter((v) => v === d).length);
      const destino = destinos[conteo.indexOf(Math.min(...conteo))];
      return zs.map((v, j) => (j === k ? destino : v));
    });
    sonar('toque', ajustes.sonido);
  };

  const ficha = (k: number) => (
    <button
      key={k}
      type="button"
      className="ficha boton plano"
      style={arrastre?.ficha === k ? { opacity: 0.3 } : undefined}
      onPointerDown={(e) => {
        if (props.bloqueado) return;
        movido.current = false;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        setArrastre({ ficha: k, x: e.clientX, y: e.clientY });
      }}
      onClick={() => !props.bloqueado && tocar(k)}
      aria-label={`Mover ${nombreObjeto(i.objeto)}`}
    >
      <DibujoObjeto objeto={i.objeto} tamano={38} etiqueta="" />
    </button>
  );

  const deposito = (zona: Zona, rotulo: string, clase = '') => {
    const fichas = zonas.map((z, k) => (z === zona ? k : -1)).filter((k) => k >= 0);
    return (
      <div key={zona} data-zona={zona} className={`deposito ${clase} ${sobre === zona ? 'activo' : ''}`} aria-label={`${rotulo}: ${fichas.length}`}>
        <div className="rotulo">
          <span>{rotulo}</span>
        </div>
        {fichas.map(ficha)}
      </div>
    );
  };

  const rotuloDestino = modo === 'juntar' ? 'Canasta grande' : modo === 'quitar' ? 'Lo que se llevan' : '';

  return (
    <div className="columna">
      <div className="arrastre" role="group" aria-label="Zona para arrastrar">
        {modo === 'juntar' && (
          <div className="fila" style={{ alignItems: 'stretch' }}>
            <div style={{ flex: 1 }}>{deposito('origen', 'Canasta 1')}</div>
            <div style={{ flex: 1 }}>{deposito('origen2', 'Canasta 2')}</div>
          </div>
        )}
        {modo !== 'juntar' && deposito('origen', modo === 'quitar' ? 'Lo que había' : 'Para repartir')}
        {modo === 'repartir' ? (
          <div className="canastas" style={{ gridTemplateColumns: `repeat(${b}, 1fr)` }}>
            {destinos.map((z, k) => deposito(z, `Canasta ${k + 1}`, 'destino'))}
          </div>
        ) : (
          deposito('destino', rotuloDestino, 'destino')
        )}
        <p className="pequeno suave" style={{ margin: 0 }}>
          Arrastra con el dedo o toca cada {nombreObjeto(i.objeto)} para moverlo.
        </p>
      </div>
      {arrastre && (
        <div className="ficha arrastrando" style={{ left: arrastre.x, top: arrastre.y }} aria-hidden="true">
          <DibujoObjeto objeto={i.objeto} tamano={44} etiqueta="" />
        </div>
      )}
      <Numerica {...props} />
    </div>
  );
}
