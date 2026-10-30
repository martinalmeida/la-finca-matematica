// Plantillas de 3.º grado: suma y resta de 4 cifras (con ceros en el minuendo),
// tablas del 2 al 10 desde arreglos de surcos, multiplicación por 1 cifra,
// división exacta (reparto y agrupación), problemas de dos pasos y estimación.

import type { Calculo, ContextoGeneracion, DefinicionPista, EjercicioBase, Objeto, Plantilla, Recipiente, Uso, Visual } from '../../juego/tipos';
import { adulto, arbolDe, articulosTienda, cuantos as cuantosDe, dibujoKilosDe, dosPersonas, mayus, nombresFincas, num, persona, pesos, type Genero } from '../contexto';
import { divisionResiduo, repartoResiduo, comprobarDivision, viajes, interpretarResiduo } from './g4';
import { conCifras, factorTabla, dif, distractores, lerp, mezclarOpciones, modoRespuesta, parResta, parSuma, pb, pn, pt, redondear } from './util';

const LIMITE = 10000;

/** Llevadas o préstamos según d: 0, luego 1, luego 2. */
function reagrupaciones(ctx: ContextoGeneracion, maximo = 2): number {
  const d = dif(ctx);
  return Math.min(maximo, d < 0.34 ? 0 : d < 0.67 ? 1 : 2);
}

/** Representación visual: bloques si cabe, si no, texto. */
function visualNumero(n: number, texto: string): Visual {
  return n <= 999 ? { tipo: 'bloques', valor: n } : { tipo: 'texto', texto };
}

/** Plural de un artículo de la tienda ("libra de arroz" → "libras de arroz"). */
function plural(nombre: string): string {
  const [primera, ...resto] = nombre.split(' ');
  let p = primera;
  if (p.endsWith('z')) p = p.slice(0, -1) + 'ces';
  else if (p.endsWith('ón')) p = p.slice(0, -2) + 'ones';
  else if (/[aeiou]$/.test(p)) p = p + 's';
  else p = p + 'es';
  return [p, ...resto].join(' ');
}

function articuloUn(genero: 'f' | 'm'): string {
  return genero === 'f' ? 'una' : 'un';
}

/** Dato que sobra (desde 3.º, con d alto). */
function datoQueSobra(ctx: ContextoGeneracion): { texto: string; valor: number } | null {
  if (!pb(ctx, 'sobran') || dif(ctx) < 0.6 || !ctx.rng.azar(0.5)) return null;
  const { rng } = ctx;
  const opciones = [
    () => {
      const v = rng.entero(2, 5);
      return { texto: ` El viaje en la chiva hasta el pueblo dura ${v} horas.`, valor: v };
    },
    () => {
      const v = rng.entero(3, 9);
      return { texto: ` En la finca también hay ${v} gallinas.`, valor: v };
    },
    () => {
      const v = rng.entero(2, 6);
      return { texto: ` Ese día trabajaron ${v} personas.`, valor: v };
    },
  ];
  return rng.elegir(opciones)();
}

/** Interacción de tabla con o sin opciones, según el modo de respuesta. */
function opcionesTabla(ctx: ContextoGeneracion, respuesta: number, calc: Calculo, extras: number[] = []) {
  const m = modoRespuesta(ctx, respuesta, calc, { extras });
  return { opciones: m.interaccion.tipo === 'opciones' ? m.interaccion.opciones : undefined, distractores: m.distractores };
}

const valorPosicional: Plantilla = {
  id: 'g3-valor',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Valor posicional hasta 9.999 (bloques y valor de cada cifra)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 9999);
    if (max <= 999) {
      const n = rng.entero(lerp(120, 500, dif(ctx)), max);
      const c = Math.floor(n / 100);
      const de = Math.floor(n / 10) % 10;
      const un = n % 10;
      const quien = adulto(rng);
      if (rng.azar(0.5)) {
        return {
          enunciado: `${mayus(quien.nombre)} va a llevar ${num(n)} limones al mercado del pueblo. Arma el número con canastas de 100, cajas de 10 y limones sueltos.`,
          instruccion: 'Arma el número',
          ilustracion: 'limon',
          datos: { n },
          respuesta: n,
          distractores: [],
          interaccion: { tipo: 'bloques', modo: 'construir', valor: n, unidad: 'limon', decena: 'caja', centena: 'canasta' },
          pistas: [`¿Cuántas canastas de 100 caben en ${n}?`, { tipo: 'bloques', valor: n, unidad: 'limon', decena: 'caja', centena: 'canasta' }, `${n} = ${c} canastas de 100, ${de} cajas de 10 y ${un} sueltos.`],
          explicacion: `${n} tiene ${c} centenas, ${de} decenas y ${un} unidades.`,
        };
      }
      const calc: Calculo = { op: 'suma', a: c * 100 + de * 10, b: un };
      const modo = modoRespuesta(ctx, n, calc, { extras: [c + de + un, un * 100 + de * 10 + c, n + 100, n - 10] });
      return {
        enunciado: `${mayus(quien.nombre)} empacó limones: ${c} canastas de 100, ${de} cajas de 10 y ${un} limones sueltos. ¿Cuántos limones tiene?`,
        instruccion: 'Cuenta por grupos',
        ilustracion: 'limon',
        datos: { centenas: c, decenas: de, unidades: un },
        respuesta: n,
        unidad: 'limones',
        ...modo,
        calculo: calc,
        pistas: ['Cuenta primero las canastas de 100, luego las cajas de 10 y al final los sueltos.', { tipo: 'bloques', valor: n }, `${c * 100} + ${de * 10} + ${un}.`],
        explicacion: `${c * 100} + ${de * 10} + ${un} = ${n}.`,
      };
    }
    // Valor de una cifra en un número de 4 cifras.
    const n = rng.entero(1000, max);
    const cifras = n.toString().split('').reverse().map(Number);
    const posiciones = [0, 1, 2, 3].filter((p) => cifras[p] > 0);
    const pos = rng.elegir(posiciones);
    const cifra = cifras[pos];
    const respuesta = cifra * 10 ** pos;
    const nombres = ['unidades', 'decenas', 'centenas', 'unidades de mil'];
    const contexto = rng.elegir([
      `La cooperativa de cacaoteros recibió ${num(n)} kilos de cacao este mes.`,
      `Desde la escuela de la vereda hasta el casco urbano de San Vicente hay ${num(n)} metros por el camino de herradura.`,
      `En la finca ${rng.elegir(nombresFincas)} sembraron ${num(n)} plántulas de café.`,
    ]);
    const extras = [cifra, cifra * 10 ** Math.min(3, pos + 1), cifra * 10 ** Math.max(0, pos - 1)].filter((x) => x !== respuesta);
    const distr = distractores(rng, respuesta, extras, 3, dif(ctx), 10 ** pos);
    return {
      enunciado: `${contexto} En el número ${num(n)}, ¿cuánto vale la cifra ${cifra} que está en las ${nombres[pos]}?`,
      instruccion: 'Valor de la cifra',
      datos: { n },
      respuesta,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: mezclarOpciones(rng, respuesta, distr) },
      pistas: [
        `¿En qué lugar está el ${cifra}: unidades, decenas, centenas o unidades de mil?`,
        { tipo: 'texto', texto: `${num(n)} = ${cifras[3]} unidades de mil + ${cifras[2]} centenas + ${cifras[1]} decenas + ${cifras[0]} unidades` },
        `${cifra} ${nombres[pos]} valen ${cifra} × ${num(10 ** pos)}.`,
      ],
      explicacion: `El ${cifra} está en las ${nombres[pos]}, así que vale ${num(respuesta)}.`,
    };
  },
};

const rectaCentena: Plantilla = {
  id: 'g3-recta-centena',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Redondear a la centena más cercana en la recta',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const min = 1000 * rng.entero(0, 8);
    let n = rng.entero(min + 1, min + 999);
    if (n % 100 === 50 || n % 100 === 0) n += 7;
    const respuesta = redondear(n, 100);
    const quien = adulto(rng);
    const lugar = rng.elegir(['la quebrada', 'la escuela de la vereda', 'la tienda de la vereda', 'la carretera']);
    return {
      enunciado: `La finca de ${quien.nombre} queda a ${num(n)} metros de ${lugar}. Toca en la recta la centena más cercana a ${num(n)}.`,
      instruccion: 'Toca la centena',
      datos: { n, min },
      respuesta,
      distractores: [respuesta + 100, respuesta - 100].filter((x) => x >= min && x <= min + 1000),
      interaccion: { tipo: 'recta', min, max: min + 1000, paso: 100, inicio: min },
      pistas: [
        `${num(n)} está entre ${num(Math.floor(n / 100) * 100)} y ${num(Math.floor(n / 100) * 100 + 100)}. ¿De cuál está más cerca?`,
        { tipo: 'recta', min, max: min + 1000, desde: Math.floor(n / 100) * 100, saltos: [] },
        `Mira las decenas: ${n % 100 < 50 ? 'menos de 50, así que redondeas hacia abajo' : 'más de 50, así que redondeas hacia arriba'}.`,
      ],
      explicacion: `${num(n)} está más cerca de ${num(respuesta)}.`,
    };
  },
};

const algoritmoSuma: Plantilla = {
  id: 'g3-algoritmo-suma',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Suma columna por columna con llevadas',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', 4);
    const [a, b] = parSuma(rng, cifras, reagrupaciones(ctx, cifras - 1), LIMITE);
    const respuesta = a + b;
    const contexto = rng.elegir([
      `La cooperativa recibió ${num(a)} kilos de cacao el lunes y ${num(b)} el martes.`,
      `${mayus(adulto(rng).nombre)} cosechó ${num(a)} mandarinas en un lote y ${num(b)} en otro.`,
      `En el vivero de la vereda hay ${num(a)} bolsas con plántulas de cacao y llegaron ${num(b)} más.`,
    ]);
    return {
      enunciado: `${contexto} Resuelve la suma cifra por cifra: ${num(a)} + ${num(b)}.`,
      instruccion: 'Suma por columnas',
      datos: { a, b },
      respuesta,
      distractores: distractores(rng, respuesta, [], 0, 0),
      interaccion: { tipo: 'algoritmo', operacion: 'suma', a, b },
      calculo: { op: 'suma', a, b },
      pistas: [
        'Empieza por las unidades. Si la suma de una columna pasa de 9, ¿qué haces?',
        visualNumero(respuesta, `${num(a)} + ${num(b)}: suma unidades, decenas, centenas y unidades de mil`),
        `Unidades: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. ${(a % 10) + (b % 10) >= 10 ? 'Escribe la unidad y lleva 1 a las decenas.' : 'Escríbelo y sigue con las decenas.'}`,
      ],
      explicacion: `${num(a)} + ${num(b)} = ${num(respuesta)}.`,
    };
  },
};

const algoritmoResta: Plantilla = {
  id: 'g3-algoritmo-resta',
  dimension: 'procedimiento',
  operacion: 'resta',
  descripcion: 'Resta con desagrupación y ceros en el minuendo',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', 4);
    const ceros = pb(ctx, 'ceros') && dif(ctx) > 0.4 && rng.azar(0.6);
    const [a, b] = parResta(rng, cifras, reagrupaciones(ctx, cifras - 1), ceros);
    const respuesta = a - b;
    const contexto = rng.elegir([
      `En la bodega había ${num(a)} kilos de café seco y vendieron ${num(b)} en el pueblo.`,
      `La cooperativa tenía ${num(a)} bolsas para empacar cacao y usó ${num(b)}.`,
      `${mayus(adulto(rng).nombre)} tenía ${pesos(a)} y gastó ${pesos(b)} en la tienda de la vereda.`,
    ]);
    return {
      enunciado: `${contexto} Resuelve la resta cifra por cifra: ${num(a)} − ${num(b)}.`,
      instruccion: 'Resta por columnas',
      datos: { a, b },
      respuesta,
      distractores: [],
      interaccion: { tipo: 'algoritmo', operacion: 'resta', a, b },
      calculo: { op: 'resta', a, b },
      pistas: [
        'Empieza por las unidades. ¿Alcanza para quitar? Si no, pide prestado a la columna de al lado.',
        visualNumero(a, `${num(a)} − ${num(b)}: resta unidades, decenas, centenas y unidades de mil`),
        a.toString().includes('0')
          ? 'Si la columna de al lado tiene 0, pide prestado a la siguiente: el 0 se vuelve 9.'
          : `Unidades: ${a % 10} − ${b % 10}. ${a % 10 < b % 10 ? `No alcanza: pide una decena y haz ${(a % 10) + 10} − ${b % 10}.` : 'Alcanza: resta y sigue con las decenas.'}`,
      ],
      explicacion: `${num(a)} − ${num(b)} = ${num(respuesta)}.`,
    };
  },
};

const problemaSumaResta: Plantilla = {
  id: 'g3-problema-kilos',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Problemas de combinación, cambio y comparación con kilos y bultos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', 4);
    const [x, y] = [adulto(rng), adulto(rng)];
    const otro = y.nombre === x.nombre ? adulto(rng, [x.nombre]) : y;
    const sobra = datoQueSobra(ctx);
    const extra = sobra?.texto ?? '';
    const incognita = pb(ctx, 'incognita') && dif(ctx) > 0.5 && rng.azar(0.5);
    const tipo = incognita ? rng.elegir(['inicial', 'cambio']) : rng.elegir(['juntar', 'quitar', 'comparar']);
    const cultivo = rng.elegir(['cacao', 'café', 'aguacate', 'naranja']);
    let enunciado: string;
    let respuesta: number;
    let calc: Calculo;
    let visual: Visual;
    let paso: string;
    if (tipo === 'juntar' || tipo === 'inicial') {
      const [a, b] = parSuma(rng, cifras, reagrupaciones(ctx, 2), LIMITE);
      respuesta = a + b;
      calc = { op: 'suma', a, b };
      enunciado =
        tipo === 'juntar'
          ? rng.elegir([
              `La cooperativa recibió ${num(a)} kilos de ${cultivo} de la vereda Llana Caliente y ${num(b)} kilos de otra vereda.${extra} ¿Cuántos kilos recibió en total?`,
              `${mayus(x.nombre)} vendió ${num(a)} kilos de ${cultivo} en enero y ${num(b)} en febrero.${extra} ¿Cuántos kilos vendió en los dos meses?`,
            ])
          : `${mayus(x.nombre)} tenía unos kilos de ${cultivo} guardados. Vendió ${num(b)} kilos en el mercado del pueblo y le quedaron ${num(a)}.${extra} ¿Cuántos kilos tenía al principio?`;
      visual = { tipo: 'texto', texto: `${num(a)} + ${num(b)}` };
      paso = tipo === 'juntar' ? `Junta las dos cantidades: ${num(a)} + ${num(b)}.` : `Lo que vendió más lo que le quedó es lo que tenía: ${num(b)} + ${num(a)}.`;
    } else {
      const [a, b] = parResta(rng, cifras, reagrupaciones(ctx, 2), pb(ctx, 'ceros'));
      respuesta = a - b;
      calc = { op: 'resta', a, b };
      if (tipo === 'quitar') {
        enunciado = `En la bodega de ${x.nombre} había ${num(a)} kilos de ${cultivo}. Vendieron ${num(b)} kilos en el casco urbano.${extra} ¿Cuántos kilos quedan?`;
        paso = `Quita lo que vendieron: ${num(a)} − ${num(b)}.`;
      } else if (tipo === 'comparar') {
        enunciado = `Este año la finca de ${x.nombre} produjo ${num(a)} kilos de ${cultivo} y la de ${otro.nombre}, ${num(b)} kilos.${extra} ¿Cuántos kilos más produjo la finca de ${x.nombre}?`;
        paso = `La diferencia es ${num(a)} − ${num(b)}.`;
      } else {
        enunciado = `En la cooperativa había ${num(b)} kilos de ${cultivo}. Llegaron más camiones y ahora hay ${num(a)} kilos.${extra} ¿Cuántos kilos llegaron?`;
        paso = `Lo que llegó es lo que hay ahora menos lo que había: ${num(a)} − ${num(b)}.`;
      }
      visual = { tipo: 'texto', texto: `${num(a)} − ${num(b)}` };
    }
    const modo = modoRespuesta(ctx, respuesta, calc, { paso: 10 });
    return {
      enunciado,
      instruccion: 'Lee y resuelve',
      ilustracion: dibujoKilosDe(cultivo),
      datos: { a: calc.a, b: calc.b, ...(sobra ? { sobra: sobra.valor } : {}) },
      respuesta,
      unidad: 'kilos',
      ...modo,
      calculo: calc,
      operacion: calc.op === 'suma' ? 'suma' : 'resta',
      pistas: [
        sobra ? '¿Qué datos necesitas de verdad? Hay uno que sobra.' : '¿Se juntan cantidades, se quitan o se comparan?',
        visual,
        paso,
      ],
      explicacion: `${calc.op === 'suma' ? `${num(calc.a)} + ${num(calc.b)}` : `${num(calc.a)} − ${num(calc.b)}`} = ${num(respuesta)} kilos.${sobra ? ' El otro dato no se necesitaba.' : ''}`,
    };
  },
};

/** Escenas de arreglos: filas con la misma cantidad en cada una (q = quien, f = filas, c = en cada fila). */
type EscenaArreglo = { obj: Objeto; u: string; filas: string; fila: string; t: (q: string, f: number, c: number) => string };
const escenasArreglo: EscenaArreglo[] = [
  { obj: 'arbol-cacao', u: 'árboles', filas: 'los surcos', fila: 'surco', t: (q, f, c) => `${mayus(q)} sembró ${f} surcos de cacao con ${c} árboles en cada surco. Forma el arreglo tocando la cuadrícula. ¿Cuántos árboles sembró?` },
  { obj: 'arbol-cafe', u: 'matas', filas: 'los surcos', fila: 'surco', t: (_q, f, c) => `En el cafetal de la finca hay ${f} surcos con ${c} matas de café cada uno. Forma el arreglo. ¿Cuántas matas de café hay?` },
  { obj: 'arbol-aguacate', u: 'árboles', filas: 'las hileras', fila: 'hilera', t: (q, f, c) => `${mayus(q)} tiene un lote de aguacate con ${f} hileras de ${c} árboles. Arma las hileras en la cuadrícula. ¿Cuántos árboles de aguacate tiene?` },
  { obj: 'arbol-naranja', u: 'naranjos', filas: 'las hileras', fila: 'hilera', t: (q, f, c) => `Detrás de la casa, ${q} plantó ${f} hileras de naranjos, con ${c} árboles por hilera. Forma el arreglo. ¿Cuántos naranjos plantó?` },
  { obj: 'arbol-mandarina', u: 'árboles', filas: 'los surcos', fila: 'surco', t: (_q, f, c) => `En la finca hay ${f} surcos de mandarina y cada surco tiene ${c} árboles. Toca la cuadrícula para formarlos. ¿Cuántos árboles de mandarina hay?` },
  { obj: 'arbol-limon', u: 'árboles', filas: 'las hileras', fila: 'hilera', t: (q, f, c) => `${mayus(q)} va a podar los árboles de limón: son ${f} hileras de ${c}. Forma el arreglo. ¿Cuántos árboles va a podar?` },
  { obj: 'platanera', u: 'matas', filas: 'los surcos', fila: 'surco', t: (_q, f, c) => `En la vega de la quebrada hay ${f} surcos de plátano con ${c} matas en cada uno. Forma el arreglo. ¿Cuántas matas de plátano hay?` },
  { obj: 'huevo', u: 'huevos', filas: 'las filas', fila: 'fila', t: (q, f, c) => `En el gallinero, ${q} acomodó los huevos en ${f} filas de ${c}. Forma el arreglo. ¿Cuántos huevos hay?` },
  { obj: 'mata', u: 'matas', filas: 'los surcos', fila: 'surco', t: (_q, f, c) => `En la huerta escolar hay ${f} surcos con ${c} matas de yuca cada uno. Forma el arreglo. ¿Cuántas matas hay?` },
  { obj: 'mata', u: 'plántulas', filas: 'las filas', fila: 'fila', t: (_q, f, c) => `En el vivero, las bolsas con plántulas de cacao están en ${f} filas de ${c}. Forma el arreglo. ¿Cuántas plántulas hay?` },
  { obj: 'semilla', u: 'semillas', filas: 'las filas', fila: 'fila', t: (q, f, c) => `${mayus(q)} sembró semillas de maíz en ${f} filas, con ${c} semillas en cada fila. Arma el arreglo. ¿Cuántas semillas sembró?` },
  { obj: 'mazorca', u: 'mazorcas', filas: 'las filas', fila: 'fila', t: (_q, f, c) => `En el patio quedaron las mazorcas de cacao en ${f} filas de ${c}, listas para partir. Forma el arreglo. ¿Cuántas mazorcas hay?` },
  { obj: 'arepa', u: 'arepas', filas: 'las filas', fila: 'fila', t: (q, f, c) => `${mayus(q)} puso las arepas en la parrilla en ${f} filas de ${c}. Toca la cuadrícula para formarlas. ¿Cuántas arepas está asando?` },
  { obj: 'pan', u: 'panes', filas: 'las filas', fila: 'fila', t: (_q, f, c) => `En la bandeja del horno de la panadería del pueblo caben ${f} filas de ${c} panes. Forma el arreglo. ¿Cuántos panes salen en cada horneada?` },
  { obj: 'naranja', u: 'naranjas', filas: 'las filas', fila: 'fila', t: (q, f, c) => `En el puesto del mercado, ${q} arrumó las naranjas en ${f} filas de ${c}. Forma el arreglo. ¿Cuántas naranjas arrumó?` },
  { obj: 'bulto', u: 'bultos', filas: 'las filas', fila: 'fila', t: (q, f, c) => `En la bodega, ${q} arrumó los bultos de cacao seco en ${f} filas de ${c}. Forma el arreglo. ¿Cuántos bultos hay?` },
  { obj: 'aguacate', u: 'aguacates', filas: 'las filas', fila: 'fila', t: (_q, f, c) => `En la cooperativa acomodaron los aguacates en una caja grande: ${f} filas de ${c}. Forma el arreglo. ¿Cuántos aguacates caben?` },
  { obj: 'mandarina', u: 'mandarinas', filas: 'las filas', fila: 'fila', t: (q, f, c) => `${mayus(q)} puso las mandarinas a madurar sobre el mesón en ${f} filas de ${c}. Forma el arreglo. ¿Cuántas mandarinas hay?` },
  { obj: 'limon', u: 'limones', filas: 'las filas', fila: 'fila', t: (_q, f, c) => `En la tienda de la vereda, los limones están en el exhibidor en ${f} filas de ${c}. Forma el arreglo. ¿Cuántos limones hay?` },
  { obj: 'platano', u: 'plátanos', filas: 'las filas', fila: 'fila', t: (q, f, c) => `${mayus(q)} colgó los plátanos para que maduren en ${f} filas de ${c}. Forma el arreglo. ¿Cuántos plátanos colgó?` },
  { obj: 'mata', u: 'matas', filas: 'las filas', fila: 'fila', t: (q, f, c) => `En la huerta de la casa, ${q} trasplantó ${f} filas de cebolla con ${c} matas cada una. Forma el arreglo. ¿Cuántas matas trasplantó?` },
  { obj: 'moneda', u: 'monedas', filas: 'las filas', fila: 'fila', t: (q, f, c) => `${mayus(q)} ordenó las monedas de la alcancía en ${f} filas de ${c}. Forma el arreglo. ¿Cuántas monedas tiene?` },
  { obj: 'gallina', u: 'gallinas', filas: 'las filas', fila: 'fila', t: (_q, f, c) => `En el galpón, las gallinas duermen en los palos en ${f} filas de ${c}. Forma el arreglo. ¿Cuántas gallinas hay?` },
];

const arregloSurcos: Plantilla = {
  id: 'g3-arreglo',
  dimension: 'comprension',
  operacion: 'multiplicacion',
  descripcion: 'Formar arreglos de surcos (filas × columnas) y contar',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const maxTabla = pn(ctx, 'maxTabla', lerp(5, 10, dif(ctx)));
    const f = factorTabla(ctx, maxTabla);
    const c = rng.entero(2, Math.min(10, maxTabla + 1));
    const respuesta = f * c;
    const v = rng.elegir(escenasArreglo);
    return {
      // La orden de armar el arreglo también cambia.
      enunciado: v.t(adulto(rng).nombre, f, c).replace(
        /(Forma|Arma|Toca)[^.?]*\./,
        rng.elegir(['Forma el arreglo tocando la cuadrícula.', 'Arma el arreglo en la cuadrícula.', `Pinta en la cuadrícula una fila por cada ${v.fila}.`]),
      ),
      instruccion: 'Forma filas y columnas',
      ilustracion: v.obj,
      datos: { f, c },
      respuesta,
      unidad: v.u,
      distractores: distractores(rng, respuesta, [f * (c + 1), f * (c - 1), f + c], 3, dif(ctx)),
      interaccion: { tipo: 'arreglo', filas: f, columnas: c, objeto: v.obj },
      calculo: { op: 'multiplicacion', a: f, b: c },
      pistas: [
        `Cuenta ${v.filas} y mira ${/as$/.test(v.u) ? 'cuántas' : 'cuántos'} ${v.u} hay en cada ${v.fila}.`,
        { tipo: 'arreglo', filas: f, columnas: c, objeto: v.obj },
        `Son ${f} veces ${c}: ${f} × ${c}.`,
      ],
      explicacion: `${f} × ${c} = ${respuesta} ${v.u}.`,
    };
  },
};

/** Escenas de las tablas: grupos de «a» repetidos «b» veces. ilus: dibujo; obj: lo que va en cada fila del arreglo. */
type EscenaTabla = { ilus?: Objeto; obj?: Objeto; t: (q: string, a: number, b: number) => string };
const escenasTabla: EscenaTabla[] = [
  { ilus: 'arepa', obj: 'arepa', t: (_q, a, b) => `En la tienda de la vereda las arepas vienen en paquetes de ${a}. ¿Cuántas arepas hay en ${b} paquetes?` },
  { ilus: 'huevo', obj: 'huevo', t: (q, a, b) => `Cada gallina del patio de ${q} puso ${a} huevos esta semana. Hay ${b} gallinas. ¿Cuántos huevos pusieron?` },
  { ilus: 'bulto', obj: 'bulto', t: (_q, a, b) => `El carro de la cooperativa lleva ${a} bultos de cacao en cada viaje. ¿Cuántos bultos lleva en ${b} viajes?` },
  { ilus: 'pan', obj: 'pan', t: (_q, a, b) => `Para el refrigerio escolar llegan bolsas de ${a} panes. ¿Cuántos panes hay en ${b} bolsas?` },
  { ilus: 'mandarina', obj: 'mandarina', t: (q, a, b) => `${mayus(q)} llena canastillas con ${a} mandarinas cada una. ¿Cuántas mandarinas necesita para ${b} canastillas?` },
  { ilus: 'platano', obj: 'platano', t: (q, a, b) => `Cada mano de plátano trae ${a} plátanos. ${mayus(q)} compró ${b} manos. ¿Cuántos plátanos compró?` },
  { ilus: 'mata', obj: 'mata', t: (_q, a, b) => `En cada surco de la huerta escolar hay ${a} matas de yuca. ¿Cuántas matas hay en ${b} surcos?` },
  { ilus: 'limon', obj: 'limon', t: (_q, a, b) => `En la cooperativa empacan ${a} limones en cada caja. ¿Cuántos limones van en ${b} cajas?` },
  { ilus: 'aguacate', obj: 'aguacate', t: (_q, a, b) => `Cada árbol de aguacate de la finca dio ${a} aguacates maduros. ¿Cuántos aguacates dieron ${b} árboles?` },
  { ilus: 'semilla', obj: 'semilla', t: (q, a, b) => `${mayus(q)} guarda ${a} semillas de maíz en cada sobre. ¿Cuántas semillas guarda en ${b} sobres?` },
  { ilus: 'naranja', obj: 'naranja', t: (q, a, b) => `Para vender en el mercado del pueblo, ${q} pone ${a} naranjas en cada bolsa. Llenó ${b} bolsas. ¿Cuántas naranjas puso?` },
  { ilus: 'moneda', obj: 'moneda', t: (q, a, b) => `${mayus(q)} echa ${a} monedas cada semana en la alcancía. ¿Cuántas monedas junta en ${b} semanas?` },
  { ilus: 'mesa', t: (_q, a, b) => `En el restaurante escolar cada mesa tiene ${a} sillas. Hay ${b} mesas. ¿Cuántas sillas hay?` },
  { t: (q, a, b) => `Cada vaca de ${q} da ${a} litros de leche en el ordeño de la mañana. ¿Cuántos litros dan ${b} vacas?` },
  { ilus: 'mazorca', obj: 'mazorca', t: (q, a, b) => `De cada árbol de cacao, ${q} cortó ${a} mazorcas maduras. ¿Cuántas mazorcas cortó de ${b} árboles?` },
];

const tablas: Plantilla = {
  id: 'g3-tablas',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Tablas de multiplicar del 2 al 10 en contexto',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const maxTabla = pn(ctx, 'maxTabla', lerp(5, 10, dif(ctx)));
    const a = factorTabla(ctx, maxTabla);
    const b = rng.entero(2, 10);
    const respuesta = a * b;
    const v = rng.elegir(escenasTabla);
    const cola = rng.elegir([`(${a} × ${b})`, `Usa la tabla del ${a}.`, `Piensa en ${a} × ${b}.`]);
    const calc: Calculo = { op: 'multiplicacion', a, b };
    const modo = modoRespuesta(ctx, respuesta, calc, { abiertaMin: 0.3, abiertaMax: 0.9 });
    return {
      enunciado: `${v.t(adulto(rng).nombre, a, b)} ${cola}`,
      instruccion: 'Multiplica',
      ilustracion: v.ilus,
      datos: { a, b },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: [
        `¿Cuántos grupos hay y cuántos hay en cada grupo?`,
        // Una fila por grupo (paquete, gallina, viaje…), con lo que trae cada uno.
        { tipo: 'arreglo', filas: b, columnas: a, objeto: v.obj },
        `Suma ${a} cada vez, ${b} veces: ${Array.from({ length: Math.min(b, 4) }, (_, i) => a * (i + 1)).join(', ')}…`,
      ],
      explicacion: `${a} × ${b} = ${respuesta}.`,
    };
  },
};

/** Cultivos que se siembran en surcos, con el nombre de sus plantas y su género. */
const cultivosSurco: { nombre: string; plantas: string; g: Genero }[] = [
  { nombre: 'cacao', plantas: 'árboles', g: 'm' },
  { nombre: 'café', plantas: 'matas', g: 'f' },
  { nombre: 'aguacate', plantas: 'árboles', g: 'm' },
  { nombre: 'plátano', plantas: 'matas', g: 'f' },
  { nombre: 'naranja', plantas: 'árboles', g: 'm' },
  { nombre: 'mandarina', plantas: 'árboles', g: 'm' },
  { nombre: 'limón', plantas: 'árboles', g: 'm' },
];

const surcosProblema: Plantilla = {
  id: 'g3-surcos',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Problemas de surcos: total, o cuántos por surco (incógnita en un factor)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const maxTabla = pn(ctx, 'maxTabla', 10);
    const f = factorTabla(ctx, maxTabla);
    const c = rng.entero(2, 10);
    const total = f * c;
    const q = adulto(rng).nombre;
    const Q = mayus(q);
    const cul = rng.elegir(cultivosSurco);
    const n = cul.nombre;
    const pl = cul.plantas;
    const Cu = cuantosDe(cul.g);
    const cu = Cu.toLowerCase();
    const sobra = datoQueSobra(ctx);
    const extra = sobra?.texto ?? '';
    // Incógnita: cuántas plantas por surco (porSurco) o cuántos surcos salen (surcos).
    const incognita = pb(ctx, 'incognita') && dif(ctx) > 0.5 && rng.azar(0.5) ? rng.elegir(['porSurco', 'surcos'] as const) : null;
    let enunciado: string;
    let respuesta: number;
    let calc: Calculo;
    if (incognita === 'porSurco') {
      respuesta = c;
      calc = { op: 'division', a: total, b: f };
      enunciado = rng.elegir([
        `${Q} sembró ${total} ${pl} de ${n} en ${f} surcos, con la misma cantidad en cada surco.${extra} ¿${Cu} ${pl} hay en cada surco?`,
        `En un lote hay ${total} ${pl} de ${n} repartidos en ${f} hileras iguales.${extra} ¿${Cu} ${pl} tiene cada hilera?`.replace('repartidos', cul.g === 'f' ? 'repartidas' : 'repartidos'),
        `${Q} tiene ${total} ${pl} de ${n} para sembrar en ${f} surcos iguales.${extra} ¿${Cu} van en cada surco?`,
      ]);
    } else if (incognita === 'surcos') {
      respuesta = f;
      calc = { op: 'division', a: total, b: c };
      enunciado = rng.elegir([
        `${Q} quiere sembrar ${total} ${pl} de ${n} en surcos de ${c}.${extra} ¿Cuántos surcos le salen?`,
        `En el lote de ${n} hay ${total} ${pl}, en hileras de ${c}.${extra} ¿Cuántas hileras hay?`,
      ]);
    } else {
      respuesta = total;
      calc = { op: 'multiplicacion', a: f, b: c };
      enunciado = rng.elegir([
        `${Q} sembró ${f} surcos de ${n} con ${c} ${pl} en cada surco.${extra} ¿${Cu} ${pl} sembró?`,
        `En la finca hay ${f} hileras de ${n}. Cada hilera tiene ${c} ${pl}.${extra} ¿${Cu} ${pl} hay en total?`,
        `${Q} va a abonar un lote de ${n} que tiene ${f} surcos de ${c} ${pl}.${extra} ¿A ${cu} ${pl} les echa abono?`,
        `En la parcela de la escuela, los niños sembraron ${f} hileras de ${n}, con ${c} ${pl} en cada una.${extra} ¿${Cu} ${pl} sembraron?`,
        `Al recorrer su lote de ${n}, ${q} contó ${f} surcos y ${c} ${pl} en cada surco.${extra} ¿${Cu} ${pl} tiene el lote?`,
        `Del vivero salieron ${pl} de ${n} para ${f} surcos nuevos, ${c} por surco.${extra} ¿${Cu} ${pl} salieron del vivero?`,
      ]);
    }
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: incognita ? [total - f, incognita === 'porSurco' ? f : c] : [f + c] });
    return {
      enunciado,
      instruccion: 'Piensa en el arreglo',
      ilustracion: arbolDe(n),
      datos: { f, c, total, ...(sobra ? { sobra: sobra.valor } : {}) },
      respuesta,
      unidad: incognita === 'surcos' ? (/hileras/.test(enunciado) ? 'hileras' : 'surcos') : pl,
      ...modo,
      calculo: calc,
      operacion: incognita ? 'division' : 'multiplicacion',
      pistas: [
        sobra
          ? 'Un dato sobra. ¿Cuáles necesitas?'
          : incognita === 'porSurco'
            ? '¿Qué número multiplicado por los surcos da el total?'
            : incognita === 'surcos'
              ? `¿Cuántas veces cabe el ${c} en ${total}?`
              : `¿Cuántos surcos y ${cu} ${pl} en cada uno?`,
        { tipo: 'arreglo', filas: f, columnas: c, objeto: arbolDe(n) },
        incognita === 'porSurco' ? `${f} × ? = ${total}. Busca en la tabla del ${f}.` : incognita === 'surcos' ? `? × ${c} = ${total}. Busca en la tabla del ${c}.` : `${f} × ${c}.`,
      ],
      explicacion:
        incognita === 'porSurco'
          ? `${total} ÷ ${f} = ${c}, porque ${f} × ${c} = ${total}.`
          : incognita === 'surcos'
            ? `${total} ÷ ${c} = ${f}, porque ${f} × ${c} = ${total}.`
            : `${f} × ${c} = ${total} ${pl}.`,
    };
  },
};

/** Escenas de grupos iguales: k grupos con n en cada uno. */
type EscenaGrupos = { obj: Objeto; u: string; grupo?: Recipiente; t: (q: string, k: number, n: number) => string };
const escenasGrupos: EscenaGrupos[] = [
  { obj: 'mandarina', u: 'mandarinas', grupo: { nombre: 'Canastilla', dibujo: 'canasta' }, t: (q, k, n) => `${mayus(q)} llenó ${k} canastillas con ${n} mandarinas cada una. ¿Cuántas mandarinas empacó?` },
  { obj: 'pan', u: 'panes', grupo: { nombre: 'Bolsa', dibujo: 'bolsa' }, t: (_q, k, n) => `Para el refrigerio escolar llegaron ${k} bolsas con ${n} panes cada una. ¿Cuántos panes llegaron?` },
  { obj: 'platano', u: 'plátanos', t: (q, k, n) => `En la feria del pueblo, ${q} armó ${k} racimos con ${n} plátanos cada uno. ¿Cuántos plátanos usó?` },
  { obj: 'huevo', u: 'huevos', grupo: { nombre: 'Caja', dibujo: 'caja' }, t: (q, k, n) => `${mayus(q)} vende los huevos en cajas de ${n}. Hoy llenó ${k} cajas. ¿Cuántos huevos empacó?` },
  { obj: 'aguacate', u: 'aguacates', grupo: { nombre: 'Bolsa', dibujo: 'bolsa' }, t: (q, k, n) => `Para el mercado del pueblo, ${q} preparó ${k} bolsas de ${n} aguacates. ¿Cuántos aguacates lleva?` },
  { obj: 'mazorca', u: 'mazorcas', grupo: { nombre: 'Canasto', dibujo: 'canasta' }, t: (_q, k, n) => `En la cosecha de cacao llenaron ${k} canastos con ${n} mazorcas cada uno. ¿Cuántas mazorcas cortaron?` },
  { obj: 'arepa', u: 'arepas', grupo: { nombre: 'Mesa', dibujo: 'mesa' }, t: (_q, k, n) => `En el restaurante escolar pusieron ${n} arepas en cada una de las ${k} mesas. ¿Cuántas arepas sirvieron?` },
  { obj: 'semilla', u: 'semillas', grupo: { nombre: 'Sobre' }, t: (q, k, n) => `${mayus(q)} regaló ${k} sobres con ${n} semillas de maíz a los vecinos. ¿Cuántas semillas regaló?` },
  { obj: 'limon', u: 'limones', grupo: { nombre: 'Niño', dibujo: 'nino' }, t: (_q, k, n) => `Para hacer limonada en la escuela, cada uno de los ${k} niños del grupo trajo ${n} limones. ¿Cuántos limones juntaron?` },
  { obj: 'mata', u: 'matas', t: (_q, k, n) => `En la huerta escolar hay ${k} eras con ${n} matas de cebolla cada una. ¿Cuántas matas de cebolla hay?` },
  { obj: 'naranja', u: 'naranjas', grupo: { nombre: 'Canasta', dibujo: 'canasta' }, t: (q, k, n) => `${mayus(q)} llevó a la feria ${k} canastas con ${n} naranjas en cada una. ¿Cuántas naranjas llevó?` },
  { obj: 'limon', u: 'limones', grupo: { nombre: 'Malla' }, t: (_q, k, n) => `En la tienda de la vereda venden los limones en mallas de ${n}. Quedan ${k} mallas. ¿Cuántos limones quedan?` },
  { obj: 'arepa', u: 'arepas', grupo: { nombre: 'Paquete' }, t: (q, k, n) => `${mayus(q)} hizo ${k} paquetes de ${n} arepas para vender en la tienda. ¿Cuántas arepas hizo?` },
  { obj: 'moneda', u: 'monedas', grupo: { nombre: 'Grado' }, t: (_q, k, n) => `Para la rifa de la escuela, cada uno de los ${k} grados reunió ${n} monedas de $500. ¿Cuántas monedas reunieron?` },
];

const gruposIguales: Plantilla = {
  id: 'g3-grupos',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Grupos iguales: canastillas, cubetas y bultos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const maxTabla = pn(ctx, 'maxTabla', lerp(5, 10, dif(ctx)));
    const k = rng.entero(2, 10);
    const n = factorTabla(ctx, maxTabla);
    const respuesta = k * n;
    const v = rng.elegir(escenasGrupos);
    const calc: Calculo = { op: 'multiplicacion', a: k, b: n };
    const modo = modoRespuesta(ctx, respuesta, calc);
    return {
      enunciado: v.t(adulto(rng).nombre, k, n),
      instruccion: 'Grupos iguales',
      ilustracion: v.obj,
      datos: { k, n },
      respuesta,
      unidad: v.u,
      ...modo,
      calculo: calc,
      pistas: ['¿Todos los grupos tienen la misma cantidad? Entonces puedes multiplicar.', { tipo: 'objetos', objeto: v.obj, grupos: Array(k).fill(n), grupo: v.grupo }, `${k} grupos de ${n}: ${k} × ${n}.`],
      explicacion: `${k} × ${n} = ${respuesta} ${v.u}.`,
    };
  },
};

/** Contextos para multiplicar a (2 o 3 cifras) por b (una cifra). */
const contextosMult: ((q: string, a: string, b: number) => string)[] = [
  (q, a, b) => `Cada árbol de naranja dio ${a} naranjas y ${q} tiene ${b} árboles. ¿Cuántas naranjas son?`,
  (q, a, b) => `Cada día ${q} camina ${a} metros hasta la escuela de la vereda. ¿Cuántos metros camina en ${b} días?`,
  (_q, a, b) => `La cooperativa empaca ${a} kilos de cacao por día. ¿Cuántos kilos empaca en ${b} días?`,
  (_q, a, b) => `El galpón de la finca da ${a} huevos por semana. ¿Cuántos huevos da en ${b} semanas?`,
  (q, a, b) => `${mayus(q)} entrega ${a} litros de leche cada semana al carro lechero. ¿Cuántos litros entrega en ${b} semanas?`,
  (q, a, b) => `Cada rollo de alambre para la cerca trae ${a} metros. ${mayus(q)} compró ${b} rollos. ¿Cuántos metros de alambre compró?`,
  (_q, a, b) => `En el beneficiadero secan ${a} kilos de café en cada tanda. ¿Cuántos kilos secan en ${b} tandas?`,
  (_q, a, b) => `Cada paca que llega a la cooperativa trae ${a} bolsas para vivero. Llegaron ${b} pacas. ¿Cuántas bolsas llegaron?`,
  (q, a, b) => `En la feria del pueblo, ${q} vendió ${a} arepas cada día durante ${b} días. ¿Cuántas arepas vendió?`,
  (_q, a, b) => `Cada surco largo de la huerta tiene ${a} matas de yuca. ¿Cuántas matas hay en ${b} surcos?`,
  (_q, a, b) => `El vivero de la vereda entrega ${a} plántulas de cacao en cada lote. ¿Cuántas plántulas hay en ${b} lotes?`,
  (q, a, b) => `${mayus(q)} recorre ${a} metros por el camino de herradura para llevar el almuerzo al lote, y lo hace ${b} veces en la semana. ¿Cuántos metros recorre?`,
];

const algoritmoMult: Plantilla = {
  id: 'g3-algoritmo-mult',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Multiplicación de 2 y 3 cifras por 1 cifra',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', dif(ctx) < 0.45 ? 2 : 3);
    const a = conCifras(rng, cifras);
    const b = rng.entero(2, 9);
    const respuesta = a * b;
    const contexto = rng.elegir(contextosMult)(adulto(rng).nombre, num(a), b);
    const pedido = rng.elegir([
      `Resuelve cifra por cifra: ${num(a)} × ${b}.`,
      `Multiplica en columnas, empezando por las unidades: ${num(a)} × ${b}.`,
      `Haz la multiplicación paso a paso: ${num(a)} × ${b}.`,
      `Calcúlalo con la multiplicación ${num(a)} × ${b}, columna por columna.`,
    ]);
    return {
      enunciado: `${contexto} ${pedido}`,
      instruccion: 'Multiplica por columnas',
      datos: { a, b },
      respuesta,
      distractores: [],
      interaccion: { tipo: 'algoritmo', operacion: 'multiplicacion', a, b },
      calculo: { op: 'multiplicacion', a, b },
      pistas: [
        `Multiplica primero las unidades por ${b}. Si pasa de 9, ¿qué llevas?`,
        { tipo: 'texto', texto: `${num(a)} × ${b} = ${a >= 100 ? `${Math.floor(a / 100) * 100} × ${b} + ` : ''}${Math.floor(a / 10) % 10 * 10} × ${b} + ${a % 10} × ${b}` },
        `${a % 10} × ${b} = ${(a % 10) * b}. ${(a % 10) * b >= 10 ? `Escribe ${((a % 10) * b) % 10} y lleva ${Math.floor(((a % 10) * b) / 10)}.` : 'Escríbelo; no llevas nada.'}`,
      ],
      explicacion: `${num(a)} × ${b} = ${num(respuesta)}.`,
    };
  },
};

/** Escenas de problemas de multiplicar: rango del número que se repite (2 cifras / 3 cifras). */
type EscenaMult = { chico: [number, number]; grande: [number, number]; u: string; dibujo?: Objeto; t: (q: string, a: number, b: number, extra: string) => string };
const escenasMult: EscenaMult[] = [
  { chico: [60, 99], grande: [100, 199], u: 'kilos', dibujo: 'bulto', t: (q, a, b, e) => `La mula de ${q} carga ${a} kilos de cacao en cada viaje. Hizo ${b} viajes hasta la carretera.${e} ¿Cuántos kilos llevó?` },
  { chico: [20, 60], grande: [100, 250], u: 'mandarinas', dibujo: 'mandarina', t: (_q, a, b, e) => `Cada árbol de mandarina de la finca dio ${a} mandarinas. Hay ${b} árboles.${e} ¿Cuántas mandarinas dieron?` },
  { chico: [12, 48], grande: [120, 360], u: 'huevos', dibujo: 'huevo', t: (_q, a, b, e) => `Un pedido de la tienda de la vereda trae ${a} huevos. Este mes llegaron ${b} pedidos iguales.${e} ¿Cuántos huevos llegaron?` },
  { chico: [20, 80], grande: [100, 200], u: 'aguacates', dibujo: 'aguacate', t: (q, a, b, e) => `En la cosecha, cada árbol de aguacate de ${q} dio ${a} aguacates.${e} ¿Cuántos aguacates salen de ${b} árboles?` },
  { chico: [50, 99], grande: [100, 400], u: 'metros', t: (q, a, b, e) => `De la casa de ${q} a la quebrada hay ${a} metros. Hoy hizo ${b} viajes de ida para traer agua.${e} ¿Cuántos metros caminó de ida?` },
  { chico: [20, 90], grande: [100, 150], u: 'kilos', dibujo: 'bulto', t: (_q, a, b, e) => `En la cosecha de la finca, cada recolector cogió ${a} kilos de café en la semana. Son ${b} recolectores.${e} ¿Cuántos kilos de café cogieron?` },
  { chico: [24, 72], grande: [100, 200], u: 'plántulas', dibujo: 'mata', t: (_q, a, b, e) => `Cada cama del vivero tiene ${a} plántulas de cacao. Hay ${b} camas.${e} ¿Cuántas plántulas hay?` },
  { chico: [20, 99], grande: [100, 300], u: 'litros', t: (q, a, b, e) => `${mayus(q)} vende ${a} litros de leche cada semana.${e} ¿Cuántos litros vende en ${b} semanas?` },
  { chico: [30, 99], grande: [100, 250], u: 'arepas', dibujo: 'arepa', t: (q, a, b, e) => `En la feria del pueblo, ${q} vende ${a} arepas cada día.${e} ¿Cuántas arepas vende en ${b} días?` },
  { chico: [50, 99], grande: [100, 200], u: 'naranjas', dibujo: 'naranja', t: (_q, a, b, e) => `Cada bulto de naranjas trae ${a} naranjas. La chiva bajó ${b} bultos al pueblo.${e} ¿Cuántas naranjas bajó?` },
  { chico: [12, 40], grande: [100, 150], u: 'matas', dibujo: 'mata', t: (_q, a, b, e) => `Cada surco de la huerta escolar tiene ${a} matas de cebolla. Hay ${b} surcos.${e} ¿Cuántas matas de cebolla hay?` },
  { chico: [30, 99], grande: [100, 300], u: 'mazorcas', dibujo: 'mazorca', t: (q, a, b, e) => `${mayus(q)} cortó ${a} mazorcas de cacao cada día durante ${b} días.${e} ¿Cuántas mazorcas cortó?` },
  { chico: [40, 99], grande: [100, 250], u: 'panes', dibujo: 'pan', t: (_q, a, b, e) => `La panadería del pueblo saca ${a} panes en cada horneada. Hoy hizo ${b} horneadas.${e} ¿Cuántos panes hizo?` },
];

const multProblema: Plantilla = {
  id: 'g3-mult-problema',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Problemas de multiplicación con 2 y 3 cifras por 1 cifra',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    // cifras = 2 o 3 fija el tamaño del número que se repite; si no, depende de d.
    const grande = pn(ctx, 'cifras', d < 0.5 ? 2 : 3) >= 3;
    const b = rng.entero(2, 9);
    const sobra = datoQueSobra(ctx);
    const extra = sobra?.texto ?? '';
    const e = rng.elegir(escenasMult);
    const [lo, hi] = grande ? e.grande : e.chico;
    const a = rng.entero(lo, hi);
    const v = { a, t: e.t(adulto(rng).nombre, a, b, extra), u: e.u, dibujo: e.dibujo };
    const respuesta = v.a * b;
    const calc: Calculo = { op: 'multiplicacion', a: v.a, b };
    const modo = modoRespuesta(ctx, respuesta, calc, { paso: 10, extras: [v.a + b] });
    return {
      enunciado: v.t,
      instruccion: 'Lee y multiplica',
      ilustracion: v.dibujo,
      datos: { a: v.a, b, ...(sobra ? { sobra: sobra.valor } : {}) },
      respuesta,
      unidad: v.u,
      ...modo,
      calculo: calc,
      pistas: [
        sobra ? 'Un dato sobra. ¿Cuál es la cantidad que se repite y cuántas veces?' : '¿Qué cantidad se repite y cuántas veces?',
        { tipo: 'texto', texto: `${num(v.a)} + ${num(v.a)} + … (${b} veces)` },
        `${num(v.a)} × ${b}: multiplica unidades, luego decenas${v.a >= 100 ? ' y centenas' : ''}.`,
      ],
      explicacion: `${num(v.a)} × ${b} = ${num(respuesta)} ${v.u}.`,
    };
  },
};

/** Escenas de reparto: n cosas en k partes iguales. */
type EscenaReparto = { obj: Objeto; u: string; grupo: Recipiente; t: (q: string, n: number, k: number) => string };
const escenasReparto: EscenaReparto[] = [
  { obj: 'arepa', u: 'arepas', grupo: { nombre: 'Mesa', dibujo: 'mesa' }, t: (q, n, k) => `${mayus(q)} reparte ${n} arepas en partes iguales entre ${k} mesas del refrigerio escolar. ¿Cuántas arepas van en cada mesa?` },
  { obj: 'semilla', u: 'semillas', grupo: { nombre: 'Grupo', dibujo: 'nino' }, t: (q, n, k) => `${mayus(q)} reparte ${n} semillas de maíz entre ${k} grupos de la huerta escolar, la misma cantidad para cada grupo. ¿Cuántas semillas recibe cada grupo?` },
  { obj: 'naranja', u: 'naranjas', grupo: { nombre: 'Canasta', dibujo: 'canasta' }, t: (q, n, k) => `${mayus(q)} reparte ${n} naranjas en ${k} canastas iguales para llevar al mercado. ¿Cuántas naranjas van en cada canasta?` },
  { obj: 'huevo', u: 'huevos', grupo: { nombre: 'Caja', dibujo: 'caja' }, t: (q, n, k) => `${mayus(q)} recogió ${n} huevos y los acomoda en ${k} cajas, todas con la misma cantidad. ¿Cuántos huevos lleva cada caja?` },
  { obj: 'mandarina', u: 'mandarinas', grupo: { nombre: 'Niño', dibujo: 'nino' }, t: (_q, n, k) => `En el descanso, la profe reparte ${n} mandarinas entre ${k} niños por igual. ¿Cuántas mandarinas le tocan a cada niño?` },
  { obj: 'pan', u: 'panes', grupo: { nombre: 'Bolsa', dibujo: 'bolsa' }, t: (_q, n, k) => `En la cocina de la escuela empacan ${n} panes en ${k} bolsas con la misma cantidad. ¿Cuántos panes van en cada bolsa?` },
  { obj: 'mata', u: 'plántulas', grupo: { nombre: 'Vecino', dibujo: 'adulto' }, t: (_q, n, k) => `El vivero regala ${n} plántulas de café a ${k} vecinos de la vereda, la misma cantidad a cada uno. ¿Cuántas plántulas recibe cada vecino?` },
  { obj: 'limon', u: 'limones', grupo: { nombre: 'Malla' }, t: (q, n, k) => `${mayus(q)} reparte ${n} limones en ${k} mallas iguales para la tienda. ¿Cuántos limones lleva cada malla?` },
  { obj: 'aguacate', u: 'aguacates', grupo: { nombre: 'Canasto', dibujo: 'canasta' }, t: (_q, n, k) => `Para la cooperativa reparten ${n} aguacates en ${k} canastos, sin que a ninguno le falte. ¿Cuántos aguacates van en cada canasto?` },
  { obj: 'mazorca', u: 'mazorcas', grupo: { nombre: 'Trabajador', dibujo: 'adulto' }, t: (_q, n, k) => `Hay ${n} mazorcas de cacao para partir y ${k} trabajadores, que se las reparten por igual. ¿Cuántas mazorcas parte cada trabajador?` },
  { obj: 'platano', u: 'plátanos', grupo: { nombre: 'Familia', dibujo: 'adulto' }, t: (q, n, k) => `${mayus(q)} reparte ${n} plátanos entre ${k} familias vecinas, la misma cantidad a cada familia. ¿Cuántos plátanos recibe cada una?` },
  { obj: 'moneda', u: 'monedas', grupo: { nombre: 'Alcancía' }, t: (q, n, k) => `${mayus(q)} guarda ${n} monedas en ${k} alcancías, la misma cantidad en cada una. ¿Cuántas monedas van en cada alcancía?` },
  { obj: 'bulto', u: 'bultos', grupo: { nombre: 'Finca' }, t: (_q, n, k) => `En la bodega de la cooperativa hay ${n} bultos de abono para ${k} fincas, la misma cantidad para cada finca. ¿Cuántos bultos le tocan a cada finca?` },
  { obj: 'huevo', u: 'huevos', grupo: { nombre: 'Canasta', dibujo: 'canasta' }, t: (q, n, k) => `${mayus(q)} lleva ${n} huevos a la feria en ${k} canastas con la misma cantidad. ¿Cuántos huevos van en cada canasta?` },
  { obj: 'limon', u: 'limones', grupo: { nombre: 'Niño', dibujo: 'nino' }, t: (_q, n, k) => `Para preparar limonada, la profe reparte ${n} limones entre ${k} niños por partes iguales. ¿Cuántos limones exprime cada niño?` },
  { obj: 'aguacate', u: 'aguacates', grupo: { nombre: 'Vecino', dibujo: 'adulto' }, t: (q, n, k) => `${mayus(q)} regala ${n} aguacates a ${k} vecinos, a todos por igual. ¿Cuántos aguacates recibe cada vecino?` },
  { obj: 'semilla', u: 'semillas', grupo: { nombre: 'Surco' }, t: (q, n, k) => `${mayus(q)} siembra ${n} semillas de fríjol en ${k} surcos, las mismas en cada surco. ¿Cuántas semillas van en cada surco?` },
  { obj: 'pan', u: 'panes', grupo: { nombre: 'Mesa', dibujo: 'mesa' }, t: (_q, n, k) => `En la reunión de padres de familia reparten ${n} panes en ${k} mesas por igual. ¿Cuántos panes ponen en cada mesa?` },
  { obj: 'moneda', u: 'monedas', grupo: { nombre: 'Nieto', dibujo: 'nino' }, t: (_q, n, k) => `La abuela reparte ${n} monedas entre sus ${k} nietos, la misma cantidad a cada uno. ¿Cuántas monedas recibe cada nieto?` },
  { obj: 'naranja', u: 'naranjas', grupo: { nombre: 'Bolsa', dibujo: 'bolsa' }, t: (q, n, k) => `${mayus(q)} reparte ${n} naranjas en ${k} bolsas iguales para mandarlas en la chiva. ¿Cuántas naranjas van en cada bolsa?` },
  { obj: 'mazorca', u: 'mazorcas', grupo: { nombre: 'Canasta', dibujo: 'canasta' }, t: (_q, n, k) => `Para llevarlas al cajón de fermentación, acomodan ${n} mazorcas de cacao en ${k} canastas iguales. ¿Cuántas mazorcas van en cada canasta?` },
  { obj: 'platano', u: 'plátanos', grupo: { nombre: 'Caja', dibujo: 'caja' }, t: (_q, n, k) => `La finca manda ${n} plátanos al mercado del pueblo en ${k} cajas con la misma cantidad. ¿Cuántos plátanos van en cada caja?` },
  { obj: 'arepa', u: 'arepas', grupo: { nombre: 'Trabajador', dibujo: 'adulto' }, t: (q, n, k) => `${mayus(q)} reparte ${n} arepas entre ${k} trabajadores del corte de café, a todos por igual. ¿Cuántas arepas le tocan a cada trabajador?` },
  { obj: 'mandarina', u: 'mandarinas', grupo: { nombre: 'Bolsa', dibujo: 'bolsa' }, t: (_q, n, k) => `Para el paseo de la escuela empacan ${n} mandarinas en ${k} bolsas iguales. ¿Cuántas mandarinas lleva cada bolsa?` },
];

const reparto: Plantilla = {
  id: 'g3-reparto',
  dimension: 'problemas',
  operacion: 'division',
  descripcion: 'División exacta como reparto en partes iguales',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(2, lerp(5, 9, dif(ctx)));
    const q = rng.entero(2, lerp(6, 15, dif(ctx)));
    const n = k * q;
    const v = rng.elegir(escenasReparto);
    const texto = v.t(adulto(rng).nombre, n, k);
    const calc: Calculo = { op: 'division', a: n, b: k };
    const arrastrar = n <= 18 && rng.azar(0.4);
    const modo = modoRespuesta(ctx, q, calc, { extras: [n - k, k] });
    return {
      enunciado: arrastrar ? `${texto} Arrastra para repartir.` : texto,
      instruccion: 'Reparte igual',
      ilustracion: v.obj,
      datos: { n, k },
      respuesta: q,
      unidad: v.u,
      ...(arrastrar ? { distractores: modo.distractores, interaccion: { tipo: 'arrastrar' as const, objeto: v.obj, modo: 'repartir' as const, a: n, b: k, destino: v.grupo } } : modo),
      calculo: calc,
      pistas: [
        `¿Qué número por ${k} da ${n}?`,
        n <= 30 ? { tipo: 'reparto', total: n, grupos: k, objeto: v.obj, grupo: v.grupo } : { tipo: 'arreglo', filas: k, columnas: q, objeto: v.obj },
        `Busca en la tabla del ${k}: ${k} × ? = ${n}.`,
      ],
      explicacion: `${n} ÷ ${k} = ${q}, porque ${k} × ${q} = ${n}.`,
    };
  },
};

/** Escenas de agrupación: n cosas en grupos de k; se pregunta cuántos grupos. obj: lo que va en cada fila del arreglo. */
type EscenaAgrupar = { u: string; obj?: Objeto; dibujo?: Objeto; t: (q: string, n: number, k: number) => string };
const escenasAgrupar: EscenaAgrupar[] = [
  { u: 'bolsas', obj: 'aguacate', dibujo: 'aguacate', t: (q, n, k) => `${mayus(q)} empaca ${n} aguacates en bolsas de ${k}. ¿Cuántas bolsas llena?` },
  { u: 'cubetas', obj: 'huevo', dibujo: 'cubeta', t: (q, n, k) => `${mayus(q)} acomoda ${n} huevos en cubetas pequeñas de ${k}. ¿Cuántas cubetas llena?` },
  // Los kilos no se dibujan uno por uno.
  { u: 'bolsas', dibujo: 'bolsa', t: (_q, n, k) => `En la cooperativa empacan ${n} kilos de cacao en bolsas de ${k} kilos. ¿Cuántas bolsas llenan?` },
  { u: 'mallas', obj: 'naranja', dibujo: 'naranja', t: (q, n, k) => `${mayus(q)} tiene ${n} naranjas y las vende en mallas de ${k}. ¿Cuántas mallas arma?` },
  { u: 'grupos', t: (_q, n, k) => `En la escuela hay ${n} niños para trabajar en la huerta, en grupos de ${k}. ¿Cuántos grupos se forman?` },
  { u: 'surcos', obj: 'mata', dibujo: 'mata', t: (q, n, k) => `${mayus(q)} va a sembrar ${n} plántulas de cacao, ${k} en cada surco. ¿Cuántos surcos necesita?` },
  { u: 'bolsas', obj: 'pan', dibujo: 'pan', t: (_q, n, k) => `Para el refrigerio hay ${n} panes y se empacan ${k} en cada bolsa. ¿Cuántas bolsas salen?` },
  { u: 'paquetes', obj: 'arepa', dibujo: 'arepa', t: (q, n, k) => `${mayus(q)} hizo ${n} arepas y las vende en paquetes de ${k}. ¿Cuántos paquetes completa?` },
  { u: 'huecos', obj: 'semilla', dibujo: 'semilla', t: (_q, n, k) => `En la huerta escolar echan ${k} semillas de maíz en cada hueco. Tienen ${n} semillas. ¿Cuántos huecos alcanzan a sembrar?` },
  { u: 'canastillas', obj: 'mandarina', dibujo: 'mandarina', t: (_q, n, k) => `En la finca cogieron ${n} mandarinas y las ponen en canastillas de ${k}. ¿Cuántas canastillas llenan?` },
  { u: 'viajes', obj: 'bulto', dibujo: 'bulto', t: (_q, n, k) => `El carro de la cooperativa lleva ${k} bultos de cacao en cada viaje. Hay ${n} bultos para llevar. ¿Cuántos viajes hace?` },
  { u: 'manos', obj: 'platano', dibujo: 'platano', t: (q, n, k) => `${mayus(q)} cortó ${n} plátanos y los arma en manos de ${k}. ¿Cuántas manos salen?` },
  { u: 'bolsas', obj: 'limon', dibujo: 'limon', t: (_q, n, k) => `En la tienda de la vereda empacan ${n} limones, ${k} en cada bolsa. ¿Cuántas bolsas llenan?` },
];

const agrupacion: Plantilla = {
  id: 'g3-agrupacion',
  dimension: 'problemas',
  operacion: 'division',
  descripcion: 'División exacta como agrupación: ¿cuántas bolsas se llenan?',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(2, lerp(5, 10, dif(ctx)));
    const q = rng.entero(2, lerp(6, 12, dif(ctx)));
    const n = k * q;
    const v = rng.elegir(escenasAgrupar);
    const calc: Calculo = { op: 'division', a: n, b: k };
    const modo = modoRespuesta(ctx, q, calc, { extras: [n - k, k] });
    return {
      enunciado: v.t(adulto(rng).nombre, n, k),
      instruccion: 'Haz grupos',
      ilustracion: v.dibujo,
      datos: { n, k },
      respuesta: q,
      unidad: v.u,
      ...modo,
      calculo: calc,
      pistas: [`¿Cuántos grupos de ${k} caben en ${n}?`, { tipo: 'arreglo', filas: q, columnas: k, objeto: v.obj }, `Cuenta de ${k} en ${k} hasta llegar a ${n}: ${k}, ${2 * k}, ${3 * k}…`],
      explicacion: `${n} ÷ ${k} = ${q} ${v.u}.`,
    };
  },
};

/** Escenas de «la división deshace la multiplicación»: a grupos de b son p. */
type EscenaRelacion = { obj: Objeto; t: (q: string, a: number, b: number, p: number) => string; grupo: string };
const escenasDeshacer: EscenaRelacion[] = [
  { obj: 'arbol', grupo: 'surcos', t: (q, a, b, p) => `${mayus(q)} sabe que ${a} surcos de ${b} árboles son ${p} árboles (${a} × ${b} = ${p}). Si siembra ${p} árboles en surcos de ${b}, ¿cuántos surcos forma? (${p} ÷ ${b})` },
  { obj: 'naranja', grupo: 'bolsas', t: (q, a, b, p) => `${mayus(q)} sabe que ${a} bolsas de ${b} naranjas son ${p} naranjas (${a} × ${b} = ${p}). Con ${p} naranjas, ¿cuántas bolsas de ${b} llena? (${p} ÷ ${b})` },
  { obj: 'huevo', grupo: 'cajas', t: (_q, a, b, p) => `En la tienda saben que ${a} cajas de ${b} huevos son ${p} huevos (${a} × ${b} = ${p}). Si llegan ${p} huevos, ¿cuántas cajas de ${b} se arman? (${p} ÷ ${b})` },
  { obj: 'arepa', grupo: 'mesas', t: (_q, a, b, p) => `En el refrigerio, ${a} mesas con ${b} arepas cada una suman ${p} arepas (${a} × ${b} = ${p}). Si hay ${p} arepas y van ${b} por mesa, ¿cuántas mesas se sirven? (${p} ÷ ${b})` },
  { obj: 'pan', grupo: 'paquetes', t: (q, a, b, p) => `${mayus(q)} recuerda que ${a} paquetes de ${b} panes son ${p} panes (${a} × ${b} = ${p}). ¿Cuántos paquetes de ${b} salen de ${p} panes? (${p} ÷ ${b})` },
  { obj: 'bulto', grupo: 'viajes', t: (_q, a, b, p) => `En ${a} viajes de ${b} bultos, el carro de la cooperativa lleva ${p} bultos (${a} × ${b} = ${p}). Si hay ${p} bultos y lleva ${b} por viaje, ¿cuántos viajes hace? (${p} ÷ ${b})` },
  { obj: 'semilla', grupo: 'huecos', t: (q, a, b, p) => `${mayus(q)} sabe que en ${a} huecos con ${b} semillas caben ${p} semillas (${a} × ${b} = ${p}). Si tiene ${p} semillas y echa ${b} por hueco, ¿cuántos huecos siembra? (${p} ÷ ${b})` },
  { obj: 'mazorca', grupo: 'canastos', t: (_q, a, b, p) => `${a} canastos con ${b} mazorcas cada uno son ${p} mazorcas (${a} × ${b} = ${p}). Si cortaron ${p} mazorcas y caben ${b} en cada canasto, ¿cuántos canastos llenan? (${p} ÷ ${b})` },
];
const escenasPariente: EscenaRelacion[] = [
  { obj: 'mandarina', grupo: 'canasta', t: (q, _a, b, p) => `${mayus(q)} quiere repartir ${p} mandarinas en ${b} canastas iguales (${p} ÷ ${b}). ¿Qué multiplicación le ayuda a resolverlo?` },
  { obj: 'limon', grupo: 'bolsa', t: (q, _a, b, p) => `${mayus(q)} va a empacar ${p} limones en ${b} bolsas con la misma cantidad (${p} ÷ ${b}). ¿Qué multiplicación sirve para saber cuántos van en cada bolsa?` },
  { obj: 'semilla', grupo: 'sobre', t: (_q, _a, b, p) => `En la huerta escolar hay ${p} semillas para ${b} sobres iguales (${p} ÷ ${b}). ¿Qué multiplicación ayuda a encontrar cuántas van en cada sobre?` },
  { obj: 'huevo', grupo: 'caja', t: (q, _a, b, p) => `${mayus(q)} reparte ${p} huevos en ${b} cajas iguales (${p} ÷ ${b}). ¿Con qué multiplicación lo comprueba?` },
  { obj: 'aguacate', grupo: 'canasto', t: (_q, _a, b, p) => `Hay ${p} aguacates para ${b} canastos con la misma cantidad (${p} ÷ ${b}). ¿Qué multiplicación te dice cuántos van en cada canasto?` },
  { obj: 'arepa', grupo: 'mesa', t: (_q, _a, b, p) => `En el restaurante escolar reparten ${p} arepas en ${b} mesas por igual (${p} ÷ ${b}). ¿Qué multiplicación usarías para saber cuántas van por mesa?` },
  { obj: 'mata', grupo: 'surco', t: (q, _a, b, p) => `${mayus(q)} siembra ${p} plántulas de cacao en ${b} surcos iguales (${p} ÷ ${b}). ¿Qué multiplicación le ayuda a saber cuántas van en cada surco?` },
  { obj: 'naranja', grupo: 'niño', t: (_q, _a, b, p) => `La profe reparte ${p} naranjas entre ${b} niños por igual (${p} ÷ ${b}). ¿Qué multiplicación ayuda a saber cuántas le tocan a cada niño?` },
];

const relacionDivision: Plantilla = {
  id: 'g3-relacion-division',
  dimension: 'comprension',
  operacion: 'division',
  descripcion: 'Relación entre multiplicación y división',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const a = rng.entero(2, 9);
    const b = rng.entero(2, 9);
    const p = a * b;
    const quien = adulto(rng).nombre;
    if (rng.azar(0.5)) {
      const v = rng.elegir(escenasDeshacer);
      const distr = distractores(rng, a, [b === a ? a + 1 : b, p - b, a + 1], 3, dif(ctx));
      return {
        enunciado: v.t(quien, a, b, p),
        instruccion: 'Usa la multiplicación',
        ilustracion: v.obj,
        datos: { a, b, p },
        respuesta: a,
        distractores: distr,
        interaccion: { tipo: 'opciones', opciones: mezclarOpciones(rng, a, distr) },
        calculo: { op: 'division', a: p, b },
        pistas: ['La división deshace la multiplicación.', { tipo: 'arreglo', filas: a, columnas: b, objeto: v.obj }, `${a} × ${b} = ${p}, entonces ${p} ÷ ${b} = ${a}: son ${a} ${v.grupo}.`],
        explicacion: `Como ${a} × ${b} = ${p}, entonces ${p} ÷ ${b} = ${a}.`,
      };
    }
    const v = rng.elegir(escenasPariente);
    const correcta = `${b} × ${a} = ${p}`;
    const otras = [`${b} + ${a} = ${b + a}`, `${p} − ${b} = ${p - b}`, `${b} × ${a + 1} = ${b * (a + 1)}`];
    const opciones = rng.barajar([correcta, ...otras]);
    return {
      enunciado: v.t(quien, a, b, p),
      instruccion: 'Elige la multiplicación',
      ilustracion: v.obj,
      datos: { a, b, p },
      respuesta: correcta,
      distractores: otras,
      interaccion: { tipo: 'opciones', opciones },
      pistas: [`Busca un número que, multiplicado por ${b}, dé ${p}.`, { tipo: 'arreglo', filas: b, columnas: a, objeto: v.obj }, `${b} × ${a} = ${p}, así que a cada ${v.grupo} le tocan ${a}.`],
      explicacion: `${p} ÷ ${b} = ${a} porque ${b} × ${a} = ${p}.`,
    };
  },
};

/** Pequeños contextos para dividir n entre k en partes iguales (con su dibujo). */
const contextosDivision: { dibujo?: Objeto; t: (q: string, n: number, k: number) => string }[] = [
  { dibujo: 'bulto', t: (q, n, k) => `${mayus(q)} tiene ${n} kilos de café para empacar en ${k} costales con el mismo peso.` },
  { dibujo: 'huevo', t: (q, n, k) => `${mayus(q)} acomoda ${n} huevos en ${k} cajas iguales.` },
  { dibujo: 'mata', t: (_q, n, k) => `En el vivero hay ${n} plántulas para ${k} surcos iguales.` },
  { dibujo: 'naranja', t: (q, n, k) => `${mayus(q)} reparte ${n} naranjas en ${k} canastas con la misma cantidad.` },
  { dibujo: 'arepa', t: (_q, n, k) => `En el refrigerio hay ${n} arepas para ${k} mesas, la misma cantidad en cada una.` },
  { t: (q, n, k) => `${mayus(q)} parte ${n} metros de cerca en ${k} tramos iguales.` },
  { dibujo: 'semilla', t: (_q, n, k) => `En la huerta escolar guardan ${n} semillas en ${k} sobres iguales.` },
  { dibujo: 'bulto', t: (_q, n, k) => `En la cooperativa reparten ${n} kilos de cacao seco en ${k} bultos con el mismo peso.` },
  { dibujo: 'pan', t: (_q, n, k) => `Para el paseo, la profe empaca ${n} panes en ${k} bolsas iguales.` },
  { dibujo: 'mandarina', t: (q, n, k) => `${mayus(q)} reparte ${n} mandarinas entre ${k} niños por partes iguales.` },
  { dibujo: 'moneda', t: (q, n, k) => `${mayus(q)} reparte ${n} monedas en ${k} alcancías por igual.` },
  { t: () => `Sin dibujos, solo con lo que sabes de multiplicar.` },
];

const divisionCalculo: Plantilla = {
  id: 'g3-division-calculo',
  dimension: 'procedimiento',
  operacion: 'division',
  descripcion: 'Cálculo de divisiones exactas con la tabla',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(2, lerp(5, 9, dif(ctx)));
    const q = rng.entero(2, lerp(9, 20, dif(ctx)));
    const n = k * q;
    const calc: Calculo = { op: 'division', a: n, b: k };
    const modo = modoRespuesta(ctx, q, calc, { abiertaMin: 0.3, abiertaMax: 0.9, extras: [n - k] });
    const c = rng.elegir(contextosDivision);
    const pedido = rng.elegir([`Resuelve: ${n} ÷ ${k} = ?`, `Divide: ${n} ÷ ${k}.`, `¿Cuánto es ${n} ÷ ${k}?`, `Calcula ${n} ÷ ${k} con la tabla del ${k}.`]);
    return {
      enunciado: `${c.t(adulto(rng).nombre, n, k)} ${pedido}`,
      instruccion: 'Divide',
      ilustracion: c.dibujo,
      datos: { n, k },
      respuesta: q,
      ...modo,
      calculo: calc,
      pistas: [`¿Qué número multiplicado por ${k} da ${n}?`, q <= 10 ? { tipo: 'arreglo', filas: k, columnas: q } : { tipo: 'texto', texto: `${k} × 10 = ${k * 10}; faltan ${n - k * 10}` }, q > 10 ? `${k} × 10 = ${k * 10}. Faltan ${n - k * 10}, que son ${k} × ${q - 10}. Total: 10 + ${q - 10}.` : `Repasa la tabla del ${k}.`],
      explicacion: `${n} ÷ ${k} = ${q}, porque ${k} × ${q} = ${n}.`,
    };
  },
};

const dosPasos: Plantilla = {
  id: 'g3-dos-pasos',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Problemas de dos pasos (con datos que sobran)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const sobra = datoQueSobra(ctx);
    const extra = sobra?.texto ?? '';
    const [x] = dosPersonas(rng);
    const tipo = rng.elegir(['suma-resta', 'mult-resta', 'mult-suma']);
    let enunciado: string;
    let respuesta: number;
    let calc: Calculo;
    let paso1: string;
    if (tipo === 'suma-resta') {
      const a = rng.entero(lerp(20, 200, d), lerp(80, 800, d));
      const b = rng.entero(lerp(20, 200, d), lerp(80, 800, d));
      const c = rng.entero(10, a + b - 5);
      respuesta = a + b - c;
      calc = { op: 'resta', a: a + b, b: c };
      [enunciado, paso1] = rng.elegir<[string, string]>([
        [`${x.nombre} y su familia cortaron ${a} mazorcas de cacao el lunes y ${b} el martes. Guardaron ${c} para semilla y el resto lo llevaron al cajón de fermentación.${extra} ¿Cuántas mazorcas llevaron al cajón?`, `Primero junta lo de los dos días: ${a} + ${b} = ${a + b}.`],
        [`En el galpón de ${x.nombre} recogieron ${a} huevos en marzo y ${b} en abril. Vendieron ${c} en la tienda de la vereda.${extra} ¿Cuántos huevos quedan?`, `Primero junta los huevos de los dos meses: ${a} + ${b} = ${a + b}.`],
        [`El vivero de la vereda tenía ${a} plántulas de café y le llegaron ${b} más. Ya entregó ${c} a los vecinos.${extra} ¿Cuántas plántulas quedan en el vivero?`, `Primero calcula cuántas plántulas hubo: ${a} + ${b} = ${a + b}.`],
        [`La cooperativa recibió ${a} kilos de cacao de una vereda y ${b} de otra. Despachó ${c} kilos al casco urbano.${extra} ¿Cuántos kilos le quedan?`, `Primero junta lo que recibió: ${a} + ${b} = ${a + b}.`],
      ]);
    } else if (tipo === 'mult-resta') {
      const f = rng.entero(3, 9);
      const c = rng.entero(6, lerp(12, 40, d));
      const v = rng.entero(5, f * c - 1);
      respuesta = f * c - v;
      calc = { op: 'resta', a: f * c, b: v };
      const A = mayus(adulto(rng).nombre);
      [enunciado, paso1] = rng.elegir<[string, string]>([
        [`${A} llevó ${f} canastas con ${c} naranjas cada una al mercado del pueblo y vendió ${v} naranjas.${extra} ¿Cuántas naranjas le quedaron?`, `Primero calcula cuántas naranjas llevó: ${f} × ${c} = ${f * c}.`],
        [`En la feria del pueblo, ${A} llevó ${f} paquetes de ${c} arepas y vendió ${v} arepas.${extra} ¿Cuántas arepas le sobraron?`, `Primero calcula cuántas arepas llevó: ${f} × ${c} = ${f * c}.`],
        [`En la huerta escolar hay ${f} surcos con ${c} matas de cebolla. Ya cosecharon ${v} matas.${extra} ¿Cuántas matas faltan por cosechar?`, `Primero calcula cuántas matas hay: ${f} × ${c} = ${f * c}.`],
      ]);
    } else {
      const f = rng.entero(3, 9);
      const c = rng.entero(6, lerp(12, 40, d));
      const e = rng.entero(5, lerp(30, 200, d));
      respuesta = f * c + e;
      calc = { op: 'suma', a: f * c, b: e };
      const A = adulto(rng).nombre;
      [enunciado, paso1] = rng.elegir<[string, string]>([
        [`En la finca de ${A} hay ${f} surcos con ${c} árboles de café cada uno, y ${e} árboles sueltos cerca de la casa.${extra} ¿Cuántos árboles de café hay en total?`, `Primero calcula los árboles de los surcos: ${f} × ${c} = ${f * c}.`],
        [`${mayus(A)} tiene ${f} canastos con ${c} mazorcas de cacao cada uno y ${e} mazorcas sueltas en el patio.${extra} ¿Cuántas mazorcas tiene?`, `Primero calcula las mazorcas de los canastos: ${f} × ${c} = ${f * c}.`],
        [`Para el refrigerio llegaron ${f} bolsas con ${c} panes cada una y otros ${e} panes sueltos.${extra} ¿Cuántos panes llegaron?`, `Primero calcula los panes de las bolsas: ${f} × ${c} = ${f * c}.`],
      ]);
    }
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: tipo === 'suma-resta' ? [calc.a] : [calc.a] });
    return {
      enunciado,
      instruccion: 'Resuelve en dos pasos',
      datos: { a: calc.a, b: calc.b, ...(sobra ? { sobra: sobra.valor } : {}) },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: [sobra ? 'Hay un dato que no necesitas. ¿Qué debes calcular primero?' : '¿Qué debes calcular primero?', { tipo: 'texto', texto: paso1 }, `${paso1} Después: ${num(calc.a)} ${calc.op === 'suma' ? '+' : '−'} ${num(calc.b)}.`],
      explicacion: `${paso1} Luego ${num(calc.a)} ${calc.op === 'suma' ? '+' : '−'} ${num(calc.b)} = ${num(respuesta)}.`,
    };
  },
};

const razonable: Plantilla = {
  id: 'g3-razonable',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: '¿Es razonable? Estimar sumas y productos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const op = pt(ctx, 'op', 'mixta');
    const mult = op === 'mult' || (op === 'mixta' && rng.azar(0.5));
    let real: number;
    let texto: string;
    let datos: Record<string, number>;
    const quien = persona(rng);
    if (mult) {
      const a = rng.entero(21, 98);
      const b = rng.entero(3, 9);
      real = a * b;
      datos = { a, b };
      const Q = quien.nombre;
      texto = rng.elegir([
        `${Q} calculó cuántos kilos de cacao carga la mula en ${b} viajes de ${a} kilos.`,
        `${Q} calculó cuántas naranjas hay en ${b} canastas de ${a} naranjas.`,
        `${Q} calculó cuántos metros camina en ${b} días si cada día camina ${a} metros.`,
        `${Q} multiplicó para saber cuántos aguacates dan ${b} árboles con ${a} aguacates cada uno.`,
        `${Q} calculó los kilos de café que cogen ${b} recolectores si cada uno coge ${a} kilos.`,
        `${Q} calculó cuántos huevos da el galpón en ${b} semanas, a ${a} huevos por semana.`,
        `${Q} calculó cuántas arepas vende su mamá en ${b} días si vende ${a} cada día.`,
        `${Q} calculó cuántas plántulas hay en ${b} camas del vivero con ${a} plántulas cada una.`,
        `${Q} multiplicó para saber cuántos litros de leche se venden en ${b} días, a ${a} litros por día.`,
      ]);
    } else {
      const a = rng.entero(1100, 4800);
      const b = rng.entero(1100, 4800);
      real = a + b;
      datos = { a, b };
      const Q = quien.nombre;
      texto = rng.elegir([
        `${Q} sumó los kilos de café de dos semanas: ${num(a)} y ${num(b)}.`,
        `${Q} sumó los kilos de cacao que recibió la cooperativa en dos meses: ${num(a)} y ${num(b)}.`,
        `${Q} sumó los metros del camino: de su casa a la escuela hay ${num(a)} metros y de la escuela al pueblo, ${num(b)}.`,
        `${Q} sumó lo que pagó en la tienda: ${pesos(a)} por el arroz y ${pesos(b)} por la panela.`,
        `${Q} sumó las plántulas de los dos viveros de la vereda: ${num(a)} y ${num(b)}.`,
        `${Q} sumó los huevos que vendió la granja en dos meses: ${num(a)} y ${num(b)}.`,
        `${Q} sumó las mazorcas de cacao de dos lotes: ${num(a)} y ${num(b)}.`,
        `${Q} sumó los litros de leche que entregó la vereda en dos semanas: ${num(a)} y ${num(b)}.`,
      ]);
    }
    const escala = mult ? 100 : 1000;
    const estimacion = redondear(real, escala);
    const lejanos = [real * 10, real + 3 * escala, real - 3 * escala, Math.round(real / 10)].filter((x) => Math.abs(x - real) >= real * 0.3 && x > 0 && x <= LIMITE);
    const esRaz = rng.azar(0.5) || !lejanos.length;
    const propuesto = esRaz ? real : rng.elegir(lejanos);
    const distr = [estimacion + 2 * escala, estimacion - 2 * escala, estimacion + 4 * escala].filter((x) => x > 0 && x <= LIMITE).slice(0, 2);
    return {
      enunciado: `${texto} ${rng.elegir(['Dice que el resultado es', 'Su respuesta fue', 'En el cuaderno anotó'])} ${num(propuesto)}. ¿Es razonable? Después, elige la mejor estimación.`,
      instruccion: '¿Tiene sentido?',
      datos: { ...datos, propuesto },
      respuesta: `${esRaz ? 'si' : 'no'}:${estimacion}`,
      distractores: distr,
      interaccion: { tipo: 'razonable', propuesto, esRazonable: esRaz, opciones: rng.barajar([estimacion, ...distr]) },
      pistas: [
        mult ? 'Redondea el número grande a la decena y multiplica de cabeza.' : 'Redondea cada número a la unidad de mil más cercana y suma.',
        { tipo: 'texto', texto: mult ? `${datos.a} es cerca de ${redondear(datos.a, 10)}; ${redondear(datos.a, 10)} × ${datos.b} = ${redondear(datos.a, 10) * datos.b}` : `${num(datos.a)} ≈ ${num(redondear(datos.a, 1000))} y ${num(datos.b)} ≈ ${num(redondear(datos.b, 1000))}` },
        `El resultado exacto está cerca de ${num(estimacion)}.`,
      ],
      explicacion: `El resultado exacto es ${num(real)}, cerca de ${num(estimacion)}. ${esRaz ? `Decir ${num(propuesto)} es razonable.` : `${num(propuesto)} está muy lejos: no es razonable.`}`,
    };
  },
};

/** Tablas de empaque: cuántos recipientes de k se llenaron cada día. */
type EscenaEmpaque = { u: string; obj: Objeto; recip: string; recipPl: string; enc: string; t: (q: string, k: number, dia: string) => string };
const escenasEmpaque: EscenaEmpaque[] = [
  { u: 'naranjas', obj: 'naranja', recip: 'canastilla', recipPl: 'canastillas', enc: 'Canastillas', t: (q, k, dia) => `${mayus(q)} empaca naranjas en canastillas de ${k}. La tabla muestra cuántas canastillas llenó cada día. ¿Cuántas naranjas empacó el ${dia}?` },
  { u: 'huevos', obj: 'huevo', recip: 'caja', recipPl: 'cajas', enc: 'Cajas', t: (q, k, dia) => `${mayus(q)} vende huevos en cajas de ${k}. En la tabla están las cajas que vendió cada día. ¿Cuántos huevos vendió el ${dia}?` },
  { u: 'aguacates', obj: 'aguacate', recip: 'bolsa', recipPl: 'bolsas', enc: 'Bolsas', t: (q, k, dia) => `Para el mercado, ${q} arma bolsas de ${k} aguacates. La tabla dice cuántas bolsas armó cada día. ¿Cuántos aguacates empacó el ${dia}?` },
  { u: 'arepas', obj: 'arepa', recip: 'paquete', recipPl: 'paquetes', enc: 'Paquetes', t: (q, k, dia) => `${mayus(q)} vende arepas en paquetes de ${k}. Mira en la tabla los paquetes que vendió cada día. ¿Cuántas arepas vendió el ${dia}?` },
  { u: 'plátanos', obj: 'platano', recip: 'mano', recipPl: 'manos', enc: 'Manos', t: (_q, k, dia) => `En la tienda de la vereda cada mano de plátano trae ${k} plátanos. La tabla muestra las manos que se vendieron cada día. ¿Cuántos plátanos se vendieron el ${dia}?` },
  { u: 'semillas', obj: 'semilla', recip: 'sobre', recipPl: 'sobres', enc: 'Sobres', t: (_q, k, dia) => `En la huerta escolar guardan semillas de maíz en sobres de ${k}. La tabla muestra cuántos sobres llenaron cada día. ¿Cuántas semillas guardaron el ${dia}?` },
  { u: 'panes', obj: 'pan', recip: 'bandeja', recipPl: 'bandejas', enc: 'Bandejas', t: (_q, k, dia) => `En la panadería del pueblo cada bandeja lleva ${k} panes. La tabla dice cuántas bandejas hornearon cada día. ¿Cuántos panes hornearon el ${dia}?` },
  { u: 'mazorcas', obj: 'mazorca', recip: 'canasto', recipPl: 'canastos', enc: 'Canastos', t: (q, k, dia) => `En la finca de ${q} llenan canastos con ${k} mazorcas de cacao. La tabla muestra los canastos de cada día. ¿Cuántas mazorcas cortaron el ${dia}?` },
];

/** Registros de la finca en tres semanas o meses (para sumar o comparar). */
type Registro = { u: string; g: Genero; obj?: Objeto; desc: (q: string) => string; verbo: string };
const registros: Registro[] = [
  { u: 'kilos', g: 'm', obj: 'bulto', desc: (q) => `los kilos de cacao que ${q} llevó a la cooperativa`, verbo: 'llevó' },
  { u: 'kilos', g: 'm', obj: 'bulto', desc: (q) => `los kilos de café que ${q} vendió en el pueblo`, verbo: 'vendió' },
  { u: 'huevos', g: 'm', obj: 'huevo', desc: (q) => `los huevos que ${q} recogió en el galpón`, verbo: 'recogió' },
  { u: 'litros', g: 'm', desc: (q) => `los litros de leche que ${q} entregó al carro lechero`, verbo: 'entregó' },
  { u: 'plántulas', g: 'f', obj: 'mata', desc: () => `las plántulas de cacao que entregó el vivero de la vereda`, verbo: 'entregó' },
  { u: 'naranjas', g: 'f', obj: 'naranja', desc: (q) => `las naranjas que ${q} vendió en el mercado del pueblo`, verbo: 'vendió' },
  { u: 'mazorcas', g: 'f', obj: 'mazorca', desc: (q) => `las mazorcas de cacao que cortó la familia de ${q}`, verbo: 'cortó' },
];
const periodos = [
  { enc: 'Semana', filas: ['Semana 1', 'Semana 2', 'Semana 3'], en: (s: string) => `en la ${s.toLowerCase()}`, todo: 'en las tres semanas' },
  { enc: 'Mes', filas: ['Enero', 'Febrero', 'Marzo'], en: (s: string) => `en ${s.toLowerCase()}`, todo: 'en los tres meses' },
  { enc: 'Mes', filas: ['Agosto', 'Septiembre', 'Octubre'], en: (s: string) => `en ${s.toLowerCase()}`, todo: 'en los tres meses' },
];
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const tablaDatos: Plantilla = {
  id: 'g3-tabla',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Leer una tabla de la cosecha y la cooperativa',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const modo = pt(ctx, 'modo', 'total');
    const cifras = pn(ctx, 'cifras', 4);
    const quien = adulto(rng);
    if (modo === 'mult') {
      const k = rng.entero(3, 9);
      const inicio = rng.entero(0, 3);
      const dias = DIAS.slice(inicio, inicio + 3);
      const cant = dias.map(() => rng.entero(2, 10));
      const i = rng.entero(0, 2);
      const respuesta = cant[i] * k;
      const calc: Calculo = { op: 'multiplicacion', a: cant[i], b: k };
      const t = opcionesTabla(ctx, respuesta, calc);
      const e = rng.elegir(escenasEmpaque);
      return {
        enunciado: e.t(quien.nombre, k, dias[i]),
        instruccion: 'Lee la tabla',
        ilustracion: e.obj,
        datos: { k, a: cant[0], b: cant[1], c: cant[2] },
        respuesta,
        unidad: e.u,
        distractores: t.distractores,
        interaccion: { tipo: 'tabla', encabezados: ['Día', e.enc], filas: dias.map((d, j) => [d, cant[j]]), opciones: t.opciones },
        calculo: calc,
        pistas: [`Busca el ${dias[i]} en la tabla. ¿Cuánto trae cada ${e.recip}?`, { tipo: 'arreglo', filas: cant[i], columnas: k, objeto: e.obj }, `${cant[i]} ${e.recipPl} de ${k}: ${cant[i]} × ${k}.`],
        explicacion: `${cant[i]} × ${k} = ${respuesta} ${e.u}.`,
      };
    }
    const reg = rng.elegir(registros);
    const per = rng.elegir(periodos);
    const tope = cifras >= 4 ? 3200 : 300;
    const piso = cifras >= 4 ? 1000 : 100;
    const valores = per.filas.map(() => rng.entero(piso, tope));
    const Cu = cuantosDe(reg.g);
    const apertura = rng.elegir([`La tabla muestra ${reg.desc(quien.nombre)}.`, `En esta tabla están ${reg.desc(quien.nombre)}.`, `Mira la tabla con ${reg.desc(quien.nombre)}.`]);
    const interaccionTabla = (opciones?: (number | string)[]) => ({ tipo: 'tabla' as const, encabezados: [per.enc, mayus(reg.u)], filas: per.filas.map((s, k) => [s, num(valores[k])]), opciones });
    if (modo === 'diferencia') {
      let [i, j] = rng.barajar([0, 1, 2]);
      if (valores[i] === valores[j]) valores[j] += 7;
      if (valores[i] < valores[j]) [i, j] = [j, i];
      const respuesta = valores[i] - valores[j];
      const calc: Calculo = { op: 'resta', a: valores[i], b: valores[j] };
      const t = opcionesTabla(ctx, respuesta, calc, [valores[i] + valores[j]]);
      return {
        enunciado: `${apertura} ¿${Cu} ${reg.u} más ${reg.verbo} ${per.en(per.filas[i])} que ${per.en(per.filas[j])}?`,
        instruccion: 'Lee la tabla',
        ilustracion: reg.obj,
        datos: { a: valores[0], b: valores[1], c: valores[2] },
        respuesta,
        unidad: reg.u,
        distractores: t.distractores,
        interaccion: interaccionTabla(t.opciones),
        calculo: calc,
        pistas: ['Busca las dos filas. Para saber cuántos más, ¿sumas o restas?', { tipo: 'texto', texto: `${num(valores[i])} − ${num(valores[j])}` }, `Resta: ${num(valores[i])} − ${num(valores[j])}.`],
        explicacion: `${num(valores[i])} − ${num(valores[j])} = ${num(respuesta)} ${reg.u}.`,
      };
    }
    const respuesta = valores[0] + valores[1] + valores[2];
    const calc: Calculo = { op: 'suma', a: valores[0] + valores[1], b: valores[2] };
    const t = opcionesTabla(ctx, respuesta, calc, [valores[0] + valores[1]]);
    return {
      enunciado: `${apertura} ¿${Cu} ${reg.u} ${reg.verbo} ${per.todo}?`,
      instruccion: 'Lee la tabla',
      ilustracion: reg.obj,
      datos: { a: valores[0], b: valores[1], c: valores[2] },
      respuesta,
      unidad: reg.u,
      distractores: t.distractores,
      interaccion: interaccionTabla(t.opciones),
      calculo: calc,
      pistas: ['Para el total, ¿juntas o quitas?', { tipo: 'texto', texto: `${num(valores[0])} + ${num(valores[1])} + ${num(valores[2])}` }, `Primero ${num(valores[0])} + ${num(valores[1])} = ${num(valores[0] + valores[1])}; luego suma ${num(valores[2])}.`],
      explicacion: `${num(valores[0])} + ${num(valores[1])} + ${num(valores[2])} = ${num(respuesta)} ${reg.u}.`,
    };
  },
};

const tienda: Plantilla = {
  id: 'g3-tienda',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Compras en la tienda de la vereda: total, precio por unidad y vueltas',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const op = pt(ctx, 'op', 'vuelto');
    const quien = persona(rng);
    const art = rng.elegir(articulosTienda);
    const nota = 'Imagina que en la tienda de la vereda';
    let enunciado: string;
    let respuesta: number;
    let calc: Calculo;
    let paso: string;
    let datos: Record<string, number>;
    if (op === 'mult' || op === 'div' || op === 'dosPasos') {
      const maxCant = Math.max(2, Math.min(9, Math.floor((op === 'dosPasos' ? 9500 : LIMITE) / art.precio)));
      const x = rng.entero(2, maxCant);
      const total = x * art.precio;
      datos = { precio: art.precio, x, total };
      if (op === 'mult') {
        respuesta = total;
        calc = { op: 'multiplicacion', a: art.precio, b: x };
        enunciado = rng.elegir([
          `${nota} ${articuloUn(art.genero)} ${art.nombre} cuesta ${pesos(art.precio)}. ${quien.nombre} compra ${x} ${plural(art.nombre)}. ¿Cuántos pesos paga?`,
          `${quien.nombre} necesita ${x} ${plural(art.nombre)} para la casa. En la tienda de la vereda ${articuloUn(art.genero)} ${art.nombre} vale ${pesos(art.precio)}. ¿Cuánto debe pagar?`,
          `En la tienda del pueblo ${articuloUn(art.genero)} ${art.nombre} cuesta ${pesos(art.precio)}. ¿Cuánto cuestan ${x} ${plural(art.nombre)}? Ayuda a ${quien.nombre} a sacar la cuenta.`,
        ]);
        paso = `${pesos(art.precio)} × ${x}.`;
      } else if (op === 'div') {
        respuesta = art.precio;
        calc = { op: 'division', a: total, b: x };
        enunciado = rng.elegir([
          `${nota}, ${quien.nombre} pagó ${pesos(total)} por ${x} ${plural(art.nombre)}, ${art.genero === 'f' ? 'todas' : 'todos'} al mismo precio. ¿Cuánto cuesta ${articuloUn(art.genero)} ${art.nombre}?`,
          `${quien.nombre} gastó ${pesos(total)} en ${x} ${plural(art.nombre)} iguales en la tienda del pueblo. ¿Cuál es el precio de ${articuloUn(art.genero)} ${art.nombre}?`,
          `Por ${x} ${plural(art.nombre)}, la tienda de la vereda le cobró ${pesos(total)} a ${quien.nombre}. ¿Cuánto vale cada ${art.nombre}?`,
        ]);
        paso = `${pesos(total)} ÷ ${x}: ¿qué número por ${x} da ${num(total)}?`;
      } else {
        respuesta = 10000 - total;
        calc = { op: 'resta', a: 10000, b: total };
        datos.pago = 10000;
        enunciado = rng.elegir([
          `${nota} ${articuloUn(art.genero)} ${art.nombre} cuesta ${pesos(art.precio)}. ${quien.nombre} compra ${x} ${plural(art.nombre)} y paga con un billete de ${pesos(10000)}. ¿Cuánto le devuelven?`,
          `${quien.nombre} lleva un billete de ${pesos(10000)} a la tienda y compra ${x} ${plural(art.nombre)} de ${pesos(art.precio)} ${art.genero === 'f' ? 'cada una' : 'cada uno'}. ¿Cuánta plata le sobra?`,
        ]);
        paso = `Primero el total: ${pesos(art.precio)} × ${x} = ${pesos(total)}. Luego ${pesos(10000)} − ${pesos(total)}.`;
      }
    } else {
      const otro = rng.elegir(articulosTienda.filter((a) => a.nombre !== art.nombre));
      const total = art.precio + otro.precio;
      const pago = total < 5000 ? rng.elegir([5000, 10000]) : 10000;
      respuesta = pago - total;
      calc = { op: 'resta', a: pago, b: total };
      datos = { p1: art.precio, p2: otro.precio, pago };
      enunciado = rng.elegir([
        `${nota} ${quien.nombre} compra ${articuloUn(art.genero)} ${art.nombre} de ${pesos(art.precio)} y ${articuloUn(otro.genero)} ${otro.nombre} de ${pesos(otro.precio)}. Paga con un billete de ${pesos(pago)}. ¿Cuánto le devuelven?`,
        `En la tienda de la vereda, ${quien.nombre} lleva ${articuloUn(art.genero)} ${art.nombre} (${pesos(art.precio)}) y ${articuloUn(otro.genero)} ${otro.nombre} (${pesos(otro.precio)}). Entrega un billete de ${pesos(pago)}. ¿Cuánto le dan de vueltas?`,
      ]);
      paso = `Primero suma: ${pesos(art.precio)} + ${pesos(otro.precio)} = ${pesos(total)}. Luego ${pesos(pago)} − ${pesos(total)}.`;
    }
    const modo = modoRespuesta(ctx, respuesta, calc, { paso: 500, extras: [calc.a + calc.b] });
    return {
      enunciado: `${enunciado} (Los precios son de ejemplo.)`,
      instruccion: 'Cuenta la plata',
      ilustracion: 'moneda',
      datos,
      respuesta,
      unidad: 'pesos',
      ...modo,
      calculo: calc,
      operacion: calc.op === 'multiplicacion' ? 'multiplicacion' : calc.op === 'division' ? 'division' : op === 'vuelto' ? 'mixta' : 'mixta',
      pistas: ['¿Qué sabes y qué te preguntan? Escribe primero lo que se paga.', { tipo: 'texto', texto: paso }, paso],
      explicacion: `${paso} Resultado: ${pesos(respuesta)}.`,
    };
  },
};

const produccion: Plantilla = {
  id: 'g3-produccion',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Producción de la finca: árboles, costales y lotes',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const op = pt(ctx, 'op', 'mult');
    const d = dif(ctx);
    const finca = rng.elegir(nombresFincas);
    let enunciado: string;
    let respuesta: number;
    let calc: Calculo;
    let visual: Visual;
    let datos: Record<string, number>;
    let dibujo: Objeto | undefined;
    const A = adulto(rng).nombre;
    if (op === 'div') {
      const k = rng.entero(2, 9);
      const q = rng.entero(3, lerp(10, 25, d));
      const n = k * q;
      respuesta = q;
      calc = { op: 'division', a: n, b: k };
      datos = { n, k };
      // fila: lo que se dibuja en cada fila del arreglo (los kilos y los litros no se dibujan uno por uno).
      let fila: Objeto | undefined;
      [enunciado, dibujo, fila] = rng.elegir<[string, Objeto | undefined, Objeto | undefined]>([
        [`En la finca ${finca} recogieron ${n} kilos de café y los empacan en ${k} costales con el mismo peso. ¿Cuántos kilos lleva cada costal?`, 'bulto', undefined],
        [`${k} jornaleros van a abonar ${n} árboles de cacao, la misma cantidad cada uno. ¿Cuántos árboles abona cada jornalero?`, 'arbol-cacao', 'arbol-cacao'],
        [`En el vivero de la finca ${finca} hay ${n} plántulas de café para sembrar en ${k} surcos iguales. ¿Cuántas plántulas van en cada surco?`, 'mata', 'mata'],
        [`${mayus(A)} cortó ${n} mazorcas de cacao y las reparte en ${k} canastos con la misma cantidad. ¿Cuántas mazorcas van en cada canasto?`, 'mazorca', 'mazorca'],
        [`En la cooperativa hay ${n} kilos de cacao seco para llenar ${k} bultos iguales. ¿Cuántos kilos van en cada bulto?`, 'bulto', undefined],
        [`La finca ${finca} manda ${n} naranjas a la cooperativa en ${k} cajas con la misma cantidad. ¿Cuántas naranjas van en cada caja?`, 'naranja', 'naranja'],
        [`En el ordeño salieron ${n} litros de leche y se reparten en ${k} cantinas iguales. ¿Cuántos litros van en cada cantina?`, undefined, undefined],
        [`${mayus(A)} cosechó ${n} aguacates y los acomoda en ${k} canastas iguales para la feria. ¿Cuántos aguacates van en cada canasta?`, 'aguacate', 'aguacate'],
        [`${k} recolectores cogieron entre todos ${n} kilos de café, la misma cantidad cada uno. ¿Cuántos kilos de café cogió cada recolector?`, 'bulto', undefined],
        [`${mayus(A)} reparte ${n} kilos de abono entre ${k} lotes por igual. ¿Cuántos kilos le echa a cada lote?`, 'bulto', undefined],
        [`La finca ${finca} entregó ${n} huevos a la tienda en ${k} cubetas con la misma cantidad. ¿Cuántos huevos van en cada cubeta?`, 'huevo', 'huevo'],
        [`En la finca ${finca} cortaron ${n} plátanos que vienen en ${k} racimos iguales. ¿Cuántos plátanos tiene cada racimo?`, 'platano', 'platano'],
        [`${k} jornaleros tienen que desyerbar ${n} surcos de café, la misma cantidad cada uno. ¿Cuántos surcos desyerba cada jornalero?`, 'arbol-cafe', undefined],
        [`En la finca ${finca} hay ${n} gallinas para pasar a ${k} galpones iguales. ¿Cuántas gallinas van en cada galpón?`, 'gallina', 'gallina'],
        [`La finca ${finca} vendió ${n} mandarinas a ${k} tiendas del pueblo, la misma cantidad a cada una. ¿Cuántas mandarinas recibió cada tienda?`, 'mandarina', 'mandarina'],
        [`El secador de la finca ${finca} secó ${n} kilos de cacao en ${k} días, la misma cantidad cada día. ¿Cuántos kilos secó por día?`, 'bulto', undefined],
        [`La finca ${finca} mandó ${n} limones a la cooperativa en ${k} bolsas iguales. ¿Cuántos limones van en cada bolsa?`, 'limon', 'limon'],
      ]);
      // Una fila por costal, jornalero, surco…
      visual = q <= 10 ? { tipo: 'arreglo', filas: k, columnas: q, objeto: fila } : { tipo: 'texto', texto: `${k} × ? = ${n}` };
    } else if (op === 'suma') {
      const [a, b] = parSuma(rng, pn(ctx, 'cifras', 3), reagrupaciones(ctx, 2), LIMITE);
      respuesta = a + b;
      calc = { op: 'suma', a, b };
      datos = { a, b };
      [enunciado, dibujo] = rng.elegir<[string, Objeto]>([
        [`En la finca ${finca} hay dos lotes de cacao. Del primero sacaron ${num(a)} mazorcas y del segundo ${num(b)}. ¿Cuántas mazorcas sacaron en total?`, 'mazorca'],
        [`En la finca ${finca} cogieron ${num(a)} kilos de café en la primera recolección y ${num(b)} en la segunda. ¿Cuántos kilos cogieron?`, 'bulto'],
        [`Los dos lotes de naranja de la finca ${finca} dieron ${num(a)} y ${num(b)} naranjas. ¿Cuántas naranjas dieron entre los dos?`, 'naranja'],
        [`El vivero de la finca ${finca} tiene ${num(a)} plántulas de cacao y ${num(b)} de café. ¿Cuántas plántulas tiene?`, 'mata'],
      ]);
      visual = { tipo: 'texto', texto: `${num(a)} + ${num(b)}` };
    } else {
      const f = rng.entero(2, 9);
      const c = d < 0.5 ? rng.entero(10, 40) : rng.entero(40, 120);
      respuesta = f * c;
      calc = { op: 'multiplicacion', a: c, b: f };
      datos = { f, c };
      [enunciado, dibujo] = rng.elegir<[string, Objeto | undefined]>([
        [`En la finca ${finca} hay ${f} árboles de aguacate. En esta cosecha cada uno dio ${c} aguacates. ¿Cuántos aguacates recogieron?`, 'arbol-aguacate'],
        [`Cada jornada de recolección, ${A} llena ${c} kilos de mazorcas. ¿Cuántos kilos llena en ${f} jornadas?`, 'mazorca'],
        [`La finca ${finca} tiene ${f} lotes de café con ${c} árboles cada uno. ¿Cuántos árboles de café tiene?`, 'arbol-cafe'],
        [`Cada vaca de la finca ${finca} da ${c} litros de leche a la semana. ¿Cuántos litros dan ${f} vacas?`, undefined],
        [`En la finca ${finca} hay ${f} galpones con ${c} gallinas cada uno. ¿Cuántas gallinas hay?`, 'gallina'],
        [`El beneficiadero de la finca ${finca} lava ${c} kilos de café cada día. ¿Cuántos kilos lava en ${f} días?`, 'bulto'],
        [`En la vega, ${A} sembró ${f} surcos de plátano con ${c} matas cada uno. ¿Cuántas matas de plátano sembró?`, 'platanera'],
        [`La finca ${finca} despachó ${f} cajas con ${c} naranjas cada una. ¿Cuántas naranjas despachó?`, 'naranja'],
        [`${mayus(A)} llenó ${f} canastos con ${c} mazorcas de cacao cada uno. ¿Cuántas mazorcas recogió?`, 'mazorca'],
      ]);
      visual = { tipo: 'texto', texto: `${c} + ${c} + … (${f} veces) = ${c} × ${f}` };
    }
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: [calc.a + calc.b] });
    const signo = calc.op === 'suma' ? '+' : calc.op === 'multiplicacion' ? '×' : '÷';
    return {
      enunciado: `${enunciado} (Los datos son del ejercicio.)`,
      instruccion: 'Calcula la producción',
      ilustracion: dibujo,
      datos,
      respuesta,
      ...modo,
      calculo: calc,
      operacion: calc.op === 'suma' ? 'suma' : calc.op === 'multiplicacion' ? 'multiplicacion' : 'division',
      pistas: ['¿Se juntan, se repiten o se reparten las cantidades?', visual, `${num(calc.a)} ${signo} ${num(calc.b)}.`],
      explicacion: `${num(calc.a)} ${signo} ${num(calc.b)} = ${num(respuesta)}.`,
    };
  },
};

const plantillasBase = [
  valorPosicional,
  rectaCentena,
  algoritmoSuma,
  algoritmoResta,
  problemaSumaResta,
  arregloSurcos,
  tablas,
  surcosProblema,
  gruposIguales,
  algoritmoMult,
  multProblema,
  reparto,
  agrupacion,
  relacionDivision,
  divisionCalculo,
  dosPasos,
  razonable,
  tablaDatos,
  tienda,
  produccion,
];

/** Contracciones: "de el profe" → "del profe", "a el abuelo" → "al abuelo". */
function contraer(texto: string): string {
  return texto.replace(/\b([Dd])e el\b/g, '$1el').replace(/\b([Aa]) el\b/g, '$1l');
}

// Se aplica en el mismo objeto para que los temas y generarParecido usen la misma versión (también en 2.º).
for (const p of plantillasBase) {
  const generar = p.generar;
  p.generar = (ctx) => {
    const ej = generar(ctx);
    const [p1, visual, p3] = ej.pistas;
    return { ...ej, enunciado: contraer(ej.enunciado), explicacion: contraer(ej.explicacion), pistas: [contraer(p1), visual, contraer(p3)] };
  };
}

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

export const g3: DefinicionPista = {
  pista: 'g3',
  limite: LIMITE,
  plantillas: [...plantillasBase, divisionResiduo, repartoResiduo, comprobarDivision, viajes, interpretarResiduo],
  temas: [
    {
      titulo: 'Repaso: tablas, sumas y restas',
      usos: [
        u(tablas),
        u(arregloSurcos),
        u(gruposIguales),
        u(algoritmoMult, { cifras: 2 }),
        u(multProblema, { cifras: 2 }),
        u(valorPosicional),
        u(rectaCentena),
        u(algoritmoSuma, { cifras: 4 }),
        u(algoritmoResta, { cifras: 4, ceros: true }),
      ],
    },
    {
      titulo: 'Repartir en partes iguales',
      usos: [u(reparto), u(produccion, { op: 'div' })],
    },
    {
      titulo: 'Agrupar: ¿cuántos grupos salen?',
      usos: [u(agrupacion), u(surcosProblema, { incognita: true })],
    },
    {
      titulo: 'Multiplicar y dividir son parientes',
      usos: [u(relacionDivision), u(surcosProblema, { incognita: true })],
    },
    {
      titulo: 'Dividir con la tabla',
      usos: [u(divisionCalculo), u(tienda, { op: 'div' }), u(produccion, { op: 'div' })],
    },
    {
      titulo: 'División con residuo',
      usos: [u(divisionResiduo), u(repartoResiduo)],
    },
    {
      titulo: 'Dividir 2 y 3 cifras entre 1 cifra',
      usos: [u(comprobarDivision), u(divisionResiduo), u(divisionCalculo)],
    },
    {
      titulo: '¿Qué hago con el residuo?',
      usos: [u(interpretarResiduo), u(viajes)],
    },
    {
      titulo: 'Problemas de dos pasos',
      usos: [u(dosPasos, { sobran: true }), u(problemaSumaResta, { cifras: 4, incognita: true, sobran: true }), u(razonable), u(tienda, { op: 'dosPasos' })],
    },
    {
      titulo: 'Problemas de la tienda y la cosecha',
      usos: [u(tablaDatos, { modo: 'total' }), u(tienda, { op: 'vuelto' }), u(tienda, { op: 'div' }), u(produccion, { op: 'mult' }), u(tablaDatos, { modo: 'diferencia' }), u(multProblema, { sobran: true })],
    },
  ],
};

/** Plantillas de 3.º que también usa 2.º (multiplicación). */
export const plantillasG3 = { tablas, arregloSurcos, gruposIguales, surcosProblema, algoritmoMult, multProblema, razonable, produccion, tienda, tablaDatos };
