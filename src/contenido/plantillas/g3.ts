// Plantillas de 3.º grado: suma y resta de 4 cifras (con ceros en el minuendo),
// tablas del 2 al 10 desde arreglos de surcos, multiplicación por 1 cifra,
// división exacta (reparto y agrupación), problemas de dos pasos y estimación.

import type { Calculo, ContextoGeneracion, DefinicionPista, EjercicioBase, Objeto, Plantilla, Uso, Visual } from '../../juego/tipos';
import { adulto, arbolDe, articulosTienda, dibujoKilosDe, dosPersonas, mayus, nombresFincas, num, persona, pesos } from '../contexto';
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
    const quien = persona(rng);
    const v = rng.elegir([
      { obj: 'arbol-cacao' as const, t: `${quien.nombre} sembró ${f} surcos de cacao con ${c} árboles en cada surco. Forma el arreglo tocando la cuadrícula. ¿Cuántos árboles sembró?`, u: 'árboles' },
      { obj: 'huevo' as const, t: `En el gallinero, ${quien.nombre} acomodó los huevos en ${f} filas de ${c}. Forma el arreglo. ¿Cuántos huevos hay?`, u: 'huevos' },
      { obj: 'mata' as const, t: `En la huerta escolar hay ${f} surcos con ${c} matas de yuca cada uno. Forma el arreglo. ¿Cuántas matas hay?`, u: 'matas' },
    ]);
    return {
      enunciado: v.t,
      instruccion: 'Forma filas y columnas',
      ilustracion: v.obj,
      datos: { f, c },
      respuesta,
      unidad: v.u,
      distractores: distractores(rng, respuesta, [f * (c + 1), f * (c - 1), f + c], 3, dif(ctx)),
      interaccion: { tipo: 'arreglo', filas: f, columnas: c, objeto: v.obj },
      calculo: { op: 'multiplicacion', a: f, b: c },
      pistas: [
        `¿Cuántas filas hay y cuántos hay en cada fila?`,
        { tipo: 'arreglo', filas: f, columnas: c, objeto: v.obj },
        `Son ${f} veces ${c}: ${f} × ${c}.`,
      ],
      explicacion: `${f} × ${c} = ${respuesta}.`,
    };
  },
};

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
    const [v, dibujo] = rng.elegir<[string, Objeto]>([
      [`En la tienda de la vereda las arepas vienen en paquetes de ${a}. ¿Cuántas arepas hay en ${b} paquetes?`, 'arepa'],
      [`Cada gallina del patio de ${adulto(rng).nombre} puso ${a} huevos esta semana. Hay ${b} gallinas. ¿Cuántos huevos pusieron?`, 'huevo'],
      [`La mula lleva ${a} bultos en cada viaje. ¿Cuántos bultos lleva en ${b} viajes?`, 'bulto'],
    ]);
    const calc: Calculo = { op: 'multiplicacion', a, b };
    const modo = modoRespuesta(ctx, respuesta, calc, { abiertaMin: 0.3, abiertaMax: 0.9 });
    return {
      enunciado: `${v} (${a} × ${b})`,
      instruccion: 'Multiplica',
      ilustracion: dibujo,
      datos: { a, b },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: [
        `¿Cuántos grupos hay y cuántos hay en cada grupo?`,
        // Una fila por paquete, gallina o viaje, con lo que trae cada uno.
        { tipo: 'arreglo', filas: b, columnas: a, objeto: dibujo },
        `Suma ${a} cada vez, ${b} veces: ${Array.from({ length: Math.min(b, 4) }, (_, i) => a * (i + 1)).join(', ')}…`,
      ],
      explicacion: `${a} × ${b} = ${respuesta}.`,
    };
  },
};

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
    const quien = persona(rng);
    const cultivo = rng.elegir(['cacao', 'café', 'aguacate', 'plátano']);
    const sobra = datoQueSobra(ctx);
    const extra = sobra?.texto ?? '';
    const factor = pb(ctx, 'incognita') && dif(ctx) > 0.5 && rng.azar(0.5);
    const calc: Calculo = factor ? { op: 'division', a: total, b: f } : { op: 'multiplicacion', a: f, b: c };
    const respuesta = factor ? c : total;
    const enunciado = factor
      ? `${quien.nombre} sembró ${total} árboles de ${cultivo} en ${f} surcos, con la misma cantidad en cada surco.${extra} ¿Cuántos árboles hay en cada surco?`
      : rng.elegir([
          `${quien.nombre} sembró ${f} surcos de ${cultivo} con ${c} árboles en cada surco.${extra} ¿Cuántos árboles sembró?`,
          `En la finca hay ${f} hileras de ${cultivo}. Cada hilera tiene ${c} árboles.${extra} ¿Cuántos árboles hay en total?`,
        ]);
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: factor ? [total - f, f] : [f + c] });
    return {
      enunciado,
      instruccion: 'Piensa en el arreglo',
      ilustracion: arbolDe(cultivo),
      datos: { f, c, total, ...(sobra ? { sobra: sobra.valor } : {}) },
      respuesta,
      unidad: 'árboles',
      ...modo,
      calculo: calc,
      operacion: factor ? 'division' : 'multiplicacion',
      pistas: [
        sobra ? 'Un dato sobra. ¿Cuáles necesitas?' : factor ? '¿Qué número multiplicado por los surcos da el total?' : '¿Cuántos surcos y cuántos árboles en cada uno?',
        { tipo: 'arreglo', filas: f, columnas: c, objeto: arbolDe(cultivo) },
        factor ? `${f} × ? = ${total}. Busca en la tabla del ${f}.` : `${f} × ${c}.`,
      ],
      explicacion: factor ? `${total} ÷ ${f} = ${c}, porque ${f} × ${c} = ${total}.` : `${f} × ${c} = ${total} árboles.`,
    };
  },
};

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
    const quien = adulto(rng);
    const v = rng.elegir([
      { t: `${mayus(quien.nombre)} llenó ${k} canastillas con ${n} mandarinas cada una. ¿Cuántas mandarinas empacó?`, obj: 'mandarina' as const, u: 'mandarinas', grupo: { nombre: 'Canastilla', dibujo: 'canasta' as const } },
      { t: `Para el refrigerio escolar llegaron ${k} bolsas con ${n} panes cada una. ¿Cuántos panes llegaron?`, obj: 'pan' as const, u: 'panes', grupo: { nombre: 'Bolsa', dibujo: 'bolsa' as const } },
      { t: `En la feria del pueblo, ${quien.nombre} armó ${k} racimos con ${n} plátanos cada uno. ¿Cuántos plátanos usó?`, obj: 'platano' as const, u: 'plátanos', grupo: undefined },
    ]);
    const calc: Calculo = { op: 'multiplicacion', a: k, b: n };
    const modo = modoRespuesta(ctx, respuesta, calc);
    return {
      enunciado: v.t,
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
    const contexto = rng.elegir([
      `Cada árbol de naranja dio ${num(a)} naranjas y ${adulto(rng).nombre} tiene ${b} árboles.`,
      `Cada día ${persona(rng).nombre} camina ${num(a)} metros hasta la escuela de la vereda. Lo hace ${b} días.`,
      `La cooperativa empaca ${num(a)} kilos de cacao por día durante ${b} días.`,
    ]);
    return {
      enunciado: `${contexto} Resuelve cifra por cifra: ${num(a)} × ${b}.`,
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
    const v = rng.elegir([
      () => {
        const a = grande ? rng.entero(100, 199) : rng.entero(60, 99);
        return { a, t: `La mula de don Ramiro carga ${a} kilos de cacao en cada viaje. Hizo ${b} viajes hasta la carretera.${extra} ¿Cuántos kilos llevó?`, u: 'kilos', dibujo: 'bulto' as Objeto };
      },
      () => {
        const a = !grande ? rng.entero(20, 60) : rng.entero(100, 250);
        return { a, t: `Cada árbol de mandarina de la finca ${rng.elegir(nombresFincas)} dio ${a} mandarinas. Hay ${b} árboles.${extra} ¿Cuántas mandarinas dieron?`, u: 'mandarinas', dibujo: 'mandarina' as Objeto };
      },
      () => {
        const a = !grande ? rng.entero(12, 48) : rng.entero(120, 360);
        return { a, t: `Una cubeta grande trae ${a} huevos. En la tienda de la vereda compraron ${b} cubetas.${extra} ¿Cuántos huevos compraron?`, u: 'huevos', dibujo: 'huevo' as Objeto };
      },
    ])();
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
    const quien = adulto(rng);
    const v = rng.elegir([
      { t: `${mayus(quien.nombre)} reparte ${n} arepas en partes iguales entre ${k} mesas del refrigerio escolar. ¿Cuántas arepas van en cada mesa?`, obj: 'arepa' as const, u: 'arepas', grupo: { nombre: 'Mesa', dibujo: 'mesa' as const } },
      { t: `El profe Julián reparte ${n} semillas de maíz entre ${k} grupos de la huerta escolar, la misma cantidad para cada grupo. ¿Cuántas semillas recibe cada grupo?`, obj: 'semilla' as const, u: 'semillas', grupo: { nombre: 'Grupo', dibujo: 'nino' as const } },
      { t: `${mayus(quien.nombre)} reparte ${n} naranjas en ${k} canastas iguales para llevar al mercado. ¿Cuántas naranjas van en cada canasta?`, obj: 'naranja' as const, u: 'naranjas', grupo: { nombre: 'Canasta', dibujo: 'canasta' as const } },
    ]);
    const calc: Calculo = { op: 'division', a: n, b: k };
    const arrastrar = n <= 18 && rng.azar(0.4);
    const modo = modoRespuesta(ctx, q, calc, { extras: [n - k, k] });
    return {
      enunciado: arrastrar ? `${v.t} Arrastra para repartir.` : v.t,
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
    const v = rng.elegir([
      // obj: lo que se cuenta en cada fila del arreglo (los kilos no se dibujan uno por uno).
      { t: `La abuela Carmen empaca ${n} aguacates en bolsas de ${k}. ¿Cuántas bolsas llena?`, u: 'bolsas', obj: 'aguacate' as Objeto | undefined, dibujo: 'aguacate' as Objeto },
      { t: `${mayus(adulto(rng).nombre)} acomoda ${n} huevos en cubetas de ${k}. ¿Cuántas cubetas llena?`, u: 'cubetas', obj: 'huevo' as Objeto | undefined, dibujo: 'cubeta' as Objeto },
      { t: `En la cooperativa empacan ${n} kilos de cacao en bolsas de ${k} kilos. ¿Cuántas bolsas llenan?`, u: 'bolsas', obj: undefined, dibujo: 'bolsa' as Objeto },
    ]);
    const calc: Calculo = { op: 'division', a: n, b: k };
    const modo = modoRespuesta(ctx, q, calc, { extras: [n - k, k] });
    return {
      enunciado: v.t,
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
    const quien = persona(rng);
    if (rng.azar(0.5)) {
      const distr = distractores(rng, a, [b === a ? a + 1 : b, p - b, a + 1], 3, dif(ctx));
      return {
        enunciado: `${quien.nombre} sabe que ${a} surcos de ${b} árboles son ${p} árboles (${a} × ${b} = ${p}). Si reparte ${p} árboles en surcos de ${b}, ¿cuántos surcos forma? (${p} ÷ ${b})`,
        instruccion: 'Usa la multiplicación',
        ilustracion: 'arbol',
        datos: { a, b, p },
        respuesta: a,
        distractores: distr,
        interaccion: { tipo: 'opciones', opciones: mezclarOpciones(rng, a, distr) },
        calculo: { op: 'division', a: p, b },
        pistas: ['La división deshace la multiplicación.', { tipo: 'arreglo', filas: a, columnas: b, objeto: 'arbol' }, `${a} × ${b} = ${p}, entonces ${p} ÷ ${b} = ${a}.`],
        explicacion: `Como ${a} × ${b} = ${p}, entonces ${p} ÷ ${b} = ${a}.`,
      };
    }
    const correcta = `${b} × ${a} = ${p}`;
    const otras = [`${b} + ${a} = ${b + a}`, `${p} − ${b} = ${p - b}`, `${b} × ${a + 1} = ${b * (a + 1)}`];
    const opciones = rng.barajar([correcta, ...otras]);
    return {
      enunciado: `${quien.nombre} quiere repartir ${p} mandarinas en ${b} canastas iguales (${p} ÷ ${b}). ¿Qué multiplicación le ayuda a resolverlo?`,
      instruccion: 'Elige la multiplicación',
      ilustracion: 'mandarina',
      datos: { a, b, p },
      respuesta: correcta,
      distractores: otras,
      interaccion: { tipo: 'opciones', opciones },
      pistas: [`Busca un número que, multiplicado por ${b}, dé ${p}.`, { tipo: 'arreglo', filas: b, columnas: a, objeto: 'mandarina' }, `${b} × ${a} = ${p}, así que cada canasta lleva ${a}.`],
      explicacion: `${p} ÷ ${b} = ${a} porque ${b} × ${a} = ${p}.`,
    };
  },
};

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
    return {
      enunciado: `${mayus(adulto(rng).nombre)} tiene ${n} kilos de café para empacar en ${k} costales con el mismo peso. Resuelve: ${n} ÷ ${k} = ?`,
      instruccion: 'Divide',
      ilustracion: 'bulto',
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
      enunciado = `${x.nombre} y su familia cortaron ${a} mazorcas de cacao el lunes y ${b} el martes. Guardaron ${c} para semilla y el resto lo llevaron al cajón de fermentación.${extra} ¿Cuántas mazorcas llevaron al cajón?`;
      paso1 = `Primero junta lo de los dos días: ${a} + ${b} = ${a + b}.`;
    } else if (tipo === 'mult-resta') {
      const f = rng.entero(3, 9);
      const c = rng.entero(6, lerp(12, 40, d));
      const v = rng.entero(5, f * c - 1);
      respuesta = f * c - v;
      calc = { op: 'resta', a: f * c, b: v };
      enunciado = `${mayus(adulto(rng).nombre)} llevó ${f} canastas con ${c} naranjas cada una al mercado del pueblo y vendió ${v} naranjas.${extra} ¿Cuántas naranjas le quedaron?`;
      paso1 = `Primero calcula cuántas naranjas llevó: ${f} × ${c} = ${f * c}.`;
    } else {
      const f = rng.entero(3, 9);
      const c = rng.entero(6, lerp(12, 40, d));
      const e = rng.entero(5, lerp(30, 200, d));
      respuesta = f * c + e;
      calc = { op: 'suma', a: f * c, b: e };
      enunciado = `En la finca de ${adulto(rng).nombre} hay ${f} surcos con ${c} árboles de café cada uno, y ${e} árboles sueltos cerca de la casa.${extra} ¿Cuántos árboles de café hay en total?`;
      paso1 = `Primero calcula los árboles de los surcos: ${f} × ${c} = ${f * c}.`;
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
      texto = `${quien.nombre} calculó cuántos kilos de cacao carga la mula en ${b} viajes de ${a} kilos.`;
    } else {
      const a = rng.entero(1100, 4800);
      const b = rng.entero(1100, 4800);
      real = a + b;
      datos = { a, b };
      texto = `${quien.nombre} sumó los kilos de café de dos semanas: ${num(a)} y ${num(b)}.`;
    }
    const escala = mult ? 100 : 1000;
    const estimacion = redondear(real, escala);
    const lejanos = [real * 10, real + 3 * escala, real - 3 * escala, Math.round(real / 10)].filter((x) => Math.abs(x - real) >= real * 0.3 && x > 0 && x <= LIMITE);
    const esRaz = rng.azar(0.5) || !lejanos.length;
    const propuesto = esRaz ? real : rng.elegir(lejanos);
    const distr = [estimacion + 2 * escala, estimacion - 2 * escala, estimacion + 4 * escala].filter((x) => x > 0 && x <= LIMITE).slice(0, 2);
    return {
      enunciado: `${texto} Dice que el resultado es ${num(propuesto)}. ¿Es razonable? Después, elige la mejor estimación.`,
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
      const dias = ['lunes', 'martes', 'miércoles'];
      const cant = dias.map(() => rng.entero(2, 10));
      const i = rng.entero(0, 2);
      const respuesta = cant[i] * k;
      const calc: Calculo = { op: 'multiplicacion', a: cant[i], b: k };
      const t = opcionesTabla(ctx, respuesta, calc);
      return {
        enunciado: `${mayus(quien.nombre)} empaca naranjas en canastillas de ${k}. La tabla muestra cuántas canastillas llenó cada día. ¿Cuántas naranjas empacó el ${dias[i]}?`,
        instruccion: 'Lee la tabla',
        ilustracion: 'naranja',
        datos: { k, a: cant[0], b: cant[1], c: cant[2] },
        respuesta,
        unidad: 'naranjas',
        distractores: t.distractores,
        interaccion: { tipo: 'tabla', encabezados: ['Día', 'Canastillas'], filas: dias.map((d, j) => [d, cant[j]]), opciones: t.opciones },
        calculo: calc,
        pistas: [`Busca el ${dias[i]} en la tabla. ¿Cuántas naranjas hay en cada canastilla?`, { tipo: 'arreglo', filas: cant[i], columnas: k, objeto: 'naranja' }, `${cant[i]} canastillas de ${k}: ${cant[i]} × ${k}.`],
        explicacion: `${cant[i]} × ${k} = ${respuesta} naranjas.`,
      };
    }
    const semanas = ['Semana 1', 'Semana 2', 'Semana 3'];
    const tope = cifras >= 4 ? 3200 : 300;
    const piso = cifras >= 4 ? 1000 : 100;
    const valores = semanas.map(() => rng.entero(piso, tope));
    if (modo === 'diferencia') {
      let [i, j] = rng.barajar([0, 1, 2]);
      if (valores[i] === valores[j]) valores[j] += 7;
      if (valores[i] < valores[j]) [i, j] = [j, i];
      const respuesta = valores[i] - valores[j];
      const calc: Calculo = { op: 'resta', a: valores[i], b: valores[j] };
      const t = opcionesTabla(ctx, respuesta, calc, [valores[i] + valores[j]]);
      return {
        enunciado: `La tabla muestra los kilos de cacao que ${quien.nombre} llevó a la cooperativa. ¿Cuántos kilos más llevó en la ${semanas[i].toLowerCase()} que en la ${semanas[j].toLowerCase()}?`,
        instruccion: 'Lee la tabla',
        ilustracion: 'bulto',
        datos: { a: valores[0], b: valores[1], c: valores[2] },
        respuesta,
        unidad: 'kilos',
        distractores: t.distractores,
        interaccion: { tipo: 'tabla', encabezados: ['Semana', 'Kilos'], filas: semanas.map((s, k) => [s, num(valores[k])]), opciones: t.opciones },
        calculo: calc,
        pistas: ['Busca las dos semanas. Para saber cuántos más, ¿sumas o restas?', { tipo: 'texto', texto: `${num(valores[i])} − ${num(valores[j])}` }, `Resta: ${num(valores[i])} − ${num(valores[j])}.`],
        explicacion: `${num(valores[i])} − ${num(valores[j])} = ${num(respuesta)} kilos.`,
      };
    }
    const respuesta = valores[0] + valores[1] + valores[2];
    const calc: Calculo = { op: 'suma', a: valores[0] + valores[1], b: valores[2] };
    const t = opcionesTabla(ctx, respuesta, calc, [valores[0] + valores[1]]);
    return {
      enunciado: `La tabla muestra los kilos de cacao que ${quien.nombre} llevó a la cooperativa en tres semanas. ¿Cuántos kilos llevó en total?`,
      instruccion: 'Lee la tabla',
      ilustracion: 'bulto',
      datos: { a: valores[0], b: valores[1], c: valores[2] },
      respuesta,
      unidad: 'kilos',
      distractores: t.distractores,
      interaccion: { tipo: 'tabla', encabezados: ['Semana', 'Kilos'], filas: semanas.map((s, k) => [s, num(valores[k])]), opciones: t.opciones },
      calculo: calc,
      pistas: ['Para el total, ¿juntas o quitas?', { tipo: 'texto', texto: `${num(valores[0])} + ${num(valores[1])} + ${num(valores[2])}` }, `Primero ${num(valores[0])} + ${num(valores[1])} = ${num(valores[0] + valores[1])}; luego suma ${num(valores[2])}.`],
      explicacion: `${num(valores[0])} + ${num(valores[1])} + ${num(valores[2])} = ${num(respuesta)} kilos.`,
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
        enunciado = `${nota} ${articuloUn(art.genero)} ${art.nombre} cuesta ${pesos(art.precio)}. ${quien.nombre} compra ${x} ${plural(art.nombre)}. ¿Cuántos pesos paga?`;
        paso = `${pesos(art.precio)} × ${x}.`;
      } else if (op === 'div') {
        respuesta = art.precio;
        calc = { op: 'division', a: total, b: x };
        enunciado = `${nota}, ${quien.nombre} pagó ${pesos(total)} por ${x} ${plural(art.nombre)}, ${art.genero === 'f' ? 'todas' : 'todos'} al mismo precio. ¿Cuánto cuesta ${articuloUn(art.genero)} ${art.nombre}?`;
        paso = `${pesos(total)} ÷ ${x}: ¿qué número por ${x} da ${num(total)}?`;
      } else {
        respuesta = 10000 - total;
        calc = { op: 'resta', a: 10000, b: total };
        datos.pago = 10000;
        enunciado = `${nota} ${articuloUn(art.genero)} ${art.nombre} cuesta ${pesos(art.precio)}. ${quien.nombre} compra ${x} ${plural(art.nombre)} y paga con un billete de ${pesos(10000)}. ¿Cuánto le devuelven?`;
        paso = `Primero el total: ${pesos(art.precio)} × ${x} = ${pesos(total)}. Luego ${pesos(10000)} − ${pesos(total)}.`;
      }
    } else {
      const otro = rng.elegir(articulosTienda.filter((a) => a.nombre !== art.nombre));
      const total = art.precio + otro.precio;
      const pago = total < 5000 ? rng.elegir([5000, 10000]) : 10000;
      respuesta = pago - total;
      calc = { op: 'resta', a: pago, b: total };
      datos = { p1: art.precio, p2: otro.precio, pago };
      enunciado = `${nota} ${quien.nombre} compra ${articuloUn(art.genero)} ${art.nombre} de ${pesos(art.precio)} y ${articuloUn(otro.genero)} ${otro.nombre} de ${pesos(otro.precio)}. Paga con un billete de ${pesos(pago)}. ¿Cuánto le devuelven?`;
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
    let dibujo: Objeto;
    if (op === 'div') {
      const k = rng.entero(2, 9);
      const q = rng.entero(3, lerp(10, 25, d));
      const n = k * q;
      respuesta = q;
      calc = { op: 'division', a: n, b: k };
      datos = { n, k };
      [enunciado, dibujo] = rng.elegir<[string, Objeto]>([
        [`En la finca ${finca} recogieron ${n} kilos de café y los empacan en ${k} costales con el mismo peso. ¿Cuántos kilos lleva cada costal?`, 'bulto'],
        [`${k} jornaleros van a abonar ${n} árboles de cacao, la misma cantidad cada uno. ¿Cuántos árboles abona cada jornalero?`, 'arbol-cacao'],
      ]);
      // Una fila por costal o por jornalero; los árboles se dibujan, los kilos no.
      visual = q <= 10 ? { tipo: 'arreglo', filas: k, columnas: q, objeto: dibujo === 'bulto' ? undefined : dibujo } : { tipo: 'texto', texto: `${k} × ? = ${n}` };
    } else if (op === 'suma') {
      const [a, b] = parSuma(rng, pn(ctx, 'cifras', 3), reagrupaciones(ctx, 2), LIMITE);
      respuesta = a + b;
      calc = { op: 'suma', a, b };
      datos = { a, b };
      enunciado = `En la finca ${finca} hay dos lotes de cacao. Del primero sacaron ${num(a)} mazorcas y del segundo ${num(b)}. ¿Cuántas mazorcas sacaron en total?`;
      dibujo = 'mazorca';
      visual = { tipo: 'texto', texto: `${num(a)} + ${num(b)}` };
    } else {
      const f = rng.entero(2, 9);
      const c = d < 0.5 ? rng.entero(10, 40) : rng.entero(40, 120);
      respuesta = f * c;
      calc = { op: 'multiplicacion', a: c, b: f };
      datos = { f, c };
      [enunciado, dibujo] = rng.elegir<[string, Objeto]>([
        [`En la finca ${finca} hay ${f} árboles de aguacate. En esta cosecha cada uno dio ${c} aguacates. ¿Cuántos aguacates recogieron?`, 'arbol-aguacate'],
        [`Cada jornada de recolección, ${adulto(rng).nombre} llena ${c} kilos de mazorcas. ¿Cuántos kilos llena en ${f} jornadas?`, 'mazorca'],
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
