// Kit de gráficas de los informes del profesor (React + SVG/HTML, sin librerías).
// Paleta de referencia validada para daltonismo; todo el estilo vive bajo `.viz` en graficas.css.

import './graficas.css';

export type { Serie, Categoria, Tono, Escala } from './tipos';
export { fmtNum, fmtPct, fmtMin, fmtFechaCorta, fmtDelta, compacto, fmtValor } from './formato';
export { useAncho } from './nucleo';
export { Tarjeta } from './Tarjeta';
export { IndicadorKPI, FilaKPI } from './IndicadorKPI';
export { GraficaLinea } from './GraficaLinea';
export { GraficaColumnas } from './GraficaColumnas';
export { GraficaBarras } from './GraficaBarras';
export { GraficaPrePost } from './GraficaPrePost';
export { MapaCalor } from './MapaCalor';
export { BarraApilada } from './BarraApilada';
export { TablaDatos } from './TablaDatos';
export type { ColumnaTabla } from './TablaDatos';
export { Medidor } from './Medidor';
export { Insignia } from './Insignia';
export { COLOR_ENTRADA, COLOR_FINAL, ESTADO } from './colores';
