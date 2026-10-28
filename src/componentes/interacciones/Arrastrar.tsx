// Arrastrar y soltar con Pointer Events (no la API de arrastre de HTML5).
// También se puede tocar una ficha para moverla (más fácil para manos pequeñas).
// Lo que ya está en el recipiente no se sale con un toque ni al deslizar el dedo para bajar
// por la página: se saca con «Sacar una» (o arrastrándola con el ratón).

import { useEffect, useRef, useState } from 'react';
import { DibujoObjeto, DibujoRecipiente, esFemenino, nombreObjeto } from '../Ilustraciones';
import type { Recipiente } from '../../juego/tipos';
import Numerica from './Numerica';
import ContenedorRecipiente, { formaRecipiente } from '../Recipiente';
import Icono from '../Icono';
import type { PropsInteraccion } from './tipos';
import { sonar } from '../../servicios/sonido';
import { useApp } from '../../estado';

type Zona = string; // 'origen', 'origen2', 'destino', 'canasta-0', …

/** Movimiento (px) a partir del cual el dedo arrastra en vez de tocar. */
const UMBRAL = 10;
/** Franja (px) junto al borde de la ventana donde la página se desplaza sola al arrastrar. */
const BORDE = 72;

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

  // Último punto del dedo: el desplazamiento automático lo usa para saber hacia dónde ir.
  const dedoEn = useRef({ x: 0, y: 0 });
  const refZona = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!arrastre) return;
    const { dedo, ficha } = arrastre;
    const mover = (e: PointerEvent) => {
      if (e.pointerId !== dedo) return;
      if (Math.hypot(e.clientX - inicioToque.current.x, e.clientY - inicioToque.current.y) > UMBRAL) movido.current = true;
      dedoEn.current = { x: e.clientX, y: e.clientY };
      setArrastre((s) => (s ? { ...s, x: e.clientX, y: e.clientY } : s));
      setSobre(zonaEn(e.clientX, e.clientY));
    };
    const soltar = (e: PointerEvent) => {
      if (e.pointerId !== dedo) return;
      // Cancelado por el sistema (llamada, gesto del celular) o soltado fuera de un recipiente:
      // la ficha se queda donde estaba.
      const z = e.type === 'pointercancel' || !movido.current ? null : zonaEn(e.clientX, e.clientY);
      if (z) {
        setZonas((zs) => {
          if (zs[ficha] === z) return zs;
          sonar('toque', ajustes.sonido);
          return zs.map((v, k) => (k === ficha ? z : v));
        });
      }
      setArrastre(null);
      setSobre(null);
    };
    // Cerca del borde de arriba o de abajo la página se desplaza sola: así se llega a un
    // recipiente que quedó fuera de la pantalla en un celular pequeño.
    let cuadro = 0;
    const desplazar = () => {
      const { x, y } = dedoEn.current;
      const abajo = window.innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-pie')) || 0);
      let paso = y < BORDE ? -Math.ceil((BORDE - y) / 6) : y > abajo - BORDE ? Math.ceil((y - (abajo - BORDE)) / 6) : 0;
      // Solo mientras quede zona de arrastre por mostrar: no se pasa de largo hasta el teclado.
      const zona = refZona.current?.getBoundingClientRect();
      if (zona && ((paso > 0 && zona.bottom <= abajo) || (paso < 0 && zona.top >= BORDE))) paso = 0;
      if (paso && movido.current) {
        window.scrollBy(0, paso);
        setSobre(zonaEn(x, y));
      }
      cuadro = requestAnimationFrame(desplazar);
    };
    dedoEn.current = { x: arrastre.x, y: arrastre.y };
    cuadro = requestAnimationFrame(desplazar);
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastre?.ficha, arrastre?.dedo, ajustes.sonido]);

  if (i.tipo !== 'arrastrar') return null;

  /** De dónde salió la ficha `k` (a donde vuelve si se saca). */
  const casa = (k: number): Zona => (modo === 'juntar' && k >= a ? 'origen2' : 'origen');

  /** Tocar sin arrastrar: mueve la ficha al destino (o a la canasta con menos). */
  const tocar = (k: number, conTeclado: boolean) => {
    if (movido.current) {
      // Fue un arrastre; el próximo toque (o Enter con el teclado) sí cuenta.
      movido.current = false;
      return;
    }
    const puesta = destinos.includes(zonas[k]);
    // Un toque sobre lo que ya está en el recipiente no lo saca (pasaba sin querer al contar o al
    // bajar por la página). Con el teclado sí: Enter es la única forma de devolverla.
    if (puesta && !conTeclado) return;
    setZonas((zs) => {
      if (puesta) return zs.map((v, j) => (j === k ? casa(k) : v));
      const conteo = destinos.map((d) => zs.filter((v) => v === d).length);
      const destino = destinos[conteo.indexOf(Math.min(...conteo))];
      return zs.map((v, j) => (j === k ? destino : v));
    });
    sonar('toque', ajustes.sonido);
  };

  /** Saca del recipiente la última ficha que entró y la devuelve a su sitio. */
  const sacarUna = (zona: Zona) => {
    const k = zonas.lastIndexOf(zona);
    if (k < 0) return;
    setZonas((zs) => zs.map((v, j) => (j === k ? casa(k) : v)));
    sonar('toque', ajustes.sonido);
  };

  const ficha = (k: number) => {
    const puesta = destinos.includes(zonas[k]);
    return (
      <button
        key={k}
        type="button"
        className={`ficha boton plano ${puesta ? 'puesta' : 'movible'}`}
        style={arrastre?.ficha === k ? { opacity: 0.3 } : undefined}
        onPointerDown={(e) => {
          if (props.bloqueado || arrastre) return;
          // Con el dedo, lo que ya está en el recipiente no se arrastra: deslizar sobre ello desplaza la página.
          if (puesta && e.pointerType !== 'mouse') return;
          movido.current = false;
          inicioToque.current = { x: e.clientX, y: e.clientY };
          (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
          setArrastre({ ficha: k, x: e.clientX, y: e.clientY, dedo: e.pointerId });
        }}
        // detail === 0: lo activó el teclado (Enter o espacio), no un toque.
        onClick={(e) => !props.bloqueado && tocar(k, e.detail === 0)}
        aria-label={puesta ? `${nombreObjeto(i.objeto)} en el recipiente` : `Mover ${nombreObjeto(i.objeto)}`}
      >
        <DibujoObjeto objeto={i.objeto} tamano={38} etiqueta="" />
      </button>
    );
  };

  const unaFicha = esFemenino(i.objeto) ? 'una' : 'uno';

  const deposito = (zona: Zona, rec: Recipiente, clase = '', indice = 0) => {
    const fichas = zonas.map((z, k) => (z === zona ? k : -1)).filter((k) => k >= 0);
    const recipiente = (
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
    if (!destinos.includes(zona)) return recipiente;
    return (
      <div key={zona} className="deposito-destino">
        {recipiente}
        <button
          type="button"
          className="boton enlace sacar-una"
          // Sin nada adentro se esconde, pero conserva su lugar: el recipiente no salta.
          style={fichas.length ? undefined : { visibility: 'hidden' }}
          disabled={props.bloqueado || !fichas.length}
          onClick={() => sacarUna(zona)}
          aria-label={`Sacar ${unaFicha} de ${rec.nombre}`}
        >
          <Icono nombre="menos" tamano={18} anim="no" /> Sacar {unaFicha}
        </button>
      </div>
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
      <div ref={refZona} className="arrastre" role="group" aria-label="Zona para arrastrar">
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
          Arrastra con el dedo o toca cada {nombreObjeto(i.objeto)} para {esFemenino(i.objeto) ? 'moverla' : 'moverlo'}. Si pusiste de más, toca «Sacar {unaFicha}».
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
