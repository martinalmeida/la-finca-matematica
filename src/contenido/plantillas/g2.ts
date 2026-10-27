// Plantillas de 2.º grado: valor posicional hasta 999, suma y resta con y sin
// reagrupación, problemas de cambio, combinación y comparación, dinero,
// grupos iguales (×2, ×5, ×10) y reparto equitativo.

import type { ContextoGeneracion, DefinicionPista, EjercicioBase, Plantilla, Uso, Visual } from '../../juego/tipos';
import { adulto, cuantos, frutas, mayus, nombreCant, nombresFincas, persona, pesos, productos, type Genero, type Persona } from '../contexto';
import { plantillasG3 } from './g3';
import { distractores, dif, lerp, mezclarOpciones, modoRespuesta, parResta, parSuma, pb, pn, pt } from './util';

// --- Ayudantes locales ---

/** "de doña Rosa", "del profe Julián". */
function de(p: Persona): string {
  return p.nombre.startsWith('el ') ? 'del ' + p.nombre.slice(3) : 'de ' + p.nombre;
}

/** Une una lista: "a, b y c". */
function unir(partes: string[]): string {
  if (partes.length <= 1) return partes.join('');
  return partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1];
}

/** Reagrupaciones según d: 0, luego 1, luego 2. */
function reagrupaciones(ctx: ContextoGeneracion, max: number): number {
  const d = dif(ctx);
  const n = d < 0.34 ? 0 : d < 0.67 ? 1 : 2;
  return Math.min(n, max < 100 ? 1 : 2);
}

/** Par para sumar (resultado < max, máximo 999). */
function parSumaG2(ctx: ContextoGeneracion, max: number): [number, number] {
  const tope = Math.min(max, 999);
  const ll = reagrupaciones(ctx, tope);
  const cifras = tope < 100 ? 2 : ll === 2 || dif(ctx) >= 0.5 ? 3 : 2;
  return parSuma(ctx.rng, cifras, ll, tope + 1);
}

/** Par para restar a − b > 0 (a ≤ max). */
function parRestaG2(ctx: ContextoGeneracion, max: number): [number, number] {
  const pr = reagrupaciones(ctx, max);
  const cifras = max < 100 ? 2 : pr === 2 || dif(ctx) >= 0.5 ? 3 : 2;
  return parResta(ctx.rng, cifras, pr);
}

function factores(ctx: ContextoGeneracion): number[] {
  return pt(ctx, 'factores', '2,5,10').split(',').map(Number);
}

function cifrasDe(n: number): [number, number, number] {
  return [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
}

/** Guía por columnas para el algoritmo (pista visual de texto). */
function guiaSuma(a: number, b: number): string {
  const [, , ua] = cifrasDe(a);
  const [, , ub] = cifrasDe(b);
  const s = ua + ub;
  return `Unidades: ${ua} + ${ub} = ${s}${s >= 10 ? `. Escribe ${s % 10} y llevas 1 a las decenas.` : '. No llevas nada.'}`;
}

function guiaResta(a: number, b: number): string {
  const ua = a % 10;
  const ub = b % 10;
  return ua >= ub
    ? `Unidades: ${ua} − ${ub} = ${ua - ub}. Sí alcanza, no hay que pedir prestado.`
    : `Unidades: ${ua} no alcanza para quitar ${ub}. Pide prestada una decena: ${ua + 10} − ${ub} = ${ua + 10 - ub}.`;
}

const articulo = (g: Genero) => (g === 'f' ? 'una' : 'un');

/** Artículos baratos de la tienda (precios ilustrativos, múltiplos de 100). */
const cosasTienda = [
  { nombre: 'pan', precio: 300, genero: 'm' as Genero },
  { nombre: 'banano', precio: 200, genero: 'm' as Genero },
  { nombre: 'mandarina', precio: 200, genero: 'f' as Genero },
  { nombre: 'borrador', precio: 300, genero: 'm' as Genero },
  { nombre: 'lápiz', precio: 500, genero: 'm' as Genero },
  { nombre: 'huevo', precio: 400, genero: 'm' as Genero },
  { nombre: 'limón', precio: 100, genero: 'm' as Genero },
  { nombre: 'arepa pequeña', precio: 500, genero: 'f' as Genero },
];

function compraAleatoria(ctx: ContextoGeneracion, maxTotal: number, maxCosas: number) {
  const { rng } = ctx;
  for (let i = 0; i < 100; i++) {
    const cantidad = rng.entero(2, maxCosas);
    const cosas = rng.barajar(cosasTienda).slice(0, cantidad);
    const total = cosas.reduce((s, c) => s + c.precio, 0);
    if (total <= maxTotal) return { cosas, total };
  }
  const cosas = [cosasTienda[1], cosasTienda[6]];
  return { cosas, total: 300 };
}

/** Productos para problemas con números grandes (sin huevos, para que las cantidades sean creíbles). */
const productosGrandes = productos.filter((p) => p.objeto !== 'huevo');

const listaCompra = (cosas: typeof cosasTienda) => unir(cosas.map((c) => `${articulo(c.genero)} ${c.nombre} de ${pesos(c.precio)}`));

// --- Plantillas ---

const bloques: Plantilla = {
  id: 'g2-bloques',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Valor posicional con canastas de 100, cajas de 10 y unidades',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 999);
    const n = rng.entero(Math.max(11, lerp(11, Math.floor(max / 2), dif(ctx))), max);
    const [c, de10, un] = cifrasDe(n);
    const quien = adulto(rng);
    if (rng.azar(0.5)) {
      return {
        enunciado: `${mayus(quien.nombre)} va a llevar ${n} limones a la cooperativa. Arma el número con canastas de 100, cajas de 10 y limones sueltos.`,
        instruccion: 'Arma el número',
        ilustracion: 'limon',
        datos: { n, centenas: c, decenas: de10, unidades: un },
        respuesta: n,
        distractores: [],
        interaccion: { tipo: 'bloques', modo: 'construir', valor: n },
        pistas: [
          `¿Cuántas canastas de 100 caben en ${n}? ¿Y cuántas cajas de 10 sobran?`,
          { tipo: 'bloques', valor: n },
          `${n} = ${c} de 100, ${de10} de 10 y ${un} sueltos.`,
        ],
        explicacion: `${n} tiene ${c} centenas, ${de10} decenas y ${un} unidades.`,
      };
    }
    const partes = [
      c ? `${c} ${c === 1 ? 'canasta' : 'canastas'} de 100` : '',
      de10 ? `${de10} ${de10 === 1 ? 'caja' : 'cajas'} de 10` : '',
      un ? `${un} ${un === 1 ? 'limón suelto' : 'limones sueltos'}` : '',
    ].filter(Boolean);
    const calc = { op: 'suma' as const, a: c * 100 + de10 * 10, b: un };
    const extras = [Number(`${un}${de10}${c}`), c + de10 + un, n + 10, n - 10, n + 100, n - 100].filter((x) => x <= 999);
    const modo = modoRespuesta(ctx, n, calc, { extras });
    return {
      enunciado: `${mayus(quien.nombre)} empacó limones para el mercado del pueblo: ${unir(partes)}. ¿Cuántos limones hay en total?`,
      instruccion: 'Cuenta de 100 en 100 y de 10 en 10',
      ilustracion: 'limon',
      datos: { centenas: c, decenas: de10, unidades: un },
      respuesta: n,
      unidad: 'limones',
      ...modo,
      calculo: calc,
      pistas: ['Cuenta primero las canastas de 100, después las cajas de 10 y al final los sueltos.', { tipo: 'bloques', valor: n }, `${c * 100} + ${de10 * 10} + ${un}.`],
      explicacion: `${c * 100} + ${de10 * 10} + ${un} = ${n}.`,
    };
  },
};

const cifraValor: Plantilla = {
  id: 'g2-cifra',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Valor de una cifra según su posición',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    let n = 0;
    let pos = 0;
    for (let i = 0; i < 100; i++) {
      n = rng.entero(lerp(100, 400, dif(ctx)), 999);
      const cs = n.toString().split('');
      const validas = [0, 1, 2].filter((p) => {
        const ch = cs[2 - p];
        return ch !== '0' && cs.filter((x) => x === ch).length === 1;
      });
      if (validas.length) {
        pos = rng.elegir(validas);
        break;
      }
    }
    const cifra = Math.floor(n / 10 ** pos) % 10;
    const respuesta = cifra * 10 ** pos;
    const opciones = rng.barajar([cifra, cifra * 10, cifra * 100]);
    const lugar = ['unidades', 'decenas', 'centenas'][pos];
    const quien = adulto(rng);
    return {
      enunciado: `El carro de la cooperativa recogió ${n} kilos de cacao en la finca ${de(quien)}. En el número ${n}, ¿cuánto vale el ${cifra}?`,
      instruccion: 'Valor de la cifra',
      ilustracion: 'bulto',
      datos: { n, cifra },
      respuesta,
      distractores: opciones.filter((o) => o !== respuesta),
      interaccion: { tipo: 'opciones', opciones },
      pistas: [`¿En qué lugar está el ${cifra}: en las unidades, en las decenas o en las centenas?`, { tipo: 'bloques', valor: n }, `El ${cifra} está en las ${lugar}.`],
      explicacion: `En ${n}, el ${cifra} está en las ${lugar}: vale ${respuesta}.`,
    };
  },
};

const comparar: Plantilla = {
  id: 'g2-comparar',
  dimension: 'comprension',
  operacion: 'resta',
  descripcion: 'Comparar números de hasta tres cifras',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 999);
    const a = rng.entero(Math.max(10, lerp(10, Math.floor(max / 2), dif(ctx))), max);
    let b = dif(ctx) > 0.5 && max > 99 ? Math.min(max, Math.floor(a / 100) * 100 + rng.entero(0, 99)) : rng.entero(10, max);
    if (b === a) b = a === max ? a - 1 : a + 1;
    const [f1, f2] = rng.barajar(nombresFincas);
    const p = rng.elegir(frutas);
    const pregunta = rng.azar(0.5) ? 'más' : 'menos';
    const respuesta = (pregunta === 'más') === a > b ? f1 : f2;
    const opciones = rng.barajar([f1, f2, 'Cosecharon igual']);
    return {
      enunciado: `La finca ${f1} cosechó ${a} ${nombreCant(p, a)} y la finca ${f2} cosechó ${b}. ¿Qué finca cosechó ${pregunta} ${p.plural}?`,
      instruccion: 'Compara',
      ilustracion: p.objeto,
      datos: { a, b },
      respuesta,
      distractores: opciones.filter((o) => o !== respuesta),
      interaccion: { tipo: 'opciones', opciones },
      pistas: [
        'Compara primero las centenas; si son iguales, mira las decenas y después las unidades.',
        { tipo: 'bloques', valor: Math.max(a, b) },
        `${Math.max(a, b)} es mayor que ${Math.min(a, b)}.`,
      ],
      explicacion: `${Math.max(a, b)} > ${Math.min(a, b)}, así que cosechó ${pregunta} la finca ${respuesta}.`,
    };
  },
};

const recta: Plantilla = {
  id: 'g2-recta',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Saltos de 10 en 10 o de 100 en 100 en la recta',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const paso = pn(ctx, 'paso', 10);
    const marcas = paso === 100 ? 10 : 20;
    const min = rng.entero(0, Math.floor((1000 - paso * marcas) / paso)) * paso;
    const max = min + paso * marcas;
    const op = pt(ctx, 'op', 'suma');
    const resta = op === 'resta' || (op === 'mixta' && rng.azar(0.5));
    const saltos = rng.entero(1, lerp(3, 8, dif(ctx)));
    const a = resta ? min + rng.entero(saltos, marcas) * paso : min + rng.entero(0, marcas - saltos) * paso;
    const total = saltos * paso;
    const respuesta = resta ? a - total : a + total;
    const quien = persona(rng);
    return {
      enunciado: `En el camino de herradura los postes están marcados de ${paso} en ${paso}. ${quien.nombre} está en el poste ${a} y ${resta ? 'se devuelve' : 'avanza'} ${saltos} ${saltos === 1 ? 'poste' : 'postes'}. ¿En qué número queda? Tócalo.`,
      instruccion: `Salta de ${paso} en ${paso}`,
      datos: { a, saltos, paso },
      respuesta,
      distractores: [respuesta + paso, respuesta - paso].filter((x) => x >= min && x <= max),
      interaccion: { tipo: 'recta', min, max, paso, inicio: a },
      calculo: { op: resta ? 'resta' : 'suma', a, b: total },
      pistas: [
        `Cada poste vale ${paso}. ¿Vas hacia los números más grandes o más pequeños?`,
        { tipo: 'recta', min, max, desde: a, saltos: Array(saltos).fill(resta ? -paso : paso) },
        `${saltos} saltos de ${paso} son ${total}: ${a} ${resta ? '−' : '+'} ${total}.`,
      ],
      explicacion: `${a} ${resta ? '−' : '+'} ${total} = ${respuesta}.`,
    };
  },
};

const algoritmoSuma: Plantilla = {
  id: 'g2-algoritmo-suma',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Suma en columnas cifra por cifra, con y sin llevar',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [a, b] = parSumaG2(ctx, pn(ctx, 'max', 999));
    const respuesta = a + b;
    const contextos = [
      `${mayus(adulto(rng).nombre)} anotó en el cuaderno de la finca ${a} huevos en una semana y ${b} en la otra.`,
      `La cooperativa de cacaoteros recibió ${a} kilos de cacao el sábado y ${b} el domingo.`,
      `En la huerta escolar sembraron ${a} matas de yuca y ${b} de maíz.`,
      `${persona(rng).nombre} contó ${a} naranjas en un árbol y ${b} en otro.`,
    ];
    const calc = { op: 'suma' as const, a, b };
    return {
      enunciado: `${rng.elegir(contextos)} Suma cifra por cifra. ¿Cuántos son en total?`,
      instruccion: 'Suma en columnas',
      datos: { a, b },
      respuesta,
      distractores: distractores(rng, respuesta, [a + b + 10, a + b - 10, a + b + 100], 3, dif(ctx)),
      interaccion: { tipo: 'algoritmo', operacion: 'suma', a, b },
      calculo: calc,
      pistas: [
        '¿Por qué columna empiezas? Siempre por las unidades.',
        { tipo: 'texto', texto: guiaSuma(a, b) },
        guiaSuma(a, b),
      ],
      explicacion: `${a} + ${b} = ${respuesta}.`,
    };
  },
};

const algoritmoResta: Plantilla = {
  id: 'g2-algoritmo-resta',
  dimension: 'procedimiento',
  operacion: 'resta',
  descripcion: 'Resta en columnas cifra por cifra, con y sin prestar',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [a, b] = parRestaG2(ctx, pn(ctx, 'max', 999));
    const respuesta = a - b;
    const contextos = [
      `En la bodega había ${a} kilos de cacao seco y se vendieron ${b} en la cooperativa.`,
      `${mayus(adulto(rng).nombre)} tenía ${a} huevos para vender y ya entregó ${b} en la tienda de la vereda.`,
      `La quebrada queda a ${a} metros de la escuela. ${persona(rng).nombre} ya caminó ${b} metros.`,
      `En el vivero había ${a} bolsas con plántulas de cacao y se sembraron ${b}.`,
    ];
    return {
      enunciado: `${rng.elegir(contextos)} Resta cifra por cifra para saber cuánto falta o cuánto queda.`,
      instruccion: 'Resta en columnas',
      datos: { a, b },
      respuesta,
      distractores: distractores(rng, respuesta, [a - b + 10, a - b - 10, a + b], 3, dif(ctx)),
      interaccion: { tipo: 'algoritmo', operacion: 'resta', a, b },
      calculo: { op: 'resta', a, b },
      pistas: ['Empieza por las unidades. ¿Alcanza para quitar?', { tipo: 'texto', texto: guiaResta(a, b) }, guiaResta(a, b)],
      explicacion: `${a} − ${b} = ${respuesta}.`,
    };
  },
};

const calculo: Plantilla = {
  id: 'g2-calculo',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Cálculo de suma o resta hasta 999',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 999);
    const op = pt(ctx, 'op', 'suma');
    const resta = op === 'resta' || (op === 'mixta' && rng.azar(0.5));
    const [a, b] = resta ? parRestaG2(ctx, max) : parSumaG2(ctx, max);
    const respuesta = resta ? a - b : a + b;
    const contexto = resta
      ? rng.elegir([`En la tienda de la vereda había ${a} huevos y se vendieron ${b}.`, `La chiva lleva ${a} bultos y deja ${b} en el pueblo.`, `De ${a} mazorcas de cacao, ${b} ya se abrieron.`])
      : rng.elegir([`En la finca hay ${a} árboles de cacao y ${b} de café.`, `La tienda recibió ${a} panelas y luego ${b} más.`, `En la vereda hay ${a} árboles de naranja y ${b} de mandarina.`]);
    const calc = { op: resta ? ('resta' as const) : ('suma' as const), a, b };
    const modo = modoRespuesta(ctx, respuesta, calc, { abiertaMin: 0.3, abiertaMax: 0.9 });
    return {
      enunciado: `${contexto} Resuelve: ${a} ${resta ? '−' : '+'} ${b} = ?`,
      instruccion: resta ? 'Resta' : 'Suma',
      datos: { a, b },
      respuesta,
      ...modo,
      calculo: calc,
      operacion: resta ? 'resta' : 'suma',
      pistas: [
        resta ? 'Resta primero las unidades, después las decenas y al final las centenas.' : 'Suma primero las unidades, después las decenas y al final las centenas.',
        { tipo: 'texto', texto: resta ? guiaResta(a, b) : guiaSuma(a, b) },
        resta ? guiaResta(a, b) : guiaSuma(a, b),
      ],
      explicacion: `${a} ${resta ? '−' : '+'} ${b} = ${respuesta}.`,
    };
  },
};

const sumaProblema: Plantilla = {
  id: 'g2-suma-problema',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Problemas de cambio-aumentar y combinación',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [a, b] = parSumaG2(ctx, pn(ctx, 'max', 999));
    const c = a + b;
    const p = rng.elegir(productosGrandes);
    const quien = persona(rng);
    const ad = adulto(rng);
    const tipo = pb(ctx, 'incognita') && dif(ctx) > 0.5 ? rng.elegir(['cambio', 'inicio']) : 'resultado';
    const cu = cuantos(p.genero);
    let enunciado: string;
    let respuesta: number;
    let calc: { op: 'suma' | 'resta'; a: number; b: number };
    if (tipo === 'cambio') {
      enunciado = `${quien.nombre} tenía ${a} ${nombreCant(p, a)}. Fue a la finca ${de(ad)} y ahora tiene ${c}. ¿${cu} ${p.plural} le regalaron?`;
      respuesta = b;
      calc = { op: 'resta', a: c, b: a };
    } else if (tipo === 'inicio') {
      enunciado = `${quien.nombre} tenía ${p.genero === 'f' ? 'algunas' : 'algunos'} ${p.plural}. Le regalaron ${b} más y ahora tiene ${c}. ¿${cu} tenía al principio?`;
      respuesta = a;
      calc = { op: 'resta', a: c, b };
    } else {
      enunciado = rng.elegir([
        `${quien.nombre} ${p.verbo} ${a} ${nombreCant(p, a)} el sábado y ${b} el domingo. ¿${cu} ${p.plural} ${p.verbo} en total?`,
        `En la finca ${rng.elegir(nombresFincas)} hay ${a} árboles de cacao y ${b} de aguacate. ¿Cuántos árboles hay en total?`,
        `${mayus(ad.nombre)} tenía ${a} ${nombreCant(p, a)} en la bodega y le llegaron ${b} más. ¿${cu} tiene ahora?`,
      ]);
      respuesta = c;
      calc = { op: 'suma', a, b };
    }
    const modo = modoRespuesta(ctx, respuesta, calc);
    return {
      enunciado,
      instruccion: tipo === 'resultado' ? 'Junta' : 'Busca lo que falta',
      ilustracion: p.objeto,
      datos: { a, b, c },
      respuesta,
      ...modo,
      calculo: calc,
      operacion: calc.op,
      pistas: [
        tipo === 'resultado' ? '¿Las cantidades se juntan o se quitan?' : 'Ya sabes el total. ¿Qué parte te falta conocer?',
        { tipo: 'texto', texto: tipo === 'resultado' ? `Parte: ${a}. Parte: ${b}. Total: ?` : `Total: ${c}. Una parte: ${tipo === 'cambio' ? a : b}. La otra parte: ?` },
        tipo === 'resultado' ? `${a} + ${b}.` : `${c} − ${tipo === 'cambio' ? a : b}.`,
      ],
      explicacion: tipo === 'resultado' ? `${a} + ${b} = ${c}.` : `${c} − ${tipo === 'cambio' ? a : b} = ${respuesta}.`,
    };
  },
};

const restaProblema: Plantilla = {
  id: 'g2-resta-problema',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Problemas de cambio-disminuir (incógnita en resultado, cambio o inicio)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [a, b] = parRestaG2(ctx, pn(ctx, 'max', 999));
    const r = a - b;
    const p = rng.elegir(productosGrandes);
    const ad = adulto(rng);
    const tipo = pb(ctx, 'incognita') && dif(ctx) > 0.5 ? rng.elegir(['cambio', 'inicio']) : 'resultado';
    const cu = cuantos(p.genero);
    let enunciado: string;
    let respuesta: number;
    let calc: { op: 'suma' | 'resta'; a: number; b: number };
    if (tipo === 'cambio') {
      enunciado = `${mayus(ad.nombre)} llevó ${a} ${nombreCant(p, a)} al mercado del pueblo y volvió con ${r}. ¿${cu} vendió?`;
      respuesta = b;
      calc = { op: 'resta', a, b: r };
    } else if (tipo === 'inicio') {
      enunciado = `${mayus(ad.nombre)} vendió ${b} ${nombreCant(p, b)} en el mercado del pueblo y le ${r === 1 ? 'quedó' : 'quedaron'} ${r}. ¿${cu} llevó al mercado?`;
      respuesta = a;
      calc = { op: 'suma', a: b, b: r };
    } else {
      enunciado = rng.elegir([
        `${mayus(ad.nombre)} llevó ${a} ${nombreCant(p, a)} al mercado del pueblo y vendió ${b}. ¿${cu} le quedaron?`,
        `En la cooperativa había ${a} bultos de cacao y salieron ${b} en el carro de la cooperativa. ¿Cuántos bultos quedan?`,
        `${persona(rng).nombre} tenía ${a} ${nombreCant(p, a)} y regaló ${b} a sus vecinos de la vereda. ¿${cu} le quedan?`,
      ]);
      respuesta = r;
      calc = { op: 'resta', a, b };
    }
    const modo = modoRespuesta(ctx, respuesta, calc);
    return {
      enunciado,
      instruccion: tipo === 'resultado' ? 'Quita' : 'Busca lo que falta',
      ilustracion: p.objeto,
      datos: { a, b, r },
      respuesta,
      ...modo,
      calculo: calc,
      operacion: calc.op,
      pistas: [
        tipo === 'inicio' ? 'Lo que vendió y lo que le quedó, juntos, ¿qué forman?' : 'Al vender o regalar, ¿quedan más o menos?',
        { tipo: 'texto', texto: `Total: ${tipo === 'inicio' ? '?' : a}. Sale: ${tipo === 'cambio' ? '?' : b}. Queda: ${tipo === 'resultado' ? '?' : r}.` },
        tipo === 'inicio' ? `${b} + ${r}.` : tipo === 'cambio' ? `${a} − ${r}.` : `${a} − ${b}.`,
      ],
      explicacion: tipo === 'inicio' ? `${b} + ${r} = ${a}.` : tipo === 'cambio' ? `${a} − ${r} = ${b}.` : `${a} − ${b} = ${r}.`,
    };
  },
};

const comparacion: Plantilla = {
  id: 'g2-comparacion',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Problemas de comparación: ¿cuántos más o menos?',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [a, b] = parRestaG2(ctx, pn(ctx, 'max', 999));
    const r = a - b;
    const x = adulto(rng);
    const y = adulto(rng, [x.nombre]);
    const p = rng.elegir(frutas);
    const cu = cuantos(p.genero);
    const inc = pb(ctx, 'incognita') && dif(ctx) > 0.5 && rng.azar(0.6);
    if (inc) {
      const mas = rng.azar(0.5);
      const enunciado = mas
        ? `En la finca ${de(y)} cosecharon ${b} ${nombreCant(p, b)}. En la finca ${de(x)} cosecharon ${r} más. ¿${cu} ${p.plural} cosecharon en la finca ${de(x)}?`
        : `En la finca ${de(x)} cosecharon ${a} ${nombreCant(p, a)}. En la finca ${de(y)} cosecharon ${r} menos. ¿${cu} ${p.plural} cosecharon en la finca ${de(y)}?`;
      const respuesta = mas ? a : b;
      const calc = mas ? { op: 'suma' as const, a: b, b: r } : { op: 'resta' as const, a, b: r };
      const modo = modoRespuesta(ctx, respuesta, calc);
      return {
        enunciado,
        instruccion: 'Compara',
        ilustracion: p.objeto,
        datos: { a, b, r },
        respuesta,
        ...modo,
        calculo: calc,
        operacion: calc.op,
        pistas: [
          mas ? '"Más que" quiere decir que esa finca tiene lo mismo y un poco más.' : '"Menos que" quiere decir que esa finca tiene lo mismo, pero le falta un poco.',
          { tipo: 'texto', texto: mas ? `${b} y ${r} más.` : `${a} y ${r} menos.` },
          mas ? `${b} + ${r}.` : `${a} − ${r}.`,
        ],
        explicacion: mas ? `${b} + ${r} = ${a}.` : `${a} − ${r} = ${b}.`,
      };
    }
    const menos = rng.azar(0.35);
    const calc = { op: 'resta' as const, a, b };
    const modo = modoRespuesta(ctx, r, calc, { extras: [a + b] });
    return {
      enunciado: menos
        ? `En la finca ${de(x)} cosecharon ${a} ${nombreCant(p, a)} y en la ${de(y)}, ${b}. ¿${cu} ${p.plural} menos cosecharon en la finca ${de(y)}?`
        : `En la finca ${de(x)} cosecharon ${a} ${nombreCant(p, a)} y en la ${de(y)}, ${b}. ¿${cu} ${p.plural} más cosecharon en la finca ${de(x)}?`,
      instruccion: 'Compara',
      ilustracion: p.objeto,
      datos: { a, b },
      respuesta: r,
      ...modo,
      calculo: calc,
      pistas: ['La diferencia es lo que le falta a la cantidad menor para llegar a la mayor.', { tipo: 'texto', texto: `${b} + ? = ${a}` }, `${a} − ${b}.`],
      explicacion: `${a} − ${b} = ${r}. La diferencia es ${r}.`,
    };
  },
};

const empaque: Plantilla = {
  id: 'g2-empaque',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Problemas de valor posicional con canastas, bolsas y sueltos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const reagrupar = dif(ctx) > 0.5 && rng.azar(0.6);
    const c = rng.entero(1, reagrupar ? 7 : 9);
    const de10 = reagrupar ? rng.entero(10, 19) : rng.entero(0, 9);
    const u = rng.entero(1, 9);
    const n = c * 100 + de10 * 10 + u;
    const ad = adulto(rng);
    const p = rng.elegir(frutas);
    const calc = { op: 'suma' as const, a: c * 100, b: de10 * 10 + u };
    const extras = [Number(`${c}${de10}${u}`), c + de10 + u, n + 10, n - 10, n - 100].filter((x) => x <= 999);
    const modo = modoRespuesta(ctx, n, calc, { extras });
    return {
      enunciado: `${mayus(ad.nombre)} llevó al mercado del pueblo ${c} ${c === 1 ? 'canasta' : 'canastas'} de 100 ${p.plural}, ${de10} ${de10 === 1 ? 'bolsa' : 'bolsas'} de 10 y ${u} ${nombreCant(p, u)} ${p.genero === 'f' ? (u === 1 ? 'suelta' : 'sueltas') : u === 1 ? 'suelto' : 'sueltos'}. ¿${cuantos(p.genero)} ${p.plural} llevó?`,
      instruccion: 'Cuenta por grupos',
      ilustracion: p.objeto,
      datos: { c, d: de10, u },
      respuesta: n,
      unidad: p.plural,
      ...modo,
      calculo: calc,
      pistas: [
        reagrupar ? `¡Ojo! ${de10} bolsas de 10 son más de 100. ¿Cuántas canastas de 100 podrías formar con ellas?` : 'Cada canasta vale 100 y cada bolsa vale 10.',
        { tipo: 'bloques', valor: n },
        `${c * 100} + ${de10 * 10} + ${u}.`,
      ],
      explicacion: `${c * 100} + ${de10 * 10} + ${u} = ${n}.`,
    };
  },
};

const dinero: Plantilla = {
  id: 'g2-dinero',
  dimension: 'aplicacion',
  operacion: 'suma',
  descripcion: 'Contar monedas y pagar compras en la tienda (hasta $1.000)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const modo = pt(ctx, 'modo', 'compra');
    const quien = persona(rng);
    if (modo === 'contar') {
      let n100 = 0;
      let n200 = 0;
      let n500 = 0;
      let total = 0;
      for (let i = 0; i < 100; i++) {
        n100 = rng.entero(1, 4);
        n200 = rng.entero(0, 2);
        n500 = dif(ctx) > 0.3 ? rng.entero(0, 1) : 0;
        total = n100 * 100 + n200 * 200 + n500 * 500;
        if (total <= 1000) break;
      }
      if (total > 1000) {
        n100 = 2;
        n200 = 1;
        n500 = 0;
        total = 400;
      }
      const partes = [
        `${n100} ${n100 === 1 ? 'moneda' : 'monedas'} de ${pesos(100)}`,
        n200 ? `${n200} ${n200 === 1 ? 'moneda' : 'monedas'} de ${pesos(200)}` : '',
        n500 ? `${n500} moneda de ${pesos(500)}` : '',
      ].filter(Boolean);
      const extras = [n100 + n200 + n500, total + 100, total - 100, total + 200].filter((x) => x <= 1000);
      const resp = modoRespuesta(ctx, total, undefined, { extras, paso: 100 });
      return {
        enunciado: `${quien.nombre} tiene en la alcancía ${unir(partes)}. ¿Cuánta plata tiene?`,
        instruccion: 'Cuenta la plata',
        ilustracion: 'moneda',
        datos: { n100, n200, n500 },
        respuesta: total,
        unidad: 'pesos',
        ...resp,
        pistas: [
          'Empieza por las monedas de más valor y sigue contando.',
          { tipo: 'texto', texto: unir(partes) },
          `${n500 ? '500 + ' : ''}${n200 ? `${n200 * 200} + ` : ''}${n100 * 100}.`,
        ],
        explicacion: `En total tiene ${pesos(total)}.`,
      };
    }
    const { cosas, total } = compraAleatoria(ctx, 1000, dif(ctx) > 0.5 ? 3 : 2);
    const primero = cosas[0].precio;
    const calc = { op: 'suma' as const, a: primero, b: total - primero };
    const resp = modoRespuesta(ctx, total, calc, { paso: 100, extras: [total + 100, total - 100] });
    return {
      enunciado: `En la tienda de la vereda, ${quien.nombre} compró ${listaCompra(cosas)}. ¿Cuánto pagó en total?`,
      instruccion: 'Suma los precios',
      ilustracion: 'moneda',
      datos: { total, cosas: cosas.length },
      respuesta: total,
      unidad: 'pesos',
      ...resp,
      calculo: calc,
      pistas: ['¿Pagar varias cosas es juntar o quitar?', { tipo: 'texto', texto: cosas.map((c) => pesos(c.precio)).join(' + ') }, `${cosas.map((c) => c.precio).join(' + ')}.`],
      explicacion: `${cosas.map((c) => c.precio).join(' + ')} = ${total}. Pagó ${pesos(total)}.`,
    };
  },
};

const vueltas: Plantilla = {
  id: 'g2-vueltas',
  dimension: 'aplicacion',
  operacion: 'resta',
  descripcion: 'Calcular las vueltas al pagar con $500 o $1.000',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const { cosas, total } = compraAleatoria(ctx, 900, dif(ctx) > 0.5 ? 3 : 2);
    const pago = total < 500 && rng.azar(0.4) ? 500 : 1000;
    const respuesta = pago - total;
    const quien = persona(rng);
    const calc = { op: 'resta' as const, a: pago, b: total };
    const modo = modoRespuesta(ctx, respuesta, calc, { paso: 100, extras: [total, respuesta + 100, respuesta - 100] });
    return {
      enunciado: `${quien.nombre} compró ${listaCompra(cosas)} en la tienda de la vereda y pagó con ${pago === 1000 ? `un billete de ${pesos(1000)}` : `una moneda de ${pesos(500)}`}. ¿Cuánto le dieron de vueltas?`,
      instruccion: 'Calcula las vueltas',
      ilustracion: 'moneda',
      datos: { total, pago },
      respuesta,
      unidad: 'pesos',
      ...modo,
      calculo: calc,
      pistas: [
        'Primero averigua cuánto costó todo. Después, ¿cuánto falta para llegar a lo que pagó?',
        { tipo: 'texto', texto: `Costó ${pesos(total)}. Pagó ${pesos(pago)}.` },
        `${pago} − ${total}.`,
      ],
      explicacion: `Todo costó ${pesos(total)}. ${pago} − ${total} = ${respuesta}. Le dieron ${pesos(respuesta)} de vueltas.`,
    };
  },
};

const arreglo: Plantilla = {
  id: 'g2-arreglo',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Grupos iguales en surcos (×2, ×5, ×10) con arreglo',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.elegir(factores(ctx));
    const f = rng.entero(2, lerp(4, 10, dif(ctx)));
    const respuesta = f * k;
    const quien = persona(rng);
    const cultivo = rng.elegir(['cacao', 'café', 'aguacate']);
    const calc = { op: 'multiplicacion' as const, a: f, b: k };
    return {
      enunciado: `${quien.nombre} sembró ${f} surcos de ${cultivo} con ${k} árboles en cada surco. Toca la cuadrícula para formar los surcos. ¿Cuántos árboles sembró?`,
      instruccion: 'Forma los surcos',
      ilustracion: 'arbol',
      datos: { f, k },
      respuesta,
      unidad: 'árboles',
      distractores: distractores(rng, respuesta, [f * (k + 1), f * (k - 1), f + k, (f + 1) * k], 3, dif(ctx)),
      interaccion: { tipo: 'arreglo', filas: f, columnas: k, objeto: 'arbol' },
      calculo: calc,
      pistas: [`¿Cuántos surcos hay y cuántos árboles tiene cada uno?`, { tipo: 'arreglo', filas: f, columnas: k, objeto: 'arbol' }, `Cuenta de ${k} en ${k}, ${f} veces.`],
      explicacion: `${f} surcos de ${k} árboles: ${Array(f).fill(k).join(' + ')} = ${f} × ${k} = ${respuesta}.`,
    };
  },
};

const sumaRepetida: Plantilla = {
  id: 'g2-suma-repetida',
  dimension: 'comprension',
  operacion: 'multiplicacion',
  descripcion: 'Suma repetida y su relación con la multiplicación',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.elegir(factores(ctx));
    const f = rng.entero(2, lerp(4, 6, dif(ctx)));
    const respuesta = f * k;
    const repetida = Array(f).fill(k).join(' + ');
    const p = rng.elegir([
      { cosa: 'huevos', recipiente: 'cubetas', cada: 'cada una', obj: 'huevo' as const },
      { cosa: 'aguacates', recipiente: 'bolsas', cada: 'cada una', obj: 'aguacate' as const },
      { cosa: 'mazorcas', recipiente: 'canastos', cada: 'cada uno', obj: 'mazorca' as const },
    ]);
    const ad = adulto(rng);
    const base = `${mayus(ad.nombre)} puso ${k} ${p.cosa} en ${p.cada} de sus ${f} ${p.recipiente}.`;
    if (rng.azar(0.5)) {
      const correcta = `${f} × ${k}`;
      const opciones = rng.barajar([correcta, `${f} + ${k}`, `${f} × ${k + 1}`]);
      return {
        enunciado: `${base} ¿Qué operación dice cuántos ${p.cosa} hay?`,
        instruccion: 'Elige la operación',
        ilustracion: p.obj,
        datos: { f, k },
        respuesta: correcta,
        distractores: opciones.filter((o) => o !== correcta),
        interaccion: { tipo: 'opciones', opciones },
        pistas: ['¿Cuántos grupos hay y cuántos hay en cada grupo?', { tipo: 'objetos', objeto: p.obj, grupos: Array(f).fill(k) }, `${repetida}: el ${k} se repite ${f} veces.`],
        explicacion: `${repetida} es lo mismo que ${f} × ${k} = ${respuesta}.`,
      };
    }
    const calc = { op: 'multiplicacion' as const, a: f, b: k };
    const modo = modoRespuesta(ctx, respuesta, calc);
    return {
      enunciado: `${base} ${repetida} = ? ¿Cuántos ${p.cosa} hay?`,
      instruccion: 'Suma grupos iguales',
      ilustracion: p.obj,
      datos: { f, k },
      respuesta,
      unidad: p.cosa,
      ...modo,
      calculo: calc,
      pistas: [`Cuenta de ${k} en ${k}.`, { tipo: 'objetos', objeto: p.obj, grupos: Array(f).fill(k) }, `${repetida} = ${f} × ${k}.`],
      explicacion: `${repetida} = ${respuesta}.`,
    };
  },
};

const grupos: Plantilla = {
  id: 'g2-grupos',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Problemas de grupos iguales y agrupación',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.elegir(factores(ctx));
    const f = rng.entero(2, lerp(5, 10, dif(ctx)));
    const total = f * k;
    const p = rng.elegir(frutas);
    const quien = persona(rng);
    const agrupar = dif(ctx) > 0.5 && rng.azar(0.5);
    if (agrupar) {
      const calc = { op: 'division' as const, a: total, b: k };
      const modo = modoRespuesta(ctx, f, calc, { extras: [f + 1, f - 1, total - k] });
      return {
        enunciado: `${quien.nombre} empaca ${total} ${p.plural} en bolsas de ${k}. ¿Cuántas bolsas llena?`,
        instruccion: 'Haz grupos',
        ilustracion: p.objeto,
        datos: { total, k },
        respuesta: f,
        unidad: 'bolsas',
        ...modo,
        calculo: calc,
        operacion: 'division',
        pistas: [`¿Cuántas veces cabe el ${k} en ${total}?`, { tipo: 'reparto', total, grupos: f, objeto: p.objeto }, `Cuenta de ${k} en ${k} hasta llegar a ${total}.`],
        explicacion: `${f} bolsas de ${k} son ${total}: llena ${f} bolsas.`,
      };
    }
    const calc = { op: 'multiplicacion' as const, a: f, b: k };
    const modo = modoRespuesta(ctx, total, calc);
    return {
      enunciado: rng.elegir([
        `${quien.nombre} llenó ${f} bolsas con ${k} ${p.plural} cada una para la feria del pueblo. ¿${cuantos(p.genero)} ${p.plural} empacó?`,
        `En el refrigerio escolar repartieron ${k} ${p.plural} en cada una de las ${f} mesas. ¿${cuantos(p.genero)} ${p.plural} repartieron?`,
      ]),
      instruccion: 'Grupos iguales',
      ilustracion: p.objeto,
      datos: { f, k },
      respuesta: total,
      unidad: p.plural,
      ...modo,
      calculo: calc,
      pistas: ['¿Cuántos grupos hay y cuántas frutas en cada grupo?', { tipo: 'objetos', objeto: p.objeto, grupos: Array(Math.min(f, 10)).fill(k) }, `${f} × ${k}: cuenta de ${k} en ${k}, ${f} veces.`],
      explicacion: `${f} × ${k} = ${total}.`,
    };
  },
};

const reparto: Plantilla = {
  id: 'g2-reparto',
  dimension: 'aplicacion',
  operacion: 'division',
  descripcion: 'Reparto equitativo arrastrando o con números',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const p = rng.elegir(frutas);
    const quien = persona(rng);
    const manipular = dif(ctx) < 0.5 || rng.azar(0.3);
    const k = manipular ? rng.elegir([2, 3, 4, 5]) : rng.elegir([2, 5, 10]);
    const cada = manipular ? rng.entero(2, Math.floor(20 / k)) : rng.entero(3, lerp(6, 10, dif(ctx)));
    const n = cada * k;
    const calc = { op: 'division' as const, a: n, b: k };
    const enunciado = `${quien.nombre} reparte ${n} ${p.plural} entre ${k} compañeros de la escuela, la misma cantidad a cada uno.${manipular ? ' Arrastra las frutas a las canastas.' : ''} ¿${cuantos(p.genero)} recibe cada uno?`;
    const base = {
      enunciado,
      instruccion: 'Reparte igual',
      ilustracion: p.objeto,
      datos: { n, k },
      respuesta: cada,
      unidad: p.plural,
      calculo: calc,
      pistas: [
        'Da una a cada uno, por turnos, hasta que no quede ninguna.',
        { tipo: 'reparto', total: n, grupos: k, objeto: p.objeto },
        `Busca el número que, repetido ${k} veces, da ${n}.`,
      ] as [string, Visual, string],
      explicacion: `${n} ÷ ${k} = ${cada}, porque ${k} × ${cada} = ${n}.`,
    };
    if (manipular) {
      return {
        ...base,
        distractores: distractores(rng, cada, [cada + 1, cada - 1, n - k], 3, dif(ctx)),
        interaccion: { tipo: 'arrastrar', objeto: p.objeto, modo: 'repartir', a: n, b: k },
      };
    }
    return { ...base, ...modoRespuesta(ctx, cada, calc, { extras: [n - k, cada + 1, cada - 1] }) };
  },
};

const razonable: Plantilla = {
  id: 'g2-razonable',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: '¿Es razonable? Estimar a la centena más cercana',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const op = pt(ctx, 'op', 'suma');
    const resta = op === 'resta' || (op === 'mixta' && rng.azar(0.5));
    const [a, b] = resta ? parResta(rng, 3, rng.entero(0, 1)) : parSuma(rng, 3, rng.entero(0, 1), 1000);
    const real = resta ? a - b : a + b;
    const lejanos = [real + 300, real - 300, real + 400, real - 400].filter((x) => x > 0 && x <= 999);
    const propuesto = rng.azar(0.5) || !lejanos.length ? real : rng.elegir(lejanos);
    const esRaz = propuesto === real;
    const estimacion = Math.round(real / 100) * 100;
    const distr = [estimacion + 200, estimacion - 200, estimacion + 400, estimacion - 400].filter((x) => x >= 0 && x <= 1000).slice(0, 2);
    const quien = persona(rng);
    const enunciado = resta
      ? `En la bodega había ${a} kilos de cacao y se vendieron ${b}. ${quien.nombre} dice que quedaron ${propuesto} kilos. ¿Es razonable? Después, elige la mejor estimación.`
      : `La cooperativa juntó ${a} kilos de cacao en una semana y ${b} en la otra. ${quien.nombre} dice que en total son ${propuesto} kilos. ¿Es razonable? Después, elige la mejor estimación.`;
    return {
      enunciado,
      instruccion: '¿Tiene sentido?',
      ilustracion: 'bulto',
      datos: { a, b, propuesto },
      respuesta: `${esRaz ? 'si' : 'no'}:${estimacion}`,
      distractores: distr,
      interaccion: { tipo: 'razonable', propuesto, esRazonable: esRaz, opciones: rng.barajar([estimacion, ...distr]) },
      operacion: resta ? 'resta' : 'suma',
      pistas: [
        'Piensa en centenas: ¿cuánto es más o menos cada número?',
        { tipo: 'texto', texto: `${a} es cerca de ${Math.round(a / 100) * 100} y ${b} es cerca de ${Math.round(b / 100) * 100}.` },
        `${Math.round(a / 100) * 100} ${resta ? '−' : '+'} ${Math.round(b / 100) * 100} es una buena aproximación.`,
      ],
      explicacion: `${a} ${resta ? '−' : '+'} ${b} = ${real}, que es cerca de ${estimacion}. ${esRaz ? `Decir ${propuesto} es razonable.` : `${propuesto} está muy lejos: no es razonable.`}`,
    };
  },
};

const tabla: Plantilla = {
  id: 'g2-tabla',
  dimension: 'aplicacion',
  operacion: 'suma',
  descripcion: 'Leer una tabla de tres días de cosecha',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 999);
    const modo = pt(ctx, 'modo', 'total');
    const tope = Math.floor(max / 3);
    const vals = [0, 0, 0].map(() => rng.entero(Math.max(5, lerp(5, Math.floor(tope / 2), dif(ctx))), tope));
    while (new Set(vals).size < 3) vals[rng.entero(0, 2)] = rng.entero(5, tope);
    const dias = ['lunes', 'martes', 'miércoles'];
    const filas = dias.map((dia, i) => [dia, vals[i]]);
    const quien = persona(rng);
    const cosa = rng.elegir([
      { encabezado: 'Kilos de café', texto: 'los kilos de café que recogió su familia', unidad: 'kilos', genero: 'm' as Genero },
      { encabezado: 'Mazorcas', texto: 'las mazorcas de cacao que cortaron en la finca', unidad: 'mazorcas', genero: 'f' as Genero },
      { encabezado: 'Naranjas', texto: 'las naranjas que vendieron en el mercado', unidad: 'naranjas', genero: 'f' as Genero },
    ]);
    const titulo = `${quien.nombre} anotó en una tabla ${cosa.texto}.`;
    const encabezados = ['Día', cosa.encabezado];
    const iMax = vals.indexOf(Math.max(...vals));
    const iMin = vals.indexOf(Math.min(...vals));
    if (modo === 'mayor') {
      const resp = dias[iMax];
      return {
        enunciado: `${titulo} ¿Qué día hubo más?`,
        instruccion: 'Lee la tabla',
        datos: { a: vals[0], b: vals[1], c: vals[2] },
        respuesta: resp,
        distractores: dias.filter((d) => d !== resp),
        interaccion: { tipo: 'tabla', encabezados, filas, opciones: dias },
        pistas: ['Busca el número más grande de la tabla.', { tipo: 'texto', texto: vals.join(', ') }, `El mayor es ${vals[iMax]}.`],
        explicacion: `${vals[iMax]} es el mayor: fue el ${resp}.`,
      };
    }
    if (modo === 'diferencia') {
      const mayor = vals[iMax];
      const menor = vals[iMin];
      const resp = mayor - menor;
      const calc = { op: 'resta' as const, a: mayor, b: menor };
      const distr = distractores(rng, resp, [mayor + menor, resp + 10, resp - 10], 3, dif(ctx));
      const abierta = rng.azar(lerp(30, 80, dif(ctx)) / 100);
      return {
        enunciado: `${titulo} ¿${cuantos(cosa.genero)} ${cosa.unidad} más hubo el ${dias[iMax]} que el ${dias[iMin]}?`,
        instruccion: 'Lee la tabla',
        datos: { a: vals[0], b: vals[1], c: vals[2] },
        respuesta: resp,
        unidad: cosa.unidad,
        distractores: distr,
        interaccion: { tipo: 'tabla', encabezados, filas, opciones: abierta ? undefined : mezclarOpciones(rng, resp, distr) },
        calculo: calc,
        pistas: [`Busca los ${cosa.unidad} del ${dias[iMax]} y del ${dias[iMin]}.`, { tipo: 'texto', texto: `${dias[iMax]}: ${mayor}. ${dias[iMin]}: ${menor}.` }, `${mayor} − ${menor}.`],
        explicacion: `${mayor} − ${menor} = ${resp}.`,
      };
    }
    const total = vals[0] + vals[1] + vals[2];
    const calc = { op: 'suma' as const, a: vals[0] + vals[1], b: vals[2] };
    const distr = distractores(rng, total, [total + 10, total - 10, vals[0] + vals[1], total + 100].filter((x) => x <= 999), 3, dif(ctx));
    const abierta = rng.azar(lerp(30, 80, dif(ctx)) / 100);
    return {
      enunciado: `${titulo} ¿${cuantos(cosa.genero)} ${cosa.unidad} hubo en los tres días?`,
      instruccion: 'Lee la tabla',
      datos: { a: vals[0], b: vals[1], c: vals[2] },
      respuesta: total,
      unidad: cosa.unidad,
      distractores: distr,
      interaccion: { tipo: 'tabla', encabezados, filas, opciones: abierta ? undefined : mezclarOpciones(rng, total, distr) },
      calculo: calc,
      pistas: ['Para saber el total, ¿juntas o quitas?', { tipo: 'texto', texto: vals.join(' + ') }, `Primero ${vals[0]} + ${vals[1]} = ${vals[0] + vals[1]}; después suma ${vals[2]}.`],
      explicacion: `${vals.join(' + ')} = ${total}.`,
    };
  },
};

const { tablas, arregloSurcos, gruposIguales, surcosProblema, algoritmoMult, multProblema, razonable: razonableMult, produccion, tienda, tablaDatos } = plantillasG3;

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

export const g2: DefinicionPista = {
  pista: 'g2',
  limite: 10000,
  plantillas: [
    bloques,
    cifraValor,
    comparar,
    recta,
    algoritmoSuma,
    algoritmoResta,
    calculo,
    sumaProblema,
    restaProblema,
    comparacion,
    empaque,
    dinero,
    vueltas,
    arreglo,
    sumaRepetida,
    grupos,
    reparto,
    razonable,
    tabla,
    tablas,
    arregloSurcos,
    gruposIguales,
    surcosProblema,
    algoritmoMult,
    multProblema,
    razonableMult,
    produccion,
    tienda,
    tablaDatos,
  ],
  temas: [
    {
      titulo: 'Repaso: sumar y restar hasta 999',
      usos: [
        u(algoritmoSuma),
        u(algoritmoResta),
        u(bloques),
        u(cifraValor),
        u(comparar, { max: 999 }),
        u(recta, { paso: 10 }),
        u(calculo, { op: 'mixta' }),
        u(sumaProblema),
        u(restaProblema),
        u(comparacion),
        u(empaque),
        u(razonable, { op: 'mixta' }),
        u(tabla, { modo: 'total' }),
      ],
    },
    {
      titulo: 'Grupos iguales y suma repetida',
      usos: [u(sumaRepetida), u(grupos), u(arreglo)],
    },
    {
      titulo: 'Arreglos de surcos',
      usos: [u(arregloSurcos, { maxTabla: 6 }), u(arreglo, { factores: '2,3,4,5' })],
    },
    {
      titulo: 'Tablas del 2, del 5 y del 10',
      usos: [u(tablas, { tablas: '2,5,10' }), u(grupos, { factores: '2,5,10' }), u(gruposIguales, { tablas: '2,5,10' }), u(arregloSurcos, { tablas: '2,5,10' })],
    },
    {
      titulo: 'Tablas del 3 y del 4',
      usos: [u(tablas, { tablas: '3,4' }), u(grupos, { factores: '3,4' }), u(gruposIguales, { tablas: '3,4' }), u(arregloSurcos, { tablas: '3,4' })],
    },
    {
      titulo: 'Tablas del 6 al 9',
      usos: [u(tablas, { tablas: '6,7,8,9' }), u(arregloSurcos, { tablas: '6,7,8,9' }), u(gruposIguales, { tablas: '6,7,8,9' }), u(surcosProblema, { tablas: '6,7,8,9' })],
    },
    {
      titulo: 'Problemas de grupos iguales',
      usos: [u(gruposIguales), u(surcosProblema), u(grupos, { factores: '2,3,4,5,10' }), u(reparto), u(tabla, { modo: 'mayor' })],
    },
    {
      titulo: 'Multiplicar 2 cifras por 1 cifra',
      usos: [u(algoritmoMult, { cifras: 2 }), u(multProblema, { cifras: 2 }), u(razonableMult, { op: 'mult' })],
    },
    {
      titulo: 'Multiplicar 3 cifras por 1 cifra',
      usos: [u(algoritmoMult, { cifras: 3 }), u(multProblema, { cifras: 3 }), u(produccion, { op: 'mult' })],
    },
    {
      titulo: 'Multiplicar en la tienda y la finca',
      usos: [u(tienda, { op: 'mult' }), u(dinero, { modo: 'compra' }), u(vueltas), u(multProblema), u(tablaDatos, { modo: 'mult' })],
    },
  ],
};
