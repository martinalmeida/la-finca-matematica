// Una sola barra apilada al 100 % (parte de un todo: «Mejoró / Igual / Bajó», o niveles
// Refuerzo / Básico / Avanzado). Ranuras categóricas en orden fijo; si una parte trae `tono`,
// usa el color de estado con su ícono. Separación de 2 px entre segmentos. El porcentaje va
// dentro del segmento solo si cabe; la leyenda trae conteo y porcentaje de cada parte.

import { useState } from 'react';
import type { Tono } from './tipos';
import { ESTADO, ICONO_TONO, SERIES, textoEnRelleno } from './colores';
import { fmtNum, fmtPct } from './formato';
import { TablaSimple, Tooltip, VerTabla, anchoTexto, puntoRelativo, useAncho, useEscape, useTooltip } from './nucleo';

type Parte = { id: string; etiqueta: string; valor: number; tono?: Tono };

type Props = {
  partes: Parte[];
  /** Total del 100 % (por defecto, la suma de las partes). Si es mayor, el resto queda sin pintar. */
  total?: number;
  /** Escribir el porcentaje dentro de cada segmento (cuando cabe). Por defecto sí. */
  mostrarPct?: boolean;
};

const GRIS_NEUTRO = '#c3c2b7';

export function BarraApilada({ partes, total, mostrarPct = true }: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const { id, tip, setTip, ocultar } = useTooltip();
  useEscape(tip !== null, ocultar);
  const [activo, setActivo] = useState<string | null>(null);
  const suma = partes.reduce((a, p) => a + Math.max(0, p.valor), 0);
  const todo = Math.max(total ?? suma, suma) || 1;
  // Color fijo por posición (nunca por tamaño): ranura i, o el color de estado si hay tono.
  const color = (p: Parte, i: number) => (p.tono ? (p.tono === 'neutro' ? GRIS_NEUTRO : ESTADO[p.tono]) : (SERIES[i] ?? GRIS_NEUTRO));
  const pct = (v: number) => (100 * v) / todo;
  const decimales = (v: number) => (pct(v) > 0 && pct(v) < 1 ? 1 : 0);
  const visibles = partes.filter((p) => p.valor > 0);
  const huecos = Math.max(0, visibles.length - 1) * 2;
  const anchoUtil = Math.max(0, ancho - huecos);

  const mostrar = (p: Parte, i: number, el: HTMLElement) => {
    setActivo(p.id);
    const pt = puntoRelativo(el, ref.current);
    setTip({ x: pt.x, y: pt.y, filas: [{ valor: `${fmtNum(p.valor)} (${fmtPct(pct(p.valor), decimales(p.valor))})`, etiqueta: p.etiqueta, color: color(p, i) }] });
  };
  const salir = () => {
    setActivo(null);
    ocultar();
  };

  const resumen = `Distribución sobre ${fmtNum(todo)}: ${partes.map((p) => `${p.etiqueta} ${fmtNum(p.valor)} (${fmtPct(pct(p.valor), decimales(p.valor))})`).join(', ')}.`;

  return (
    <div className="viz viz-grafica" role="group" aria-label={resumen}>
      <div ref={ref} className="viz-lienzo viz-apilada" onPointerLeave={salir}>
        <div className="viz-apilada-barra">
          {partes.map((p, i) => {
            if (p.valor <= 0) return null;
            const fondo = color(p, i);
            const texto = fmtPct(pct(p.valor), decimales(p.valor));
            const anchoSeg = (anchoUtil * pct(p.valor)) / 100;
            const cabe = mostrarPct && anchoTexto(texto, 12, 600) + 12 <= anchoSeg;
            return (
              <div
                key={p.id}
                className={`viz-apilada-seg${activo === p.id ? ' viz-activa' : ''}`}
                style={{ flexGrow: p.valor, background: fondo, color: textoEnRelleno(fondo) }}
                tabIndex={0}
                role="img"
                aria-label={`${p.etiqueta}: ${fmtNum(p.valor)}, ${texto}`}
                aria-describedby={activo === p.id ? id : undefined}
                onPointerEnter={(e) => mostrar(p, i, e.currentTarget)}
                onFocus={(e) => mostrar(p, i, e.currentTarget)}
                onBlur={salir}
              >
                {cabe && <span aria-hidden="true">{texto}</span>}
              </div>
            );
          })}
          {todo > suma && <div className="viz-apilada-resto" style={{ flexGrow: todo - suma }} aria-hidden="true" />}
        </div>
        <Tooltip estado={tip} ancho={ancho} id={id} />
      </div>
      <ul className="viz-leyenda viz-leyenda-partes">
        {partes.map((p, i) => (
          <li key={p.id}>
            {p.tono ? (
              <i className="viz-clave-tono" style={{ background: color(p, i), color: textoEnRelleno(color(p, i)) }} aria-hidden="true">
                {ICONO_TONO[p.tono]}
              </i>
            ) : (
              <i className="viz-clave-caja" style={{ background: color(p, i) }} aria-hidden="true" />
            )}
            <span>{p.etiqueta}</span>
            <b>{fmtNum(p.valor)}</b>
            <span className="viz-n">{fmtPct(pct(p.valor), decimales(p.valor))}</span>
          </li>
        ))}
      </ul>
      <VerTabla>
        <TablaSimple encabezados={['Parte', 'Cantidad', '%']} filas={partes.map((p) => [p.etiqueta, fmtNum(p.valor), fmtPct(pct(p.valor), decimales(p.valor))])} />
      </VerTabla>
    </div>
  );
}
