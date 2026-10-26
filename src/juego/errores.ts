// Detector de errores típicos: compara la respuesta con lo que daría cada error conocido
// y devuelve un mensaje específico y amable (nunca solo "¡Incorrecto!").

import type { Calculo, Ejercicio, Respuesta } from './tipos';

export type TipoError =
  | 'suma-sin-llevar'
  | 'resta-menor-mayor'
  | 'operacion-equivocada'
  | 'tabla-vecina'
  | 'residuo-ignorado'
  | 'conteo-por-uno'
  | 'cerca'
  | 'otro';

export const nombresErrores: Record<TipoError, string> = {
  'suma-sin-llevar': 'Suma sin llevar',
  'resta-menor-mayor': 'Resta del menor al mayor',
  'operacion-equivocada': 'Operación equivocada',
  'tabla-vecina': 'Tabla vecina',
  'residuo-ignorado': 'Residuo ignorado',
  'conteo-por-uno': 'Conteo por uno',
  cerca: 'Respuesta cercana',
  otro: 'Otro',
};

function cifras(n: number): number[] {
  return Math.abs(Math.trunc(n)).toString().split('').reverse().map(Number);
}

/** Suma columna por columna sin reagrupar: 47 + 38 → 75 (7+8=15 → 5, 4+3=7). */
export function sumaSinLlevar(a: number, b: number): number {
  const ca = cifras(a);
  const cb = cifras(b);
  const largo = Math.max(ca.length, cb.length);
  let resultado = 0;
  for (let i = largo - 1; i >= 0; i--) {
    resultado = resultado * 10 + (((ca[i] ?? 0) + (cb[i] ?? 0)) % 10);
  }
  return resultado;
}

/** Resta columna por columna quitando el menor del mayor: 53 − 28 → 35. */
export function restaMenorMayor(a: number, b: number): number {
  const ca = cifras(a);
  const cb = cifras(b);
  const largo = Math.max(ca.length, cb.length);
  let resultado = 0;
  for (let i = largo - 1; i >= 0; i--) {
    resultado = resultado * 10 + Math.abs((ca[i] ?? 0) - (cb[i] ?? 0));
  }
  return resultado;
}

/** ¿El cálculo necesita reagrupar (llevar)? */
export function llevaEnSuma(a: number, b: number): boolean {
  return sumaSinLlevar(a, b) !== a + b;
}

/** ¿La resta necesita desagrupar (prestar)? */
export function prestaEnResta(a: number, b: number): boolean {
  return restaMenorMayor(a, b) !== a - b;
}

/** Valor esperado según la operación del cálculo (sin redondeos). */
function valor(op: Calculo['op'], a: number, b: number): number | null {
  switch (op) {
    case 'suma':
      return a + b;
    case 'resta':
      return a - b;
    case 'multiplicacion':
      return a * b;
    case 'division':
      return b === 0 ? null : a / b;
    default:
      return null;
  }
}

export function detectarTipoError(calculo: Calculo | undefined, respuestaCorrecta: Respuesta, dada: Respuesta): TipoError {
  const r = typeof dada === 'number' ? dada : Number(String(dada).replace(/\./g, ''));
  const correcta = typeof respuestaCorrecta === 'number' ? respuestaCorrecta : Number(respuestaCorrecta);
  if (!Number.isFinite(r) || !calculo) {
    return Number.isFinite(r) && Number.isFinite(correcta) && Math.abs(r - correcta) === 1 ? 'conteo-por-uno' : 'otro';
  }
  const { op, a, b } = calculo;

  if (op === 'conteo') {
    return Math.abs(r - correcta) === 1 ? 'conteo-por-uno' : 'otro';
  }
  if (op === 'division' && calculo.redondearArriba && r === Math.floor(a / b) && a % b !== 0) {
    return 'residuo-ignorado';
  }
  if (op === 'suma' && r !== a + b && r === sumaSinLlevar(a, b)) {
    return 'suma-sin-llevar';
  }
  if (op === 'resta' && r !== a - b && r === restaMenorMayor(a, b)) {
    return 'resta-menor-mayor';
  }
  if (op === 'multiplicacion' && r !== a * b && (r === a * (b + 1) || r === a * (b - 1) || r === (a + 1) * b || r === (a - 1) * b)) {
    return 'tabla-vecina';
  }
  // ¿Coincide con otra operación entre los mismos datos?
  const otras: Calculo['op'][] = ['suma', 'resta', 'multiplicacion', 'division'];
  for (const otra of otras) {
    if (otra === op) continue;
    const v = valor(otra, a, b);
    const v2 = otra === 'resta' ? b - a : null;
    if ((v !== null && Number.isInteger(v) && v === r) || (v2 !== null && v2 > 0 && v2 === r)) {
      if (r !== correcta) return 'operacion-equivocada';
    }
  }
  if (Number.isFinite(correcta) && correcta !== 0 && Math.abs(r - correcta) <= Math.max(1, Math.abs(correcta) * 0.05)) {
    return 'cerca';
  }
  return 'otro';
}

export function mensajeError(tipo: TipoError, ej: Pick<Ejercicio, 'pista' | 'calculo'>): string {
  const adulto = ej.pista === 'familia';
  switch (tipo) {
    case 'suma-sin-llevar':
      return adulto
        ? 'Revise las unidades: cuando pasan de 9, forman una decena nueva que se lleva a la siguiente columna.'
        : 'Revisa las unidades: cuando pasan de 9, forman una decena nueva.';
    case 'resta-menor-mayor':
      return adulto
        ? 'En cada columna, ¿alcanza para quitar? Si no, pida prestada una decena a la columna de al lado.'
        : 'En las unidades, ¿alcanza para quitar? Si no, pide prestada una decena.';
    case 'operacion-equivocada':
      return adulto
        ? 'Vuelva a leer el problema: ¿se juntan, se quitan, se repiten o se reparten cantidades?'
        : 'Vuelve a leer: ¿se juntan cosas o se quitan?';
    case 'tabla-vecina':
      return adulto ? 'Casi. Revise si contó un grupo de más o de menos.' : 'Casi. Cuenta un grupo más o uno menos y compara.';
    case 'residuo-ignorado':
      return adulto
        ? 'Tenga en cuenta lo que sobra: también necesita su propio viaje o empaque.'
        : '¿Y los bultos que sobran? También necesitan un viaje.';
    case 'conteo-por-uno':
      return adulto ? 'Le faltó o le sobró uno. Cuente de nuevo con calma.' : 'Toca cada objeto una sola vez y cuenta despacio.';
    case 'cerca':
      return adulto ? 'Está muy cerca. Revise el último paso del cálculo.' : '¡Estás muy cerca! Revisa tu cuenta otra vez.';
    default:
      return adulto
        ? 'Todavía no. Lea otra vez el problema e identifique qué datos necesita.'
        : 'Todavía no. Lee otra vez despacio; si quieres, pide una pista.';
  }
}
