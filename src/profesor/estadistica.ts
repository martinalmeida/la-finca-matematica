// Estadística para los informes (sin librerías): medidas descriptivas y pruebas para muestras
// pareadas (prueba de entrada vs. prueba final). Todo es puro y se prueba en tests/estadistica.test.ts.

export const media = (xs: number[]): number | null => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

export function mediana(xs: number[]): number | null {
  if (!xs.length) return null;
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

/** Desviación estándar muestral (n − 1). */
export function desviacion(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = media(xs)!;
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

// ── Distribución t de Student ──

function lnGamma(z: number): number {
  // Lanczos (g = 7, n = 9).
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Fracción continua de la beta incompleta (Numerical Recipes, betacf). */
function betaCF(a: number, b: number, x: number): number {
  const MAX = 300;
  const EPS = 3e-14;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Beta incompleta regularizada I_x(a, b). */
function betaInc(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betaCF(a, b, x)) / a : 1 - (bt * betaCF(b, a, 1 - x)) / b;
}

/** P(|T| ≥ |t|) con gl grados de libertad (valor p bilateral). */
export function pBilateralT(t: number, gl: number): number {
  if (!Number.isFinite(t)) return 0;
  return betaInc(gl / (gl + t * t), gl / 2, 0.5);
}

/** Valor crítico t (bilateral) para un nivel de confianza (0,95 → t₀.₀₂₅). */
export function tCritico(gl: number, confianza = 0.95): number {
  const alfa = 1 - confianza;
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2;
    if (pBilateralT(m, gl) > alfa) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** Función de distribución normal estándar (Abramowitz y Stegun 7.1.26 sobre erf). */
export function normalCDF(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

export type Pareado = {
  n: number;
  mediaAntes: number;
  mediaDespues: number;
  /** Diferencia media (después − antes) y su desviación. */
  diferencia: number;
  deDiferencia: number | null;
  /** Intervalo de confianza del 95 % de la diferencia media. */
  ic95: [number, number] | null;
  /** t de Student para muestras pareadas, grados de libertad y valor p bilateral. */
  t: number | null;
  gl: number;
  p: number | null;
  /** Tamaño del efecto: d de Cohen para muestras pareadas (dz = diferencia / DE de las diferencias). */
  d: number | null;
  magnitud: 'sin datos' | 'trivial' | 'pequeño' | 'mediano' | 'grande';
  /** Prueba de rangos con signo de Wilcoxon (aproximación normal con corrección por continuidad). */
  wilcoxon: { w: number; z: number; p: number; nSinEmpates: number } | null;
  mejoraron: number;
  iguales: number;
  bajaron: number;
};

export function magnitudEfecto(d: number | null): Pareado['magnitud'] {
  if (d === null || !Number.isFinite(d)) return 'sin datos';
  const a = Math.abs(d);
  return a < 0.2 ? 'trivial' : a < 0.5 ? 'pequeño' : a < 0.8 ? 'mediano' : 'grande';
}

function wilcoxon(dif: number[]): Pareado['wilcoxon'] {
  const nz = dif.filter((x) => x !== 0);
  const n = nz.length;
  if (n < 1) return null;
  const orden = nz.map((v) => ({ v, a: Math.abs(v) })).sort((x, y) => x.a - y.a);
  // Rangos promedio en los empates.
  const rangos = new Array<number>(n);
  let empates = 0;
  for (let i = 0; i < n; ) {
    let j = i;
    while (j + 1 < n && orden[j + 1].a === orden[i].a) j++;
    const r = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) rangos[k] = r;
    const t = j - i + 1;
    empates += t ** 3 - t;
    i = j + 1;
  }
  let wMas = 0;
  orden.forEach((o, k) => {
    if (o.v > 0) wMas += rangos[k];
  });
  const esperado = (n * (n + 1)) / 4;
  const varianza = (n * (n + 1) * (2 * n + 1)) / 24 - empates / 48;
  if (varianza <= 0) return { w: wMas, z: 0, p: 1, nSinEmpates: n };
  const z = (wMas - esperado - Math.sign(wMas - esperado) * 0.5) / Math.sqrt(varianza);
  return { w: wMas, z, p: Math.min(1, 2 * (1 - normalCDF(Math.abs(z)))), nSinEmpates: n };
}

/** Comparación de muestras pareadas (misma persona antes y después). */
export function pareado(antes: number[], despues: number[]): Pareado | null {
  const n = Math.min(antes.length, despues.length);
  if (n === 0) return null;
  const dif = Array.from({ length: n }, (_, i) => despues[i] - antes[i]);
  const diferencia = media(dif)!;
  const de = desviacion(dif);
  const gl = n - 1;
  let t: number | null = null;
  let p: number | null = null;
  let ic95: [number, number] | null = null;
  let d: number | null = null;
  if (de !== null && n >= 2) {
    const ee = de / Math.sqrt(n);
    if (ee > 0) {
      t = diferencia / ee;
      p = pBilateralT(t, gl);
      const tc = tCritico(gl);
      ic95 = [diferencia - tc * ee, diferencia + tc * ee];
      d = diferencia / de;
    } else {
      // Todas las diferencias iguales: sin variación no hay prueba t (efecto indefinido salvo que sea 0).
      ic95 = [diferencia, diferencia];
    }
  }
  return {
    n,
    mediaAntes: media(antes.slice(0, n))!,
    mediaDespues: media(despues.slice(0, n))!,
    diferencia,
    deDiferencia: de,
    ic95,
    t,
    gl,
    p,
    d,
    magnitud: magnitudEfecto(d),
    wilcoxon: wilcoxon(dif),
    mejoraron: dif.filter((x) => x > 0).length,
    iguales: dif.filter((x) => x === 0).length,
    bajaron: dif.filter((x) => x < 0).length,
  };
}

/** Ganancia normalizada de Hake: (después − antes) / (máximo − antes). Null si ya estaba en el máximo. */
export function gananciaNormalizada(antes: number, despues: number, maximo = 100): number | null {
  return antes >= maximo ? null : (despues - antes) / (maximo - antes);
}
