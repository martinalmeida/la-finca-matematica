// Piezas internas compartidas por las gráficas: ancho del contenedor, escalas, tooltip,
// leyenda y la vista de tabla («Ver tabla»).

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import type { Escala } from './tipos';
import { esFechaIso, fmtFechaCorta } from './formato';

/* ---------------- Ancho del contenedor ---------------- */

/** Ancho en píxeles del elemento (se actualiza con ResizeObserver). 0 hasta la primera medida. */
export function useAncho<T extends HTMLElement = HTMLDivElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // En la copia para imprimir (oculta en pantalla hasta el momento de imprimir) no se puede medir:
    // se usa el ancho de la hoja carta impresa, completa o media si va en una rejilla de dos.
    const anchoImpreso = () => (el.closest('.rejilla-dos') ? 330 : 680);
    const medir = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setAncho(w);
      else if (el.closest('.zona-impresion')) setAncho(anchoImpreso());
    };
    medir();
    if (typeof ResizeObserver === 'undefined') {
      // Sin ResizeObserver (pruebas en jsdom): un ancho razonable para poder dibujar.
      if (!el.getBoundingClientRect().width) setAncho(600);
      return;
    }
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho];
}

/* ---------------- Escalas ---------------- */

/** Marcas «redondas» del eje desde 0 hasta cubrir `max` (para pct siempre 0–100). */
export function marcasEje(max: number, escala: Escala, cuantas = 4): number[] {
  if (escala === 'pct' && max <= 100) return [0, 25, 50, 75, 100];
  const tope = max > 0 ? max : 1;
  const crudo = tope / cuantas;
  let paso: number;
  if (escala === 'min') {
    const pasos = [1, 2, 5, 10, 15, 20, 30, 60, 90, 120, 180, 240, 360, 480, 600, 720, 1200, 1800, 2400, 3000, 6000];
    paso = pasos.find((p) => p >= crudo) ?? Math.ceil(crudo / 600) * 600;
  } else {
    const mag = 10 ** Math.floor(Math.log10(crudo));
    const norm = crudo / mag;
    paso = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    // Conteos: sin pasos fraccionarios cuando los valores son enteros grandes.
    if (paso < 1 && tope >= 1) paso = 1;
  }
  const marcas: number[] = [];
  for (let v = 0; v < tope + paso * 0.999; v += paso) marcas.push(Math.round(v * 1e6) / 1e6);
  return marcas;
}

/** Máximo de un conjunto de valores (ignorando null). */
export function maximo(valores: (number | null | undefined)[]): number {
  let m = 0;
  for (const v of valores) if (v !== null && v !== undefined && Number.isFinite(v) && v > m) m = v;
  return m;
}

let lienzoMedida: CanvasRenderingContext2D | null | undefined;
let fuenteMedida = '';

/** Ancho de un texto en píxeles: medido con canvas en la fuente de la página (o estimado si no hay canvas). */
export function anchoTexto(texto: string, tam = 12, peso = 400): number {
  if (lienzoMedida === undefined) {
    try {
      lienzoMedida = typeof document !== 'undefined' && !/jsdom/i.test(navigator.userAgent) ? document.createElement('canvas').getContext('2d') : null;
      if (lienzoMedida) fuenteMedida = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    } catch {
      lienzoMedida = null;
    }
  }
  if (lienzoMedida) {
    lienzoMedida.font = `${peso} ${tam}px ${fuenteMedida}`;
    return lienzoMedida.measureText(texto).width;
  }
  let w = 0;
  for (const c of texto) w += /[\s.,:;|il1!']/.test(c) ? 0.3 : /[A-ZÑMW%mw]/.test(c) ? 0.85 : 0.58;
  return w * tam;
}

/** Etiqueta del eje x: fechas ISO como «12 oct»; cualquier otro texto tal cual. */
export function etiquetaX(x: string): string {
  return esFechaIso(x) ? fmtFechaCorta(x) : x;
}

/** ¿Las fechas van de semana en semana? (para titular el tooltip «Semana del 12 oct»). */
export function sonSemanas(x: string[]): boolean {
  if (x.length < 2 || !x.every(esFechaIso)) return false;
  const dias = (a: string, b: string) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86400000);
  for (let i = 1; i < x.length; i++) if (dias(x[i - 1], x[i]) !== 7) return false;
  return true;
}

/** Título del tooltip para la posición i del eje x. */
export function tituloX(x: string[], i: number): string {
  const v = x[i];
  if (!esFechaIso(v)) return v;
  return sonSemanas(x) ? `Semana del ${fmtFechaCorta(v)}` : fmtFechaCorta(v);
}

/** Cada cuántas posiciones se rotula el eje x para que las etiquetas no choquen. */
export function pasoEtiquetas(n: number, anchoPlot: number, anchoEtiqueta: number): number {
  if (n <= 1) return 1;
  const caben = Math.max(1, Math.floor(anchoPlot / (anchoEtiqueta + 10)));
  return Math.max(1, Math.ceil(n / caben));
}

/** Rectángulo con las esquinas del extremo de datos redondeadas (4 px) y la base cuadrada. */
export function rutaColumna(x: number, y: number, w: number, h: number, r = 4): string {
  if (h <= 0 || w <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/* ---------------- Tooltip ---------------- */

export type FilaTip = { valor: string; etiqueta?: string; color?: string; forma?: 'linea' | 'punto' };
export type EstadoTip = { x: number; y: number; titulo?: string; filas: FilaTip[]; nota?: string } | null;

/** Un solo tooltip por gráfica, dentro del envoltorio relativo y sin salirse de él. */
export function Tooltip({ estado, ancho, id }: { estado: EstadoTip; ancho: number; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!estado || !el) {
      setPos(null);
      return;
    }
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = Math.max(4, Math.min(estado.x - w / 2, ancho - w - 4));
    let top = estado.y - h - 12;
    if (top < 4) top = estado.y + 16;
    setPos({ left, top });
  }, [estado, ancho]);
  const estilo: CSSProperties = pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' };
  return (
    <div ref={ref} id={id} role="tooltip" className="viz-tip" hidden={!estado} style={estilo}>
      {estado?.titulo && <div className="viz-tip-titulo">{estado.titulo}</div>}
      {estado?.filas.map((f, i) => (
        <div className="viz-tip-fila" key={i}>
          {f.color && <i className={f.forma === 'punto' ? 'viz-clave-punto' : 'viz-clave-linea'} style={{ background: f.color }} aria-hidden="true" />}
          <b>{f.valor}</b>
          {f.etiqueta && <span>{f.etiqueta}</span>}
        </div>
      ))}
      {estado?.nota && <div className="viz-tip-nota">{estado.nota}</div>}
    </div>
  );
}

/** Estado del tooltip de una gráfica + su id (para aria-describedby). */
export function useTooltip() {
  const id = useId();
  const [tip, setTip] = useState<EstadoTip>(null);
  const ocultar = useCallback(() => setTip(null), []);
  return { id: `tip${id.replace(/:/g, '')}`, tip, setTip, ocultar };
}

/** Coordenadas de un elemento relativas al envoltorio de la gráfica (centro arriba). */
export function puntoRelativo(el: Element, envoltorio: Element | null): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  const e = envoltorio?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return { x: r.left - e.left + r.width / 2, y: r.top - e.top };
}

/** Cierra el tooltip con Escape (también cuando el foco está en otra parte de la gráfica). */
export function useEscape(activo: boolean, ocultar: () => void) {
  useEffect(() => {
    if (!activo) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && ocultar();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [activo, ocultar]);
}

/* ---------------- Leyenda ---------------- */

export type ItemLeyenda = { id: string; nombre: string; color: string; forma?: 'linea' | 'caja' | 'punto'; extra?: ReactNode };

/** Leyenda: la forma de la clave imita la marca (línea para líneas, caja para barras). El texto va en tinta. */
export function Leyenda({ items }: { items: ItemLeyenda[] }) {
  return (
    <ul className="viz-leyenda">
      {items.map((it) => (
        <li key={it.id}>
          <i className={`viz-clave-${it.forma ?? 'caja'}`} style={{ background: it.color }} aria-hidden="true" />
          <span>{it.nombre}</span>
          {it.extra}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Tarjeta y «Ver tabla» ---------------- */

/** Dentro de una Tarjeta con tabla propia, las gráficas no repiten su tabla automática. */
export const ContextoTarjeta = createContext<{ tablaPropia: boolean }>({ tablaPropia: false });

/** «Ver tabla»: los mismos datos de la gráfica en una tabla HTML (alternativa accesible). */
export function VerTabla({ children, forzar = false }: { children: ReactNode; forzar?: boolean }) {
  const { tablaPropia } = useContext(ContextoTarjeta);
  if (tablaPropia && !forzar) return null;
  return (
    <details className="viz-ver-tabla">
      <summary>Ver tabla</summary>
      <div className="viz-tabla-envoltorio">{children}</div>
    </details>
  );
}

/** Tabla sencilla para «Ver tabla». La primera columna es encabezado de fila. */
export function TablaSimple({ encabezados, filas, numericas = [] }: { encabezados: string[]; filas: (string | number)[][]; numericas?: number[] }) {
  const der = (i: number) => (i > 0 && (numericas.length === 0 || numericas.includes(i)) ? 'viz-num' : undefined);
  return (
    <table className="viz-tabla">
      <thead>
        <tr>
          {encabezados.map((e, i) => (
            <th key={i} scope="col" className={der(i)}>
              {e}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((f, j) => (
          <tr key={j}>
            {f.map((c, i) =>
              i === 0 ? (
                <th key={i} scope="row">
                  {c}
                </th>
              ) : (
                <td key={i} className={der(i)}>
                  {c}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
