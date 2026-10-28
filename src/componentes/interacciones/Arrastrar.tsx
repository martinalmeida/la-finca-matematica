// Arrastrar y soltar con Pointer Events (no la API de arrastre de HTML5).
// También se puede tocar una ficha para moverla (más fácil para manos pequeñas).

import { useEffect, useRef, useState } from 'react';
import { DibujoObjeto, DibujoRecipiente, esFemenino, nombreObjeto } from '../Ilustraciones';
import type { Recipiente } from '../../juego/tipos';
import Numerica from './Numerica';
import ContenedorRecipiente, { formaRecipiente } from '../Recipiente';
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
  const [arrastre, setArrastre] = useState<{ ficha: number; x: number; y: number; dedo: number } | null>(null);
  // Punto donde se puso el dedo: menos de 8 px de movimiento es un toque, no un arrastre.
  const inicioToque = useRef({ x: 0, y: 0 });
  const [sobre, setSobre] = useState<Zona | null>(null);
  const movido = useRef(false);

  const destinos: Zona[] = modo === 'repartir' ? Array.from({ length: b }, (_, k) => `canasta-${k}`) : ['destino'];

  const zonaEn = (x: number, y: number): Zona | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-zona]') as HTMLElement | null;
    return el?.dataset.zona ?? null;
  };

  useEffect(() => {
    if (!arrastre) return;
    const { dedo, ficha } = arrastre;
    const mover = (e: PointerEvent) => {
      if (e.pointerId !== dedo) return;
      if (Math.hypot(e.clientX - inicioToque.current.x, e.clientY - inicioToque.current.y) > 8) movido.current = true;
      setArrastre((s) => (s ? { ...s, x: e.clientX, y: e.clientY } : s));
      setSobre(zonaEn(e.clientX, e.clientY));
    };
    const soltar = (e: PointerEvent) => {
      if (e.pointerId !== dedo) return;
      // Cancelado por el sistema (llamada, gesto del celular): la ficha vuelve a su sitio.
      const z = e.type === 'pointercancel' || !movido.current ? null : zonaEn(e.clientX, e.clientY);
      if (z) {
        setZonas((zs) => zs.map((v, k) => (k === ficha ? z : v)));
        sonar('toque', ajustes.sonido);
      }
      setArrastre(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastre?.ficha, arrastre?.dedo, ajustes.sonido]);

  if (i.tipo !== 'arrastrar') return null;

  /** Tocar sin arrastrar: mueve la ficha al destino (o a la canasta con menos). */
  const tocar = (k: number) => {
    if (movido.current) {
      // Fue un arrastre; el próximo toque (o Enter con el teclado) sí cuenta.
      movido.current = false;
      return;
    }
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
        if (props.bloqueado || arrastre) return;
        movido.current = false;
        inicioToque.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        setArrastre({ ficha: k, x: e.clientX, y: e.clientY, dedo: e.pointerId });
      }}
      onClick={() => !props.bloqueado && tocar(k)}
      aria-label={`Mover ${nombreObjeto(i.objeto)}`}
    >
      <DibujoObjeto objeto={i.objeto} tamano={38} etiqueta="" />
    </button>
  );

  const deposito = (zona: Zona, rec: Recipiente, clase = '', indice = 0) => {
    const fichas = zonas.map((z, k) => (z === zona ? k : -1)).filter((k) => k >= 0);
    return (
      <ContenedorRecipiente
        key={zona}
        data-zona={zona}
        forma={formaRecipiente(rec.dibujo)}
        activo={sobre === zona}
        className={`deposito ${clase}`}
        aria-label={`${rec.nombre}: ${fichas.length}`}
        rotulo={
          <div className="recipiente-rotulo">
            {/* Con forma propia el dibujo sobra: el recipiente ya se ve. Personas y animales sí lo llevan. */}
            {!formaRecipiente(rec.dibujo) && <DibujoRecipiente dibujo={rec.dibujo} indice={indice} tamano={24} />}
            <span className="rotulo-texto">{rec.nombre}</span>
          </div>
        }
      >
        {fichas.map(ficha)}
      </ContenedorRecipiente>
    );
  };

  // Rótulos por defecto: canastas (lo que dicen los enunciados de juntar y repartir de 1.º).
  const canasta = (nombre: string): Recipiente => ({ nombre, dibujo: 'canasta' });
  const origen = i.origen ?? (modo === 'juntar' ? canasta('Canasta 1') : { nombre: modo === 'quitar' ? 'Lo que había' : 'Para repartir' });
  const origen2 = i.origen2 ?? canasta('Canasta 2');
  const destino: Recipiente = i.destino ?? (modo === 'juntar' ? canasta('Canasta grande') : modo === 'quitar' ? { nombre: 'Lo que se llevan' } : canasta('Canasta'));
  // Repartir: nunca más de 3 depósitos por fila, y 2 si el nombre es largo («Compañero 5» no cabe en un tercio de 320 px).
  const columnas = b <= 2 ? b : b === 4 || destino.nombre.length > 6 ? 2 : 3;

  return (
    <div className="columna">
      <div className="arrastre" role="group" aria-label="Zona para arrastrar">
        {modo === 'juntar' && (
          <div className="fila" style={{ alignItems: 'stretch' }}>
            <div style={{ flex: 1, minWidth: 0 }}>{deposito('origen', origen)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>{deposito('origen2', origen2, '', 1)}</div>
          </div>
        )}
        {modo !== 'juntar' && deposito('origen', origen)}
        {modo === 'repartir' ? (
          <div className="canastas" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
            {destinos.map((z, k) => deposito(z, { ...destino, nombre: `${destino.nombre} ${k + 1}` }, 'destino', k))}
          </div>
        ) : (
          deposito('destino', destino, 'destino')
        )}
        <p className="pequeno suave" style={{ margin: 0 }}>
          Arrastra con el dedo o toca cada {nombreObjeto(i.objeto)} para {esFemenino(i.objeto) ? 'moverla' : 'moverlo'}.
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
