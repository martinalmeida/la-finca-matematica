// Pesas (dumbbell): prueba de entrada (naranja, ranura 2) y prueba final (azul, ranura 1) por
// fila, unidas por un segmento gris. A la derecha, el cambio en tinta con ▲/▼. Leyenda siempre.
// Se puede ordenar como llegan o por avance.

import { useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react';
import type { Escala } from './tipos';
import { COLOR_ENTRADA, COLOR_FINAL } from './colores';
import { fmtDelta, fmtEje, fmtNum, fmtValor, unidadDelta } from './formato';
import { Leyenda, TablaSimple, Tooltip, VerTabla, marcasEje, maximo, puntoRelativo, useAncho, useEscape, useTooltip } from './nucleo';

type Fila = { id: string; etiqueta: string; antes: number | null; despues: number | null; n?: number };

type Props = {
  filas: Fila[];
  escala: 'pct' | 'num';
  max?: number;
  /** Nombres de las dos pruebas (por defecto «Prueba de entrada» y «Prueba final»). */
  nombres?: [string, string];
};

const delta = (f: Fila) => (f.antes !== null && f.despues !== null ? f.despues - f.antes : null);

export function GraficaPrePost({ filas, escala, max, nombres = ['Prueba de entrada', 'Prueba final'] }: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const { id, tip, setTip, ocultar } = useTooltip();
  useEscape(tip !== null, ocultar);
  const [porAvance, setPorAvance] = useState(false);
  const filasRef = useRef<(HTMLDivElement | null)[]>([]);
  const unidad = unidadDelta(escala as Escala);

  const ordenadas = useMemo(() => {
    if (!porAvance) return filas;
    return [...filas].sort((a, b) => {
      const da = delta(a);
      const db = delta(b);
      if (da === null) return db === null ? 0 : 1;
      if (db === null) return -1;
      return db - da;
    });
  }, [filas, porAvance]);

  const marcas = useMemo(() => (max !== undefined ? marcasEje(max, escala) : marcasEje(maximo(filas.flatMap((f) => [f.antes, f.despues])), escala)), [filas, escala, max]);
  const tope = max ?? (marcas[marcas.length - 1] || 1);
  const pos = (v: number) => `${(100 * Math.max(0, Math.min(v, tope))) / tope}%`;

  const mostrar = (f: Fila, el: HTMLElement) => {
    const p = puntoRelativo(el, ref.current);
    const d = delta(f);
    setTip({
      x: p.x,
      y: p.y + 4,
      titulo: f.etiqueta,
      filas: [
        { valor: fmtValor(f.antes, escala), etiqueta: nombres[0], color: COLOR_ENTRADA, forma: 'punto' },
        { valor: fmtValor(f.despues, escala), etiqueta: nombres[1], color: COLOR_FINAL, forma: 'punto' },
      ],
      nota: [d !== null ? `Cambio: ${fmtDelta(d, unidad)}` : '', f.n !== undefined ? `n = ${fmtNum(f.n)}` : ''].filter(Boolean).join(' · ') || undefined,
    });
  };
  const alTecla = (i: number) => (e: KeyboardEvent<HTMLElement>) => {
    const sig = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : null;
    if (sig === null) return;
    e.preventDefault();
    filasRef.current[Math.max(0, Math.min(ordenadas.length - 1, sig))]?.focus();
  };

  const conDelta = filas.map(delta).filter((d): d is number => d !== null);
  const promedio = conDelta.length ? conDelta.reduce((a, b) => a + b, 0) / conDelta.length : null;
  const resumen = `Comparación entre ${nombres[0].toLowerCase()} y ${nombres[1].toLowerCase()} en ${filas.length} filas.${promedio !== null ? ` Cambio promedio: ${fmtDelta(promedio, unidad)}.` : ''}`;
  const angosto = ancho > 0 && ancho < 420;

  return (
    <div className="viz viz-grafica" role="group" aria-label={resumen}>
      <div className="viz-controles">
        <Leyenda
          items={[
            { id: 'entrada', nombre: nombres[0], color: COLOR_ENTRADA, forma: 'punto' },
            { id: 'final', nombre: nombres[1], color: COLOR_FINAL, forma: 'punto' },
          ]}
        />
        <div className="viz-segmentado" role="group" aria-label="Orden">
          <button type="button" aria-pressed={!porAvance} onClick={() => setPorAvance(false)}>
            Original
          </button>
          <button type="button" aria-pressed={porAvance} onClick={() => setPorAvance(true)}>
            Por avance
          </button>
        </div>
      </div>
      <div ref={ref} className={`viz-lienzo viz-pesas${angosto ? ' viz-angosto' : ''}`} onPointerLeave={ocultar}>
        {ordenadas.map((f, i) => {
          const d = delta(f);
          const lo = f.antes !== null && f.despues !== null ? Math.min(f.antes, f.despues) : null;
          const hi = f.antes !== null && f.despues !== null ? Math.max(f.antes, f.despues) : null;
          return (
            <div
              key={f.id}
              ref={(el) => {
                filasRef.current[i] = el;
              }}
              className="viz-pesas-fila"
              tabIndex={i === 0 ? 0 : -1}
              role="img"
              aria-label={`${f.etiqueta}: ${nombres[0]} ${fmtValor(f.antes, escala)}, ${nombres[1]} ${fmtValor(f.despues, escala)}${d !== null ? `, cambio ${fmtDelta(d, unidad)}` : ''}`}
              aria-describedby={tip?.titulo === f.etiqueta ? id : undefined}
              onPointerEnter={(e: PointerEvent<HTMLElement>) => mostrar(f, e.currentTarget)}
              onFocus={(e: FocusEvent<HTMLElement>) => mostrar(f, e.currentTarget)}
              onBlur={ocultar}
              onKeyDown={alTecla(i)}
            >
              <span className="viz-barras-etiqueta" title={f.etiqueta}>
                {f.etiqueta}
              </span>
              <span className="viz-pesas-pista">
                {marcas.map((m) => (
                  <i key={m} className={m === 0 ? 'viz-pesas-base' : 'viz-pesas-reticula'} style={{ left: pos(m) }} />
                ))}
                {lo !== null && hi !== null && hi > lo && <i className="viz-pesas-union" style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})` }} />}
                {f.antes !== null && <i className="viz-pesas-punto" style={{ left: pos(f.antes), background: COLOR_ENTRADA }} />}
                {f.despues !== null && <i className="viz-pesas-punto" style={{ left: pos(f.despues), background: COLOR_FINAL }} />}
              </span>
              <span className="viz-pesas-delta">
                {d === null ? (
                  <span className="viz-n">—</span>
                ) : (
                  <>
                    <span aria-hidden="true" className="viz-pesas-flecha">
                      {d > 0 ? '▲' : d < 0 ? '▼' : '='}
                    </span>
                    {fmtDelta(d, angosto ? '' : unidad)}
                  </>
                )}
              </span>
            </div>
          );
        })}
        <div className="viz-pesas-fila viz-pesas-eje" aria-hidden="true">
          <span />
          <span className="viz-pesas-pista">
            {marcas.map((m, k) => (
              <span key={m} className={`viz-eje-html${k === 0 ? ' viz-inicio' : k === marcas.length - 1 ? ' viz-fin' : ''}`} style={{ left: pos(m) }}>
                {fmtEje(m, escala)}
              </span>
            ))}
          </span>
          <span />
        </div>
        <Tooltip estado={tip} ancho={ancho} id={id} />
      </div>
      <VerTabla>
        <TablaSimple
          encabezados={['Fila', nombres[0], nombres[1], 'Cambio', ...(filas.some((f) => f.n !== undefined) ? ['n'] : [])]}
          filas={ordenadas.map((f) => {
            const d = delta(f);
            return [f.etiqueta, fmtValor(f.antes, escala), fmtValor(f.despues, escala), d === null ? '—' : fmtDelta(d, unidad), ...(filas.some((g) => g.n !== undefined) ? [f.n === undefined ? '—' : fmtNum(f.n)] : [])];
          })}
        />
      </VerTabla>
    </div>
  );
}
