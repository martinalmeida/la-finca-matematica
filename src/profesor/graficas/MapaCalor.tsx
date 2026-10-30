// Mapa de calor con una sola rampa azul (pasos 100 → 700 de la paleta). Por defecto lo más bajo
// es lo más oscuro (en un % de aciertos resalta lo que necesita atención); con `invertir`, lo
// más alto es lo más oscuro (para conteos de errores). Celdas sin dato rayadas con «—». El valor
// va dentro de la celda solo si cabe, en blanco o casi negro según el fondo. Si las columnas no
// caben, la tabla se desplaza de lado DENTRO de su caja, con la primera columna fija.

import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { colorRampa, textoSobre } from './colores';
import { fmtValor } from './formato';
import { TablaSimple, Tooltip, VerTabla, anchoTexto, puntoRelativo, useAncho, useEscape, useTooltip } from './nucleo';

type Props = {
  filas: { id: string; etiqueta: string }[];
  columnas: { id: string; etiqueta: string }[];
  valor: (fila: string, col: string) => number | null;
  escala: 'pct' | 'num';
  /** Texto dentro de la celda (por defecto, el valor con su formato). */
  textoCelda?: (v: number) => string;
  /** true: más valor = más oscuro (conteos de errores). false: menos valor = más oscuro. */
  invertir?: boolean;
  alPulsarFila?: (id: string) => void;
};

const ANCHO_MIN_CELDA = 46;

export function MapaCalor({ filas, columnas, valor, escala, textoCelda, invertir = false, alPulsarFila }: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const { id, tip, setTip, ocultar } = useTooltip();
  useEscape(tip !== null, ocultar);
  const [foco, setFoco] = useState<[number, number]>([0, 0]);
  const celdas = useRef<Map<string, HTMLTableCellElement>>(new Map());

  const matriz = useMemo(() => filas.map((f) => columnas.map((c) => {
    const v = valor(f.id, c.id);
    return v === null || !Number.isFinite(v) ? null : v;
  })), [filas, columnas, valor]);
  const nums = matriz.flat().filter((v): v is number => v !== null);
  const min = 0;
  const max = escala === 'pct' ? 100 : Math.max(1, ...nums);
  const fmt = (v: number) => (textoCelda ? textoCelda(v) : fmtValor(v, escala));
  // t = 0 → paso 100 (claro), t = 1 → paso 700 (oscuro).
  const tono = (v: number) => {
    const t = (v - min) / (max - min || 1);
    return invertir ? t : 1 - t;
  };

  const anchoEtiqueta = ancho > 0 && ancho < 480 ? 104 : 168;
  // Ninguna palabra del encabezado se parte por la mitad: la celda mínima es tan ancha como la
  // palabra más larga (con tope); si así no caben, la tabla se desplaza dentro de su caja.
  const minCelda = Math.min(96, Math.max(ANCHO_MIN_CELDA, ...columnas.flatMap((c) => c.etiqueta.split(/\s+/).map((p) => Math.ceil(anchoTexto(p, 11, 500)) + 10))));
  const anchoCelda = Math.max(minCelda, ancho > 0 ? Math.floor((ancho - anchoEtiqueta - 2) / Math.max(1, columnas.length)) - 2 : ANCHO_MIN_CELDA);
  const caben = nums.every((v) => anchoTexto(fmt(v), 12, 500) <= anchoCelda - 8);

  const mostrar = (i: number, j: number, el: HTMLElement) => {
    const p = puntoRelativo(el, ref.current);
    const v = matriz[i][j];
    setTip({ x: p.x, y: p.y + 2, titulo: filas[i].etiqueta, filas: [{ valor: v === null ? 'Sin datos' : fmt(v), etiqueta: columnas[j].etiqueta }] });
  };
  const alTecla = (i: number, j: number) => (e: KeyboardEvent<HTMLElement>) => {
    const mov: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    const m = mov[e.key];
    if (!m) return;
    e.preventDefault();
    const ni = Math.max(0, Math.min(filas.length - 1, i + m[0]));
    const nj = Math.max(0, Math.min(columnas.length - 1, j + m[1]));
    setFoco([ni, nj]);
    celdas.current.get(`${ni}:${nj}`)?.focus();
  };

  const valorLeyenda = (t: number) => fmt(min + t * (max - min));
  const resumen = `Mapa de calor: ${filas.length} filas por ${columnas.length} columnas. Escala de ${fmt(min)} a ${fmt(max)}; ${invertir ? 'más oscuro es más alto' : 'más oscuro es más bajo'}.`;

  return (
    <div className="viz viz-grafica" role="group" aria-label={resumen}>
      <div className="viz-rampa" aria-hidden="true">
        <span>{invertir ? valorLeyenda(0) : valorLeyenda(1)}</span>
        <i style={{ background: `linear-gradient(to right, ${[0, 0.25, 0.5, 0.75, 1].map((t) => colorRampa(t)).join(', ')})` }} />
        <span>{invertir ? valorLeyenda(1) : valorLeyenda(0)}</span>
        <span className="viz-rampa-nulo">
          <i className="viz-nulo" /> Sin datos
        </span>
      </div>
      <div ref={ref} className="viz-lienzo" onPointerLeave={ocultar}>
        <div className="viz-calor-desplazable" onScroll={ocultar}>
          <table className="viz-calor" style={{ minWidth: anchoEtiqueta + columnas.length * (minCelda + 2) }}>
            <colgroup>
              <col style={{ width: anchoEtiqueta }} />
              {columnas.map((c) => (
                <col key={c.id} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="viz-calor-esquina">
                  <span className="viz-sr">Fila</span>
                </th>
                {columnas.map((c) => (
                  <th key={c.id} scope="col" title={c.etiqueta}>
                    <span className="viz-calor-col">{c.etiqueta}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.id}>
                  <th scope="row" title={f.etiqueta}>
                    {alPulsarFila ? (
                      <button type="button" className="viz-calor-fila-boton" onClick={() => alPulsarFila(f.id)}>
                        {f.etiqueta}
                      </button>
                    ) : (
                      <span className="viz-calor-fila">{f.etiqueta}</span>
                    )}
                  </th>
                  {columnas.map((c, j) => {
                    const v = matriz[i][j];
                    const fondo = v === null ? undefined : colorRampa(tono(v));
                    return (
                      <td
                        key={c.id}
                        ref={(el) => {
                          if (el) celdas.current.set(`${i}:${j}`, el);
                          else celdas.current.delete(`${i}:${j}`);
                        }}
                        className={v === null ? 'viz-nulo' : undefined}
                        style={fondo ? { background: fondo, color: textoSobre(fondo) } : undefined}
                        tabIndex={foco[0] === i && foco[1] === j ? 0 : -1}
                        aria-label={`${f.etiqueta}, ${c.etiqueta}: ${v === null ? 'sin datos' : fmt(v)}`}
                        aria-describedby={tip && foco[0] === i && foco[1] === j ? id : undefined}
                        onPointerEnter={(e) => mostrar(i, j, e.currentTarget)}
                        onFocus={(e) => {
                          setFoco([i, j]);
                          mostrar(i, j, e.currentTarget);
                        }}
                        onBlur={ocultar}
                        onKeyDown={alTecla(i, j)}
                      >
                        <span aria-hidden="true">{v === null ? '—' : caben ? fmt(v) : ''}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Tooltip estado={tip} ancho={ancho} id={id} />
      </div>
      <VerTabla>
        <TablaSimple encabezados={['', ...columnas.map((c) => c.etiqueta)]} filas={filas.map((f, i) => [f.etiqueta, ...matriz[i].map((v) => (v === null ? '—' : fmt(v)))])} />
      </VerTabla>
    </div>
  );
}
