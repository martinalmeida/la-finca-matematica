// Barras horizontales por categoría (estudiantes, temas…). Etiqueta a la izquierda (hasta dos
// líneas, el texto completo en `title`), valor en la punta y `n` atenuado. Con `resaltar`, esas
// barras van en acento y las demás en gris de contexto. Con `alPulsar`, cada fila es un botón.

import { useMemo, useRef } from 'react';
import type { CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from 'react';
import type { Categoria, Escala } from './tipos';
import { fmtNum, fmtValor } from './formato';
import { TablaSimple, Tooltip, VerTabla, anchoTexto, maximo, puntoRelativo, useAncho, useTooltip, useEscape } from './nucleo';

type Props = {
  categorias: Categoria[];
  escala: Escala;
  /** 'valor' (por defecto): de mayor a menor, sin dato al final. 'original': como llegan. */
  orden?: 'valor' | 'original';
  meta?: { valor: number; etiqueta: string };
  /** Ids que van en acento; el resto en gris (énfasis). */
  resaltar?: string[];
  /** Máximo de la escala (por defecto 100 en pct; el mayor valor en otro caso). */
  max?: number;
  /** Si se da, cada barra es un botón (para entrar al detalle de un estudiante o tema). */
  alPulsar?: (id: string) => void;
};

const textoN = (n: number | undefined) => (n === undefined ? '' : `n = ${fmtNum(n)}`);

export function GraficaBarras({ categorias, escala, orden = 'valor', meta, resaltar, max, alPulsar }: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const { id, tip, setTip, ocultar } = useTooltip();
  useEscape(tip !== null, ocultar);
  const filasRef = useRef<(HTMLElement | null)[]>([]);

  const filas = useMemo(() => {
    if (orden === 'original') return categorias;
    return [...categorias].sort((a, b) => {
      if (a.valor === null) return b.valor === null ? 0 : 1;
      if (b.valor === null) return -1;
      return b.valor - a.valor;
    });
  }, [categorias, orden]);

  const tope = max ?? (escala === 'pct' ? 100 : Math.max(maximo(categorias.map((c) => c.valor)), meta?.valor ?? 0) || 1);
  const conEnfasis = !!resaltar && resaltar.length > 0;
  // Espacio a la derecha para el valor y la n de la barra más larga.
  const reserva = Math.ceil(Math.max(...filas.map((c) => anchoTexto(c.valor === null ? 'sin datos' : fmtValor(c.valor, escala), 13, 600) + (c.n !== undefined ? anchoTexto(textoN(c.n), 12) + 6 : 0)), 30) + 12);
  const pct = (v: number) => `${(100 * Math.max(0, Math.min(v, tope))) / tope}%`;
  const estiloPista: CSSProperties = { right: reserva };

  const mostrar = (c: Categoria, el: HTMLElement) => {
    const p = puntoRelativo(el, ref.current);
    setTip({
      x: p.x,
      y: p.y + 4,
      titulo: c.etiqueta,
      filas: [{ valor: c.valor === null ? 'Sin datos' : fmtValor(c.valor, escala), etiqueta: c.n !== undefined ? textoN(c.n) : undefined }],
      nota: c.detalle,
    });
  };
  const alTecla = (i: number) => (e: KeyboardEvent<HTMLElement>) => {
    const sig = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : null;
    if (sig === null) return;
    e.preventDefault();
    filasRef.current[Math.max(0, Math.min(filas.length - 1, sig))]?.focus();
  };

  const maxFila = filas.find((c) => c.valor !== null);
  const resumen = `Gráfica de barras con ${filas.length} categorías.${maxFila ? ` Mayor: ${maxFila.etiqueta}, ${fmtValor(maxFila.valor, escala)}.` : ''}${meta ? ` Meta: ${fmtValor(meta.valor, escala)}.` : ''}`;

  return (
    <div className="viz viz-grafica" role="group" aria-label={resumen}>
      <div ref={ref} className={`viz-lienzo viz-barras${meta ? ' viz-con-meta' : ''}`} onPointerLeave={ocultar}>
        {meta && (
          <div className="viz-barras-fila viz-barras-cabeza" aria-hidden="true">
            <span />
            <span className="viz-barras-celda">
              <span className="viz-barras-pista" style={estiloPista}>
                <span className={`viz-meta-rotulo${meta.valor / tope > 0.5 ? ' viz-a-la-izq' : ''}`} style={{ left: pct(meta.valor) }}>
                  {meta.etiqueta} {fmtValor(meta.valor, escala)}
                </span>
              </span>
            </span>
          </div>
        )}
        {filas.map((c, i) => {
          const color = conEnfasis ? (resaltar!.includes(c.id) ? 'var(--viz-serie-1)' : 'var(--viz-gris)') : 'var(--viz-serie-1)';
          const contenido = (
            <>
              <span className="viz-barras-etiqueta" title={c.etiqueta}>
                {c.etiqueta}
              </span>
              <span className="viz-barras-celda">
                <span className="viz-barras-pista" style={estiloPista}>
                  {meta && <i className="viz-meta-vertical" style={{ left: pct(meta.valor) }} />}
                  {c.valor !== null && c.valor > 0 && <span className="viz-barra" style={{ width: pct(c.valor), background: color }} />}
                  <span className="viz-barras-valor" style={{ left: c.valor === null ? 4 : `calc(${pct(c.valor)} + 4px)` }}>
                    {c.valor === null ? <span className="viz-n">sin datos</span> : <b>{fmtValor(c.valor, escala)}</b>}
                    {c.n !== undefined && <span className="viz-n">{textoN(c.n)}</span>}
                  </span>
                </span>
              </span>
            </>
          );
          const comunes = {
            className: `viz-barras-fila${alPulsar ? ' viz-pulsable' : ''}`,
            'aria-describedby': tip?.titulo === c.etiqueta ? id : undefined,
            onPointerEnter: (e: PointerEvent<HTMLElement>) => mostrar(c, e.currentTarget),
            onFocus: (e: FocusEvent<HTMLElement>) => mostrar(c, e.currentTarget),
            onBlur: ocultar,
            onKeyDown: alTecla(i),
            ref: (el: HTMLElement | null) => {
              filasRef.current[i] = el;
            },
          };
          const lectura = `${c.etiqueta}: ${c.valor === null ? 'sin datos' : fmtValor(c.valor, escala)}${c.n !== undefined ? `, ${textoN(c.n).replace(/ /g, ' ')}` : ''}`;
          return alPulsar ? (
            <button key={c.id} type="button" {...comunes} aria-label={`${lectura}. Ver detalle`} onClick={() => alPulsar(c.id)}>
              {contenido}
            </button>
          ) : (
            <div key={c.id} {...comunes} role="img" aria-label={lectura} tabIndex={i === 0 ? 0 : -1}>
              {contenido}
            </div>
          );
        })}
        <Tooltip estado={tip} ancho={ancho} id={id} />
      </div>
      <VerTabla>
        <TablaSimple
          encabezados={['Categoría', 'Valor', ...(filas.some((c) => c.n !== undefined) ? ['n'] : []), ...(filas.some((c) => c.detalle) ? ['Detalle'] : [])]}
          filas={filas.map((c) => [
            c.etiqueta,
            fmtValor(c.valor, escala),
            ...(filas.some((f) => f.n !== undefined) ? [c.n === undefined ? '—' : fmtNum(c.n)] : []),
            ...(filas.some((f) => f.detalle) ? [c.detalle ?? ''] : []),
          ])}
          numericas={filas.some((c) => c.n !== undefined) ? [1, 2] : [1]}
        />
      </VerTabla>
    </div>
  );
}
