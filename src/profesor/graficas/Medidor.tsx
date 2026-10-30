// Medidor de 0 a 100 (por ejemplo, % de la ruta completada). La pista es un paso más claro
// de la misma rampa que el relleno. Con `umbrales` [bajo, alto], por debajo de `bajo` el
// relleno pasa a «grave» y entre ambos a «aviso», siempre con ícono y texto.

import type { Tono } from './tipos';
import { fmtPct } from './formato';
import { Insignia } from './Insignia';

export function Medidor({ valor, etiqueta, umbrales }: { valor: number; etiqueta: string; umbrales?: [number, number] }) {
  const v = Math.max(0, Math.min(100, Number.isFinite(valor) ? valor : 0));
  let tono: Tono | null = null;
  let texto = '';
  if (umbrales) {
    const [bajo, alto] = umbrales;
    if (v < bajo) {
      tono = 'grave';
      texto = `Bajo (menos de ${fmtPct(bajo)})`;
    } else if (v < alto) {
      tono = 'aviso';
      texto = `Medio (menos de ${fmtPct(alto)})`;
    }
  }
  return (
    <div className={`viz viz-medidor${tono ? ` viz-medidor-${tono}` : ''}`}>
      <div className="viz-medidor-cabeza">
        <span className="viz-medidor-etiqueta">{etiqueta}</span>
        <span className="viz-medidor-valor">{fmtPct(v)}</span>
      </div>
      <div className="viz-medidor-pista" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-valuetext={`${fmtPct(v)}${texto ? `, ${texto}` : ''}`} aria-label={etiqueta}>
        {v > 0 && <div className="viz-medidor-relleno" style={{ width: `${v}%` }} />}
        {umbrales?.map((u, i) => (
          <i key={i} className="viz-medidor-umbral" style={{ left: `${Math.max(0, Math.min(100, u))}%` }} aria-hidden="true" />
        ))}
      </div>
      {tono && (
        <div className="viz-medidor-estado">
          <Insignia tono={tono}>{texto}</Insignia>
        </div>
      )}
    </div>
  );
}
