// Ayudantes compartidos por las plantillas de todas las pistas.

import type { Rng } from '../../juego/rng';
import type { Calculo, ContextoGeneracion, Interaccion, Respuesta } from '../../juego/tipos';
import { restaMenorMayor, sumaSinLlevar } from '../../juego/errores';

/** Interpolación lineal según la dificultad d (0..1), redondeada. */
export function lerp(min: number, max: number, d: number): number {
  return Math.round(min + (max - min) * Math.min(1, Math.max(0, d)));
}

/** Parámetro numérico con valor por defecto. */
export function pn(ctx: ContextoGeneracion, nombre: string, defecto: number): number {
  const v = ctx.params[nombre];
  return typeof v === 'number' ? v : defecto;
}

/** Parámetro booleano. */
export function pb(ctx: ContextoGeneracion, nombre: string): boolean {
  return ctx.params[nombre] === true;
}

/** Parámetro de texto. */
export function pt(ctx: ContextoGeneracion, nombre: string, defecto: string): string {
  const v = ctx.params[nombre];
  return typeof v === 'string' ? v : defecto;
}

/** d efectivo: en repaso baja un poco la dificultad. */
export function dif(ctx: ContextoGeneracion): number {
  return ctx.repaso ? Math.max(0, ctx.d - 0.35) : ctx.d;
}

/** Errores típicos como distractores, según la operación. */
export function distractoresTipicos(calc: Calculo): number[] {
  const { op, a, b } = calc;
  const lista: number[] = [];
  switch (op) {
    case 'suma':
      lista.push(sumaSinLlevar(a, b), a + b + 1, a + b - 1, a + b + 10, a + b - 10, Math.abs(a - b));
      break;
    case 'resta':
      lista.push(restaMenorMayor(a, b), a - b + 1, a - b - 1, a + b, a - b + 10, a - b - 10);
      break;
    case 'multiplicacion':
      lista.push(a * (b + 1), a * (b - 1), (a + 1) * b, a + b, a * b + 10, a * b - 10);
      break;
    case 'division':
      if (calc.redondearArriba) lista.push(Math.floor(a / b), Math.ceil(a / b) + 1, a - b);
      else lista.push(Math.floor(a / b) + 1, Math.floor(a / b) - 1, a - b, b);
      break;
    case 'conteo':
      lista.push(a + 1, a - 1, a + 2);
      break;
    default:
      break;
  }
  return lista;
}

/**
 * Construye la lista de distractores: distintos entre sí y de la respuesta, no negativos
 * y enteros. Si faltan, completa con vecinos cercanos (más cercanos cuanto mayor es d).
 */
export function distractores(rng: Rng, respuesta: number, candidatos: number[], cantidad: number, d: number, paso = 1): number[] {
  const usados = new Set<number>([respuesta]);
  const salida: number[] = [];
  for (const c of rng.barajar(candidatos)) {
    if (salida.length >= cantidad) break;
    if (!Number.isInteger(c) || c < 0 || usados.has(c)) continue;
    usados.add(c);
    salida.push(c);
  }
  // Vecinos: con d bajo, más lejanos (más fácil distinguirlos).
  const alcance = Math.max(1, Math.round((d < 0.5 ? 4 : 2) * paso));
  let k = 1;
  let intentos = 0;
  while (salida.length < cantidad && intentos < 200) {
    intentos++;
    const delta = (alcance + Math.floor(k / 2)) * (k % 2 === 0 ? 1 : -1);
    const c = respuesta + delta;
    k++;
    if (c < 0 || usados.has(c)) continue;
    usados.add(c);
    salida.push(c);
  }
  return salida;
}

/** Opciones barajadas (incluye la respuesta). */
export function mezclarOpciones<T extends Respuesta>(rng: Rng, respuesta: T, distr: T[]): T[] {
  return rng.barajar([respuesta, ...distr]);
}

/**
 * Elige entre opción múltiple y teclado: a mayor d, más respuesta abierta.
 * Devuelve la interacción y los distractores usados.
 */
export function modoRespuesta(
  ctx: ContextoGeneracion,
  respuesta: number,
  calc: Calculo | undefined,
  opts: { abiertaMin?: number; abiertaMax?: number; cantidad?: number; extras?: number[]; paso?: number } = {},
): { interaccion: Interaccion; distractores: number[] } {
  const d = dif(ctx);
  const cantidad = opts.cantidad ?? 3;
  const candidatos = [...(opts.extras ?? []), ...(calc ? distractoresTipicos(calc) : [])];
  const distr = distractores(ctx.rng, respuesta, candidatos, cantidad, d, opts.paso ?? 1);
  const pAbierta = ctx.repaso ? 0.2 : lerpF(opts.abiertaMin ?? 0.25, opts.abiertaMax ?? 0.8, d);
  if (ctx.rng.azar(pAbierta)) {
    // En 1.º, la respuesta abierta se puede escribir con el dedo (dos casillas: hasta 99).
    const escribir = pb(ctx, 'escribir') && respuesta >= 0 && respuesta <= 99;
    return { interaccion: escribir ? { tipo: 'escribir', cifras: 2 } : { tipo: 'numerica' }, distractores: distr };
  }
  return { interaccion: { tipo: 'opciones', opciones: mezclarOpciones(ctx.rng, respuesta, distr) }, distractores: distr };
}

export function lerpF(min: number, max: number, d: number): number {
  return min + (max - min) * Math.min(1, Math.max(0, d));
}

/** Entero aleatorio con un número dado de cifras. */
export function conCifras(rng: Rng, cifras: number): number {
  if (cifras <= 1) return rng.entero(1, 9);
  return rng.entero(10 ** (cifras - 1), 10 ** cifras - 1);
}

/**
 * Par (a, b) para sumar con un número exacto de reagrupaciones (llevadas),
 * con a y b de `cifras` cifras y suma menor que `maximo`.
 */
export function parSuma(rng: Rng, cifras: number, llevadas: number, maximo: number): [number, number] {
  for (let i = 0; i < 400; i++) {
    const a = conCifras(rng, cifras);
    const b = conCifras(rng, Math.max(1, cifras - (rng.azar(0.3) ? 1 : 0)));
    if (a + b >= maximo) continue;
    if (contarLlevadas(a, b) === llevadas) return [a, b];
  }
  // Respaldo: sin restricción de llevadas.
  const a = conCifras(rng, cifras);
  return [a, Math.max(1, Math.min(conCifras(rng, cifras), maximo - a - 1))];
}

/**
 * Par (a, b) con a > b para restar con un número exacto de desagrupaciones (préstamos).
 */
export function parResta(rng: Rng, cifras: number, prestamos: number, conCeroEnMinuendo = false): [number, number] {
  for (let i = 0; i < 600; i++) {
    let a = conCifras(rng, cifras);
    if (conCeroEnMinuendo && cifras >= 3) {
      const s = a.toString().split('');
      s[s.length - 2] = '0';
      if (rng.azar(0.4) && cifras >= 4) s[s.length - 3] = '0';
      a = Number(s.join(''));
    }
    const b = rng.entero(Math.max(1, 10 ** (cifras - 2)), a - 1);
    if (b <= 0 || b >= a) continue;
    if (contarPrestamos(a, b) === prestamos) return [a, b];
  }
  const a = conCifras(rng, cifras);
  return [a, rng.entero(1, a - 1)];
}

export function contarLlevadas(a: number, b: number): number {
  let llevo = 0;
  let total = 0;
  while (a > 0 || b > 0) {
    const s = (a % 10) + (b % 10) + llevo;
    llevo = s >= 10 ? 1 : 0;
    total += llevo;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return total;
}

export function contarPrestamos(a: number, b: number): number {
  let presto = 0;
  let total = 0;
  while (a > 0 || b > 0) {
    const s = (a % 10) - (b % 10) - presto;
    presto = s < 0 ? 1 : 0;
    total += presto;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return total;
}

/** Redondea a la decena, centena, etc. más cercana. */
export function redondear(n: number, a: number): number {
  return Math.round(n / a) * a;
}

/** Validador numérico tolerante a texto ("1.000"). */
export function igualNumero(respuesta: number) {
  return (r: Respuesta) => {
    const n = typeof r === 'number' ? r : Number(String(r).replace(/\./g, '').replace(',', '.'));
    return n === respuesta;
  };
}
