// Plantillas de 5.º grado: números grandes, doble, mitad y propiedad distributiva,
// multiplicación de varias cifras, división con divisor de 2 cifras, residuo en contexto,
// tablas de datos, proporcionalidad simple, fracciones como reparto y problemas compuestos.

import type { Calculo, ContextoGeneracion, DefinicionPista, EjercicioBase, Plantilla, Uso } from '../../juego/tipos';
import { adulto, mayus, num, persona, pesos } from '../contexto';
import { plantillasDecimales } from './decimales';
import { conCifras, dif, distractores, distractoresTipicos, lerp, mezclarOpciones, modoRespuesta, pn, pt, redondear } from './util';

const LIMITE = 10_000_000;

const nombresPosicion = ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil', 'centenas de mil', 'unidades de millón'];

function cifrasDe(n: number): number {
  return Math.abs(n).toString().length;
}

/** Distractores a partir del cálculo y de extras, ajustados a la magnitud de la respuesta. */
function distr(ctx: ContextoGeneracion, respuesta: number, calc: Calculo | undefined, extras: number[] = [], cantidad = 3): number[] {
  const paso = Math.max(1, 10 ** Math.max(0, cifrasDe(respuesta) - 2));
  return distractores(ctx.rng, respuesta, [...extras, ...(calc ? distractoresTipicos(calc) : [])], cantidad, dif(ctx), paso);
}

/** Modo de respuesta con paso proporcional al tamaño de la respuesta. */
function modo(ctx: ContextoGeneracion, respuesta: number, calc: Calculo | undefined, extras: number[] = []) {
  return modoRespuesta(ctx, respuesta, calc, { extras, paso: Math.max(1, 10 ** Math.max(0, cifrasDe(respuesta) - 2)), abiertaMin: 0.4, abiertaMax: 0.9 });
}

/** Frase con un dato que sobra (desde d alto). */
function datoQueSobra(ctx: ContextoGeneracion): string {
  if (dif(ctx) < 0.6 || !ctx.rng.azar(0.6)) return '';
  const { rng } = ctx;
  return ' ' + rng.elegir([
    `El viaje hasta el casco urbano de San Vicente dura ${rng.entero(2, 4)} horas.`,
    `En la finca trabajan ${rng.entero(3, 9)} personas.`,
    `La finca queda a ${rng.entero(3, 12)} kilómetros de la escuela.`,
    `Ese día llovió ${rng.entero(2, 5)} horas sobre la Serranía de los Yariguíes.`,
  ]);
}

// --- Comprensión ---

const valorPosicional: Plantilla = {
  id: 'g5-valor-posicional',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Valor posicional en números grandes',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', 7);
    const n = conCifras(rng, cifras);
    const texto = n.toString();
    const posiciones = texto
      .split('')
      .map((c, i) => ({ c: Number(c), pos: texto.length - 1 - i }))
      .filter((x) => x.c !== 0 && x.pos >= 1);
    const elegido = rng.elegir(posiciones.length ? posiciones : [{ c: Number(texto[0]), pos: texto.length - 1 }]);
    const contexto = rng.elegir([
      `En el año, la cooperativa de cacaoteros recibió ${num(n)} kilos de cacao.`,
      `En la feria del pueblo se recogieron ${pesos(n)} para arreglar el camino de herradura.`,
      `En los viveros de la vereda Llana Caliente han sembrado ${num(n)} plántulas de cacao.`,
    ]);
    const unidad = 10 ** elegido.pos;
    const sumarModo = dif(ctx) > 0.5 && rng.azar(0.5) && n + unidad <= LIMITE;
    if (sumarModo) {
      const respuesta = n + unidad;
      const calc: Calculo = { op: 'suma', a: n, b: unidad };
      return {
        enunciado: `${contexto} Si se suma ${num(unidad)} más, ¿qué número resulta?`,
        instruccion: 'Piensa en la posición',
        datos: { n, b: unidad },
        respuesta,
        ...modo(ctx, respuesta, calc, [n + unidad * 10, n + Math.max(1, unidad / 10), n + 1]),
        calculo: calc,
        pistas: [
          `¿Qué cifra cambia cuando sumas ${num(unidad)}?`,
          { tipo: 'texto', texto: `${num(n)}: la cifra de las ${nombresPosicion[elegido.pos]} es ${elegido.c}.` },
          `Solo aumenta en 1 la cifra de las ${nombresPosicion[elegido.pos]}: pasa de ${elegido.c} a ${elegido.c + 1} (si llega a 10, se lleva).`,
        ],
        explicacion: `${num(n)} + ${num(unidad)} = ${num(respuesta)}.`,
      };
    }
    const respuesta = elegido.c * unidad;
    const calc: Calculo = { op: 'multiplicacion', a: elegido.c, b: unidad };
    return {
      enunciado: `${contexto} ¿Qué valor tiene la cifra ${elegido.c} que está en las ${nombresPosicion[elegido.pos]}?`,
      instruccion: 'Valor de la cifra',
      datos: { n, cifra: elegido.c },
      respuesta,
      ...modo(ctx, respuesta, undefined, [elegido.c, respuesta * 10, respuesta / 10].filter((x) => Number.isInteger(x))),
      calculo: calc,
      pistas: [
        'Cuenta las posiciones desde la derecha: unidades, decenas, centenas…',
        { tipo: 'texto', texto: nombresPosicion.slice(0, texto.length).reverse().map((p, i) => `${texto[i]} → ${p}`).join('\n') },
        `${elegido.c} en las ${nombresPosicion[elegido.pos]} vale ${elegido.c} × ${num(unidad)}.`,
      ],
      explicacion: `La cifra ${elegido.c} está en las ${nombresPosicion[elegido.pos]}: vale ${num(respuesta)}.`,
    };
  },
};

const distributiva: Plantilla = {
  id: 'g5-distributiva',
  dimension: 'comprension',
  operacion: 'multiplicacion',
  descripcion: 'Propiedad distributiva para multiplicar mentalmente',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const grande = pt(ctx, 'tamano', 'normal') === 'grande' || dif(ctx) > 0.6;
    const a = rng.entero(3, 9);
    let b = grande ? rng.entero(101, 999) : rng.entero(12, 99);
    if (b % 10 === 0) b += rng.entero(1, 9);
    const parteGrande = grande ? Math.floor(b / 100) * 100 : Math.floor(b / 10) * 10;
    const resto = b - parteGrande;
    const quien = persona(rng);
    const contexto = `En la finca hay ${a} lotes con ${b} árboles de cacao cada uno.`;
    const completar = rng.azar(0.4);
    if (completar) {
      const calc: Calculo = { op: 'resta', a: b, b: parteGrande };
      return {
        enunciado: `${contexto} Para calcular ${a} × ${b}, ${quien.nombre} piensa: ${a} × ${parteGrande} + ${a} × ☐. ¿Qué número va en el cuadro?`,
        instruccion: 'Completa la descomposición',
        ilustracion: 'arbol',
        datos: { a, b, parteGrande },
        respuesta: resto,
        ...modo(ctx, resto, calc, [b, parteGrande, resto + 10]),
        calculo: calc,
        pistas: [
          `¿En qué dos partes se separó ${b}?`,
          { tipo: 'texto', texto: `${b} = ${parteGrande} + ☐` },
          `${b} − ${parteGrande} = ${resto}.`,
        ],
        explicacion: `${b} = ${parteGrande} + ${resto}, así que ${a} × ${b} = ${a} × ${parteGrande} + ${a} × ${resto}.`,
      };
    }
    const respuesta = a * b;
    const calc: Calculo = { op: 'multiplicacion', a, b };
    return {
      enunciado: `${contexto} ${quien.nombre} calcula cuántos árboles hay así: ${a} × ${parteGrande} + ${a} × ${resto}. ¿Cuántos árboles hay?`,
      instruccion: 'Descompón y suma',
      ilustracion: 'arbol',
      datos: { a, b },
      respuesta,
      ...modo(ctx, respuesta, calc, [a * parteGrande + resto, a * parteGrande]),
      calculo: calc,
      pistas: [
        'Calcula cada parte por separado y después súmalas.',
        { tipo: 'texto', texto: `${a} × ${parteGrande} = ${num(a * parteGrande)}\n${a} × ${resto} = ${a * resto}` },
        `${num(a * parteGrande)} + ${a * resto}.`,
      ],
      explicacion: `${a} × ${b} = ${num(a * parteGrande)} + ${a * resto} = ${num(respuesta)} árboles.`,
    };
  },
};

const ordinales: Record<number, [string, string]> = {
  2: ['la mitad', 'mitades'],
  3: ['la tercera parte', 'terceras partes'],
  4: ['la cuarta parte', 'cuartas partes'],
  5: ['la quinta parte', 'quintas partes'],
  6: ['la sexta parte', 'sextas partes'],
  8: ['la octava parte', 'octavas partes'],
  10: ['la décima parte', 'décimas partes'],
};
const numerales = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];

const fraccionReparto: Plantilla = {
  id: 'g5-fraccion',
  dimension: 'comprension',
  operacion: 'division',
  descripcion: 'Fracción de una cantidad como reparto',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.elegir([2, 3, 4, 5, 6, 8, 10]);
    const q = rng.entero(2, lerp(8, 60, dif(ctx)));
    const n = k * q;
    const m = k > 2 && dif(ctx) > 0.4 && rng.azar(0.6) ? rng.entero(2, k - 1) : 1;
    const respuesta = q * m;
    const parte = m === 1 ? ordinales[k][0] : `las ${numerales[m]} ${ordinales[k][1]}`;
    const fr = `${m}/${k}`;
    const v = rng.elegir([
      { t: `${mayus(adulto(rng).nombre)} cosechó ${n} mazorcas de cacao y le regala ${parte} a su vecina. ¿Cuántas mazorcas le regala?`, u: 'mazorcas' },
      { t: `En la huerta escolar hay ${n} matas. ${mayus(parte)} son de yuca. ¿Cuántas matas de yuca hay?`, u: 'matas' },
      { t: `La cooperativa tiene ${n} bultos de cacao y ya vendió ${parte}. ¿Cuántos bultos vendió?`, u: 'bultos' },
    ]);
    const calc: Calculo = { op: 'division', a: n, b: k };
    return {
      enunciado: v.t,
      instruccion: `Calcula ${fr} de ${n}`,
      datos: { n, k, m },
      respuesta,
      unidad: v.u,
      ...modo(ctx, respuesta, calc, [n - respuesta, q, n * m]),
      calculo: calc,
      pistas: [
        `Primero reparte ${n} en ${k} partes iguales. ¿Cuánto hay en cada parte?`,
        n <= 40 ? { tipo: 'reparto', total: n, grupos: k } : { tipo: 'texto', texto: `${n} ÷ ${k} = ? (una parte)\nluego × ${m}` },
        `${n} ÷ ${k} = ${q}${m > 1 ? `; y ${m} partes son ${q} × ${m}` : ''}.`,
      ],
      explicacion: `${fr} de ${n}: ${n} ÷ ${k} = ${q}${m > 1 ? ` y ${q} × ${m} = ${respuesta}` : ''}. Son ${respuesta} ${v.u}.`,
    };
  },
};

const razonable: Plantilla = {
  id: 'g5-razonable',
  dimension: 'comprension',
  operacion: 'multiplicacion',
  descripcion: '¿Es razonable? Estimar productos y cocientes',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const division = pt(ctx, 'op', 'multiplicacion') === 'division';
    const quien = persona(rng);
    let real: number;
    let estimacion: number;
    let enunciadoBase: string;
    let pista3: string;
    let a: number;
    let b: number;
    if (division) {
      b = rng.entero(12, 98);
      const q = rng.entero(lerp(12, 40, dif(ctx)), lerp(80, 400, dif(ctx)));
      a = b * q;
      real = q;
      estimacion = redondear(q, 10 ** (cifrasDe(q) - 1));
      enunciadoBase = `La cooperativa empacó ${num(a)} kilos de cacao en sacos de ${b} kilos. ${quien.nombre} dice que llenaron`;
      pista3 = `${num(a)} ÷ ${b} es más o menos ${num(redondear(a, 10 ** (cifrasDe(a) - 2)))} ÷ ${redondear(b, 10)}.`;
    } else {
      a = rng.entero(lerp(21, 120, dif(ctx)), lerp(99, 999, dif(ctx)));
      b = rng.entero(12, 98);
      real = a * b;
      const ra = redondear(a, 10 ** (cifrasDe(a) - 1));
      const rb = redondear(b, 10);
      estimacion = ra * rb;
      enunciadoBase = `En ${rng.elegir(['la finca', 'la vereda Llana Caliente', 'el lote de don Ramiro'])} hay ${a} árboles de cacao y cada uno dio ${b} mazorcas. ${quien.nombre} dice que en total hay`;
      pista3 = `${a} es cerca de ${ra} y ${b} es cerca de ${rb}: ${ra} × ${rb} = ${num(ra * rb)}.`;
    }
    const esRazonable = rng.azar(0.5);
    const lejanos = [real * 10, Math.round(real / 10), a + b].filter((x) => x > 0 && Math.abs(x - real) >= real * 0.5 && x <= LIMITE);
    const propuesto = esRazonable || !lejanos.length ? real : rng.elegir(lejanos);
    const esRaz = propuesto === real;
    const opcionesEst = [estimacion, estimacion * 10];
    if (estimacion % 10 === 0) opcionesEst.push(estimacion / 10);
    else opcionesEst.push(estimacion * 100);
    const distrEst = opcionesEst.slice(1);
    return {
      enunciado: `${enunciadoBase} ${num(propuesto)}${division ? ' sacos' : ''}. ¿Es razonable? Después, elige la mejor estimación.`,
      instruccion: '¿Tiene sentido?',
      ilustracion: division ? 'bulto' : 'mazorca',
      datos: { a, b, propuesto },
      respuesta: `${esRaz ? 'si' : 'no'}:${estimacion}`,
      distractores: distrEst,
      interaccion: { tipo: 'razonable', propuesto, esRazonable: esRaz, opciones: rng.barajar(opcionesEst) },
      calculo: { op: division ? 'division' : 'multiplicacion', a, b },
      pistas: [
        'Redondea los números para que la cuenta sea fácil y compara.',
        { tipo: 'texto', texto: division ? `${num(a)} ÷ ${b} ≈ ?` : `${a} × ${b} ≈ ?` },
        pista3,
      ],
      explicacion: `${division ? `${num(a)} ÷ ${b}` : `${a} × ${b}`} = ${num(real)}, cerca de ${num(estimacion)}. ${esRaz ? `Decir ${num(propuesto)} es razonable.` : `${num(propuesto)} está muy lejos: no es razonable.`}`,
    };
  },
};

// --- Procedimiento ---

const dobleMitad: Plantilla = {
  id: 'g5-doble-mitad',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Doble y mitad de números grandes',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = lerp(3, 5, dif(ctx));
    const doble = rng.azar(0.5);
    const n = doble ? conCifras(rng, cifras) : conCifras(rng, cifras) * 2;
    const respuesta = doble ? n * 2 : n / 2;
    const cosa = rng.elegir(['kilos de cacao', 'kilos de café', 'plántulas', 'aguacates']);
    const calc: Calculo = doble ? { op: 'multiplicacion', a: n, b: 2 } : { op: 'division', a: n, b: 2 };
    return {
      enunciado: doble
        ? `El año pasado la cooperativa de cacaoteros recibió ${num(n)} ${cosa}. Este año recibió el doble. Calcula el doble de ${num(n)}.`
        : `En la vereda Llana Caliente se recogieron ${num(n)} ${cosa} y la mitad se lleva al mercado del pueblo. Calcula la mitad de ${num(n)}.`,
      instruccion: doble ? 'Calcula el doble' : 'Calcula la mitad',
      datos: { n },
      respuesta,
      operacion: doble ? 'multiplicacion' : 'division',
      ...modo(ctx, respuesta, calc, doble ? [n + 2, n * 3] : [n - 2, n * 2]),
      calculo: calc,
      pistas: [
        doble ? 'El doble es sumar el número dos veces.' : 'La mitad es repartir en 2 partes iguales.',
        { tipo: 'texto', texto: doble ? `${num(n)} + ${num(n)}` : `${num(n)} ÷ 2` },
        doble
          ? `Descompón: el doble de ${num(Math.floor(n / 1000) * 1000)} y el doble de ${num(n % 1000)}, y súmalos.`
          : `Descompón: la mitad de ${num(Math.floor(n / 1000) * 1000)} y la mitad de ${num(n % 1000)}, y súmalas.`,
      ],
      explicacion: doble ? `${num(n)} × 2 = ${num(respuesta)}.` : `${num(n)} ÷ 2 = ${num(respuesta)}.`,
    };
  },
};

const multAlgoritmo: Plantilla = {
  id: 'g5-algoritmo-mult',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Algoritmo guiado de la multiplicación por una cifra',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifrasA = pn(ctx, 'cifrasA', lerp(3, 5, dif(ctx)));
    const a = conCifras(rng, cifrasA);
    const b = rng.entero(lerp(3, 6, dif(ctx)), 9);
    const respuesta = a * b;
    const calc: Calculo = { op: 'multiplicacion', a, b };
    const contexto = rng.elegir([
      `Cada uno de los ${b} cajones de fermentación tiene ${num(a)} granos de cacao.`,
      `La cooperativa despacha ${num(a)} kilos de cacao cada semana durante ${b} semanas.`,
      `En ${b} veredas de San Vicente hay ${num(a)} árboles de aguacate en cada una.`,
    ]);
    return {
      enunciado: `${contexto} Resuelve cifra por cifra: ${num(a)} × ${b}.`,
      instruccion: 'Multiplica cifra por cifra',
      datos: { a, b },
      respuesta,
      distractores: distr(ctx, respuesta, calc),
      interaccion: { tipo: 'algoritmo', operacion: 'multiplicacion', a, b },
      calculo: calc,
      pistas: [
        `Empieza por las unidades: ¿cuánto es ${a % 10} × ${b}? Escribe las unidades y lleva las decenas.`,
        { tipo: 'texto', texto: `${num(a)}\n×    ${b}\n―――――` },
        `${a % 10} × ${b} = ${(a % 10) * b}: escribe ${((a % 10) * b) % 10} y llevas ${Math.floor(((a % 10) * b) / 10)}.`,
      ],
      explicacion: `${num(a)} × ${b} = ${num(respuesta)}.`,
    };
  },
};

const multVarias: Plantilla = {
  id: 'g5-mult-varias',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Multiplicación de varias cifras',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifrasA = pn(ctx, 'cifrasA', lerp(3, 4, dif(ctx)));
    const cifrasB = pn(ctx, 'cifrasB', lerp(2, 3, dif(ctx)));
    const a = conCifras(rng, cifrasA);
    let b = conCifras(rng, cifrasB);
    if (b % 10 === 0) b += rng.entero(1, 9);
    const respuesta = a * b;
    const calc: Calculo = { op: 'multiplicacion', a, b };
    const quien = persona(rng);
    return {
      enunciado: `${quien.nombre} ayuda a hacer las cuentas en la cooperativa de cacaoteros. Calcula: ${num(a)} × ${num(b)}.`,
      instruccion: 'Multiplica',
      datos: { a, b },
      respuesta,
      ...modo(ctx, respuesta, calc),
      calculo: calc,
      pistas: [
        `Separa ${num(b)} en unidades, decenas${b >= 100 ? ' y centenas' : ''}, y multiplica ${num(a)} por cada parte.`,
        { tipo: 'texto', texto: b >= 10 ? `${num(a)} × ${b % 10}\n${num(a)} × ${num(b - (b % 10))}` : `${num(a)} × ${b}` },
        `${num(a)} × ${b % 10} = ${num(a * (b % 10))}; ${num(a)} × ${num(b - (b % 10))} = ${num(a * (b - (b % 10)))}. Suma los productos parciales.`,
      ],
      explicacion: `${num(a)} × ${num(b)} = ${num(respuesta)}.`,
    };
  },
};

const divDos: Plantilla = {
  id: 'g5-division',
  dimension: 'procedimiento',
  operacion: 'division',
  descripcion: 'División exacta con divisor de 2 cifras',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const divCifras = pn(ctx, 'divCifras', 2);
    const b = divCifras === 1 ? rng.entero(3, 9) : rng.entero(lerp(11, 25, dif(ctx)), lerp(30, 99, dif(ctx)));
    const q = conCifras(rng, lerp(2, 3, dif(ctx)));
    const a = b * q;
    const calc: Calculo = { op: 'division', a, b };
    return {
      enunciado: `En la cooperativa se reparten ${num(a)} kilos de abono en ${b} partes iguales. Calcula: ${num(a)} ÷ ${b}.`,
      instruccion: 'Divide',
      ilustracion: 'bulto',
      datos: { a, b },
      respuesta: q,
      ...modo(ctx, q, calc, [q + 10, Math.max(1, q - 10), q * 10]),
      calculo: calc,
      pistas: [
        `¿Cuántas veces cabe ${b} en las primeras cifras de ${num(a)}?`,
        { tipo: 'texto', texto: [1, 2, 3, 4, 5].map((k) => `${b} × ${k} = ${b * k}`).join('\n') },
        `Comprueba multiplicando: el cociente × ${b} debe dar ${num(a)}.`,
      ],
      explicacion: `${num(a)} ÷ ${b} = ${num(q)}, porque ${num(q)} × ${b} = ${num(a)}.`,
    };
  },
};

// --- Problemas ---

const comparacionMult: Plantilla = {
  id: 'g5-comparacion-mult',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Doble, triple, cuádruple y mitad en contexto',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [k, palabra] = rng.elegir([[2, 'el doble'], [3, 'el triple'], [4, 'el cuádruple']] as [number, string][]);
    const base = conCifras(rng, lerp(3, 5, dif(ctx)));
    const total = base * k;
    const inicial = dif(ctx) > 0.5 && rng.azar(0.5);
    const cultivo = rng.elegir(['cacao', 'café', 'aguacate', 'naranja']);
    const sobra = datoQueSobra(ctx);
    const respuesta = inicial ? base : total;
    const calc: Calculo = inicial ? { op: 'division', a: total, b: k } : { op: 'multiplicacion', a: base, b: k };
    return {
      enunciado: inicial
        ? `Este año la finca ${rng.elegir(['El Mirador', 'La Esperanza', 'Buenavista'])} produjo ${num(total)} kilos de ${cultivo}, que es ${palabra} de lo que produjo el año pasado.${sobra} ¿Cuántos kilos produjo el año pasado?`
        : `El año pasado la finca produjo ${num(base)} kilos de ${cultivo}. Este año produjo ${palabra}.${sobra} ¿Cuántos kilos produjo este año?`,
      instruccion: inicial ? 'Busca el año pasado' : 'Calcula este año',
      datos: { base, k },
      respuesta,
      unidad: 'kilos',
      operacion: inicial ? 'division' : 'multiplicacion',
      ...modo(ctx, respuesta, calc, inicial ? [total * k, total - k] : [base + k, base * (k + 1)]),
      calculo: calc,
      pistas: [
        inicial ? `Si este año es ${palabra}, ¿el año pasado fue más o fue menos?` : `${mayus(palabra)} es multiplicar por ${k}.`,
        { tipo: 'texto', texto: inicial ? `año pasado × ${k} = ${num(total)}` : `${num(base)} × ${k} = ?` },
        inicial ? `Divide ${num(total)} entre ${k}.` : `${num(base)} × ${k}.`,
      ],
      explicacion: inicial ? `${num(total)} ÷ ${k} = ${num(base)} kilos.` : `${num(base)} × ${k} = ${num(total)} kilos.`,
    };
  },
};

const multProblema: Plantilla = {
  id: 'g5-mult-problema',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Problemas de multiplicación de varias cifras',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const sobra = datoQueSobra(ctx);
    const variante = rng.entero(0, 2);
    let a: number;
    let b: number;
    let enunciado: string;
    let unidad: string;
    if (variante === 0) {
      b = rng.entero(6, 24) * 500;
      a = rng.entero(lerp(20, 150, dif(ctx)), Math.min(999, Math.floor(LIMITE / b)));
      enunciado = `La cooperativa compró ${a} kilos de cacao seco a ${pesos(b)} el kilo (precio ilustrativo).${sobra} ¿Cuántos pesos pagó?`;
      unidad = 'pesos';
    } else if (variante === 1) {
      a = rng.entero(lerp(40, 300, dif(ctx)), 999);
      b = rng.entero(15, 60);
      enunciado = `En el lote de ${adulto(rng).nombre} hay ${a} árboles de cacao y cada uno dio ${b} mazorcas.${sobra} ¿Cuántas mazorcas dieron en total?`;
      unidad = 'mazorcas';
    } else {
      a = rng.entero(lerp(12, 80, dif(ctx)), 250);
      b = rng.entero(55, 70);
      enunciado = `El carro de la cooperativa llevó ${a} bultos de cacao al casco urbano de San Vicente. Cada bulto pesa ${b} kilos.${sobra} ¿Cuántos kilos llevó?`;
      unidad = 'kilos';
    }
    const respuesta = a * b;
    const calc: Calculo = { op: 'multiplicacion', a, b };
    return {
      enunciado,
      instruccion: 'Grupos iguales: multiplica',
      ilustracion: variante === 2 ? 'bulto' : 'mazorca',
      datos: { a, b },
      respuesta,
      unidad,
      ...modo(ctx, respuesta, calc, [a + b]),
      calculo: calc,
      pistas: [
        '¿Se repite la misma cantidad varias veces? Entonces multiplica.',
        { tipo: 'texto', texto: `${num(a)} grupos de ${num(b)}` },
        `${num(a)} × ${num(b)}: multiplica por cada cifra y suma los productos parciales.`,
      ],
      explicacion: `${num(a)} × ${num(b)} = ${num(respuesta)} ${unidad}.`,
    };
  },
};

const divProblema: Plantilla = {
  id: 'g5-division-problema',
  dimension: 'problemas',
  operacion: 'division',
  descripcion: 'Problemas de división exacta',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const divCifras = pn(ctx, 'divCifras', 2);
    const sobra = datoQueSobra(ctx);
    const b = divCifras === 1 ? rng.entero(3, 9) : rng.entero(lerp(12, 30, dif(ctx)), lerp(40, 75, dif(ctx)));
    const variante = rng.entero(0, 2);
    let q: number;
    let enunciado: string;
    let unidad: string;
    if (variante === 0) {
      q = rng.entero(lerp(8, 40, dif(ctx)), lerp(40, 400, dif(ctx)));
      enunciado = `En el secadero hay ${num(b * q)} kilos de cacao seco. Se empacan en sacos de ${b} kilos.${sobra} ¿Cuántos sacos se llenan?`;
      unidad = 'sacos';
    } else if (variante === 1) {
      // Tope del total a repartir (en 4.º, hasta $1.000.000).
      const tope = pn(ctx, 'maxPesos', LIMITE);
      q = Math.min(rng.entero(20, 60), Math.floor(tope / b / 1000)) * 1000;
      enunciado = `${mayus(adulto(rng).nombre)} reparte ${pesos(b * q)} en partes iguales entre ${b} trabajadores de la cosecha.${sobra} ¿Cuántos pesos recibe cada uno?`;
      unidad = 'pesos';
    } else {
      q = rng.entero(lerp(10, 30, dif(ctx)), lerp(60, 150, dif(ctx)));
      enunciado = `La mula hizo ${b} viajes por el camino de herradura y llevó ${num(b * q)} kilos de café, la misma cantidad en cada viaje.${sobra} ¿Cuántos kilos llevó en cada viaje?`;
      unidad = 'kilos';
    }
    const a = b * q;
    const calc: Calculo = { op: 'division', a, b };
    return {
      enunciado,
      instruccion: 'Reparte en partes iguales',
      ilustracion: 'bulto',
      datos: { a, b },
      respuesta: q,
      unidad,
      ...modo(ctx, q, calc, [q * 10]),
      calculo: calc,
      pistas: [
        '¿Se reparte o se agrupa en partes iguales? Entonces divide.',
        { tipo: 'texto', texto: `${num(a)} ÷ ${b} = ?` },
        `Busca un número que multiplicado por ${b} dé ${num(a)}.`,
      ],
      explicacion: `${num(a)} ÷ ${b} = ${num(q)} ${unidad}.`,
    };
  },
};

const residuoContexto: Plantilla = {
  id: 'g5-residuo',
  dimension: 'problemas',
  operacion: 'division',
  descripcion: 'Interpretar el residuo en contexto',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(lerp(12, 25, dif(ctx)), lerp(40, 80, dif(ctx)));
    const q = rng.entero(lerp(3, 12, dif(ctx)), lerp(15, 90, dif(ctx)));
    const r = rng.entero(1, k - 1);
    const n = k * q + r;
    const tipo = rng.elegir(['viajes', 'completos', 'sobran'] as const);
    let enunciado: string;
    let respuesta: number;
    let unidad: string;
    let explicacion: string;
    if (tipo === 'viajes') {
      enunciado = `El carro de la cooperativa lleva ${k} bultos por viaje. ¿Cuántos viajes necesita para llevar ${num(n)} bultos de cacao hasta el casco urbano?`;
      respuesta = q + 1;
      unidad = 'viajes';
      explicacion = `${num(n)} ÷ ${k} = ${q} y sobran ${r}. Esos ${r} bultos también necesitan un viaje: ${q + 1} viajes.`;
    } else if (tipo === 'completos') {
      enunciado = `En el secadero hay ${num(n)} kilos de cacao seco y se empacan en sacos de ${k} kilos. ¿Cuántos sacos se llenan completos?`;
      respuesta = q;
      unidad = 'sacos';
      explicacion = `${num(n)} ÷ ${k} = ${q} y sobran ${r} kilos, que no alcanzan para otro saco: ${q} sacos completos.`;
    } else {
      enunciado = `${mayus(adulto(rng).nombre)} empaca ${num(n)} aguacates en cajas de ${k}. ¿Cuántos aguacates quedan por fuera de las cajas llenas?`;
      respuesta = r;
      unidad = 'aguacates';
      explicacion = `${num(n)} ÷ ${k} = ${q} cajas y sobran ${r} aguacates.`;
    }
    const calc: Calculo = { op: 'division', a: n, b: k, redondearArriba: tipo === 'viajes' };
    return {
      enunciado,
      instruccion: '¿Qué hago con lo que sobra?',
      ilustracion: tipo === 'sobran' ? 'aguacate' : 'bulto',
      datos: { n, k },
      respuesta,
      unidad,
      ...modo(ctx, respuesta, calc, tipo === 'viajes' ? [q] : tipo === 'completos' ? [q + 1, r] : [q, k - r]),
      calculo: calc,
      permiteResiduo: true,
      pistas: [
        tipo === 'viajes' ? '¿Se pueden dejar bultos sin llevar?' : tipo === 'completos' ? 'Un saco a medio llenar, ¿cuenta como completo?' : 'Lo que sobra es el residuo de la división.',
        { tipo: 'texto', texto: `${num(n)} ÷ ${k} = ${q}, residuo ${r}` },
        `${k} × ${q} = ${num(k * q)} y ${num(n)} − ${num(k * q)} = ${r}.`,
      ],
      explicacion,
    };
  },
};

const proporcionalidad: Plantilla = {
  id: 'g5-proporcion',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Proporcionalidad simple: valor por unidad',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const a = rng.entero(2, 9);
    const u = rng.entero(lerp(3, 12, dif(ctx)), lerp(12, 45, dif(ctx)));
    const b = a * u;
    let c = rng.entero(2, lerp(12, 60, dif(ctx)));
    if (c === a) c += 1;
    const v = rng.elegir([
      {
        dato: `Con ${a} bultos de abono se fertilizan ${num(b)} árboles de cacao.`,
        directa: `¿Cuántos árboles se fertilizan con ${c} bultos?`,
        inversa: `¿Cuántos bultos se necesitan para fertilizar ${num(u * c)} árboles?`,
        x: 'bultos',
        y: 'árboles',
      },
      {
        dato: `En ${a} jornales se cosechan ${num(b)} mazorcas de cacao.`,
        directa: `¿Cuántas mazorcas se cosechan en ${c} jornales?`,
        inversa: `¿Cuántos jornales se necesitan para cosechar ${num(u * c)} mazorcas?`,
        x: 'jornales',
        y: 'mazorcas',
      },
      {
        dato: `En ${a} días la marquesina seca ${num(b)} kilos de cacao.`,
        directa: `¿Cuántos kilos seca en ${c} días?`,
        inversa: `¿Cuántos días necesita para secar ${num(u * c)} kilos?`,
        x: 'días',
        y: 'kilos',
      },
    ]);
    const inversa = dif(ctx) > 0.6 && rng.azar(0.4);
    const respuesta = inversa ? c : u * c;
    const calc: Calculo = inversa ? { op: 'division', a: u * c, b: u } : { op: 'multiplicacion', a: u, b: c };
    return {
      enunciado: `${v.dato}${datoQueSobra(ctx)} ${inversa ? v.inversa : v.directa}`,
      instruccion: 'Busca cuánto por cada uno',
      datos: { a, b, c },
      respuesta,
      ...modo(ctx, respuesta, calc, inversa ? [c * a, u * c - b] : [b * c, b + c, b * c / a + a]),
      calculo: calc,
      pistas: [
        `¿Cuántos ${v.y} corresponden a 1 solo de los ${v.x}?`.replace('Cuántos mazorcas', 'Cuántas mazorcas'),
        { tipo: 'texto', texto: `${a} → ${num(b)}\n1 → ${num(b)} ÷ ${a} = ${u}` },
        inversa ? `Cada uno rinde ${u}. Divide ${num(u * c)} entre ${u}.` : `Por cada uno son ${u}. Multiplica ${u} × ${c}.`,
      ],
      explicacion: inversa
        ? `${num(b)} ÷ ${a} = ${u} por cada uno; ${num(u * c)} ÷ ${u} = ${c}.`
        : `${num(b)} ÷ ${a} = ${u} por cada uno; ${u} × ${c} = ${num(u * c)}.`,
    };
  },
};

const dosPasos: Plantilla = {
  id: 'g5-dos-pasos',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Problemas de dos o tres pasos con incógnita en distintos lugares',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const sobra = datoQueSobra(ctx);
    const tipo = dif(ctx) < 0.35 ? 'vuelto' : rng.elegir(['inicial', 'cambio', 'vuelto'] as const);
    const quien = adulto(rng);
    if (tipo === 'inicial') {
      const v = rng.entero(lerp(20, 80, dif(ctx)), 300);
      const s = rng.entero(3, 12);
      const r = rng.entero(50, 2000);
      const respuesta = r + v * s;
      const calc: Calculo = { op: 'suma', a: r, b: v * s };
      return {
        enunciado: `${mayus(quien.nombre)} tenía cacao guardado en la bodega. Vendió ${v} kilos cada semana durante ${s} semanas y le quedaron ${num(r)} kilos.${sobra} ¿Cuántos kilos tenía al principio?`,
        instruccion: 'Busca cuánto había al principio',
        datos: { v, s, r },
        respuesta,
        unidad: 'kilos',
        ...modo(ctx, respuesta, calc, [v * s - r, r + v, v * s]),
        calculo: calc,
        pistas: [
          'Primero calcula cuánto vendió en total. Luego piensa: lo vendido más lo que quedó…',
          { tipo: 'texto', texto: `vendido: ${v} × ${s}\nquedó: ${num(r)}` },
          `${v} × ${s} = ${num(v * s)}; ${num(v * s)} + ${num(r)}.`,
        ],
        explicacion: `Vendió ${v} × ${s} = ${num(v * s)} kilos. Tenía ${num(v * s)} + ${num(r)} = ${num(respuesta)} kilos.`,
      };
    }
    if (tipo === 'cambio') {
      const nb = rng.entero(3, 12);
      const precio = rng.entero(40, 140) * 1000;
      const r = rng.entero(1, 50) * 1000;
      const t = nb * precio + r;
      const calc: Calculo = { op: 'division', a: t - r, b: nb };
      return {
        enunciado: `${mayus(quien.nombre)} tenía ${pesos(t)}. Compró ${nb} bultos de abono, todos al mismo precio, y le quedaron ${pesos(r)}.${sobra} ¿Cuánto costó cada bulto? (Precios ilustrativos.)`,
        instruccion: 'Busca el precio de cada bulto',
        ilustracion: 'bulto',
        datos: { t, nb, r },
        respuesta: precio,
        unidad: 'pesos',
        ...modo(ctx, precio, calc, [Math.round(t / nb / 1000) * 1000, t - r]),
        calculo: calc,
        pistas: [
          'Primero averigua cuánto gastó en total en los bultos.',
          { tipo: 'texto', texto: `gastó: ${pesos(t)} − ${pesos(r)}\ncada bulto: gastado ÷ ${nb}` },
          `${pesos(t)} − ${pesos(r)} = ${pesos(t - r)}; ahora divide entre ${nb}.`,
        ],
        explicacion: `Gastó ${pesos(t - r)}; ${pesos(t - r)} ÷ ${nb} = ${pesos(precio)} cada bulto.`,
      };
    }
    // Vuelto: 2 pasos, o 3 con un segundo artículo si d es alto.
    const n1 = rng.entero(2, 8);
    const p1 = rng.entero(4, 30) * 500;
    const tres = dif(ctx) > 0.66;
    const n2 = tres ? rng.entero(2, 6) : 0;
    const p2 = tres ? rng.entero(2, 12) * 500 : 0;
    const gasto = n1 * p1 + n2 * p2;
    const billete = Math.ceil((gasto + 1) / 50000) * 50000;
    const respuesta = billete - gasto;
    const calc: Calculo = { op: 'resta', a: billete, b: gasto };
    return {
      enunciado: `En el mercado del pueblo, ${quien.nombre} compra ${n1} libras de fríjol a ${pesos(p1)} cada una${tres ? ` y ${n2} panelas a ${pesos(p2)} cada una` : ''}. Paga con ${pesos(billete)}.${sobra} ¿Cuánto le devuelven? (Precios ilustrativos.)`,
      instruccion: 'Calcula el vuelto',
      ilustracion: 'moneda',
      datos: { n1, p1, n2, p2, billete },
      respuesta,
      unidad: 'pesos',
      ...modo(ctx, respuesta, calc, [billete - n1 * p1, gasto]),
      calculo: calc,
      pistas: [
        'Primero calcula cuánto cuesta toda la compra; después, el vuelto.',
        { tipo: 'texto', texto: `${n1} × ${pesos(p1)}${tres ? `\n${n2} × ${pesos(p2)}` : ''}` },
        `La compra cuesta ${pesos(gasto)}; ${pesos(billete)} − ${pesos(gasto)}.`,
      ],
      explicacion: `La compra cuesta ${pesos(gasto)}. Le devuelven ${pesos(billete)} − ${pesos(gasto)} = ${pesos(respuesta)}.`,
    };
  },
};

// --- Aplicación ---

const redondeo: Plantilla = {
  id: 'g5-redondeo',
  dimension: 'aplicacion',
  operacion: 'suma',
  descripcion: 'Redondear números grandes para informes',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', lerp(5, 7, dif(ctx)));
    const n = conCifras(rng, cifras);
    const p = rng.entero(Math.max(1, cifras - 4), cifras - 1);
    const unidadRed = 10 ** p;
    const respuesta = redondear(n, unidadRed);
    const nombre = nombresPosicion[p].replace(/^unidades/, 'unidad').replace(/^decenas/, 'decena').replace(/^centenas/, 'centena');
    const abajo = Math.floor(n / unidadRed) * unidadRed;
    const arriba = abajo + unidadRed;
    const calc: Calculo = { op: 'otra', a: n, b: unidadRed };
    return {
      enunciado: `${mayus(rng.elegir(['para la cartelera de la escuela', 'para el informe de la cooperativa', 'para la reunión de la junta de la vereda']))}, ${persona(rng).nombre} redondea ${num(n)} kilos de cacao a la ${nombre} más cercana. ¿Qué número escribe?`,
      instruccion: 'Redondea',
      datos: { n },
      respuesta,
      unidad: 'kilos',
      ...modo(ctx, respuesta, calc, [abajo === respuesta ? arriba : abajo, redondear(n, unidadRed * 10), redondear(n, Math.max(1, unidadRed / 10))].filter((x) => x <= LIMITE)),
      calculo: calc,
      pistas: [
        `¿Entre qué dos números redondos (de ${num(unidadRed)} en ${num(unidadRed)}) está ${num(n)}?`,
        { tipo: 'texto', texto: `${num(abajo)} ← ${num(n)} → ${num(arriba)}` },
        `Mira la cifra de la derecha de la ${nombre}: si es 5 o más, sube; si es menor, baja.`,
      ],
      explicacion: `${num(n)} está más cerca de ${num(respuesta)}.`,
    };
  },
};

const valorUnitario: Plantilla = {
  id: 'g5-valor-unitario',
  dimension: 'aplicacion',
  operacion: 'multiplicacion',
  descripcion: 'Precios por kilo: total, precio unitario y regla de tres',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const modoV = pt(ctx, 'modo', 'regla');
    const producto = rng.elegir(['café', 'cacao seco', 'aguacate', 'naranja', 'panela']);
    const precio = rng.entero(10, 120) * 100;
    const nota = ' (Precio ilustrativo.)';
    if (modoV === 'mult') {
      const k = rng.entero(lerp(12, 40, dif(ctx)), lerp(60, 400, dif(ctx)));
      const respuesta = precio * k;
      const calc: Calculo = { op: 'multiplicacion', a: k, b: precio };
      return {
        enunciado: `En la cooperativa, el kilo de ${producto} se paga a ${pesos(precio)}.${nota} ¿Cuánto se paga por ${k} kilos?`,
        instruccion: 'Precio total',
        ilustracion: 'moneda',
        datos: { precio, k },
        respuesta,
        unidad: 'pesos',
        operacion: 'multiplicacion',
        ...modo(ctx, respuesta, calc),
        calculo: calc,
        pistas: ['Si cada kilo cuesta lo mismo, ¿qué operación usas?', { tipo: 'texto', texto: `${k} × ${pesos(precio)}` }, `${k} × ${num(precio)}.`],
        explicacion: `${k} × ${pesos(precio)} = ${pesos(respuesta)}.`,
      };
    }
    if (modoV === 'div') {
      const k = rng.entero(11, lerp(30, 99, dif(ctx)));
      const total = precio * k;
      const calc: Calculo = { op: 'division', a: total, b: k };
      return {
        enunciado: `${mayus(adulto(rng).nombre)} pagó ${pesos(total)} por ${k} kilos de ${producto}.${nota} ¿Cuánto costó cada kilo?`,
        instruccion: 'Precio de un kilo',
        ilustracion: 'moneda',
        datos: { total, k },
        respuesta: precio,
        unidad: 'pesos',
        operacion: 'division',
        ...modo(ctx, precio, calc),
        calculo: calc,
        pistas: ['El total se reparte entre los kilos.', { tipo: 'texto', texto: `${pesos(total)} ÷ ${k}` }, `Busca un número que multiplicado por ${k} dé ${num(total)}.`],
        explicacion: `${pesos(total)} ÷ ${k} = ${pesos(precio)} por kilo.`,
      };
    }
    const a = rng.entero(2, 9);
    let m = rng.entero(2, lerp(12, 40, dif(ctx)));
    if (m === a) m += 1;
    const total = a * precio;
    const respuesta = m * precio;
    const calc: Calculo = { op: 'multiplicacion', a: precio, b: m };
    return {
      enunciado: `En el mercado del pueblo, ${a} kilos de ${producto} cuestan ${pesos(total)}.${nota} ¿Cuánto cuestan ${m} kilos al mismo precio?`,
      instruccion: 'Primero el precio de 1 kilo',
      ilustracion: 'moneda',
      datos: { a, total, m },
      respuesta,
      unidad: 'pesos',
      operacion: 'mixta',
      ...modo(ctx, respuesta, calc, [total * m, total + m * 100, total * m / a + precio]),
      calculo: calc,
      pistas: ['¿Cuánto cuesta 1 kilo?', { tipo: 'texto', texto: `${a} kilos → ${pesos(total)}\n1 kilo → ${pesos(total)} ÷ ${a}` }, `1 kilo cuesta ${pesos(precio)}; multiplica por ${m}.`],
      explicacion: `${pesos(total)} ÷ ${a} = ${pesos(precio)} el kilo; ${m} × ${pesos(precio)} = ${pesos(respuesta)}.`,
    };
  },
};

const tablaSacos: Plantilla = {
  id: 'g5-tabla-sacos',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Leer una tabla de recibos de cacao y empacar en sacos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const semanas = [rng.entero(lerp(100, 600, dif(ctx)), lerp(500, 3000, dif(ctx))), 0, 0].map((x, i) => (i === 0 ? x : rng.entero(lerp(100, 600, dif(ctx)), lerp(500, 3000, dif(ctx)))));
    const [s1, s2, s3] = semanas;
    const k = rng.elegir([25, 40, 50, 60, 62, 70]);
    const total = s1 + s2 + s3;
    const sobranModo = rng.azar(0.3);
    const q = Math.floor(total / k);
    const r = total % k;
    const respuesta = sobranModo ? r : q;
    const conExtra = dif(ctx) > 0.6;
    const encabezados = conExtra ? ['Semana', 'Kilos de cacao', 'Socios que entregaron'] : ['Semana', 'Kilos de cacao'];
    const filas = semanas.map((s, i) => (conExtra ? [`Semana ${i + 1}`, s, rng.entero(8, 40)] : [`Semana ${i + 1}`, s]));
    const calc: Calculo = { op: 'division', a: total, b: k };
    const d = distr(ctx, respuesta, sobranModo ? undefined : calc, sobranModo ? [k - r, q, r + 1] : [q + 1, Math.round(total / k / 10) * 10]);
    const abierta = rng.azar(0.3 + 0.5 * dif(ctx));
    return {
      enunciado: sobranModo
        ? `La cooperativa recibió cacao durante tres semanas, como muestra la tabla. Si empaca todo en sacos de ${k} kilos, ¿cuántos kilos quedan por fuera de los sacos llenos?`
        : `La cooperativa recibió cacao durante tres semanas, como muestra la tabla. Si empaca todo en sacos de ${k} kilos, ¿cuántos sacos llena completos?`,
      instruccion: 'Lee la tabla',
      ilustracion: 'bulto',
      datos: { s1, s2, s3, k },
      respuesta,
      unidad: sobranModo ? 'kilos' : 'sacos',
      distractores: d,
      interaccion: { tipo: 'tabla', encabezados, filas, opciones: abierta ? undefined : mezclarOpciones(rng, respuesta, d) },
      calculo: calc,
      permiteResiduo: true,
      pistas: [
        'Primero suma los kilos de las tres semanas. ¿Necesitas todos los datos de la tabla?',
        { tipo: 'texto', texto: `${num(s1)} + ${num(s2)} + ${num(s3)} = ${num(total)}` },
        `${num(total)} ÷ ${k} = ${q}, residuo ${r}.`,
      ],
      explicacion: `En total ${num(total)} kilos. ${num(total)} ÷ ${k} = ${q} sacos completos y sobran ${r} kilos.`,
    };
  },
};

const compuestoTabla: Plantilla = {
  id: 'g5-compuesto-tabla',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Problemas compuestos con tabla de producción y precios',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const prods = rng.barajar([
      { n: 'Cacao seco', p: rng.entero(16, 24) * 500 },
      { n: 'Café', p: rng.entero(14, 22) * 500 },
      { n: 'Aguacate', p: rng.entero(4, 8) * 500 },
      { n: 'Naranja', p: rng.entero(2, 4) * 500 },
    ]).slice(0, 3);
    const kilos = prods.map(() => rng.entero(lerp(20, 80, dif(ctx)), lerp(120, 300, dif(ctx))));
    const filas = prods.map((p, i) => [p.n, kilos[i], pesos(p.p)]);
    const finca = rng.elegir(['El Mirador', 'La Esperanza', 'Buenavista', 'El Cacaotal']);
    const pasos = dif(ctx) < 0.34 ? 1 : dif(ctx) < 0.67 ? 2 : 3;
    const v0 = kilos[0] * prods[0].p;
    const v1 = kilos[1] * prods[1].p;
    let respuesta: number;
    let pregunta: string;
    let calc: Calculo;
    let paso: string;
    if (pasos === 1) {
      respuesta = v0;
      calc = { op: 'multiplicacion', a: kilos[0], b: prods[0].p };
      pregunta = `¿Cuánto recibe la finca por ${prods[0].n.toLowerCase()}?`;
      paso = `${kilos[0]} × ${pesos(prods[0].p)}.`;
    } else if (pasos === 2) {
      respuesta = v0 + v1;
      calc = { op: 'suma', a: v0, b: v1 };
      pregunta = `¿Cuánto recibe en total por ${prods[0].n.toLowerCase()} y ${prods[1].n.toLowerCase()}?`;
      paso = `${pesos(v0)} + ${pesos(v1)}.`;
    } else {
      const gasto = rng.entero(1, Math.floor((v0 + v1) / 2 / 10000)) * 10000;
      respuesta = v0 + v1 - gasto;
      calc = { op: 'resta', a: v0 + v1, b: gasto };
      pregunta = `Si gastó ${pesos(gasto)} en jornales y abono, ¿cuánto ganó por ${prods[0].n.toLowerCase()} y ${prods[1].n.toLowerCase()}?`;
      paso = `Ingresos: ${pesos(v0)} + ${pesos(v1)} = ${pesos(v0 + v1)}; luego resta ${pesos(gasto)}.`;
    }
    return {
      enunciado: `La tabla muestra lo que vendió la finca ${finca} en el mes (precios ilustrativos). ${pregunta}`,
      instruccion: 'Lee la tabla y calcula',
      ilustracion: 'moneda',
      datos: { k0: kilos[0], p0: prods[0].p, k1: kilos[1], p1: prods[1].p, k2: kilos[2], p2: prods[2].p },
      respuesta,
      unidad: 'pesos',
      ...modo(ctx, respuesta, calc, [v0, v1, v0 + v1, kilos[0] + prods[0].p].filter((x) => x !== respuesta)),
      interaccion: { tipo: 'tabla', encabezados: ['Producto', 'Kilos', 'Precio por kilo'], filas },
      calculo: calc,
      pistas: [
        `¿Qué filas de la tabla necesitas? ${pasos > 1 ? 'No usas todas.' : ''}`.trim(),
        { tipo: 'texto', texto: `Lo que recibe por un producto = kilos × precio por kilo` },
        paso,
      ],
      explicacion: `${prods[0].n}: ${kilos[0]} × ${pesos(prods[0].p)} = ${pesos(v0)}.${pasos > 1 ? ` ${prods[1].n}: ${kilos[1]} × ${pesos(prods[1].p)} = ${pesos(v1)}.` : ''} Resultado: ${pesos(respuesta)}.`,
    };
  },
};

// La plantilla compuesta usa tabla con teclado: ajustar distractores sin opciones.
const compuestoTablaFinal: Plantilla = {
  ...compuestoTabla,
  generar(ctx): EjercicioBase {
    const ej = compuestoTabla.generar(ctx);
    const abierta = ctx.rng.azar(0.4 + 0.5 * dif(ctx));
    if (ej.interaccion.tipo === 'tabla' && !abierta) {
      ej.interaccion = { ...ej.interaccion, opciones: mezclarOpciones(ctx.rng, ej.respuesta, ej.distractores) };
    }
    return ej;
  },
};

const { leer, comparar, sumaResta, multiplicar, dividir, problema } = plantillasDecimales;

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

export const g5: DefinicionPista = {
  pista: 'g5',
  limite: LIMITE,
  plantillas: [
    valorPosicional,
    distributiva,
    fraccionReparto,
    razonable,
    dobleMitad,
    multAlgoritmo,
    multVarias,
    divDos,
    comparacionMult,
    multProblema,
    divProblema,
    residuoContexto,
    proporcionalidad,
    dosPasos,
    redondeo,
    valorUnitario,
    tablaSacos,
    compuestoTablaFinal,
    leer,
    comparar,
    sumaResta,
    multiplicar,
    dividir,
    problema,
  ],
  temas: [
    {
      titulo: 'Números grandes y redondeo',
      usos: [u(redondeo), u(valorPosicional, { cifras: 7 }), u(dobleMitad), u(distributiva)],
    },
    {
      titulo: 'Multiplicar varias cifras',
      usos: [u(multVarias), u(multAlgoritmo), u(multProblema), u(razonable), u(comparacionMult), u(distributiva, { tamano: 'grande' })],
    },
    {
      titulo: 'Dividir entre 2 cifras',
      usos: [u(divDos), u(divProblema), u(razonable, { op: 'division' }), u(residuoContexto)],
    },
    {
      titulo: 'Problemas con las cuatro operaciones',
      usos: [u(dosPasos), u(proporcionalidad), u(valorUnitario), u(fraccionReparto), u(tablaSacos), u(compuestoTablaFinal)],
    },
    {
      titulo: 'Décimas y centésimas',
      usos: [u(leer)],
    },
    {
      titulo: 'Comparar y ordenar decimales',
      usos: [u(comparar), u(leer)],
      prueba: u(comparar),
    },
    {
      titulo: 'Sumar y restar decimales',
      usos: [u(sumaResta)],
    },
    {
      titulo: 'Multiplicar decimales',
      usos: [u(multiplicar)],
    },
    {
      titulo: 'Dividir con resultado decimal',
      usos: [u(dividir)],
    },
    {
      titulo: 'Problemas con números decimales',
      usos: [u(problema), u(sumaResta), u(multiplicar), u(dividir)],
    },
  ],
};

/** Plantillas de división de 5.º que también usa 4.º. */
export { divDos, divProblema, residuoContexto };
