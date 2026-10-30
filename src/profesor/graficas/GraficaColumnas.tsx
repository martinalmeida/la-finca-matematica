// Columnas de una sola serie en el tiempo (p. ej. ejercicios por semana). Columnas finas
// (≤ 24 px) con el extremo redondeado; solo se rotula la columna más alta. El valor de
// cada columna aparece al pasar el puntero o con el foco del teclado.

import { useMemo, useRef, useState } from 'react';
import type { Escala } from './tipos';
import { fmtEje, fmtValor } from './formato';
import { TablaSimple, Tooltip, VerTabla, anchoTexto, etiquetaX, marcasEje, maximo, pasoEtiquetas, rutaColumna, tituloX, useAncho, useTooltip } from './nucleo';

type Props = {
  x: string[];
  valores: (number | null)[];
  escala: Escala;
  /** Qué se cuenta (va en el tooltip y en la tabla). */
  nombre: string;
  alto?: number;
};

const ALTO_EJE_X = 22;

export function GraficaColumnas({ x, valores, escala, nombre, alto = 220 }: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const { id, tip, setTip, ocultar } = useTooltip();
  const [activo, setActivo] = useState<number | null>(null);
  const botones = useRef<(HTMLDivElement | null)[]>([]);
  const n = x.length;

  const marcas = useMemo(() => marcasEje(maximo(valores), escala), [valores, escala]);
  const tope = marcas[marcas.length - 1] || 1;
  const anchoIzq = Math.max(...marcas.map((m) => anchoTexto(fmtEje(m, escala), 11))) + 10;
  const arriba = 20; // espacio para la etiqueta de la columna más alta
  const plotW = Math.max(40, ancho - anchoIzq - 4);
  const plotH = Math.max(40, alto - arriba - ALTO_EJE_X);
  const banda = n ? plotW / n : plotW;
  const grosor = Math.max(2, Math.min(24, banda * 0.62));
  const cx = (i: number) => anchoIzq + banda * (i + 0.5);
  const py = (v: number) => arriba + plotH - (Math.max(0, v) / tope) * plotH;

  let iMax = -1;
  valores.forEach((v, i) => {
    if (v !== null && Number.isFinite(v) && v > 0 && (iMax < 0 || v > (valores[iMax] as number))) iMax = i;
  });
  const paso = pasoEtiquetas(n, plotW, Math.max(...x.map((v) => anchoTexto(etiquetaX(v), 11)), 30));

  const mostrar = (i: number) => {
    setActivo(i);
    const v = valores[i];
    setTip({ x: cx(i), y: v !== null && Number.isFinite(v) ? py(v) : arriba + plotH / 2, titulo: tituloX(x, i), filas: [{ valor: v === null ? 'Sin datos' : fmtValor(v, escala), etiqueta: nombre }] });
  };
  const salir = () => {
    setActivo(null);
    ocultar();
  };

  const total = valores.reduce<number>((a, v) => a + (v ?? 0), 0);
  const resumen = `Gráfica de columnas: ${nombre}${n ? `, ${n} periodos` : ''}.${iMax >= 0 ? ` Máximo ${fmtValor(valores[iMax], escala)} en ${tituloX(x, iMax)}.` : ''}${escala !== 'pct' ? ` Total ${fmtValor(total, escala)}.` : ''}`;

  return (
    <div className="viz viz-grafica" role="group" aria-label={resumen}>
      <div ref={ref} className="viz-lienzo" style={{ height: alto }} onPointerLeave={salir}>
        {ancho > 0 && n > 0 && (
          <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" focusable="false">
            {marcas.map((m) => (
              <g key={m}>
                <line x1={anchoIzq} x2={anchoIzq + plotW} y1={py(m)} y2={py(m)} className={m === 0 ? 'viz-base' : 'viz-reticula'} />
                <text x={anchoIzq - 8} y={py(m)} dy="0.35em" textAnchor="end" className="viz-eje">
                  {fmtEje(m, escala)}
                </text>
              </g>
            ))}
            {valores.map((v, i) =>
              v !== null && Number.isFinite(v) && v > 0 ? (
                <path key={i} d={rutaColumna(cx(i) - grosor / 2, py(v), grosor, py(0) - py(v))} className={`viz-columna${activo === i ? ' viz-activa' : ''}`} />
              ) : null,
            )}
            {iMax >= 0 && (
              <text x={cx(iMax)} y={py(valores[iMax] as number) - 6} textAnchor="middle" className="viz-etiqueta-directa">
                {fmtValor(valores[iMax], escala)}
              </text>
            )}
            {x.map((v, i) =>
              (n - 1 - i) % paso === 0 ? (
                <text key={i} x={cx(i)} y={arriba + plotH + 16} textAnchor="middle" className="viz-eje">
                  {etiquetaX(v)}
                </text>
              ) : null,
            )}
          </svg>
        )}
        {ancho > 0 &&
          x.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                botones.current[i] = el;
              }}
              className="viz-zona"
              style={{ left: anchoIzq + banda * i, top: arriba, width: banda, height: plotH }}
              tabIndex={i === (activo ?? n - 1) ? 0 : -1}
              role="img"
              aria-label={`${tituloX(x, i)}: ${valores[i] === null ? 'sin datos' : fmtValor(valores[i], escala)} ${nombre}`}
              aria-describedby={activo === i ? id : undefined}
              onPointerEnter={() => mostrar(i)}
              onFocus={() => mostrar(i)}
              onBlur={salir}
              onKeyDown={(e) => {
                const sig = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
                if (e.key === 'Escape') return salir();
                if (sig === null) return;
                e.preventDefault();
                botones.current[Math.max(0, Math.min(n - 1, sig))]?.focus();
              }}
            />
          ))}
        <Tooltip estado={tip} ancho={ancho} id={id} />
      </div>
      <VerTabla>
        <TablaSimple encabezados={['Periodo', nombre]} filas={x.map((_, i) => [tituloX(x, i), fmtValor(valores[i], escala)])} />
      </VerTabla>
    </div>
  );
}
