// Ficha de indicador: etiqueta, valor, cambio frente al periodo anterior y una línea mínima
// de tendencia (gris de contexto, el último punto en acento). `FilaKPI` las acomoda en rejilla.

import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { useAncho } from './nucleo';

type Delta = { valor: number | null; texto: string; mejorSiSube: boolean };

/** Línea mínima: gris, huecos donde no hay dato, último punto en acento con anillo de superficie. */
function Minilinea({ valores }: { valores: (number | null)[] }) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const alto = 30;
  const pad = 6;
  const nums = valores.filter((v): v is number => v !== null && Number.isFinite(v));
  let svg: ReactNode = null;
  if (ancho > 0 && nums.length > 0) {
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const rango = max - min || 1;
    const n = valores.length;
    const px = (i: number) => pad + (n <= 1 ? (ancho - 2 * pad) / 2 : (i * (ancho - 2 * pad)) / (n - 1));
    const py = (v: number) => (max === min ? alto / 2 : pad + (1 - (v - min) / rango) * (alto - 2 * pad));
    let d = '';
    let abierto = false;
    valores.forEach((v, i) => {
      if (v === null || !Number.isFinite(v)) {
        abierto = false;
        return;
      }
      d += `${abierto ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)}`;
      abierto = true;
    });
    let ultimo = -1;
    for (let i = n - 1; i >= 0; i--) if (valores[i] !== null && Number.isFinite(valores[i])) { ultimo = i; break; }
    svg = (
      <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" focusable="false">
        <path d={d} className="viz-mini-linea" />
        {ultimo >= 0 && <circle cx={px(ultimo)} cy={py(valores[ultimo] as number)} r={4} className="viz-mini-punto" />}
      </svg>
    );
  }
  return (
    <div ref={ref} className="viz-kpi-tendencia">
      {svg}
    </div>
  );
}

export function IndicadorKPI({
  etiqueta,
  valor,
  delta,
  tendencia,
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  delta?: Delta;
  tendencia?: (number | null)[];
  /** Cómo se calcula el indicador (se muestra con el botón «?»). */
  ayuda?: string;
}) {
  const id = useId();
  const [verAyuda, setVerAyuda] = useState(false);
  let claseDelta = 'viz-delta-neutro';
  let icono = '';
  let lectura = '';
  if (delta && delta.valor !== null && Number.isFinite(delta.valor) && delta.valor !== 0) {
    const sube = delta.valor > 0;
    const bueno = sube === delta.mejorSiSube;
    claseDelta = bueno ? 'viz-delta-bien' : 'viz-delta-mal';
    icono = sube ? '▲' : '▼';
    lectura = `${sube ? 'Subió' : 'Bajó'} (${bueno ? 'mejora' : 'empeora'}): `;
  } else if (delta && delta.valor === 0) {
    icono = '=';
    lectura = 'Sin cambio: ';
  }
  return (
    <div className="viz viz-kpi">
      <div className="viz-kpi-cabeza">
        <span className="viz-kpi-etiqueta">{etiqueta}</span>
        {ayuda && (
          <button
            type="button"
            className="viz-ayuda"
            aria-label={`Cómo se calcula: ${etiqueta}`}
            aria-expanded={verAyuda}
            aria-controls={`${id}a`}
            title={ayuda}
            onClick={() => setVerAyuda((v) => !v)}
          >
            ?
          </button>
        )}
      </div>
      {ayuda && verAyuda && (
        <p className="viz-kpi-ayuda" id={`${id}a`}>
          {ayuda}
        </p>
      )}
      <div className="viz-kpi-valor">{valor}</div>
      {delta && (
        <div className={`viz-kpi-delta ${claseDelta}`}>
          {icono && (
            <span className="viz-kpi-delta-icono" aria-hidden="true">
              {icono}
            </span>
          )}
          <span className="viz-sr">{lectura}</span>
          <span>{delta.texto}</span>
        </div>
      )}
      {tendencia && tendencia.length > 1 && <Minilinea valores={tendencia} />}
    </div>
  );
}

/** Rejilla de fichas: 2 columnas en el teléfono, hasta 6 en el computador. */
export function FilaKPI({ children }: { children: ReactNode }) {
  return <div className="viz viz-fila-kpi">{children}</div>;
}
