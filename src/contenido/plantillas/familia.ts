// Plantillas de la pista Familia: problemas del hogar y la producción, con trato de usted.
// Precios, rendimientos y porcentajes son datos de ejemplo, no valores reales.

import type { ContextoGeneracion, DefinicionPista, EjercicioBase, Interaccion, Plantilla, Uso } from '../../juego/tipos';
import type { Rng } from '../../juego/rng';
import { adulto, articulosTienda, mayus, num, pesos, type Genero } from '../contexto';
import { restaMenorMayor } from '../../juego/errores';
import { dif, distractores, lerp, lerpF, mezclarOpciones, pn, pt } from './util';

// --- Ayudantes locales ---

const quien = (rng: Rng, excluir: string[] = []): string => mayus(adulto(rng, excluir).nombre);

/** Nombre a mitad de frase: "doña Rosa", "el profe Julián". */
const minus = (nombre: string): string => nombre.charAt(0).toLowerCase() + nombre.slice(1);

/** "de" + nombre con contracción: "del profe Julián", "de doña Rosa". */
const de = (nombre: string): string => (nombre.startsWith('el ') ? 'del ' + nombre.slice(3) : 'de ' + nombre);

/** Múltiplo de `paso` entre min y max. */
function redondo(rng: Rng, min: number, max: number, paso: number): number {
  const lo = Math.max(1, Math.ceil(min / paso));
  const hi = Math.max(lo, Math.floor(max / paso));
  return rng.entero(lo, hi) * paso;
}

/** Distractores cercanos: más lejanos con d bajo, más cercanos con d alto. */
function cercanos(r: number, paso: number, d: number): number[] {
  return d < 0.5 ? [r + 10 * paso, r - 10 * paso, r + 5 * paso, r * 10] : [r + paso, r - paso, r + 2 * paso, r - 2 * paso];
}

/** Opción múltiple o teclado (más teclado con d alto). */
function responder(ctx: ContextoGeneracion, r: number, candidatos: number[], min = 0.3, max = 0.85): { interaccion: Interaccion; distractores: number[] } {
  const d = dif(ctx);
  const distr = distractores(ctx.rng, r, candidatos, 3, d);
  const p = ctx.repaso ? 0.2 : lerpF(min, max, d);
  if (ctx.rng.azar(p)) return { interaccion: { tipo: 'numerica' }, distractores: distr };
  return { interaccion: { tipo: 'opciones', opciones: mezclarOpciones(ctx.rng, r, distr) }, distractores: distr };
}

/** Opciones para una tabla (o teclado si sale respuesta abierta). */
function opcionesTabla(ctx: ContextoGeneracion, r: number, candidatos: number[]): { opciones?: number[]; distractores: number[] } {
  const res = responder(ctx, r, candidatos);
  return { opciones: res.interaccion.tipo === 'opciones' ? (res.interaccion.opciones as number[]) : undefined, distractores: res.distractores };
}

/** Plural del primer sustantivo: "libra de arroz" → "libras de arroz". */
function plural(nombre: string): string {
  const [primera, ...resto] = nombre.split(' ');
  let p: string;
  if (primera.endsWith('z')) p = primera.slice(0, -1) + 'ces';
  else if (primera.endsWith('ón')) p = primera.slice(0, -2) + 'ones';
  else if (/[aeiou]$/.test(primera)) p = primera + 's';
  else p = primera + 'es';
  return [p, ...resto].join(' ');
}

const cada = (g: Genero) => (g === 'f' ? 'cada una' : 'cada uno');

function enumerar(partes: string[]): string {
  return partes.length <= 1 ? partes.join('') : partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1];
}

type Item = { nombre: string; precio: number; genero: Genero; cant: number };

function compra(rng: Rng, nItems: number, maxCant: number): Item[] {
  return rng
    .barajar(articulosTienda)
    .slice(0, nItems)
    .map((a) => ({ ...a, cant: rng.entero(1, maxCant) }));
}

function textoCompra(items: Item[]): string {
  return enumerar(items.map((a) => (a.cant === 1 ? `${a.genero === 'f' ? 'una' : 'un'} ${a.nombre} de ${pesos(a.precio)}` : `${a.cant} ${plural(a.nombre)} de ${pesos(a.precio)} ${cada(a.genero)}`)));
}

const totalCompra = (items: Item[]) => items.reduce((s, a) => s + a.cant * a.precio, 0);

const PORCENTAJES = [10, 25, 50] as const;
const PARTE: Record<number, string> = { 10: 'La décima parte', 25: 'La cuarta parte', 50: 'La mitad' };

// --- Plantillas ---

const calculoMental: Plantilla = {
  id: 'fam-calculo-mental',
  dimension: 'procedimiento',
  operacion: 'mixta',
  descripcion: 'Cálculo mental con dinero: sumar, restar y multiplicar precios redondos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const max = pn(ctx, 'max', 20000);
    let op = pt(ctx, 'op', 'suma');
    if (op === 'mixta') op = rng.azar(0.5) ? 'suma' : 'resta';
    const paso = d < 0.5 ? 1000 : 500;
    const q = quien(rng);
    if (op === 'mult') {
      const art = rng.elegir([
        { s: 'kilo de aguacate', p: 'kilos de aguacate', g: 'm' as Genero },
        { s: 'docena de huevos', p: 'docenas de huevos', g: 'f' as Genero },
        { s: 'kilo de limón', p: 'kilos de limón', g: 'm' as Genero },
        { s: 'racimo de plátano', p: 'racimos de plátano', g: 'm' as Genero },
        { s: 'panela', p: 'panelas', g: 'f' as Genero },
      ]);
      const precio = redondo(rng, 1000, lerp(4000, 15000, d), paso);
      const n = rng.entero(2, lerp(5, 12, d));
      const r = precio * n;
      return {
        enunciado: `En el mercado del pueblo, ${art.g === 'f' ? 'una' : 'un'} ${art.s} cuesta ${pesos(precio)} (precio de ejemplo). Calcule mentalmente cuánto cuestan ${n} ${art.p}.`,
        instruccion: 'Calcule mentalmente',
        datos: { precio, n },
        respuesta: r,
        ...responder(ctx, r, [precio * (n + 1), precio * (n - 1), precio + n * 1000, r * 10, ...cercanos(r, 1000, d)]),
        calculo: { op: 'multiplicacion', a: precio, b: n },
        operacion: 'multiplicacion',
        pistas: [
          '¿Le sirve pensar primero en los miles y después en los cientos?',
          { tipo: 'texto', texto: `${n} veces ${pesos(precio)}` },
          precio % 1000 === 0
            ? `Multiplique ${n} × ${num(precio / 1000)} mil.`
            : `Multiplique por partes: ${n} × ${num(Math.floor(precio / 1000) * 1000)} y luego ${n} × ${num(precio % 1000)}.`,
        ],
        explicacion: `${n} × ${pesos(precio)} = ${pesos(r)}.`,
      };
    }
    if (op === 'resta') {
      const a = redondo(rng, 2 * paso, max, paso);
      const b = redondo(rng, paso, a - paso, paso);
      const r = a - b;
      const enunciado = rng.elegir([
        `${q} llevó ${pesos(a)} al mercado del pueblo y gastó ${pesos(b)}. Calcule mentalmente cuánto le quedó.`,
        `Usted tiene ${pesos(a)} en el bolsillo y paga ${pesos(b)} en la tienda de la vereda. ¿Cuánto le queda? Hágalo mentalmente.`,
        `Para la semana hay ${pesos(a)} y ya se gastaron ${pesos(b)}. Calcule mentalmente cuánto falta por gastar.`,
      ]);
      return {
        enunciado,
        instruccion: 'Calcule mentalmente',
        datos: { a, b },
        respuesta: r,
        ...responder(ctx, r, [a + b, restaMenorMayor(a, b), ...cercanos(r, paso, d)]),
        calculo: { op: 'resta', a, b },
        operacion: 'resta',
        pistas: [
          '¿Puede contar desde lo que gastó hasta lo que tenía?',
          { tipo: 'texto', texto: `${pesos(a)} − ${pesos(b)}` },
          `Quite primero los miles y luego los cientos de ${pesos(b)}.`,
        ],
        explicacion: `${pesos(a)} − ${pesos(b)} = ${pesos(r)}.`,
      };
    }
    const a = redondo(rng, paso, Math.max(paso, max * 0.6), paso);
    const b = redondo(rng, paso, max - a, paso);
    const r = a + b;
    const enunciado = rng.elegir([
      `${q} anotó en el cuaderno de la finca dos ventas del día: ${pesos(a)} por huevos y ${pesos(b)} por limones. Calcule mentalmente el total.`,
      `Para el refrigerio de la escuela, usted aporta ${pesos(a)} y una vecina aporta ${pesos(b)}. ¿Cuánto reúnen entre las dos familias? Hágalo mentalmente.`,
      `${q} pagó ${pesos(a)} por el pasaje en la chiva y ${pesos(b)} por el almuerzo. ¿Cuánto gastó en total? Calcule mentalmente.`,
    ]);
    return {
      enunciado,
      instruccion: 'Calcule mentalmente',
      datos: { a, b },
      respuesta: r,
      ...responder(ctx, r, [Math.abs(a - b), ...cercanos(r, paso, d)]),
      calculo: { op: 'suma', a, b },
      operacion: 'suma',
      pistas: [
        '¿Le sirve juntar primero los miles y después los cientos?',
        { tipo: 'texto', texto: `${pesos(a)} + ${pesos(b)}` },
        `Junte los miles de ambos valores y después sume los cientos que sobran.`,
      ],
      explicacion: `${pesos(a)} + ${pesos(b)} = ${pesos(r)}.`,
    };
  },
};

const estimarCompra: Plantilla = {
  id: 'fam-estimar-compra',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: '¿Es razonable el cobro de la tienda? Estimar al millar',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const items = compra(rng, d < 0.4 ? 2 : 3, lerp(2, 5, d));
    const total = totalCompra(items);
    const est = Math.max(1000, Math.round(total / 1000) * 1000);
    const desv = rng.elegir([5000, 8000, 10000, total * 9]);
    const esRaz = rng.azar(0.5);
    const propuesto = esRaz ? total : total - desv > 0 && rng.azar(0.5) ? total - desv : total + desv;
    const distr = [est + 3000, est - 3000 > 0 ? est - 3000 : est + 6000];
    return {
      enunciado: `${quien(rng)} compró en la tienda de la vereda ${textoCompra(items)} (precios de ejemplo). El tendero le cobra ${pesos(propuesto)}. ¿Le parece razonable ese cobro? Luego elija la mejor estimación del total.`,
      instruccion: '¿Tiene sentido?',
      datos: { total, propuesto, est },
      respuesta: `${esRaz ? 'si' : 'no'}:${est}`,
      distractores: distr,
      interaccion: { tipo: 'razonable', propuesto, esRazonable: esRaz, opciones: rng.barajar([est, ...distr]) },
      calculo: { op: 'suma', a: total - items[0].cant * items[0].precio, b: items[0].cant * items[0].precio },
      pistas: [
        'Redondee cada valor al millar más cercano y súmelos.',
        { tipo: 'texto', texto: items.map((a) => `${a.cant} × ${pesos(a.precio)}`).join(' + ') },
        `El total exacto es ${pesos(total)}; redondeado al millar, unos ${pesos(est)}.`,
      ],
      explicacion: `La compra suma ${pesos(total)}, cerca de ${pesos(est)}. ${esRaz ? `Cobrar ${pesos(propuesto)} es razonable.` : `${pesos(propuesto)} está muy lejos de ese valor: no es razonable.`}`,
    };
  },
};

const rectaDinero: Plantilla = {
  id: 'fam-recta-dinero',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Ubicar en la recta numérica una suma de dinero',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 20000);
    const paso = pn(ctx, 'paso', 1000);
    const a = redondo(rng, paso, max - paso, paso);
    const b = redondo(rng, paso, max - a, paso);
    const r = a + b;
    const q = quien(rng);
    return {
      enunciado: rng.elegir([
        `${q} guardó ${pesos(a)} el lunes y ${pesos(b)} el martes en la alcancía de la casa. Toque en la recta el total que reunió.`,
        `En la feria del pueblo, ${minus(q)} vendió arepas por ${pesos(a)} en la mañana y por ${pesos(b)} en la tarde. Ubique en la recta el total del día.`,
      ]),
      instruccion: 'Toque el valor',
      datos: { a, b },
      respuesta: r,
      distractores: [r + paso, r - paso].filter((x) => x >= 0),
      interaccion: { tipo: 'recta', min: 0, max, paso, inicio: a },
      calculo: { op: 'suma', a, b },
      pistas: [
        `Cada marca de la recta vale ${pesos(paso)}. ¿Desde dónde empieza a contar?`,
        { tipo: 'recta', min: 0, max, desde: a, saltos: [b] },
        `Parta de ${pesos(a)} y avance ${b / paso} ${b / paso === 1 ? 'marca' : 'marcas'}.`,
      ],
      explicacion: `${pesos(a)} + ${pesos(b)} = ${pesos(r)}.`,
    };
  },
};

const vueltas: Plantilla = {
  id: 'fam-vueltas',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Vueltos al pagar con un billete',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const n = d < 0.3 ? 1 : d < 0.7 ? 2 : 3;
    const items = compra(rng, n, d < 0.5 ? 1 : 3);
    const total = totalCompra(items);
    const billetes = [2000, 5000, 10000, 20000, 50000, 100000].filter((b) => b > total);
    const billete = rng.elegir(billetes.slice(0, 2));
    const r = billete - total;
    const extra = articulosTienda.find((a) => !items.some((i) => i.nombre === a.nombre))!;
    const sobra = d > 0.6 ? ` En el mostrador también había ${extra.genero === 'f' ? 'una' : 'un'} ${extra.nombre} de ${pesos(extra.precio)}, pero no ${extra.genero === 'f' ? 'la' : 'lo'} llevó.` : '';
    return {
      enunciado: `${quien(rng)} compró en la tienda de la vereda ${textoCompra(items)} (precios de ejemplo). Pagó con un billete de ${pesos(billete)}.${sobra} ¿Cuánto le deben devolver?`,
      instruccion: 'Calcule el vuelto',
      datos: { total, billete },
      respuesta: r,
      unidad: 'pesos',
      ...responder(ctx, r, [total, restaMenorMayor(billete, total), billete + total, ...cercanos(r, 500, d)]),
      calculo: { op: 'resta', a: billete, b: total },
      pistas: [
        n > 1 ? 'Primero calcule cuánto suma la compra. ¿Qué hace luego con el billete?' : '¿Cuánto falta desde el precio hasta el valor del billete?',
        { tipo: 'texto', texto: `Billete ${pesos(billete)} − compra ${pesos(total)}` },
        `La compra vale ${pesos(total)}. Cuente desde ${pesos(total)} hasta ${pesos(billete)}.`,
      ],
      explicacion: `La compra suma ${pesos(total)}. ${pesos(billete)} − ${pesos(total)} = ${pesos(r)} de vuelto.`,
    };
  },
};

const compraVarios: Plantilla = {
  id: 'fam-compra-varios',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Comprar varias unidades del mismo producto o cuántas alcanzan',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const art = rng.elegir(articulosTienda);
    const n = rng.entero(2, lerp(6, 15, d));
    const total = n * art.precio;
    const q = quien(rng);
    if (d > 0.4 && rng.azar(0.5)) {
      return {
        enunciado: `Con ${pesos(total)}, ¿${art.genero === 'f' ? 'cuántas' : 'cuántos'} ${plural(art.nombre)} de ${pesos(art.precio)} puede comprar ${minus(q)} sin que le sobre dinero? (precio de ejemplo)`,
        instruccion: 'Reparta el dinero',
        datos: { total, precio: art.precio },
        respuesta: n,
        ...responder(ctx, n, [n + 1, n - 1, n + 2, n * 10]),
        calculo: { op: 'division', a: total, b: art.precio },
        operacion: 'division',
        pistas: [
          `¿Cuántas veces cabe ${pesos(art.precio)} en ${pesos(total)}?`,
          { tipo: 'texto', texto: `${pesos(total)} ÷ ${pesos(art.precio)}` },
          `Vaya sumando ${pesos(art.precio)} hasta llegar a ${pesos(total)} y cuente las veces.`,
        ],
        explicacion: `${pesos(total)} ÷ ${pesos(art.precio)} = ${n}.`,
      };
    }
    return {
      enunciado: rng.elegir([
        `${q} necesita ${n} ${plural(art.nombre)} para la casa. ${mayus(cada(art.genero))} cuesta ${pesos(art.precio)} (precio de ejemplo). ¿Cuánto debe pagar?`,
        `Para la semana, usted compra ${n} ${plural(art.nombre)} a ${pesos(art.precio)} ${cada(art.genero)} (precio de ejemplo). ¿Cuánto paga en total?`,
      ]),
      instruccion: 'Calcule el total',
      datos: { n, precio: art.precio },
      respuesta: total,
      unidad: 'pesos',
      ...responder(ctx, total, [art.precio * (n + 1), art.precio * (n - 1), art.precio + n, total * 10, ...cercanos(total, 500, d)]),
      calculo: { op: 'multiplicacion', a: art.precio, b: n },
      pistas: [
        '¿Se suma el mismo precio varias veces? ¿Qué operación lo hace más rápido?',
        { tipo: 'texto', texto: `${n} × ${pesos(art.precio)}` },
        `Multiplique ${n} × ${num(art.precio)}.`,
      ],
      explicacion: `${n} × ${pesos(art.precio)} = ${pesos(total)}.`,
    };
  },
};

const GASTOS = ['Mercado', 'Pasajes en la chiva', 'Útiles escolares', 'Recibo de la luz', 'Gas', 'Concentrado para las gallinas'];

const presupuesto: Plantilla = {
  id: 'fam-presupuesto',
  dimension: 'aplicacion',
  operacion: 'suma',
  descripcion: 'Presupuesto semanal en una tabla',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const max = pn(ctx, 'max', lerp(30000, 120000, d));
    const nFilas = pn(ctx, 'filas', d < 0.5 ? 3 : 4);
    const nombres = rng.barajar(GASTOS).slice(0, nFilas);
    const valores = nombres.map(() => redondo(rng, 5000, max, 5000));
    const filas = nombres.map((n, i) => [n, pesos(valores[i])]);
    const total = valores.reduce((s, v) => s + v, 0);
    const conSaldo = ctx.params.conSaldo === true || d > 0.6;
    const titulo = `${quien(rng)} anotó en el cuaderno de la finca los gastos de la semana (valores de ejemplo).`;
    if (conSaldo) {
      const presu = Math.ceil((total + 10000) / 50000) * 50000;
      const r = presu - total;
      const op = opcionesTabla(ctx, r, [total, presu + total, ...cercanos(r, 5000, d)]);
      return {
        enunciado: `${titulo} El presupuesto de la semana era de ${pesos(presu)}. ¿Cuánto dinero le queda?`,
        instruccion: 'Lea la tabla',
        datos: { total, presupuesto: presu },
        respuesta: r,
        unidad: 'pesos',
        distractores: op.distractores,
        interaccion: { tipo: 'tabla', encabezados: ['Gasto de la semana', 'Valor'], filas, opciones: op.opciones },
        calculo: { op: 'resta', a: presu, b: total },
        pistas: [
          'Son dos pasos: ¿cuánto se gastó en total y cuánto queda del presupuesto?',
          { tipo: 'texto', texto: `Gastos: ${valores.map(pesos).join(' + ')}` },
          `Los gastos suman ${pesos(total)}. Ahora haga ${pesos(presu)} − ${pesos(total)}.`,
        ],
        explicacion: `Gastos: ${pesos(total)}. ${pesos(presu)} − ${pesos(total)} = ${pesos(r)}.`,
      };
    }
    if (d > 0.3 && nFilas > 2) {
      const r = valores[0] + valores[1];
      const op = opcionesTabla(ctx, r, [total, Math.abs(valores[0] - valores[1]), ...cercanos(r, 5000, d)]);
      return {
        enunciado: `${titulo} ¿Cuánto gastó entre «${nombres[0]}» y «${nombres[1]}»?`,
        instruccion: 'Lea la tabla',
        datos: { a: valores[0], b: valores[1] },
        respuesta: r,
        unidad: 'pesos',
        distractores: op.distractores,
        interaccion: { tipo: 'tabla', encabezados: ['Gasto de la semana', 'Valor'], filas, opciones: op.opciones },
        calculo: { op: 'suma', a: valores[0], b: valores[1] },
        pistas: ['Solo necesita dos filas de la tabla. ¿Cuáles?', { tipo: 'texto', texto: `${pesos(valores[0])} + ${pesos(valores[1])}` }, `Sume ${pesos(valores[0])} y ${pesos(valores[1])}.`],
        explicacion: `${pesos(valores[0])} + ${pesos(valores[1])} = ${pesos(r)}. Los demás gastos no se necesitan.`,
      };
    }
    const ultimo = valores[valores.length - 1];
    const op = opcionesTabla(ctx, total, [total - ultimo, total + ultimo, ...cercanos(total, 5000, d)]);
    return {
      enunciado: `${titulo} ¿Cuánto gastó en total?`,
      instruccion: 'Lea la tabla',
      datos: { total },
      respuesta: total,
      unidad: 'pesos',
      distractores: op.distractores,
      interaccion: { tipo: 'tabla', encabezados: ['Gasto de la semana', 'Valor'], filas, opciones: op.opciones },
      calculo: { op: 'suma', a: total - ultimo, b: ultimo },
      pistas: ['¿Qué operación junta todos los gastos?', { tipo: 'texto', texto: valores.map(pesos).join(' + ') }, `Sume los valores de arriba hacia abajo, uno por uno.`],
      explicacion: `${valores.map(pesos).join(' + ')} = ${pesos(total)}.`,
    };
  },
};

const VENTAS = [
  { pl: 'kilos de aguacate', u: 'el kilo', min: 2000, max: 5000 },
  { pl: 'docenas de huevos', u: 'la docena', min: 6000, max: 9000 },
  { pl: 'kilos de naranja', u: 'el kilo', min: 1000, max: 2500 },
  { pl: 'racimos de plátano', u: 'el racimo', min: 8000, max: 15000 },
  { pl: 'kilos de yuca', u: 'el kilo', min: 1000, max: 2500 },
  { pl: 'kilos de mandarina', u: 'el kilo', min: 1500, max: 3000 },
];

const ventaMercado: Plantilla = {
  id: 'fam-venta-mercado',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Ventas en el mercado del pueblo (uno o dos productos)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const [v1, v2] = rng.barajar(VENTAS);
    const k1 = rng.entero(lerp(5, 10, d), lerp(15, 60, d));
    const p1 = redondo(rng, v1.min, v1.max, 500);
    const q = quien(rng);
    if (d >= 0.5 && rng.azar(0.5)) {
      const k2 = rng.entero(5, lerp(15, 40, d));
      const p2 = redondo(rng, v2.min, v2.max, 500);
      const i1 = k1 * p1;
      const i2 = k2 * p2;
      const r = i1 + i2;
      return {
        enunciado: `${q} vendió en el mercado del pueblo ${k1} ${v1.pl} a ${pesos(p1)} ${v1.u} y ${k2} ${v2.pl} a ${pesos(p2)} ${v2.u} (precios de ejemplo). ¿Cuánto recibió en total?`,
        instruccion: 'Calcule la venta',
        datos: { k1, p1, k2, p2 },
        respuesta: r,
        unidad: 'pesos',
        ...responder(ctx, r, [i1, i2, k1 * p2 + k2 * p1, ...cercanos(r, 1000, d)]),
        calculo: { op: 'suma', a: i1, b: i2 },
        operacion: 'mixta',
        pistas: [
          'Calcule cada venta por separado y luego júntelas.',
          { tipo: 'texto', texto: `${k1} × ${pesos(p1)} + ${k2} × ${pesos(p2)}` },
          `Primera venta: ${pesos(i1)}. Segunda venta: ${pesos(i2)}.`,
        ],
        explicacion: `${pesos(i1)} + ${pesos(i2)} = ${pesos(r)}.`,
      };
    }
    const r = k1 * p1;
    return {
      enunciado: rng.elegir([
        `${q} llevó al mercado del pueblo ${k1} ${v1.pl} y los vendió a ${pesos(p1)} ${v1.u} (precio de ejemplo). ¿Cuánto dinero recibió?`,
        `En la feria del pueblo, una familia vendió ${k1} ${v1.pl} a ${pesos(p1)} ${v1.u} (precio de ejemplo). ¿Cuánto recibió por la venta?`,
      ]),
      instruccion: 'Calcule la venta',
      datos: { k: k1, p: p1 },
      respuesta: r,
      unidad: 'pesos',
      ...responder(ctx, r, [p1 * (k1 + 1), p1 * (k1 - 1), k1 + p1, r * 10, ...cercanos(r, 1000, d)]),
      calculo: { op: 'multiplicacion', a: p1, b: k1 },
      pistas: ['¿Cuántas veces se cobra el precio?', { tipo: 'texto', texto: `${k1} × ${pesos(p1)}` }, `Multiplique ${k1} × ${num(p1)}.`],
      explicacion: `${k1} × ${pesos(p1)} = ${pesos(r)}.`,
    };
  },
};

const rendimiento: Plantilla = {
  id: 'fam-rendimiento',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Producción por árbol: mazorcas, café y aguacate',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const q = quien(rng);
    const sobra = d > 0.6 ? ` La finca queda a ${rng.entero(1, 3)} horas a pie del casco urbano de San Vicente.` : '';
    const tipo = rng.elegir(['cacao', 'cafe', 'aguacate']);
    if (tipo === 'aguacate') {
      const n = rng.entero(5, lerp(12, 30, d));
      const k = redondo(rng, 20, lerp(40, 80, d), 5);
      const t = n * k;
      return {
        enunciado: `${q} cosechó ${num(t)} kilos de aguacate de ${n} árboles, y todos dieron la misma cantidad (dato del ejercicio).${sobra} ¿Cuántos kilos dio cada árbol?`,
        instruccion: 'Calcule por árbol',
        datos: { t, n },
        respuesta: k,
        unidad: 'kilos',
        ...responder(ctx, k, [k + 5, k - 5, t - n, k * 10, k + 1]),
        calculo: { op: 'division', a: t, b: n },
        operacion: 'division',
        pistas: ['Si reparte la cosecha por igual entre los árboles, ¿qué operación hace?', { tipo: 'texto', texto: `${num(t)} ÷ ${n}` }, `Busque qué número multiplicado por ${n} da ${num(t)}.`],
        explicacion: `${num(t)} ÷ ${n} = ${k} kilos por árbol.`,
      };
    }
    const cacao = tipo === 'cacao';
    const n = cacao ? rng.entero(lerp(10, 40, d), lerp(60, 300, d)) : redondo(rng, lerp(100, 300, d), lerp(500, 2000, d), 50);
    const m = cacao ? rng.entero(10, 30) : rng.entero(2, 5);
    const r = n * m;
    return {
      enunciado: cacao
        ? `En el último corte, cada árbol del lote ${de(minus(q))} dio en promedio ${m} mazorcas (dato del ejercicio). Si el lote tiene ${n} árboles, ¿cuántas mazorcas cosechó?${sobra}`
        : `${q} tiene ${num(n)} árboles de café. Si cada árbol da ${m} kilos de café cereza en la cosecha (dato del ejercicio), ¿cuántos kilos recoge en total?${sobra}`,
      instruccion: 'Calcule la cosecha',
      datos: { n, m },
      respuesta: r,
      unidad: cacao ? 'mazorcas' : 'kilos',
      ...responder(ctx, r, [n * (m + 1), n * (m - 1), n + m, r * 10, ...cercanos(r, 10, d)]),
      calculo: { op: 'multiplicacion', a: n, b: m },
      pistas: ['Cada árbol aporta lo mismo. ¿Qué operación repite esa cantidad por cada árbol?', { tipo: 'texto', texto: `${num(n)} × ${m}` }, `Multiplique ${num(n)} × ${m}.`],
      explicacion: `${num(n)} × ${m} = ${num(r)}.`,
    };
  },
};

const bultos: Plantilla = {
  id: 'fam-bultos',
  dimension: 'procedimiento',
  operacion: 'division',
  descripcion: 'Empacar en bultos de 50 kilos y viajes de la mula',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    let modo = pt(ctx, 'modo', 'exacto');
    if (modo === 'mixto') modo = rng.elegir(['exacto', 'residuo', 'viajes']);
    const q = quien(rng);
    if (modo === 'viajes') {
      const k = rng.elegir([2, 3]);
      let n = rng.entero(lerp(5, 10, d), lerp(12, 30, d));
      if (n % k === 0 && rng.azar(0.8)) n++;
      const r = Math.ceil(n / k);
      return {
        enunciado: `La mula ${de(minus(q))} carga ${k} bultos por viaje. ¿Cuántos viajes necesita para llevar ${n} bultos de cacao hasta la carretera?`,
        instruccion: 'Cuente los viajes',
        datos: { n, k },
        respuesta: r,
        unidad: 'viajes',
        ...responder(ctx, r, [Math.floor(n / k), r + 1, n - k, n * k]),
        calculo: { op: 'division', a: n, b: k, redondearArriba: true },
        pistas: [
          'Si sobran bultos al final, ¿se quedan en la finca o necesitan otro viaje?',
          { tipo: 'reparto', total: n, grupos: k, objeto: 'bulto' },
          `${n} ÷ ${k} = ${Math.floor(n / k)}, y sobran ${n % k}.`,
        ],
        explicacion: n % k === 0 ? `${n} ÷ ${k} = ${r} viajes.` : `${n} ÷ ${k} = ${Math.floor(n / k)} y sobran ${n % k}; esos también necesitan un viaje: ${r} viajes.`,
      };
    }
    const nb = rng.entero(lerp(3, 10, d), lerp(10, 60, d));
    if (modo === 'residuo') {
      const rem = redondo(rng, 5, 45, 5);
      const total = nb * 50 + rem;
      const preguntaSobra = rng.azar(0.4);
      const r = preguntaSobra ? rem : nb;
      return {
        enunciado: `${q} tiene ${num(total)} kilos de cacao seco para llevar a la cooperativa de cacaoteros y los empaca en bultos de 50 kilos. ${preguntaSobra ? '¿Cuántos kilos sobran después de llenar los bultos completos?' : '¿Cuántos bultos completos llena?'}`,
        instruccion: preguntaSobra ? 'Calcule lo que sobra' : 'Cuente los bultos',
        datos: { total, nb, rem },
        respuesta: r,
        unidad: preguntaSobra ? 'kilos' : 'bultos',
        ...responder(ctx, r, preguntaSobra ? [rem + 5, 50 - rem, rem + 10, nb] : [nb + 1, nb - 1, rem, nb * 10]),
        calculo: { op: 'division', a: total, b: 50 },
        permiteResiduo: true,
        pistas: ['¿Cuántas veces caben 50 kilos en el total?', { tipo: 'texto', texto: `${num(total)} ÷ 50` }, `${nb} bultos son ${num(nb * 50)} kilos.`],
        explicacion: `${num(total)} ÷ 50 = ${nb} bultos completos y sobran ${rem} kilos.`,
      };
    }
    const total = nb * 50;
    return {
      enunciado: `${q} empaca ${num(total)} kilos de cacao seco en bultos de 50 kilos. ¿Cuántos bultos llena?`,
      instruccion: 'Cuente los bultos',
      datos: { total },
      respuesta: nb,
      unidad: 'bultos',
      ...responder(ctx, nb, [nb + 1, nb - 1, nb * 10, total - 50]),
      calculo: { op: 'division', a: total, b: 50 },
      pistas: ['¿Cuántas veces caben 50 kilos en el total?', { tipo: 'texto', texto: `${num(total)} ÷ 50` }, `Dos bultos son 100 kilos. ¿Cuántos cientos hay en ${num(total)}?`],
      explicacion: `${num(total)} ÷ 50 = ${nb} bultos.`,
    };
  },
};

const jornales: Plantilla = {
  id: 'fam-jornales',
  dimension: 'aplicacion',
  operacion: 'multiplicacion',
  descripcion: 'Pago de jornales por trabajadores y días',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const pago = redondo(rng, 50000, 80000, 5000);
    const t = d < 0.4 ? 1 : rng.entero(2, lerp(3, 6, d));
    const dias = rng.entero(2, 6);
    const jornales = t * dias;
    const r = jornales * pago;
    const labor = rng.elegir(['la recolección de cacao', 'la limpia del cacaotal', 'la poda de los árboles de cacao', 'la recolección de café']);
    const sobra = d > 0.6 ? ` La finca tiene ${num(redondo(rng, 300, 1500, 50))} árboles en producción.` : '';
    return {
      enunciado: `Para ${labor}, ${minus(quien(rng))} contrató ${t === 1 ? 'a 1 trabajador' : `a ${t} trabajadores`} durante ${dias} días. Cada jornal se paga a ${pesos(pago)} (valor de ejemplo).${sobra} ¿Cuánto debe pagar en total?`,
      instruccion: 'Calcule el pago',
      datos: { t, dias, pago },
      respuesta: r,
      unidad: 'pesos',
      ...responder(ctx, r, [pago * dias, pago * t, pago * (t + dias), (jornales + 1) * pago, ...cercanos(r, 5000, d)]),
      calculo: { op: 'multiplicacion', a: jornales, b: pago },
      pistas: [
        'Un jornal es el pago de un día de trabajo de una persona. ¿Cuántos jornales hay?',
        { tipo: 'arreglo', filas: Math.min(t, 10), columnas: dias },
        `${t} × ${dias} = ${jornales} jornales. Ahora multiplique por ${pesos(pago)}.`,
      ],
      explicacion: `${t} × ${dias} = ${jornales} jornales; ${jornales} × ${pesos(pago)} = ${pesos(r)}.`,
    };
  },
};

const porcentajeConcepto: Plantilla = {
  id: 'fam-porcentaje-concepto',
  dimension: 'comprension',
  operacion: 'division',
  descripcion: 'Qué significa el 10, el 25 y el 50 %',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    if (d < 0.5 || rng.azar(0.4)) {
      const p = rng.elegir(PORCENTAJES);
      const opciones = rng.barajar([PARTE[10], PARTE[25], PARTE[50], 'Tres cuartas partes']);
      const lugar = rng.elegir(['En la feria del pueblo anuncian', 'En el almacén agrícola ofrecen', 'La cooperativa de cacaoteros ofrece']);
      return {
        enunciado: `${lugar} un descuento del ${p} %. ¿A qué parte del precio equivale ese descuento?`,
        instruccion: 'Elija la parte',
        datos: { p },
        respuesta: PARTE[p],
        distractores: opciones.filter((o) => o !== PARTE[p]),
        interaccion: { tipo: 'opciones', opciones },
        pistas: [
          'El 100 % es el precio completo. ¿Cuántas veces cabe este porcentaje en 100?',
          { tipo: 'texto', texto: `100 ÷ ${p} = ${100 / p}` },
          `El ${p} % es 1 de cada ${100 / p} partes iguales.`,
        ],
        explicacion: `El ${p} % es ${PARTE[p].toLowerCase()} del precio, porque 100 ÷ ${p} = ${100 / p}.`,
      };
    }
    // Comparar porcentajes de bases distintas.
    const p1 = rng.elegir(PORCENTAJES);
    const p2 = rng.elegir(PORCENTAJES.filter((x) => x !== p1));
    const b1 = redondo(rng, 20000, 200000, 20000);
    const igual = rng.azar(0.3);
    const b2 = igual ? (b1 * p1) / p2 : redondo(rng, 20000, 200000, 20000);
    const v1 = (b1 * p1) / 100;
    const v2 = (b2 * p2) / 100;
    const o1 = `El ${p1} % de ${pesos(b1)}`;
    const o2 = `El ${p2} % de ${pesos(b2)}`;
    const resp = v1 === v2 ? 'Son iguales' : v1 > v2 ? o1 : o2;
    const opciones = rng.barajar([o1, o2, 'Son iguales']);
    return {
      enunciado: `¿Qué es más dinero: el ${p1} % de ${pesos(b1)} o el ${p2} % de ${pesos(b2)}?`,
      instruccion: 'Compare',
      datos: { p1, p2, b1, b2 },
      respuesta: resp,
      distractores: opciones.filter((o) => o !== resp),
      interaccion: { tipo: 'opciones', opciones },
      pistas: [
        'Un porcentaje mayor no siempre da más dinero: depende de la cantidad de la que se saca.',
        { tipo: 'texto', texto: `${PARTE[p1]} de ${pesos(b1)} · ${PARTE[p2].toLowerCase()} de ${pesos(b2)}` },
        `El ${p1} % de ${pesos(b1)} es ${pesos(v1)}; el ${p2} % de ${pesos(b2)} es ${pesos(v2)}.`,
      ],
      explicacion: `${pesos(v1)} frente a ${pesos(v2)}: ${resp === 'Son iguales' ? 'son iguales' : `es más ${resp.charAt(0).toLowerCase() + resp.slice(1)}`}.`,
    };
  },
};

/** Base que da un porcentaje entero y redondo. */
function basePorcentaje(rng: Rng, p: number, min: number, max: number): number {
  return redondo(rng, min, max, p === 25 ? 4000 : p === 50 ? 2000 : 10000);
}

const porcentajeCalculo: Plantilla = {
  id: 'fam-porcentaje-calculo',
  dimension: 'procedimiento',
  operacion: 'division',
  descripcion: 'Calcular el 10, el 25 o el 50 % de una cantidad',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const p = rng.elegir(PORCENTAJES);
    const base = basePorcentaje(rng, p, 20000, lerp(100000, 2000000, d));
    const r = (base * p) / 100;
    const otros = PORCENTAJES.filter((x) => x !== p).map((x) => (base * x) / 100);
    const contexto = rng.elegir([
      `Calcule el ${p} % de ${pesos(base)}.`,
      `${quien(rng)} ahorra el ${p} % de lo que recibió por una venta de ${pesos(base)} (dato de ejemplo). ¿Cuánto ahorra?`,
      `La junta de acción comunal pide aportar el ${p} % de ${pesos(base)} para arreglar el camino de herradura (dato de ejemplo). ¿Cuánto es ese aporte?`,
    ]);
    return {
      enunciado: contexto,
      instruccion: 'Calcule el porcentaje',
      datos: { p, base },
      respuesta: r,
      unidad: 'pesos',
      ...responder(ctx, r, [...otros, base - r, r * 10, r / 10]),
      calculo: { op: 'division', a: base, b: 100 / p },
      pistas: [
        `El ${p} % es ${PARTE[p].toLowerCase()}. ¿Entre cuánto divide?`,
        { tipo: 'texto', texto: `${pesos(base)} ÷ ${100 / p}` },
        `Divida ${num(base)} entre ${100 / p}.`,
      ],
      explicacion: `El ${p} % de ${pesos(base)} es ${pesos(base)} ÷ ${100 / p} = ${pesos(r)}.`,
    };
  },
};

const secado: Plantilla = {
  id: 'fam-secado',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Pérdida de peso del cacao al secarse (porcentaje del ejercicio)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const p = rng.elegir(PORCENTAJES);
    const a = redondo(rng, lerp(40, 200, d), lerp(200, 2000, d), 20);
    const perdida = (a * p) / 100;
    const r = a - perdida;
    const lugar = rng.elegir(['en la elba', 'en la marquesina']);
    const preguntaPerdida = d < 0.3 && rng.azar(0.5);
    const resp = preguntaPerdida ? perdida : r;
    return {
      enunciado: `Al secarse ${lugar}, el cacao en baba pierde peso. Si de ${num(a)} kilos se pierde el ${p} % (es un dato del ejercicio, no un valor técnico real), ${preguntaPerdida ? '¿cuántos kilos se pierden?' : '¿cuántos kilos de cacao seco quedan?'}`,
      instruccion: preguntaPerdida ? 'Calcule la pérdida' : 'Calcule lo que queda',
      datos: { a, p },
      respuesta: resp,
      unidad: 'kilos',
      ...responder(ctx, resp, preguntaPerdida ? [r, a - p, perdida * 2, perdida + 10] : [perdida, a - p, a + perdida, r + 10, r - 10]),
      calculo: preguntaPerdida ? { op: 'division', a, b: 100 / p } : { op: 'resta', a, b: perdida },
      pistas: [
        preguntaPerdida ? `El ${p} % es ${PARTE[p].toLowerCase()}. ¿Cuánto es eso de ${num(a)}?` : 'Son dos pasos: primero cuánto se pierde y luego cuánto queda.',
        { tipo: 'texto', texto: `${PARTE[p]} de ${num(a)} kilos = ${num(a)} ÷ ${100 / p}` },
        `Se pierden ${num(perdida)} kilos.${preguntaPerdida ? '' : ` Ahora reste: ${num(a)} − ${num(perdida)}.`}`,
      ],
      explicacion: `El ${p} % de ${num(a)} es ${num(perdida)} kilos. ${preguntaPerdida ? '' : `Quedan ${num(a)} − ${num(perdida)} = ${num(r)} kilos.`}`.trim(),
    };
  },
};

const ARTICULOS_DESCUENTO = [
  { n: 'el bulto de abono', min: 80000, max: 160000 },
  { n: 'las botas de caucho', min: 30000, max: 60000 },
  { n: 'la carretilla', min: 150000, max: 250000 },
  { n: 'las tijeras de podar', min: 40000, max: 80000 },
  { n: 'el uniforme escolar', min: 50000, max: 90000 },
];

const descuento: Plantilla = {
  id: 'fam-descuento',
  dimension: 'aplicacion',
  operacion: 'resta',
  descripcion: 'Precio final con descuento del 10, 25 o 50 %',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const p = rng.elegir(PORCENTAJES);
    const art = rng.elegir(ARTICULOS_DESCUENTO);
    const precio = basePorcentaje(rng, p, art.min, art.max);
    const q = quien(rng);
    const varios = art.n === 'el bulto de abono' && d > 0.6;
    const n = varios ? rng.entero(2, 6) : 1;
    const bruto = precio * n;
    const desc = (bruto * p) / 100;
    const r = bruto - desc;
    return {
      enunciado: varios
        ? `En el almacén agrícola del casco urbano de San Vicente, el bulto de abono cuesta ${pesos(precio)} y, por comprar ${n} bultos, le hacen un descuento del ${p} % sobre el total (precios de ejemplo). ¿Cuánto paga ${minus(q)}?`
        : `En el almacén agrícola del casco urbano de San Vicente, ${art.n} ${art.n.startsWith('las') ? 'cuestan' : 'cuesta'} ${pesos(precio)} y ${art.n.startsWith('las') ? 'tienen' : 'tiene'} un descuento del ${p} % (precios de ejemplo). ¿Cuánto paga ${minus(q)}?`,
      instruccion: 'Calcule el precio final',
      datos: { precio, p, n },
      respuesta: r,
      unidad: 'pesos',
      ...responder(ctx, r, [desc, bruto, bruto + desc, ...cercanos(r, 1000, d)]),
      calculo: { op: 'resta', a: bruto, b: desc },
      pistas: [
        varios ? 'Son tres pasos: el total sin descuento, cuánto le descuentan y cuánto paga.' : 'Primero calcule cuánto le descuentan. ¿Qué hace después con ese valor?',
        { tipo: 'texto', texto: `Descuento: ${PARTE[p].toLowerCase()} de ${pesos(bruto)}` },
        `${varios ? `Sin descuento: ${n} × ${pesos(precio)} = ${pesos(bruto)}. ` : ''}Le descuentan ${pesos(desc)}.`,
      ],
      explicacion: `${varios ? `${n} × ${pesos(precio)} = ${pesos(bruto)}. ` : ''}El ${p} % de ${pesos(bruto)} es ${pesos(desc)}. Paga ${pesos(bruto)} − ${pesos(desc)} = ${pesos(r)}.`,
    };
  },
};

const arrobas: Plantilla = {
  id: 'fam-arrobas',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Convertir arrobas (12,5 kg) a kilos y kilos a arrobas',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const q = quien(rng);
    if (rng.azar(0.5)) {
      const n = 2 * rng.entero(1, lerp(5, 20, d));
      const r = n * 12.5;
      return {
        enunciado: `${q} vende el cacao por arrobas. Una arroba es 12,5 kilos. ¿Cuántos kilos hay en ${n} arrobas?`,
        instruccion: 'Convierta a kilos',
        datos: { n },
        respuesta: r,
        unidad: 'kilos',
        ...responder(ctx, r, [n * 12, n * 13, n * 10, n * 25]),
        calculo: { op: 'multiplicacion', a: n / 2, b: 25 },
        pistas: [
          'Dos arrobas son 25 kilos. ¿Cuántos pares de arrobas hay?',
          { tipo: 'texto', texto: `${n} arrobas = ${n / 2} × 25 kilos` },
          `${n} ÷ 2 = ${n / 2} pares; ${n / 2} × 25.`,
        ],
        explicacion: `${n} × 12,5 = ${num(r)} kilos (es lo mismo que ${n / 2} × 25).`,
      };
    }
    const m = rng.entero(1, lerp(4, 20, d));
    const kg = 25 * m;
    const r = 2 * m;
    return {
      enunciado: `${q} tiene ${num(kg)} kilos de cacao seco. Si una arroba es 12,5 kilos, ¿cuántas arrobas son?`,
      instruccion: 'Convierta a arrobas',
      datos: { kg },
      respuesta: r,
      unidad: 'arrobas',
      ...responder(ctx, r, [m, r + 1, r - 1, r + 2, kg / 5]),
      calculo: { op: 'division', a: kg * 2, b: 25 },
      pistas: ['25 kilos son 2 arrobas. ¿Cuántas veces caben 25 kilos en el total?', { tipo: 'texto', texto: `${num(kg)} ÷ 25 = ${m}` }, `${m} grupos de 25 kilos; cada grupo son 2 arrobas.`],
      explicacion: `${num(kg)} ÷ 25 = ${m}; ${m} × 2 = ${r} arrobas.`,
    };
  },
};

const gramos: Plantilla = {
  id: 'fam-gramos',
  dimension: 'procedimiento',
  operacion: 'division',
  descripcion: 'Kilos, gramos y libras: empacar café molido',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const q = quien(rng);
    const modo = rng.elegir(['gramos', 'bolsas', 'libras']);
    const k = rng.entero(2, lerp(6, 30, d));
    if (modo === 'gramos') {
      const r = k * 1000;
      return {
        enunciado: `${q} compró ${k} kilos de panela para la casa. ¿Cuántos gramos son? (1 kilo = 1.000 gramos)`,
        instruccion: 'Convierta a gramos',
        datos: { k },
        respuesta: r,
        unidad: 'gramos',
        ...responder(ctx, r, [k * 100, k * 10000, k * 500]),
        calculo: { op: 'multiplicacion', a: k, b: 1000 },
        operacion: 'multiplicacion',
        pistas: ['¿Cuántos gramos tiene un kilo?', { tipo: 'texto', texto: `${k} × 1.000` }, `Agregue tres ceros a ${k}.`],
        explicacion: `${k} × 1.000 = ${num(r)} gramos.`,
      };
    }
    if (modo === 'libras') {
      const r = k * 2;
      return {
        enunciado: `En la tienda de la vereda se vende el arroz por libras (1 libra = 500 gramos). ¿Cuántas libras salen de un bulto de ${k} kilos?`,
        instruccion: 'Convierta a libras',
        datos: { k },
        respuesta: r,
        unidad: 'libras',
        ...responder(ctx, r, [k, k * 5, r + 2, k * 1000]),
        calculo: { op: 'division', a: k * 1000, b: 500 },
        pistas: ['¿Cuántas libras hay en un kilo?', { tipo: 'texto', texto: '1 kilo = 1.000 g = 2 libras' }, `${k} kilos × 2 libras.`],
        explicacion: `Cada kilo son 2 libras: ${k} × 2 = ${r} libras.`,
      };
    }
    const g = rng.elegir([250, 500]);
    const r = (k * 1000) / g;
    return {
      enunciado: `${q} tostó y molió ${k} kilos de café para vender en el mercado del pueblo. Si lo empaca en bolsas de ${g} gramos, ¿cuántas bolsas llena?`,
      instruccion: 'Cuente las bolsas',
      datos: { k, g },
      respuesta: r,
      unidad: 'bolsas',
      ...responder(ctx, r, [k * (g === 250 ? 2 : 4), k, r + 1, r - 1]),
      calculo: { op: 'division', a: k * 1000, b: g },
      pistas: [`¿Cuántas bolsas de ${g} gramos salen de un solo kilo?`, { tipo: 'texto', texto: `1 kilo = 1.000 g = ${1000 / g} bolsas` }, `${k} kilos × ${1000 / g} bolsas por kilo.`],
      explicacion: `${num(k * 1000)} g ÷ ${g} = ${r} bolsas.`,
    };
  },
};

const hectarea: Plantilla = {
  id: 'fam-hectarea',
  dimension: 'aplicacion',
  operacion: 'multiplicacion',
  descripcion: 'Hectáreas, metros cuadrados y árboles sembrados',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const q = quien(rng);
    const modo = d < 0.3 ? 'arboles' : rng.elegir(['arboles', 'lote', 'hectareas']);
    if (modo === 'lote') {
      let l = 50;
      let w = 20;
      for (let i = 0; i < 50; i++) {
        l = redondo(rng, 40, 90, 10);
        w = redondo(rng, 20, 100, 10);
        if (l * w < 10000) break;
      }
      const area = l * w;
      const r = 10000 - area;
      return {
        enunciado: `Una hectárea tiene 10.000 metros cuadrados. ${q} tiene un lote rectangular de ${l} metros de largo y ${w} metros de ancho. ¿Cuántos metros cuadrados le faltan para completar una hectárea?`,
        instruccion: 'Calcule el área',
        datos: { l, w },
        respuesta: r,
        unidad: 'm²',
        ...responder(ctx, r, [area, 10000 - 2 * (l + w), 10000 - (l + w), r + 100, r - 100]),
        calculo: { op: 'resta', a: 10000, b: area },
        pistas: ['Son dos pasos: el área del lote y lo que falta hasta 10.000.', { tipo: 'texto', texto: `Área = ${l} × ${w}` }, `El lote tiene ${num(area)} m². Ahora 10.000 − ${num(area)}.`],
        explicacion: `${l} × ${w} = ${num(area)} m²; 10.000 − ${num(area)} = ${num(r)} m².`,
      };
    }
    const dens = rng.elegir([800, 1000, 1100, 1200]);
    const h = rng.entero(2, lerp(5, 20, d));
    const total = dens * h;
    if (modo === 'hectareas') {
      return {
        enunciado: `En el plan de siembra de la finca se ponen ${num(dens)} árboles de cacao por hectárea (dato del ejercicio). Si ${minus(q)} tiene ${num(total)} plántulas en el vivero, ¿cuántas hectáreas puede sembrar?`,
        instruccion: 'Calcule las hectáreas',
        datos: { dens, total },
        respuesta: h,
        unidad: 'hectáreas',
        ...responder(ctx, h, [h + 1, h - 1, h * 10, h + 2]),
        calculo: { op: 'division', a: total, b: dens },
        operacion: 'division',
        pistas: [`¿Cuántas veces caben ${num(dens)} árboles en ${num(total)}?`, { tipo: 'texto', texto: `${num(total)} ÷ ${num(dens)}` }, `Pruebe: ${num(dens)} × ${h - 1}, ${num(dens)} × ${h}…`],
        explicacion: `${num(total)} ÷ ${num(dens)} = ${h} hectáreas.`,
      };
    }
    return {
      enunciado: `En el plan de siembra de la finca se ponen ${num(dens)} árboles de cacao por hectárea (dato del ejercicio). ¿Cuántos árboles necesita ${minus(q)} para ${h} hectáreas?`,
      instruccion: 'Calcule los árboles',
      datos: { dens, h },
      respuesta: total,
      unidad: 'árboles',
      ...responder(ctx, total, [dens * (h + 1), dens * (h - 1), dens + h, total * 10]),
      calculo: { op: 'multiplicacion', a: dens, b: h },
      pistas: ['Cada hectárea lleva la misma cantidad de árboles. ¿Qué operación usa?', { tipo: 'texto', texto: `${num(dens)} × ${h}` }, `Multiplique ${num(dens)} × ${h}.`],
      explicacion: `${num(dens)} × ${h} = ${num(total)} árboles.`,
    };
  },
};

const proporcion: Plantilla = {
  id: 'fam-proporcion',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Proporcionalidad simple: valor por unidad',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const a = rng.entero(2, 5);
    let c = rng.entero(2, lerp(8, 15, d));
    if (c === a) c++;
    if (rng.azar(0.5)) {
      const u = redondo(rng, 60000, 150000, 1000);
      const x = a * u;
      const r = c * u;
      return {
        enunciado: `Si ${a} bultos de abono cuestan ${pesos(x)} (precio de ejemplo), ¿cuánto cuestan ${c} bultos del mismo abono?`,
        instruccion: 'Busque el valor por bulto',
        datos: { a, c, x },
        respuesta: r,
        unidad: 'pesos',
        ...responder(ctx, r, [x * c, u * (c + 1), u * (c - 1), x + c * 1000, ...cercanos(r, 1000, d)]),
        calculo: { op: 'multiplicacion', a: u, b: c },
        pistas: ['¿Cuánto cuesta un solo bulto?', { tipo: 'texto', texto: `${pesos(x)} ÷ ${a} = ${pesos(u)} por bulto` }, `Un bulto cuesta ${pesos(u)}. Ahora multiplique por ${c}.`],
        explicacion: `${pesos(x)} ÷ ${a} = ${pesos(u)} por bulto; ${c} × ${pesos(u)} = ${pesos(r)}.`,
      };
    }
    const m = rng.entero(5, lerp(15, 40, d));
    const b = a * m;
    const r = c * m;
    return {
      enunciado: `Con ${a} bultos de abono se fertilizan ${b} árboles de cacao. ¿Cuántos árboles se fertilizan con ${c} bultos?`,
      instruccion: 'Busque el valor por bulto',
      datos: { a, b, c },
      respuesta: r,
      unidad: 'árboles',
      ...responder(ctx, r, [b * c, b + c - a, m * (c + 1), m * (c - 1)]),
      calculo: { op: 'multiplicacion', a: m, b: c },
      pistas: ['¿Cuántos árboles se fertilizan con un solo bulto?', { tipo: 'texto', texto: `${b} ÷ ${a} = ${m} árboles por bulto` }, `${m} árboles por bulto × ${c} bultos.`],
      explicacion: `${b} ÷ ${a} = ${m} árboles por bulto; ${c} × ${m} = ${r} árboles.`,
    };
  },
};

const compararUnidades: Plantilla = {
  id: 'fam-comparar-unidades',
  dimension: 'comprension',
  operacion: 'multiplicacion',
  descripcion: 'Comparar pesos en arrobas, kilos y gramos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const q = quien(rng);
    if (rng.azar(0.5)) {
      const x = 2 * rng.entero(1, 10);
      const delta = rng.elegir([-10, -5, 0, 5, 10]);
      const y = x * 12.5 + delta;
      const oa = `Las ${x} arrobas`;
      const ob = `Los ${num(y)} kilos`;
      const resp = delta === 0 ? 'Pesan lo mismo' : delta > 0 ? ob : oa;
      const opciones = rng.barajar([oa, ob, 'Pesan lo mismo']);
      return {
        enunciado: `${q} tiene un bulto con ${x} arrobas de cacao y otro con ${num(y)} kilos. Recuerde que una arroba es 12,5 kilos. ¿Cuál pesa más?`,
        instruccion: 'Compare',
        datos: { x, y },
        respuesta: resp,
        distractores: opciones.filter((o) => o !== resp),
        interaccion: { tipo: 'opciones', opciones },
        pistas: ['Para comparar, pase todo a la misma unidad.', { tipo: 'texto', texto: `${x} arrobas = ${x / 2} × 25 kilos` }, `${x} arrobas son ${num(x * 12.5)} kilos.`],
        explicacion: `${x} arrobas = ${num(x * 12.5)} kilos, frente a ${num(y)} kilos: ${resp === 'Pesan lo mismo' ? 'pesan lo mismo' : `pesan más ${resp.charAt(0).toLowerCase() + resp.slice(1)}`}.`,
      };
    }
    const k = rng.entero(1, 5);
    const g = k * 1000 + rng.elegir([-500, -250, 0, 250, 500]);
    const oa = `Los ${num(g)} gramos`;
    const ob = `${k === 1 ? 'El kilo' : `Los ${k} kilos`}`;
    const resp = g === k * 1000 ? 'Pesan lo mismo' : g > k * 1000 ? oa : ob;
    const opciones = rng.barajar([oa, ob, 'Pesan lo mismo']);
    return {
      enunciado: `En la tienda de la vereda hay una bolsa con ${num(g)} gramos de café y otra con ${k} ${k === 1 ? 'kilo' : 'kilos'}. ¿Cuál pesa más?`,
      instruccion: 'Compare',
      datos: { g, k },
      respuesta: resp,
      distractores: opciones.filter((o) => o !== resp),
      interaccion: { tipo: 'opciones', opciones },
      pistas: ['¿Cuántos gramos tiene un kilo?', { tipo: 'texto', texto: '1 kilo = 1.000 gramos' }, `${k} ${k === 1 ? 'kilo es' : 'kilos son'} ${num(k * 1000)} gramos.`],
      explicacion: `${k} ${k === 1 ? 'kilo' : 'kilos'} = ${num(k * 1000)} gramos, frente a ${num(g)} gramos: ${resp === 'Pesan lo mismo' ? 'pesan lo mismo' : `pesan más ${resp.charAt(0).toLowerCase() + resp.slice(1)}`}.`,
    };
  },
};

const ganancia: Plantilla = {
  id: 'fam-ganancia',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Ingresos, gastos y ganancia de una venta de cacao',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const k = redondo(rng, 100, lerp(300, 3000, d), 10);
    const p = redondo(rng, 8000, 14000, 500);
    const ingreso = k * p;
    const g = redondo(rng, ingreso * 0.2, ingreso * 0.7, 10000);
    const r = ingreso - g;
    const tresPasos = d > 0.6;
    const g1 = tresPasos ? redondo(rng, 10000, g - 10000, 10000) : g;
    const g2 = g - g1;
    const sobra = tresPasos ? ` La finca tiene ${redondo(rng, 300, 1500, 50)} árboles de cacao.` : '';
    const gastos = tresPasos ? `gastó ${pesos(g1)} en abono y ${pesos(g2)} en jornales` : `gastó ${pesos(g)} en abono y jornales`;
    return {
      enunciado: `Una familia de la vereda Llana Caliente vendió ${num(k)} kilos de cacao a ${pesos(p)} el kilo en la cooperativa de cacaoteros y ${gastos} (valores de ejemplo).${sobra} ¿Cuánto ganó?`,
      instruccion: 'Calcule la ganancia',
      datos: tresPasos ? { k, p, g1, g2 } : { k, p, g },
      respuesta: r,
      unidad: 'pesos',
      ...responder(ctx, r, [ingreso, ingreso + g, g, ...cercanos(r, 10000, d)]),
      calculo: { op: 'resta', a: ingreso, b: g },
      pistas: [
        'Ganancia = lo que entra − lo que sale. ¿Cuánto entró por la venta?',
        { tipo: 'texto', texto: `Ingreso: ${num(k)} × ${pesos(p)}. Gastos: ${tresPasos ? `${pesos(g1)} + ${pesos(g2)}` : pesos(g)}` },
        `Ingreso: ${pesos(ingreso)}. Gastos: ${pesos(g)}. Ahora reste.`,
      ],
      explicacion: `${num(k)} × ${pesos(p)} = ${pesos(ingreso)}. ${tresPasos ? `Gastos: ${pesos(g1)} + ${pesos(g2)} = ${pesos(g)}. ` : ''}Ganancia: ${pesos(ingreso)} − ${pesos(g)} = ${pesos(r)}.`,
    };
  },
};

const planCosecha: Plantilla = {
  id: 'fam-plan-cosecha',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Planear la cosecha con una tabla de ingresos y gastos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const i1 = redondo(rng, 1000000, lerp(3000000, 15000000, d), 50000);
    const conAguacate = d > 0.5;
    const i2 = conAguacate ? redondo(rng, 200000, 2000000, 50000) : 0;
    const ingresos = i1 + i2;
    const gAbono = redondo(rng, ingresos * 0.08, ingresos * 0.2, 10000);
    const gJornales = redondo(rng, ingresos * 0.15, ingresos * 0.35, 10000);
    const gTransporte = redondo(rng, 20000, 200000, 10000);
    const gastos = gAbono + gJornales + gTransporte;
    const filas: (string | number)[][] = [['Ingreso: venta de cacao', pesos(i1)]];
    if (conAguacate) filas.push(['Ingreso: venta de aguacate', pesos(i2)]);
    filas.push(['Gasto: abono', pesos(gAbono)], ['Gasto: jornales', pesos(gJornales)], ['Gasto: transporte a la cooperativa', pesos(gTransporte)]);
    const q = quien(rng);
    const soloGastos = d < 0.4;
    const r = soloGastos ? gastos : ingresos - gastos;
    const op = opcionesTabla(ctx, r, soloGastos ? [gastos - gTransporte, ingresos, ...cercanos(r, 10000, d)] : [ingresos, gastos, i1 - gastos, ingresos + gastos, ...cercanos(r, 10000, d)].filter((x) => x !== r));
    return {
      enunciado: `${q} hizo el plan de la cosecha del semestre en el cuaderno de la finca (valores de ejemplo). ${soloGastos ? '¿Cuánto suman los gastos?' : '¿Cuál es la ganancia: ingresos menos gastos?'}`,
      instruccion: 'Lea la tabla',
      datos: { ingresos, gastos },
      respuesta: r,
      unidad: 'pesos',
      distractores: op.distractores,
      interaccion: { tipo: 'tabla', encabezados: ['Concepto', 'Valor'], filas, opciones: op.opciones },
      calculo: soloGastos ? { op: 'suma', a: gAbono + gJornales, b: gTransporte } : { op: 'resta', a: ingresos, b: gastos },
      pistas: [
        soloGastos ? 'Busque solo las filas que dicen «Gasto».' : 'Sume por un lado los ingresos y por otro los gastos.',
        { tipo: 'texto', texto: `Gastos: ${pesos(gAbono)} + ${pesos(gJornales)} + ${pesos(gTransporte)}` },
        soloGastos ? `Sume los tres gastos.` : `Ingresos: ${pesos(ingresos)}. Gastos: ${pesos(gastos)}.`,
      ],
      explicacion: soloGastos ? `Gastos: ${pesos(gastos)}.` : `Ingresos ${pesos(ingresos)} − gastos ${pesos(gastos)} = ${pesos(r)} de ganancia.`,
    };
  },
};

const razonableCosecha: Plantilla = {
  id: 'fam-razonable-cosecha',
  dimension: 'comprension',
  operacion: 'multiplicacion',
  descripcion: '¿Es razonable el cálculo de una venta grande? Estimación',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = redondo(rng, 50, 400, 10);
    const p = redondo(rng, 8000, 14000, 500);
    const real = k * p;
    const escala = 10 ** (String(real).length - 2);
    const est = Math.round(real / escala) * escala;
    const esRaz = rng.azar(0.5);
    const propuesto = esRaz ? real : rng.elegir([real * 10, real / 10, k + p]);
    const distr = [est * 10, est / 10];
    const q = quien(rng);
    return {
      enunciado: `${q} calcula que si vende ${k} kilos de cacao a ${pesos(p)} el kilo (precio de ejemplo) recibirá ${pesos(propuesto)}. ¿Es razonable? Luego elija la mejor estimación.`,
      instruccion: '¿Tiene sentido?',
      datos: { k, p, propuesto, est },
      respuesta: `${esRaz ? 'si' : 'no'}:${est}`,
      distractores: distr,
      interaccion: { tipo: 'razonable', propuesto, esRazonable: esRaz, opciones: rng.barajar([est, ...distr]) },
      calculo: { op: 'multiplicacion', a: k, b: p },
      pistas: [
        'Redondee: ¿cuántos kilos, más o menos? ¿Y cuánto vale el kilo, más o menos?',
        { tipo: 'texto', texto: `${Math.round(k / 10) * 10} × ${pesos(Math.round(p / 1000) * 1000)}` },
        `${Math.round(k / 10) * 10} × ${num(Math.round(p / 1000) * 1000)} = ${num((Math.round(k / 10) * 10) * Math.round(p / 1000) * 1000)}, aproximadamente.`,
      ],
      explicacion: `${k} × ${pesos(p)} = ${pesos(real)}, cerca de ${pesos(est)}. ${esRaz ? 'El cálculo es razonable.' : `${pesos(propuesto)} está muy lejos: no es razonable.`}`,
    };
  },
};

const plantillas = [
  calculoMental,
  estimarCompra,
  rectaDinero,
  vueltas,
  compraVarios,
  presupuesto,
  ventaMercado,
  rendimiento,
  bultos,
  jornales,
  porcentajeConcepto,
  porcentajeCalculo,
  secado,
  descuento,
  arrobas,
  gramos,
  hectarea,
  proporcion,
  compararUnidades,
  ganancia,
  planCosecha,
  razonableCosecha,
];

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

export const familia: DefinicionPista = {
  pista: 'familia',
  limite: 100000000,
  plantillas,
  tramos: [
    {
      inicio: 0,
      fin: 0,
      titulo: 'Bienvenida y cálculo mental básico',
      usos: [u(calculoMental, { max: 10000, op: 'suma' }), u(rectaDinero, { max: 10000, paso: 500 }), u(vueltas), u(presupuesto, { max: 20000, filas: 2 })],
    },
    {
      inicio: 1,
      fin: 15,
      titulo: 'Cálculo mental y estimación con dinero',
      usos: [u(calculoMental, { max: 50000, op: 'mixta' }), u(estimarCompra), u(rectaDinero, { max: 20000, paso: 1000 }), u(vueltas), u(compraVarios), u(presupuesto, { max: 50000, filas: 3 })],
    },
    {
      inicio: 16,
      fin: 35,
      titulo: 'Compras, ventas, vueltos y presupuesto semanal',
      usos: [u(calculoMental, { op: 'mult' }), u(estimarCompra), u(compraVarios), u(vueltas), u(ventaMercado), u(presupuesto, { conSaldo: true })],
    },
    {
      inicio: 36,
      fin: 55,
      titulo: 'Producción: kilos por árbol, bultos y jornales',
      usos: [u(rendimiento), u(bultos, { modo: 'mixto' }), u(jornales), u(ventaMercado), u(calculoMental, { op: 'mult' }), u(razonableCosecha)],
    },
    {
      inicio: 56,
      fin: 75,
      titulo: 'Porcentajes de 10, 25 y 50 %: descuentos y secado',
      usos: [u(porcentajeConcepto), u(porcentajeCalculo), u(secado), u(descuento), u(razonableCosecha)],
    },
    {
      inicio: 76,
      fin: 90,
      titulo: 'Proporciones y unidades: g, kg, arroba y hectárea',
      usos: [u(compararUnidades), u(arrobas), u(gramos), u(proporcion), u(hectarea)],
    },
    {
      inicio: 91,
      fin: 100,
      titulo: 'Planear la cosecha: costos, ingresos y ganancia',
      usos: [u(ganancia), u(planCosecha), u(proporcion), u(secado), u(razonableCosecha), u(bultos, { modo: 'mixto' }), u(descuento), u(arrobas)],
    },
  ],
};
