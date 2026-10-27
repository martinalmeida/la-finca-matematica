// Plantillas de números decimales (5.º): décimas y centésimas con kilos, litros y metros,
// comparar, sumar y restar, multiplicar, dividir con resultado decimal y problemas.
// Los valores se calculan en centésimas enteras para evitar errores de coma flotante.
// En Colombia los precios no llevan centavos: los decimales van en pesos, medidas y cantidades.

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

const medidas = [
  { cosa: 'el bulto de cacao', unidad: 'kilos', verbo: 'pesa' },
  { cosa: 'la cantina de leche', unidad: 'litros', verbo: 'tiene' },
  { cosa: 'el rollo de alambre', unidad: 'metros', verbo: 'mide' },
  { cosa: 'la bolsa de café molido', unidad: 'kilos', verbo: 'pesa' },
];

// --- Comprensión ---

const leer: Plantilla = {
  id: 'g5-decimal-leer',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Décimas y centésimas: leer y armar números decimales',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const ent = rng.entero(1, lerp(9, 40, dif(ctx)));
    const dec = rng.entero(1, 9);
    const cen = rng.entero(1, 9);
    const m = rng.elegir(medidas);
    if (rng.azar(0.5)) {
      // Armar el número: enteros, décimas y centésimas.
      const conCen = dif(ctx) >= 0.4 && rng.azar(0.6);
      const respuesta = c2(ent + dec / 10 + (conCen ? cen / 100 : 0));
      const partes = `${ent} ${ent === 1 ? 'entero' : 'enteros'} y ${conCen ? `${dec * 10 + cen} centésimas` : `${dec} ${dec === 1 ? 'décima' : 'décimas'}`}`;
      return {
        enunciado: `En la balanza de la finca, ${m.cosa} ${m.verbo} ${partes} de ${m.unidad}. ¿Qué número es?`,
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
    const respuesta = pideCen ? cen : dec;
    const candidatos = [...new Set([dec, cen, ent % 10, (respuesta % 9) + 1].filter((x) => x !== respuesta && x > 0))].slice(0, 3);
    const opciones = rng.barajar([respuesta, ...candidatos]);
    return {
      enunciado: `${mayus(m.cosa)} ${m.verbo} ${med(n, m.unidad)}. ¿Qué cifra está en el lugar de las ${pideCen ? 'centésimas' : 'décimas'}?`,
      instruccion: pideCen ? 'Busca las centésimas' : 'Busca las décimas',
      datos: { n, ent, dec, cen },
      respuesta,
      distractores: candidatos,
      interaccion: { tipo: 'opciones', opciones },
      calculo: { op: 'otra', a: ent, b: dec },
      pistas: [
        'Después de la coma, la primera cifra son las décimas y la segunda, las centésimas.',
        { tipo: 'texto', texto: `${num(n)}\nEnteros: ${ent} | Décimas: ${dec} | Centésimas: ${cen}` },
        `En ${num(n)}, la cifra de las ${pideCen ? 'centésimas' : 'décimas'} es ${respuesta}.`,
      ],
      explicacion: `En ${num(n)}: ${ent} ${ent === 1 ? 'entero' : 'enteros'}, ${dec} décimas y ${cen} centésimas.`,
    };
  },
};

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
    const m = rng.elegir([
      { t: 'Estos bultos de cacao seco pesan', u: 'kilos', q: mayor ? '¿Cuál pesa más?' : '¿Cuál pesa menos?' },
      { t: 'Hoy se ordeñaron tres vacas y dieron', u: 'litros', q: mayor ? '¿Cuál es la mayor cantidad?' : '¿Cuál es la menor cantidad?' },
      { t: 'Los niños midieron con un metro unas guaduas de', u: 'metros', q: mayor ? '¿Cuál es la más larga?' : '¿Cuál es la más corta?' },
    ]);
    return {
      enunciado: `${m.t} ${unicos.map((x) => num(x)).join(', ')} ${m.u}. ${m.q}`,
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

const sumaResta: Plantilla = {
  id: 'g5-decimal-suma-resta',
  dimension: 'procedimiento',
  operacion: 'mixta',
  descripcion: 'Sumar y restar números decimales (alinear la coma)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const resta = rng.azar(0.5);
    let a = decimal(rng, 1, lerp(10, 60, dif(ctx)), decimalesSegun(ctx));
    let b = decimal(rng, 1, lerp(8, 40, dif(ctx)), decimalesSegun(ctx));
    if (resta && b >= a) [a, b] = [b, a];
    if (resta && a === b) a = c2(a + 1);
    const respuesta = c2(resta ? a - b : a + b);
    const m = rng.elegir(medidas);
    const quien = adulto(rng);
    const enunciado = resta
      ? `${mayus(quien.nombre)} tenía ${med(a, m.unidad)} y usó ${med(b, m.unidad)}. ¿Cuánto le queda? (${num(a)} − ${num(b)})`
      : `${mayus(quien.nombre)} juntó ${med(a, m.unidad)} con ${med(b, m.unidad)}. ¿Cuánto tiene en total? (${num(a)} + ${num(b)})`;
    // Error típico: no alinear la coma (sumar 2,5 + 1,25 como 25 + 125 centésimas).
    const desalineado = resta ? a - b / 10 : a + b / 10;
    return {
      enunciado,
      instruccion: resta ? 'Resta con la coma alineada' : 'Suma con la coma alineada',
      datos: { a, b },
      respuesta,
      unidad: m.unidad,
      ...modoDec(ctx, respuesta, [desalineado, resta ? a + b : Math.abs(a - b), respuesta + 0.1, respuesta + 1]),
      calculo: { op: 'otra', a, b },
      pistas: [
        'Escribe un número debajo del otro con las comas en la misma columna.',
        { tipo: 'texto', texto: `  ${a.toFixed(2).replace('.', ',')}\n${resta ? '−' : '+'} ${b.toFixed(2).replace('.', ',')}\n  ────` },
        'Completa con ceros para que los dos tengan dos cifras después de la coma. Luego opera como siempre y baja la coma.',
      ],
      explicacion: `${num(a)} ${resta ? '−' : '+'} ${num(b)} = ${num(respuesta)} ${m.unidad}.`,
    };
  },
};

const multiplicar: Plantilla = {
  id: 'g5-decimal-mult',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Multiplicar un decimal por un natural, por 10 y por 100',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const porPotencia = rng.azar(0.35);
    const a = decimal(rng, 1, lerp(6, 30, dif(ctx)), porPotencia ? 2 : decimalesSegun(ctx));
    const k = porPotencia ? rng.elegir([10, 100]) : rng.entero(2, lerp(5, 9, dif(ctx)));
    const respuesta = c2(a * k);
    const m = rng.elegir([
      { t: `Cada bolsa de café molido pesa ${med(a, 'kilos')}.`, q: `¿Cuántos kilos pesan ${k} bolsas?`, u: 'kilos' },
      { t: `Cada vaca da ${med(a, 'litros')} de leche en el ordeño de la mañana.`, q: `¿Cuántos litros dan ${k} vacas?`, u: 'litros' },
      { t: `Cada tramo de cerca necesita ${med(a, 'metros')} de alambre.`, q: `¿Cuántos metros se necesitan para ${k} tramos?`, u: 'metros' },
    ]);
    return {
      enunciado: `${m.t} ${m.q} (${num(a)} × ${k})`,
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
      // Dividendo que no sea múltiplo del divisor, pero con resultado de máximo 2 decimales.
      // Dividendo que no sea múltiplo del divisor, con resultado de máximo dos decimales.
      do a = rng.entero(lerp(5, 20, dif(ctx)), lerp(30, 150, dif(ctx)));
      while (a % k === 0 || (a * 100) % k !== 0);
    }
    const respuesta = c2(a / k);
    const m = rng.elegir([
      { t: `${mayus(persona(rng).nombre)} reparte ${a} kilos de mazorcas de cacao en ${k} costales iguales.`, q: '¿Cuántos kilos van en cada costal?', u: 'kilos' },
      { t: `En la vereda se reparten ${a} litros de leche entre ${k} familias por igual.`, q: '¿Cuántos litros le tocan a cada familia?', u: 'litros' },
      { t: `Un rollo de ${a} metros de cabuya se corta en ${k} pedazos iguales.`, q: '¿Cuánto mide cada pedazo?', u: 'metros' },
    ]);
    return {
      enunciado: `${m.t} ${m.q} (${a} ÷ ${k})`,
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
      const producto = rng.elegir(['carne', 'queso', 'café molido', 'panela']);
      return {
        enunciado: `${mayus(quien.nombre)} compró ${med(kilos, 'kilos')} de ${producto} a ${pesos(precio)} el kilo. (Precio ilustrativo.) ¿Cuánto pagó?`,
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
      return {
        enunciado: `${mayus(quien.nombre)} pesó dos bultos de cacao seco: uno de ${med(a, 'kilos')} y otro de ${med(b, 'kilos')}.${dosPasos ? ` Vendió ${med(vendido, 'kilos')}. ¿Cuántos kilos le quedan?` : ' ¿Cuántos kilos tiene en total?'}`,
        instruccion: dosPasos ? 'Dos pasos' : 'Suma los pesos',
        ilustracion: 'bulto',
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
    return {
      enunciado: `En la finca hay ${med(total, 'litros')} de guarapo y se llenan ${n} botellas de ${med(botella, 'litros')}. ¿Cuántos litros sobran?`,
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
