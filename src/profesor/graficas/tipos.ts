// Tipos compartidos por las gráficas de los informes del profesor.

/** Una serie de valores alineada con el eje `x` de la gráfica (null = sin dato: se dibuja como hueco). */
export type Serie = { id: string; nombre: string; valores: (number | null)[] };

/** Una categoría de una gráfica de barras (un estudiante, un tema…). `n` = cuántos datos la respaldan. */
export type Categoria = { id: string; etiqueta: string; valor: number | null; n?: number; detalle?: string };

/** Tono de estado: siempre se muestra con ícono y texto, nunca solo con color. */
export type Tono = 'neutro' | 'bien' | 'aviso' | 'grave' | 'critico';

/** Escala de los valores: porcentaje 0–100, número o minutos. */
export type Escala = 'pct' | 'num' | 'min';
