// Serie de tiempo (1 a 3 series). Retícula tenue, eje y de 0–100 para porcentajes, marcas
// redondas en otros casos. Una línea vertical sigue al puntero y se ajusta a la fecha más
// cercana; el tooltip lista todas las series en esa fecha. Con una sola serie lleva un velo
// de área al 10 %. Etiqueta directa al final de cada serie y leyenda cuando hay dos o más.

import { useMemo, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { Escala, Serie } from './tipos';
import { VAR_SERIES } from './colores';
import { fmtEje, fmtFechaCorta, fmtValor } from './formato';
import { Leyenda, TablaSimple, Tooltip, VerTabla, anchoTexto, etiquetaX, marcasEje, maximo, pasoEtiquetas, tituloX, useAncho, useTooltip } from './nucleo';

type Props = {
  /** Fechas ISO (o etiquetas) del eje x. */
  x: string[];
  /** De 1 a 3 series, alineadas con `x`. */
  series: Serie[];
  escala: Escala;
  /** Línea de referencia horizontal (rotulada a la derecha). */
  meta?: { valor: number; etiqueta: string };
  /** Alto total, incluido el eje x. */
  alto?: number;
  etiquetaY?: string;
};

const ALTO_EJE_X = 22;

export function GraficaLinea({ x, series, escala, meta, alto = 240, etiquetaY }: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const { id, tip, setTip, ocultar } = useTooltip();
  const [activo, setActivo] = useState<number | null>(null);
  const n = x.length;
  const colores = series.map((_, i) => VAR_SERIES[i] ?? 'var(--viz-gris)');

  const marcas = useMemo(() => {
    const max = Math.max(maximo(series.flatMap((s) => s.valores)), meta?.valor ?? 0);
    return marcasEje(max, escala);
  }, [series, escala, meta]);
  const tope = marcas[marcas.length - 1] || 1;

  // Último punto con dato de cada serie (para la etiqueta directa).
  const ultimos = series.map((s) => {
    for (let i = s.valores.length - 1; i >= 0; i--) if (s.valores[i] !== null && Number.isFinite(s.valores[i])) return i;
    return -1;
  });

  const angosto = ancho < 480;
  const etiquetaFinal = (k: number) => {
    const v = fmtValor(series[k].valores[ultimos[k]], escala);
    return series.length > 1 && !angosto ? `${v} ${series[k].nombre}` : v;
  };
  const anchoIzq = Math.max(...marcas.map((m) => anchoTexto(fmtEje(m, escala), 11))) + 10;
  const arriba = etiquetaY ? 22 : 10;
  const plotH = Math.max(40, alto - arriba - ALTO_EJE_X);
  const py = (v: number) => arriba + plotH - (Math.max(0, v) / tope) * plotH;
  // Margen derecho: etiquetas directas y, si no choca con ellas, el rótulo de la meta.
  const anchoEtiquetas = series.length <= 3 ? Math.max(20, ...series.map((_, k) => (ultimos[k] >= 0 ? anchoTexto(etiquetaFinal(k), 12, 600) : 0))) + 12 : 20;
  const textoMeta = meta ? `${meta.etiqueta} ${fmtValor(meta.valor, escala)}` : '';
  const anchoMeta = anchoTexto(textoMeta, 11) + 12;
  const metaFuera =
    !!meta &&
    meta.valor <= tope &&
    anchoMeta <= ancho * 0.32 &&
    series.every((s, k) => ultimos[k] < 0 || Math.abs(py(s.valores[ultimos[k]] as number) - py(meta.valor)) >= 15);
  const anchoDer = Math.min(Math.max(anchoEtiquetas, metaFuera ? anchoMeta : 0), ancho * 0.32);
  const plotW = Math.max(40, ancho - anchoIzq - anchoDer);
  const px = (i: number) => anchoIzq + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));

  // Segmentos continuos (los null cortan la línea).
  const segmentos = series.map((s) => {
    const segs: number[][] = [];
    let actual: number[] = [];
    s.valores.forEach((v, i) => {
      if (v === null || !Number.isFinite(v)) {
        if (actual.length) segs.push(actual);
        actual = [];
      } else actual.push(i);
    });
    if (actual.length) segs.push(actual);
    return segs;
  });

  // Etiquetas directas: se omiten las que chocarían con otra (no se apilan ni se separan a la fuerza).
  const etiquetas: { k: number; y: number }[] = [];
  if (series.length <= 3) {
    series
      .map((s, k) => ({ k, y: ultimos[k] >= 0 ? py(s.valores[ultimos[k]] as number) : NaN }))
      .filter((e) => !Number.isNaN(e.y))
      .forEach((e) => {
        if (etiquetas.every((o) => Math.abs(o.y - e.y) >= 15)) etiquetas.push(e);
      });
  }

  const paso = pasoEtiquetas(n, plotW, Math.max(...x.map((v) => anchoTexto(etiquetaX(v), 11)), 30));

  const mostrar = (i: number) => {
    setActivo(i);
    const ys = series.map((s) => s.valores[i]).filter((v): v is number => v !== null && Number.isFinite(v));
    setTip({
      x: px(i),
      y: ys.length ? py(Math.max(...ys)) : arriba + plotH / 2,
      titulo: tituloX(x, i),
      filas: series.map((s, k) => ({ valor: fmtValor(s.valores[i], escala), etiqueta: s.nombre, color: colores[k] })),
    });
  };
  const salir = () => {
    setActivo(null);
    ocultar();
  };
  const alMover = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - r.left - 8; // la zona empieza 8 px antes del área de dibujo
    const i = n <= 1 ? 0 : Math.round((rel / plotW) * (n - 1));
    mostrar(Math.max(0, Math.min(n - 1, i)));
  };
  const alTecla = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = activo ?? n - 1;
    const sig = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
    if (e.key === 'Escape') return salir();
    if (sig === null) return;
    e.preventDefault();
    mostrar(Math.max(0, Math.min(n - 1, sig)));
  };

  const resumen = `Gráfica de líneas${series.length ? `: ${series.map((s) => s.nombre).join(', ')}` : ''}${n ? `, del ${fmtFechaCorta(x[0])} al ${fmtFechaCorta(x[n - 1])}` : ''}. ${series
    .map((s, k) => (ultimos[k] >= 0 ? `${s.nombre}: último valor ${fmtValor(s.valores[ultimos[k]], escala)}` : `${s.nombre}: sin datos`))
    .join('. ')}.`;

  return (
    <div className="viz viz-grafica" role="group" aria-label={resumen}>
      {series.length >= 2 && <Leyenda items={series.map((s, k) => ({ id: s.id, nombre: s.nombre, color: colores[k], forma: 'linea' }))} />}
      <div ref={ref} className="viz-lienzo" style={{ height: alto }}>
        {ancho > 0 && n > 0 && (
          <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" focusable="false">
            {etiquetaY && (
              <text x={0} y={11} className="viz-eje-titulo">
                {etiquetaY}
              </text>
            )}
            {marcas.map((m) => (
              <g key={m}>
                <line x1={anchoIzq} x2={anchoIzq + plotW} y1={py(m)} y2={py(m)} className={m === 0 ? 'viz-base' : 'viz-reticula'} />
                <text x={anchoIzq - 8} y={py(m)} dy="0.35em" textAnchor="end" className="viz-eje">
                  {fmtEje(m, escala)}
                </text>
              </g>
            ))}
            {x.map((v, i) =>
              i % paso === 0 ? (
                <text key={i} x={px(i)} y={arriba + plotH + 16} textAnchor={n > 1 && i === 0 ? 'start' : 'middle'} className="viz-eje">
                  {etiquetaX(v)}
                </text>
              ) : null,
            )}
            {meta && meta.valor <= tope && (
              <g>
                <line x1={anchoIzq} x2={anchoIzq + plotW} y1={py(meta.valor)} y2={py(meta.valor)} className="viz-meta" />
                {metaFuera ? (
                  <text x={anchoIzq + plotW + 8} y={py(meta.valor)} dy="0.35em" className="viz-meta-texto">
                    {textoMeta}
                  </text>
                ) : (
                  // Si choca con una etiqueta final, va sobre la línea, al comienzo del área de dibujo.
                  <text x={anchoIzq + 4} y={py(meta.valor) - 5} className="viz-meta-texto">
                    {textoMeta}
                  </text>
                )}
              </g>
            )}
            {series.length === 1 &&
              segmentos[0].map((seg, j) =>
                seg.length > 1 ? (
                  <path
                    key={j}
                    d={`M${px(seg[0])},${py(0)}${seg.map((i) => `L${px(i)},${py(series[0].valores[i] as number)}`).join('')}L${px(seg[seg.length - 1])},${py(0)}Z`}
                    className="viz-area"
                    style={{ fill: colores[0] }}
                  />
                ) : null,
              )}
            {activo !== null && <line x1={px(activo)} x2={px(activo)} y1={arriba} y2={arriba + plotH} className="viz-cruz" />}
            {series.map((s, k) => (
              <g key={s.id}>
                {segmentos[k].map((seg, j) =>
                  seg.length > 1 ? (
                    <path key={j} d={seg.map((i, h) => `${h ? 'L' : 'M'}${px(i)},${py(s.valores[i] as number)}`).join('')} className="viz-linea" style={{ stroke: colores[k] }} />
                  ) : (
                    // Un punto aislado entre huecos: se dibuja como punto para que no desaparezca.
                    <circle key={j} cx={px(seg[0])} cy={py(s.valores[seg[0]] as number)} r={3} className="viz-punto" style={{ fill: colores[k] }} />
                  ),
                )}
                {ultimos[k] >= 0 && <circle cx={px(ultimos[k])} cy={py(s.valores[ultimos[k]] as number)} r={4} className="viz-punto" style={{ fill: colores[k] }} />}
              </g>
            ))}
            {activo !== null &&
              series.map((s, k) => {
                const v = s.valores[activo];
                return v === null || !Number.isFinite(v) ? null : <circle key={s.id} cx={px(activo)} cy={py(v)} r={4.5} className="viz-punto" style={{ fill: colores[k] }} />;
              })}
            {etiquetas.map(({ k, y }) => (
              <text key={k} x={px(ultimos[k]) + 8} y={y} dy="0.35em" className="viz-etiqueta-directa">
                {etiquetaFinal(k)}
              </text>
            ))}
          </svg>
        )}
        {ancho > 0 && n > 0 && (
          <div
            className="viz-zona"
            style={{ left: anchoIzq - 8, top: arriba, width: plotW + 16, height: plotH }}
            tabIndex={0}
            role="img"
            aria-label="Use las flechas izquierda y derecha para recorrer las fechas"
            aria-describedby={tip ? id : undefined}
            onPointerMove={alMover}
            onPointerDown={alMover}
            onPointerLeave={salir}
            onFocus={() => mostrar(activo ?? n - 1)}
            onBlur={salir}
            onKeyDown={alTecla}
          />
        )}
        <Tooltip estado={tip} ancho={ancho} id={id} />
      </div>
      <VerTabla>
        <TablaSimple
          encabezados={['Fecha', ...series.map((s) => s.nombre)]}
          filas={x.map((_, i) => [tituloX(x, i), ...series.map((s) => fmtValor(s.valores[i], escala))])}
        />
      </VerTabla>
    </div>
  );
}
