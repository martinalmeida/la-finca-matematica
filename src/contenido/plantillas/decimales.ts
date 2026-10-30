// Plantillas de números decimales (5.º): décimas y centésimas con kilos, litros y metros,
// comparar, sumar y restar, multiplicar, dividir con resultado decimal y problemas.
// Los valores se calculan en centésimas enteras para evitar errores de coma flotante.
// En Colombia los precios no llevan centavos: los decimales van en medidas (kilos, litros, metros), no en pesos.

import type { ContextoGeneracion, EjercicioBase, Interaccion, Plantilla } from '../../juego/tipos';
import type { Rng } from '../../juego/rng';
import { adulto, mayus, num, persona, pesos } from '../contexto';
import { dif, lerp, lerpF } from './util';

/** Redondea a centésimas. */
export function c2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Número con 1 o 2 decimales entre min y max (en unidades), según d. */
function decimal(rng: Rng, min: number, max: number, decimales: 1 | 2): number {
  const f = decimales === 1 ? 10 : 100;
  let v = rng.entero(min * f + 1, max * f - 1);
  // Que el número tenga de verdad esa cantidad de decimales (2,50 → 2,5 no sirve para centésimas).
  if (decimales === 2 && v % 10 === 0) v += rng.entero(1, 9);
  if (decimales === 1 && v % 10 === 0) v += rng.entero(1, 9);
  return v / f;
}

function decimalesSegun(ctx: ContextoGeneracion): 1 | 2 {
  return dif(ctx) < 0.4 || ctx.rng.azar(0.4) ? 1 : 2;
}

/** Distractores decimales: errores típicos y vecinos, positivos y distintos de la respuesta. */
function distractoresDec(rng: Rng, respuesta: number, candidatos: number[], cantidad = 3): number[] {
  const r = c2(respuesta);
  const usados = new Set<number>([r]);
  const salida: number[] = [];
  const vecinos = [r + 0.1, r - 0.1, r + 1, r - 1, r + 0.01, r - 0.01, r * 10, r / 10];
  for (const c of [...rng.barajar(candidatos), ...rng.barajar(vecinos)]) {
    if (salida.length >= cantidad) break;
    const v = c2(c);
    if (v <= 0 || usados.has(v) || Math.abs(v * 100 - Math.round(v * 100)) > 1e-9) continue;
    usados.add(v);
    salida.push(v);
  }
  return salida;
}

/** Opciones o teclado con coma: a mayor d, más respuesta abierta. */
function modoDec(ctx: ContextoGeneracion, respuesta: number, candidatos: number[]): { interaccion: Interaccion; distractores: number[]; decimales: true } {
  const distr = distractoresDec(ctx.rng, respuesta, candidatos);
  const abierta = ctx.rng.azar(ctx.repaso ? 0.2 : lerpF(0.3, 0.8, dif(ctx)));
  const interaccion: Interaccion = abierta ? { tipo: 'numerica' } : { tipo: 'opciones', opciones: ctx.rng.barajar([c2(respuesta), ...distr]) };
  return { interaccion, distractores: distr, decimales: true };
}

/** «2,5 kilos» con la unidad. */
function med(v: number, unidad: string): string {
  return `${num(c2(v))} ${unidad}`;
}

/** Cosas que se miden con decimales: cómo se miden y hasta cuántas unidades es creíble. */
type Medida = { cosa: string; unidad: string; verbo: string; como: string; max: number };

const medidas: Medida[] = [
  { cosa: 'el bulto de cacao seco', unidad: 'kilos', verbo: 'pesa', como: 'En la balanza de la cooperativa', max: 40 },
  { cosa: 'la cantina de leche', unidad: 'litros', verbo: 'tiene', como: 'Según la jarra medidora', max: 40 },
  { cosa: 'el rollo de alambre', unidad: 'metros', verbo: 'mide', como: 'Según la cinta métrica', max: 40 },
  { cosa: 'la bolsa de café molido', unidad: 'kilos', verbo: 'pesa', como: 'En la balanza de la tienda', max: 3 },
  { cosa: 'la manguera para regar la huerta', unidad: 'metros', verbo: 'mide', como: 'Según la cinta métrica', max: 30 },
  { cosa: 'el lazo para amarrar la carga de la mula', unidad: 'metros', verbo: 'mide', como: 'Con el metro de la finca', max: 15 },
  { cosa: 'el balde del ordeño', unidad: 'litros', verbo: 'tiene', como: 'Según la jarra medidora', max: 12 },
  { cosa: 'el costal de café pergamino', unidad: 'kilos', verbo: 'pesa', como: 'En la báscula del beneficiadero', max: 40 },
  { cosa: 'la canasta de mazorcas de cacao', unidad: 'kilos', verbo: 'pesa', como: 'En la balanza de la finca', max: 25 },
  { cosa: 'el racimo de plátano', unidad: 'kilos', verbo: 'pesa', como: 'En la balanza de la finca', max: 35 },
  { cosa: 'el bidón de agua de la escuela', unidad: 'litros', verbo: 'tiene', como: 'Según la jarra medidora', max: 20 },
  { cosa: 'la guadua para el corral', unidad: 'metros', verbo: 'mide', como: 'Con el metro de la finca', max: 9 },
  { cosa: 'el queso de la quesera', unidad: 'kilos', verbo: 'pesa', como: 'En la balanza de la tienda', max: 4 },
  { cosa: 'la olla de agua de panela', unidad: 'litros', verbo: 'tiene', como: 'Según la jarra medidora', max: 15 },
];

// --- Comprensión ---

const leer: Plantilla = {
  id: 'g5-decimal-leer',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Décimas y centésimas: leer y armar números decimales',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const m = rng.elegir(medidas);
    const ent = rng.entero(1, Math.max(1, Math.min(m.max, lerp(9, 40, dif(ctx)))));
    const dec = rng.entero(1, 9);
    const cen = rng.entero(1, 9);
    if (rng.azar(0.5)) {
      // Armar el número: enteros, décimas y centésimas.
      const conCen = dif(ctx) >= 0.4 && rng.azar(0.6);
      const respuesta = c2(ent + dec / 10 + (conCen ? cen / 100 : 0));
      const partes = `${ent} ${ent === 1 ? 'entero' : 'enteros'} y ${conCen ? `${dec * 10 + cen} centésimas` : `${dec} ${dec === 1 ? 'décima' : 'décimas'}`}`;
      const enunciado = rng.azar(0.5)
        ? `${m.como}, ${m.cosa} ${m.verbo} ${partes} de ${m.unidad}. ¿Qué número es?`
        : `${persona(rng).nombre} anotó en el cuaderno que ${m.cosa} ${m.verbo} ${partes} de ${m.unidad}. ¿Cómo se escribe ese número con coma?`;
      return {
        enunciado,
        instruccion: 'Arma el número decimal',
        datos: { ent, dec, ...(conCen ? { cen } : {}) },
        respuesta,
        unidad: m.unidad,
        ...modoDec(ctx, respuesta, conCen ? [ent + (dec * 10 + cen) / 1000, ent * 100 + dec * 10 + cen, ent + cen / 10 + dec / 100] : [ent + dec / 100, ent * 10 + dec, ent + dec]),
        calculo: { op: 'otra', a: ent, b: dec },
        pistas: [
          'La parte entera va antes de la coma; las décimas, justo después de la coma.',
          { tipo: 'texto', texto: conCen ? `Enteros: ${ent} | Décimas: ${dec} | Centésimas: ${cen}` : `Enteros: ${ent} | Décimas: ${dec}` },
          conCen ? `${dec * 10 + cen} centésimas son ${dec} décimas y ${cen} centésimas.` : `${dec} décimas se escriben ${num(dec / 10)}.`,
        ],
        explicacion: `${partes} se escribe ${num(respuesta)}.`,
      };
    }
    // ¿Qué cifra está en las décimas o en las centésimas?
    const n = c2(ent + dec / 10 + cen / 100);
    const pideCen = dif(ctx) >= 0.4 && rng.azar(0.5);
    const lugar = pideCen ? 'centésimas' : 'décimas';
    const respuesta = pideCen ? cen : dec;
    const candidatos = [...new Set([dec, cen, ent % 10, (respuesta % 9) + 1].filter((x) => x !== respuesta && x > 0))].slice(0, 3);
    const opciones = rng.barajar([respuesta, ...candidatos]);
    const enunciado = rng.azar(0.5)
      ? `${mayus(m.cosa)} ${m.verbo} ${med(n, m.unidad)}. ¿Qué cifra está en el lugar de las ${lugar}?`
      : `${m.como}, ${m.cosa} ${m.verbo} ${med(n, m.unidad)}. En ese número, ¿qué cifra ocupa las ${lugar}?`;
    return {
      enunciado,
      instruccion: pideCen ? 'Busca las centésimas' : 'Busca las décimas',
      datos: { n, ent, dec, cen },
      respuesta,
      distractores: candidatos,
      interaccion: { tipo: 'opciones', opciones },
      calculo: { op: 'otra', a: ent, b: dec },
      pistas: [
        'Después de la coma, la primera cifra son las décimas y la segunda, las centésimas.',
        { tipo: 'texto', texto: `${num(n)}\nEnteros: ${ent} | Décimas: ${dec} | Centésimas: ${cen}` },
        `En ${num(n)}, la cifra de las ${lugar} es ${respuesta}.`,
      ],
      explicacion: `En ${num(n)}: ${ent} ${ent === 1 ? 'entero' : 'enteros'}, ${dec} décimas y ${cen} centésimas.`,
    };
  },
};

/** Qué se compara: el texto termina justo antes de la lista de medidas. */
const escenasComparar: { t: string; u: string; mas: string; menos: string }[] = [
  { t: 'Estos bultos de cacao seco pesan', u: 'kilos', mas: '¿Cuál pesa más?', menos: '¿Cuál pesa menos?' },
  { t: 'Hoy se ordeñaron unas vacas y dieron', u: 'litros', mas: '¿Cuál es la mayor cantidad?', menos: '¿Cuál es la menor cantidad?' },
  { t: 'Los niños midieron con un metro unas guaduas de', u: 'metros', mas: '¿Cuál es la más larga?', menos: '¿Cuál es la más corta?' },
  { t: 'En la báscula del beneficiadero, los costales de café pergamino pesaron', u: 'kilos', mas: '¿Cuál costal pesa más?', menos: '¿Cuál costal pesa menos?' },
  { t: 'Los rollos de alambre que quedaron en la bodega miden', u: 'metros', mas: '¿Cuál rollo es el más largo?', menos: '¿Cuál rollo es el más corto?' },
  { t: 'Los racimos de plátano de esta semana pesaron', u: 'kilos', mas: '¿Cuál es el racimo más pesado?', menos: '¿Cuál es el racimo más liviano?' },
  { t: 'Las cantinas de leche que llegaron a la quesera tienen', u: 'litros', mas: '¿Cuál cantina tiene más leche?', menos: '¿Cuál cantina tiene menos leche?' },
  { t: 'Los pedazos de manguera que hay en la huerta escolar miden', u: 'metros', mas: '¿Cuál pedazo es el más largo?', menos: '¿Cuál pedazo es el más corto?' },
  { t: 'Las canastas de mazorcas de cacao que recogieron hoy pesan', u: 'kilos', mas: '¿Cuál canasta pesa más?', menos: '¿Cuál canasta pesa menos?' },
  { t: 'Las ollas de agua de panela para el refrigerio tienen', u: 'litros', mas: '¿Cuál olla tiene más?', menos: '¿Cuál olla tiene menos?' },
];

const comparar: Plantilla = {
  id: 'g5-decimal-comparar',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Comparar y ordenar números decimales',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const ent = rng.entero(1, lerp(5, 20, dif(ctx)));
    // Trampa típica: 2,5 frente a 2,35 (más cifras no es más grande).
    const a = c2(ent + rng.entero(2, 9) / 10);
    let b = c2(ent + rng.entero(11, 99) / 100);
    if (b === a) b = c2(b + 0.01);
    const c = c2(ent + rng.entero(1, 9) / 100);
    const lista = dif(ctx) >= 0.5 ? [a, b, c] : [a, b];
    const unicos = [...new Set(lista)];
    const mayor = rng.azar(0.5);
    const respuesta = mayor ? Math.max(...unicos) : Math.min(...unicos);
    const m = rng.elegir(escenasComparar);
    return {
      // Con «y» y punto y coma: la coma ya es la del decimal (4,2 y 4,51; no «4,2, 4,51»).
      enunciado: `${m.t} ${unicos.slice(0, -1).map((x) => num(x)).join('; ')} y ${num(unicos[unicos.length - 1])} ${m.u}. ${mayor ? m.mas : m.menos}`,
      instruccion: mayor ? 'Busca el mayor' : 'Busca el menor',
      datos: Object.fromEntries(unicos.map((x, k) => [`n${k}`, x])),
      respuesta,
      unidad: m.u,
      distractores: unicos.filter((x) => x !== respuesta),
      interaccion: { tipo: 'opciones', opciones: rng.barajar(unicos) },
      calculo: { op: 'otra', a, b },
      decimales: true,
      pistas: [
        'Primero compara los enteros. Si son iguales, compara las décimas y luego las centésimas.',
        { tipo: 'texto', texto: unicos.map((x) => num(x).padEnd(5, ' ') + ' → ' + (x.toFixed(2).replace('.', ','))).join('\n') },
        `Escribe todos con dos cifras después de la coma (${num(a)} = ${a.toFixed(2).replace('.', ',')}) y compara.`,
      ],
      explicacion: `Con dos cifras después de la coma: ${unicos.map((x) => x.toFixed(2).replace('.', ',')).join(', ')}. El ${mayor ? 'mayor' : 'menor'} es ${num(respuesta)}.`,
    };
  },
};

// --- Procedimiento ---

/** Situación para operar dos medidas (a y b ya escritas). max: hasta cuántas unidades es creíble. */
type EscenaDos = { t: (quien: string, a: string, b: string) => string; u: string; max: number };

const escenasSuma: EscenaDos[] = [
  { t: (q, a, b) => `${mayus(q)} cosechó ${a} kilos de cacao en baba el lunes y ${b} kilos el martes. ¿Cuántos kilos cosechó en los dos días?`, u: 'kilos', max: 60 },
  { t: (_q, a, b) => `Una vaca dio ${a} litros de leche en el ordeño de la mañana y ${b} litros en el de la tarde. ¿Cuántos litros dio en el día?`, u: 'litros', max: 12 },
  { t: (q, a, b) => `Para la cerca, ${q} compró un rollo de ${a} metros de alambre y otro de ${b} metros. ¿Cuántos metros de alambre tiene?`, u: 'metros', max: 60 },
  { t: (q, a, b) => `${mayus(q)} unió una manguera de ${a} metros con otra de ${b} metros para regar la huerta escolar. ¿Cuánto mide la manguera unida?`, u: 'metros', max: 30 },
  { t: (q, a, b) => `${mayus(q)} secó ${a} kilos de café pergamino en la marquesina y ${b} kilos en el patio. ¿Cuántos kilos secó en total?`, u: 'kilos', max: 60 },
  { t: (q, a, b) => `En la tienda de la vereda, ${q} compró ${a} kilos de arroz y ${b} kilos de frijol. ¿Cuántos kilos lleva en total?`, u: 'kilos', max: 10 },
  { t: (_q, a, b) => `Dos racimos de plátano pesan ${a} kilos y ${b} kilos. ¿Cuánto pesan los dos juntos?`, u: 'kilos', max: 35 },
  { t: (_q, a, b) => `La huerta escolar gastó ${a} litros de agua el lunes y ${b} litros el martes. ¿Cuántos litros gastó en los dos días?`, u: 'litros', max: 60 },
  { t: (q, a, b) => `Para amarrar la carga de la mula, ${q} une un lazo de ${a} metros con otro de ${b} metros. ¿Cuánto mide el lazo completo?`, u: 'metros', max: 15 },
  { t: (_q, a, b) => `En la cooperativa pesaron dos costales de café: uno de ${a} kilos y otro de ${b} kilos. ¿Cuánto pesan juntos?`, u: 'kilos', max: 60 },
  { t: (q, a, b) => `${mayus(q)} llevó a la quesera una cantina con ${a} litros de leche y otra con ${b} litros. ¿Cuántos litros llevó?`, u: 'litros', max: 40 },
  { t: (q, a, b) => `${mayus(q)} recogió ${a} kilos de mandarina en la mañana y ${b} kilos en la tarde. ¿Cuántos kilos recogió en el día?`, u: 'kilos', max: 60 },
  { t: (_q, a, b) => `La chiva recorrió ${a} kilómetros hasta la escuela y ${b} kilómetros más hasta el pueblo. ¿Cuántos kilómetros recorrió?`, u: 'kilómetros', max: 30 },
  { t: (q, a, b) => `Para el sancocho de la escuela, ${q} compró ${a} kilos de yuca y ${b} kilos de plátano. ¿Cuántos kilos compró en total?`, u: 'kilos', max: 15 },
];

const escenasResta: EscenaDos[] = [
  { t: (q, a, b) => `${mayus(q)} tenía ${a} litros de leche y vendió ${b} litros en la tienda. ¿Cuántos litros le quedan?`, u: 'litros', max: 40 },
  { t: (_q, a, b) => `De un rollo de ${a} metros de alambre se usaron ${b} metros para la cerca. ¿Cuántos metros quedan en el rollo?`, u: 'metros', max: 60 },
  { t: (q, a, b) => `El costal de cacao seco pesaba ${a} kilos y ${q} sacó ${b} kilos para hacer chocolate de mesa. ¿Cuántos kilos quedan en el costal?`, u: 'kilos', max: 60 },
  { t: (q, a, b) => `La manguera medía ${a} metros y ${q} le cortó un pedazo de ${b} metros. ¿Cuánto mide ahora?`, u: 'metros', max: 30 },
  { t: (_q, a, b) => `La cantina llegó a la quesera con ${a} litros de leche y para un queso usaron ${b} litros. ¿Cuántos litros quedan en la cantina?`, u: 'litros', max: 40 },
  { t: (q, a, b) => `${mayus(q)} cosechó ${a} kilos de mandarina y le regaló ${b} kilos a una vecina. ¿Cuántos kilos le quedan?`, u: 'kilos', max: 60 },
  { t: (_q, a, b) => `El tanque de agua lluvia tenía ${a} litros y con ${b} litros regaron la huerta escolar. ¿Cuántos litros quedan en el tanque?`, u: 'litros', max: 60 },
  { t: (_q, a, b) => `Un bulto de cacao pesa ${a} kilos y otro pesa ${b} kilos. ¿Cuántos kilos más pesa el primero?`, u: 'kilos', max: 60 },
  { t: (q, a, b) => `El camino a la escuela mide ${a} kilómetros y ${q} ya caminó ${b} kilómetros. ¿Cuánto le falta?`, u: 'kilómetros', max: 8 },
  { t: (q, a, b) => `${mayus(q)} tenía un lazo de ${a} metros y cortó ${b} metros para amarrar la carga de la mula. ¿Cuántos metros de lazo le quedan?`, u: 'metros', max: 15 },
  { t: (_q, a, b) => `El racimo de plátano pesaba ${a} kilos y ya se vendieron ${b} kilos de plátanos. ¿Cuánto pesa lo que queda?`, u: 'kilos', max: 35 },
  { t: (q, a, b) => `${mayus(q)} necesita ${a} kilos de café pergamino para llenar el costal y ya tiene ${b} kilos. ¿Cuántos kilos le faltan?`, u: 'kilos', max: 60 },
  { t: (_q, a, b) => `En la mañana había ${a} litros de agua de panela para el refrigerio y se sirvieron ${b} litros. ¿Cuántos litros quedan?`, u: 'litros', max: 20 },
  { t: (_q, a, b) => `La cancha de la escuela mide ${a} metros de largo y ${b} metros de ancho. ¿Cuántos metros más mide de largo que de ancho?`, u: 'metros', max: 60 },
];

const sumaResta: Plantilla = {
  id: 'g5-decimal-suma-resta',
  dimension: 'procedimiento',
  operacion: 'mixta',
  descripcion: 'Sumar y restar números decimales (alinear la coma)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const resta = rng.azar(0.5);
    const m = rng.elegir(resta ? escenasResta : escenasSuma);
    let a = decimal(rng, 1, Math.max(3, Math.min(m.max, lerp(10, 60, dif(ctx)))), decimalesSegun(ctx));
    let b = decimal(rng, 1, Math.max(3, Math.min(m.max, lerp(8, 40, dif(ctx)))), decimalesSegun(ctx));
    if (resta && b >= a) [a, b] = [b, a];
    if (resta && a === b) a = c2(a + 1);
    const respuesta = c2(resta ? a - b : a + b);
    const cuenta = `${num(a)} ${resta ? '−' : '+'} ${num(b)}`;
    const enunciado = `${m.t(adulto(rng).nombre, num(a), num(b))} ${rng.azar(0.5) ? `(${cuenta})` : `Resuelve ${cuenta}.`}`;
    // Error típico: no alinear la coma (sumar 2,5 + 1,25 como 25 + 125 centésimas).
    const desalineado = resta ? a - b / 10 : a + b / 10;
    return {
      enunciado,
      instruccion: resta ? 'Resta con la coma alineada' : 'Suma con la coma alineada',
      datos: { a, b },
      respuesta,
      unidad: m.u,
      ...modoDec(ctx, respuesta, [desalineado, resta ? a + b : Math.abs(a - b), respuesta + 0.1, respuesta + 1]),
      calculo: { op: 'otra', a, b },
      pistas: [
        'Escribe un número debajo del otro con las comas en la misma columna.',
        { tipo: 'texto', texto: `  ${a.toFixed(2).replace('.', ',')}\n${resta ? '−' : '+'} ${b.toFixed(2).replace('.', ',')}\n  ────` },
        'Completa con ceros para que los dos tengan dos cifras después de la coma. Luego opera como siempre y baja la coma.',
      ],
      explicacion: `${cuenta} = ${num(respuesta)} ${m.u}.`,
    };
  },
};

/** Un decimal repetido k veces (a ya escrito). max: hasta cuántas unidades es creíble. */
const escenasMult: { t: (a: string, k: number) => string; u: string; max: number }[] = [
  { t: (a, k) => `Cada bolsa de café molido pesa ${a} kilos. ¿Cuántos kilos pesan ${k} bolsas?`, u: 'kilos', max: 3 },
  { t: (a, k) => `Cada vaca da ${a} litros de leche en el ordeño de la mañana. ¿Cuántos litros dan ${k} vacas?`, u: 'litros', max: 12 },
  { t: (a, k) => `Cada tramo de cerca necesita ${a} metros de alambre. ¿Cuántos metros se necesitan para ${k} tramos?`, u: 'metros', max: 30 },
  { t: (a, k) => `Cada costal de café pergamino pesa ${a} kilos. ¿Cuánto pesan ${k} costales?`, u: 'kilos', max: 30 },
  { t: (a, k) => `En cada cantina caben ${a} litros de leche. ¿Cuántos litros caben en ${k} cantinas?`, u: 'litros', max: 30 },
  { t: (a, k) => `Cada surco de la huerta escolar mide ${a} metros. ¿Cuántos metros miden ${k} surcos?`, u: 'metros', max: 15 },
  { t: (a, k) => `Cada racimo de plátano pesa ${a} kilos. ¿Cuánto pesan ${k} racimos iguales?`, u: 'kilos', max: 30 },
  { t: (a, k) => `Cada caja de aguacates pesa ${a} kilos. ¿Cuántos kilos pesan ${k} cajas?`, u: 'kilos', max: 20 },
  { t: (a, k) => `Para regar, cada pedazo de manguera mide ${a} metros. ¿Cuánto miden ${k} pedazos unidos?`, u: 'metros', max: 10 },
  { t: (a, k) => `Cada balde lleva ${a} litros de agua al semillero. ¿Cuántos litros llevan ${k} baldes?`, u: 'litros', max: 12 },
  { t: (a, k) => `La finca vende ${a} litros de leche cada día a la quesera. ¿Cuántos litros vende en ${k} días?`, u: 'litros', max: 30 },
  { t: (a, k) => `Cada canasta de mazorcas de cacao pesa ${a} kilos. ¿Cuántos kilos pesan ${k} canastas?`, u: 'kilos', max: 25 },
  { t: (a, k) => `Cada lazo para amarrar la carga mide ${a} metros. ¿Cuántos metros miden ${k} lazos?`, u: 'metros', max: 10 },
  { t: (a, k) => `Cada árbol de mandarina dio ${a} kilos de fruta. ¿Cuántos kilos dieron ${k} árboles?`, u: 'kilos', max: 30 },
  { t: (a, k) => `Cada tabla del secadero de cacao mide ${a} metros. ¿Cuántos metros miden ${k} tablas puestas una tras otra?`, u: 'metros', max: 4 },
  { t: (a, k) => `En cada viaje la mula carga ${a} kilos de leña. ¿Cuántos kilos carga en ${k} viajes?`, u: 'kilos', max: 30 },
  { t: (a, k) => `Cada mata de tomate de la huerta dio ${a} kilos. ¿Cuántos kilos dieron ${k} matas?`, u: 'kilos', max: 4 },
  { t: (a, k) => `Cada gallina come ${a} kilos de maíz al mes. ¿Cuántos kilos comen ${k} gallinas?`, u: 'kilos', max: 3 },
  { t: (a, k) => `Cada lata de café cereza pesa ${a} kilos. ¿Cuánto pesan ${k} latas?`, u: 'kilos', max: 13 },
  { t: (a, k) => `Cada olla de agua de panela tiene ${a} litros. ¿Cuántos litros hay en ${k} ollas?`, u: 'litros', max: 12 },
];

const multiplicar: Plantilla = {
  id: 'g5-decimal-mult',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Multiplicar un decimal por un natural, por 10 y por 100',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const porPotencia = rng.azar(0.35);
    const m = rng.elegir(escenasMult);
    const a = decimal(rng, 1, Math.max(2, Math.min(m.max, lerp(6, 30, dif(ctx)))), porPotencia ? 2 : decimalesSegun(ctx));
    const k = porPotencia ? rng.elegir([10, 100]) : rng.entero(2, lerp(5, 9, dif(ctx)));
    const respuesta = c2(a * k);
    const cuenta = rng.elegir([`(${num(a)} × ${k})`, `Calcula ${num(a)} × ${k}.`, `Multiplica ${num(a)} por ${k}.`]);
    return {
      enunciado: `${m.t(num(a), k)} ${cuenta}`,
      instruccion: porPotencia ? `Multiplica por ${k}` : 'Multiplica el decimal',
      datos: { a, k },
      respuesta,
      unidad: m.u,
      ...modoDec(ctx, respuesta, [a * k * 10, (a * k) / 10, a + k, Math.floor(a) * k]),
      calculo: { op: 'otra', a, b: k },
      pistas: porPotencia
        ? [`Al multiplicar por ${k}, la coma se corre ${k === 10 ? 'un lugar' : 'dos lugares'} a la derecha.`, { tipo: 'texto', texto: `${num(a)} × ${k}` }, `Corre la coma de ${num(a)} ${k === 10 ? 'una vez' : 'dos veces'} a la derecha.`]
        : [
            'Multiplica como si no hubiera coma y al final ponla.',
            { tipo: 'texto', texto: `${num(a)} × ${k}\n= ${Math.round(a * 100)} centésimas × ${k}` },
            `${Math.round(a * 100)} × ${k} = ${Math.round(a * 100) * k} centésimas = ${num(respuesta)}.`,
          ],
      explicacion: `${num(a)} × ${k} = ${num(respuesta)} ${m.u}.`,
    };
  },
};

/** Repartir una medida entera en k partes iguales (resultado decimal). cien: tiene sentido repartir entre 100. */
const escenasDividir: { t: (a: number, k: number, quien: string) => string; u: string; cien?: boolean }[] = [
  { t: (a, k, q) => `${mayus(q)} reparte ${a} kilos de mazorcas de cacao en ${k} costales iguales. ¿Cuántos kilos van en cada costal?`, u: 'kilos' },
  { t: (a, k) => `En la vereda se reparten ${a} litros de leche entre ${k} familias por igual. ¿Cuántos litros le tocan a cada familia?`, u: 'litros', cien: true },
  { t: (a, k) => `Un rollo de ${a} metros de cabuya se corta en ${k} pedazos iguales. ¿Cuánto mide cada pedazo?`, u: 'metros', cien: true },
  { t: (a, k, q) => `${mayus(q)} empaca ${a} kilos de café pergamino en ${k} costales con el mismo peso. ¿Cuántos kilos lleva cada costal?`, u: 'kilos' },
  { t: (a, k) => `Una manguera de ${a} metros se corta en ${k} pedazos iguales para regar la huerta escolar. ¿Cuánto mide cada pedazo?`, u: 'metros' },
  { t: (a, k) => `Para la fiesta de la escuela prepararon ${a} litros de agua de panela y los repartieron en ${k} ollas iguales. ¿Cuántos litros hay en cada olla?`, u: 'litros' },
  { t: (a, k) => `Se reparten ${a} kilos de abono entre ${k} surcos de la huerta por igual. ¿Cuántos kilos le tocan a cada surco?`, u: 'kilos' },
  { t: (a, k, q) => `${mayus(q)} tiene ${a} metros de alambre para ${k} tramos iguales de cerca. ¿Cuántos metros lleva cada tramo?`, u: 'metros', cien: true },
  { t: (a, k) => `Se cosecharon ${a} kilos de naranja y se reparten en ${k} canastas iguales. ¿Cuántos kilos van en cada canasta?`, u: 'kilos' },
  { t: (a, k) => `Los ${a} litros de agua lluvia del tanque se reparten en ${k} baldes iguales. ¿Cuántos litros van en cada balde?`, u: 'litros' },
  { t: (a, k, q) => `${mayus(q)} tiene ${a} kilos de maíz para las gallinas y quiere que le alcancen ${k} días, la misma cantidad cada día. ¿Cuántos kilos les da cada día?`, u: 'kilos', cien: true },
  { t: (a, k) => `Un lazo de ${a} metros se corta en ${k} pedazos iguales para amarrar los bultos. ¿Cuánto mide cada pedazo?`, u: 'metros', cien: true },
  { t: (a, k) => `La cooperativa reparte ${a} kilos de cacao seco entre ${k} socias por igual para hacer chocolate. ¿Cuántos kilos recibe cada socia?`, u: 'kilos' },
  { t: (a, k) => `En la quesera vacían ${a} litros de leche en ${k} cantinas iguales. ¿Cuántos litros quedan en cada cantina?`, u: 'litros' },
  { t: (a, k) => `Se reparten ${a} kilos de yuca entre ${k} familias de la vereda por igual. ¿Cuántos kilos le tocan a cada familia?`, u: 'kilos', cien: true },
  { t: (a, k) => `Un rollo de ${a} metros de plástico se corta en ${k} pedazos iguales para techar las marquesinas. ¿Cuánto mide cada pedazo?`, u: 'metros' },
  { t: (a, k) => `Una lona de ${a} metros para los toldos de la feria del pueblo se corta en ${k} pedazos iguales. ¿Cuánto mide cada pedazo?`, u: 'metros' },
  { t: (a, k, q) => `${mayus(q)} envasa ${a} litros de miel de abejas en ${k} garrafas iguales para venderlas en el mercado. ¿Cuántos litros lleva cada garrafa?`, u: 'litros' },
];

const dividir: Plantilla = {
  id: 'g5-decimal-division',
  dimension: 'procedimiento',
  operacion: 'division',
  descripcion: 'Dividir con resultado decimal (repartir kilos y litros) y dividir entre 10',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const entre10 = rng.azar(0.3);
    let a: number;
    let k: number;
    if (entre10) {
      k = rng.elegir([10, 100]);
      a = rng.entero(lerp(10, 50, dif(ctx)), lerp(99, 900, dif(ctx)));
      if (a % 10 === 0) a += rng.entero(1, 9);
    } else {
      k = rng.elegir(dif(ctx) < 0.5 ? [2, 4, 5] : [2, 4, 5, 8]);
      // Dividendo que no sea múltiplo del divisor, con resultado de máximo dos decimales.
      do a = rng.entero(lerp(5, 20, dif(ctx)), lerp(30, 150, dif(ctx)));
      while (a % k === 0 || (a * 100) % k !== 0);
    }
    const respuesta = c2(a / k);
    const m = rng.elegir(k === 100 ? escenasDividir.filter((e) => e.cien) : escenasDividir);
    const cuenta = rng.elegir([`(${a} ÷ ${k})`, `Calcula ${a} ÷ ${k}.`, `Divide ${a} entre ${k}.`]);
    return {
      enunciado: `${m.t(a, k, persona(rng).nombre)} ${cuenta}`,
      instruccion: entre10 ? `Divide entre ${k}` : 'Divide hasta que no sobre nada',
      datos: { a, k },
      respuesta,
      unidad: m.u,
      ...modoDec(ctx, respuesta, [Math.floor(a / k), Math.floor(a / k) + (a % k) / 10, a / k / 10, a / k * 10]),
      calculo: { op: 'otra', a, b: k },
      permiteResiduo: true,
      pistas: entre10
        ? [`Al dividir entre ${k}, la coma se corre ${k === 10 ? 'un lugar' : 'dos lugares'} a la izquierda.`, { tipo: 'texto', texto: `${a} ÷ ${k}` }, `Corre la coma de ${a} ${k === 10 ? 'una vez' : 'dos veces'} a la izquierda.`]
        : [
            `Divide ${a} entre ${k}. Si sobra algo, pon la coma en el cociente y sigue dividiendo con un cero.`,
            { tipo: 'texto', texto: `${a} ÷ ${k} = ${Math.floor(a / k)} y sobran ${a % k}\n${a % k} = ${(a % k) * 10} décimas` },
            `${Math.floor(a / k)} enteros; con lo que sobra, ${(a % k) * 10} décimas ÷ ${k}…`,
          ],
      explicacion: `${a} ÷ ${k} = ${num(respuesta)} ${m.u}${entre10 ? '' : `, porque ${num(respuesta)} × ${k} = ${a}`}.`,
    };
  },
};

// --- Problemas ---

const problema: Plantilla = {
  id: 'g5-decimal-problema',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Problemas con decimales: precio por kilo, compras y sobrantes',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const quien = adulto(rng);
    const tipo = rng.elegir(['precio', 'dos-pesadas', 'sobra'] as const);
    if (tipo === 'precio') {
      // kilos con una cifra decimal × precio múltiplo de 100: el total queda en pesos enteros.
      const kilos = decimal(rng, 1, lerp(4, 12, dif(ctx)), 1);
      const precio = rng.entero(lerp(10, 20, dif(ctx)), lerp(40, 120, dif(ctx))) * 100;
      const respuesta = Math.round(kilos * precio);
      const producto = rng.elegir(['carne', 'queso', 'café molido', 'panela', 'frijol', 'pescado', 'tomate', 'cebolla']);
      const donde = rng.elegir(['', ' en la tienda de la vereda', ' en el mercado del pueblo', ' en la plaza de San Vicente']);
      return {
        enunciado: `${mayus(quien.nombre)} compró${donde} ${med(kilos, 'kilos')} de ${producto} a ${pesos(precio)} el kilo. (Precio ilustrativo.) ${rng.elegir(['¿Cuánto pagó?', '¿Cuánta plata tuvo que pagar?'])}`,
        instruccion: 'Precio por kilos',
        ilustracion: 'moneda',
        datos: { kilos, precio },
        respuesta,
        unidad: 'pesos',
        ...modoDec(ctx, respuesta, [Math.floor(kilos) * precio, respuesta + precio, respuesta * 10, respuesta - 100]),
        calculo: { op: 'otra', a: kilos, b: precio },
        operacion: 'multiplicacion',
        pistas: [
          '¿Cuántos kilos y cuánto vale cada uno? Multiplica.',
          { tipo: 'texto', texto: `${num(kilos)} × ${pesos(precio)}\n= ${Math.floor(kilos)} × ${pesos(precio)} + 0,${Math.round((kilos % 1) * 10)} × ${pesos(precio)}` },
          `${Math.floor(kilos)} kilos cuestan ${pesos(Math.floor(kilos) * precio)}; el pedazo de kilo cuesta ${pesos(respuesta - Math.floor(kilos) * precio)}.`,
        ],
        explicacion: `${num(kilos)} × ${pesos(precio)} = ${pesos(respuesta)}.`,
      };
    }
    if (tipo === 'dos-pesadas') {
      const a = decimal(rng, 1, lerp(8, 30, dif(ctx)), decimalesSegun(ctx));
      const b = decimal(rng, 1, lerp(8, 30, dif(ctx)), decimalesSegun(ctx));
      const total = c2(a + b);
      const vendido = c2(decimal(rng, 1, Math.max(2, Math.floor(total)), 1));
      const dosPasos = dif(ctx) >= 0.5 && vendido < total;
      const respuesta = dosPasos ? c2(total - vendido) : total;
      const [cosas, dibujo] = rng.elegir([
        ['dos bultos de cacao seco', 'bulto'],
        ['dos costales de café pergamino', 'bulto'],
        ['dos canastas de naranjas', 'naranja'],
        ['dos cajas de aguacates', 'aguacate'],
        ['dos racimos de plátano', 'platano'],
        ['dos canastas de mandarinas', 'mandarina'],
      ] as const);
      const fem = /canastas|cajas/.test(cosas);
      return {
        enunciado: `${mayus(quien.nombre)} pesó ${cosas}: ${fem ? 'una' : 'uno'} de ${med(a, 'kilos')} y ${fem ? 'otra' : 'otro'} de ${med(b, 'kilos')}.${dosPasos ? ` Vendió ${med(vendido, 'kilos')}. ¿Cuántos kilos le quedan?` : ' ¿Cuántos kilos tiene en total?'}`,
        instruccion: dosPasos ? 'Dos pasos' : 'Suma los pesos',
        ilustracion: dibujo,
        datos: { a, b, ...(dosPasos ? { vendido } : {}) },
        respuesta,
        unidad: 'kilos',
        ...modoDec(ctx, respuesta, [total, a + b / 10, respuesta + 1, respuesta + 0.1]),
        calculo: { op: 'otra', a, b },
        pistas: [
          dosPasos ? 'Primero junta los dos bultos; después quita lo que vendió.' : 'Junta los dos pesos con las comas alineadas.',
          { tipo: 'texto', texto: `${num(a)} + ${num(b)} = ${num(total)}${dosPasos ? `\n${num(total)} − ${num(vendido)}` : ''}` },
          dosPasos ? `En total tenía ${num(total)} kilos. Ahora resta ${num(vendido)}.` : `${num(a)} + ${num(b)}.`,
        ],
        explicacion: dosPasos ? `${num(a)} + ${num(b)} = ${num(total)}; ${num(total)} − ${num(vendido)} = ${num(respuesta)} kilos.` : `${num(a)} + ${num(b)} = ${num(total)} kilos.`,
      };
    }
    // Sobrante: llenar botellas de 1,5 o 2,5 litros.
    const botella = rng.elegir([0.5, 1.5, 2.5]);
    const n = rng.entero(2, lerp(5, 12, dif(ctx)));
    const sobra = c2(rng.entero(1, Math.round(botella * 10) - 1) / 10);
    const total = c2(botella * n + sobra);
    const respuesta = sobra;
    const liquido = rng.elegir(['guarapo', 'leche', 'agua de panela', 'miel de abejas', 'jugo de naranja']);
    const [donde, envase] = rng.elegir([
      ['En la finca hay', 'botellas'],
      ['Para la fiesta de la escuela prepararon', 'jarras'],
      ['En la cocina hay', 'botellas'],
      ['Para vender en el mercado, en la finca envasan', 'garrafas'],
    ]);
    return {
      enunciado: `${donde} ${med(total, 'litros')} de ${liquido} y se llenan ${n} ${envase} de ${med(botella, 'litros')}. ¿Cuántos litros sobran?`,
      instruccion: 'Dos pasos',
      datos: { total, botella, n },
      respuesta,
      unidad: 'litros',
      ...modoDec(ctx, respuesta, [c2(botella * n), total - n, respuesta + 0.5, botella]),
      calculo: { op: 'otra', a: total, b: botella },
      pistas: [
        'Primero calcula cuántos litros caben en las botellas; luego réstalo del total.',
        { tipo: 'texto', texto: `${n} × ${num(botella)} = ${num(c2(botella * n))}` },
        `${num(total)} − ${num(c2(botella * n))}.`,
      ],
      explicacion: `${n} × ${num(botella)} = ${num(c2(botella * n))} litros en botellas; ${num(total)} − ${num(c2(botella * n))} = ${num(respuesta)} litros sobran.`,
    };
  },
};

export const plantillasDecimales = { leer, comparar, sumaResta, multiplicar, dividir, problema };
