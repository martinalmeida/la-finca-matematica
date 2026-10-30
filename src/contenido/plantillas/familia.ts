// Plantillas de la pista Familia: problemas del hogar y la producción, con trato de usted.
// Precios, rendimientos y porcentajes son datos de ejemplo, no valores reales.

import type { Pista, Tema, ContextoGeneracion, DefinicionPista, EjercicioBase, Interaccion, Plantilla, Uso } from '../../juego/tipos';
import type { Rng } from '../../juego/rng';
import { adulto, articulosTienda, cuantos, mayus, num, pesos, type Genero } from '../contexto';
import { restaMenorMayor } from '../../juego/errores';
import { dif, distractores, lerp, lerpF, mezclarOpciones, pn, pt } from './util';

// --- Ayudantes locales ---

const quien = (rng: Rng, excluir: string[] = []): string => mayus(adulto(rng, excluir).nombre);

/** Nombre a mitad de frase: "doña Rosa", "el profe Julián". */
const minus = (nombre: string): string => nombre.charAt(0).toLowerCase() + nombre.slice(1);

/** "de" + nombre con contracción: "del profe Julián", "de doña Rosa". */
const de = (nombre: string): string => (nombre.startsWith('el ') ? 'del ' + nombre.slice(3) : 'de ' + nombre);

/** "a" + nombre con contracción: "al profe Julián", "a doña Rosa". */
const al = (nombre: string): string => (nombre.startsWith('el ') ? 'al ' + nombre.slice(3) : 'a ' + nombre);

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

/** Formas de pedir el cálculo mental. */
const MENTAL = ['Calcule mentalmente.', 'Hágalo de cabeza, sin lápiz.', 'Resuélvalo mentalmente.'];

/** Escena con dos valores en pesos: (quién, a, b) → enunciado. */
type Escena2 = (q: string, a: string, b: string) => string;

const SUMAS: Escena2[] = [
  (q, a, b) => `${q} anotó en el cuaderno de la finca dos ventas del día: ${a} por huevos y ${b} por limones. ¿Cuánto vendió en total?`,
  (_q, a, b) => `Para el refrigerio de la escuela, usted aporta ${a} y una vecina aporta ${b}. ¿Cuánto reúnen entre las dos familias?`,
  (q, a, b) => `${q} pagó ${a} por el pasaje en la chiva y ${b} por el almuerzo en el pueblo. ¿Cuánto gastó en total?`,
  (_q, a, b) => `El recibo de la luz llegó por ${a} y el del agua por ${b}. ¿Cuánto hay que pagar entre los dos recibos?`,
  (q, a, b) => `${q} debía ${a} en la tienda de la vereda y esta semana sacó fiado ${b} más. ¿Cuánto debe ahora?`,
  (q, a, b) => `${q} tenía ahorrados ${a} en la natillera de la vereda y este mes metió ${b}. ¿Cuánto tiene ahorrado?`,
  (q, a, b) => `Por la leche de la quincena le pagaron ${al(minus(q))} ${a}, y por los huevos, ${b}. ¿Cuánto recibió en total?`,
  (q, a, b) => `Para el colegio, ${minus(q)} compró cuadernos por ${a} y colores por ${b}. ¿Cuánto pagó por los útiles?`,
  (_q, a, b) => `La pipeta de gas costó ${a} y subirla en moto hasta la finca, ${b}. ¿Cuánto costó todo?`,
  (q, a, b) => `En el vivero, ${minus(q)} pagó ${a} por plántulas de cacao y ${b} por bolsas para vivero. ¿Cuánto gastó?`,
  (q, a, b) => `${q} vendió en el mercado del pueblo mandarinas por ${a} y aguacates por ${b}. ¿Cuánto recibió?`,
  (q, a, b) => `${q} gastó ${a} en la recarga del celular y ${b} en el mototaxi hasta el pueblo. ¿Cuánto gastó en total?`,
  (q, a, b) => `En la droguería veterinaria, ${minus(q)} compró un purgante para las vacas por ${a} y vitaminas para los terneros por ${b}. ¿Cuánto pagó?`,
  (q, a, b) => `Para la fiesta de la vereda, ${minus(q)} gastó ${a} en gaseosas y ${b} en hielo. ¿Cuánto gastó entre las dos cosas?`,
];

const RESTAS: Escena2[] = [
  (q, a, b) => `${q} llevó ${a} al mercado del pueblo y gastó ${b}. ¿Cuánto le quedó?`,
  (_q, a, b) => `Usted tiene ${a} en el bolsillo y paga ${b} en la tienda de la vereda. ¿Cuánto le queda?`,
  (_q, a, b) => `Para la semana hay ${a} y ya se gastaron ${b}. ¿Cuánto queda para el resto de la semana?`,
  (q, a, b) => `${q} debía ${a} en la tienda de la vereda y abonó ${b}. ¿Cuánto debe todavía?`,
  (q, a, b) => `${q} quiere reunir ${a} para los útiles escolares y ya tiene ${b}. ¿Cuánto le falta?`,
  (q, a, b) => `El recibo de la luz es de ${a} y ${minus(q)} ya juntó ${b}. ¿Cuánto le falta para pagarlo?`,
  (q, a, b) => `${q} vendió la leche de la semana por ${a} y pagó ${b} de concentrado para las vacas. ¿Cuánto le quedó de la venta?`,
  (q, a, b) => `De los ${a} que había en la alcancía, ${minus(q)} sacó ${b} para el pasaje en la chiva. ¿Cuánto queda en la alcancía?`,
  (q, a, b) => `Las botas de caucho cuestan ${a} y ${minus(q)} tiene ${b}. ¿Cuánto le falta para comprarlas?`,
  (q, a, b) => `En la cooperativa le pagaron ${al(minus(q))} ${a} y de ahí gastó ${b} en abono. ¿Cuánto le quedó?`,
  (q, a, b) => `${q} tenía ${a} para el mercado y en la plaza gastó ${b} en carne. ¿Cuánto le queda para lo demás?`,
  (q, a, b) => `La cuota del crédito de la moto es de ${a} y ${minus(q)} ya pagó ${b}. ¿Cuánto le falta para completar la cuota?`,
  (q, a, b) => `${q} tenía ${a} y pagó ${b} por la pipeta de gas. ¿Cuánto le quedó?`,
  (q, a, b) => `Para el paseo del colegio piden ${a} por estudiante y ${minus(q)} ya dio ${b}. ¿Cuánto le falta dar?`,
];

/** Productos para multiplicar precios: (quién, cantidad, precio) → enunciado, con su rango de precio. */
const MULTIPLICAR: { t: (q: string, n: number, p: string) => string; min: number; max: number }[] = [
  { t: (_q, n, p) => `En el mercado del pueblo, el kilo de aguacate está a ${p}. ¿Cuánto cuestan ${n} kilos?`, min: 2000, max: 6000 },
  { t: (_q, n, p) => `En la tienda de la vereda, la docena de huevos vale ${p}. ¿Cuánto se paga por ${n} docenas?`, min: 8000, max: 15000 },
  { t: (q, n, p) => `En el vivero, cada plántula de cacao injertada cuesta ${p}. ¿Cuánto paga ${minus(q)} por ${n} plántulas?`, min: 2000, max: 5000 },
  { t: (q, n, p) => `${q} compra ${n} cuadernos para los niños, a ${p} cada uno. ¿Cuánto paga?`, min: 2000, max: 6000 },
  { t: (_q, n, p) => `El pasaje en la chiva hasta San Vicente cuesta ${p} por persona. ¿Cuánto pagan ${n} personas de la familia?`, min: 5000, max: 12000 },
  { t: (q, n, p) => `${q} vende la panela a ${p} cada una. ¿Cuánto recibe por ${n} panelas?`, min: 3000, max: 6000 },
  { t: (q, n, p) => `En la plaza, la libra de café molido de la finca se vende a ${p}. ¿Cuánto recibe ${minus(q)} por ${n} libras?`, min: 8000, max: 15000 },
  { t: (_q, n, p) => `En el almacén agrícola, cada pollito de engorde cuesta ${p}. ¿Cuánto cuestan ${n} pollitos?`, min: 2000, max: 5000 },
  { t: (q, n, p) => `El galón de gasolina para la moto vale ${p}. ¿Cuánto paga ${minus(q)} por ${n} galones?`, min: 14000, max: 17000 },
  { t: (q, n, p) => `${q} vende el queso a ${p} la libra. ¿Cuánto recibe por ${n} libras?`, min: 8000, max: 13000 },
  { t: (_q, n, p) => `En el mercado del pueblo, un racimo de plátano se vende a ${p}. ¿Cuánto dan por ${n} racimos?`, min: 8000, max: 15000 },
  { t: (_q, n, p) => `En la plaza, el kilo de limón está a ${p}. ¿Cuánto cuestan ${n} kilos?`, min: 1000, max: 4000 },
  { t: (q, n, p) => `Cada colino de plátano cuesta ${p}. ¿Cuánto paga ${minus(q)} por ${n} colinos para resembrar el platanal?`, min: 1000, max: 3000 },
  { t: (q, n, p) => `${q} le vende al vecino litros de leche a ${p} cada uno. ¿Cuánto recibe por ${n} litros?`, min: 1000, max: 3000 },
];

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
    const mental = rng.elegir(MENTAL);
    if (op === 'mult') {
      const art = rng.elegir(MULTIPLICAR);
      const precio = redondo(rng, art.min, lerp(Math.min(art.max, art.min * 2), art.max, d), paso);
      const n = rng.entero(2, lerp(5, 12, d));
      const r = precio * n;
      return {
        enunciado: `${art.t(q, n, pesos(precio))} ${mental}`,
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
      return {
        enunciado: `${rng.elegir(RESTAS)(q, pesos(a), pesos(b))} ${mental}`,
        instruccion: 'Calcule mentalmente',
        datos: { a, b },
        respuesta: r,
        ...responder(ctx, r, [a + b, restaMenorMayor(a, b), ...cercanos(r, paso, d)]),
        calculo: { op: 'resta', a, b },
        operacion: 'resta',
        pistas: [
          `¿Puede contar desde ${pesos(b)} hasta ${pesos(a)}?`,
          { tipo: 'texto', texto: `${pesos(a)} − ${pesos(b)}` },
          `Quite primero los miles y luego los cientos de ${pesos(b)}.`,
        ],
        explicacion: `${pesos(a)} − ${pesos(b)} = ${pesos(r)}.`,
      };
    }
    const a = redondo(rng, paso, Math.max(paso, max * 0.6), paso);
    const b = redondo(rng, paso, max - a, paso);
    const r = a + b;
    return {
      enunciado: `${rng.elegir(SUMAS)(q, pesos(a), pesos(b))} ${mental}`,
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

const RECTA: Escena2[] = [
  (q, a, b) => `${q} guardó ${a} el lunes y ${b} el martes en la alcancía de la casa. Toque en la recta el total que reunió.`,
  (q, a, b) => `En la feria del pueblo, ${minus(q)} vendió arepas por ${a} en la mañana y por ${b} en la tarde. Ubique en la recta el total del día.`,
  (q, a, b) => `${q} vendió huevos por ${a} el sábado y por ${b} el domingo. Toque en la recta lo que recibió el fin de semana.`,
  (q, a, b) => `Para el bazar de la escuela, ${minus(q)} recogió ${a} con la rifa y ${b} con las empanadas. Ubique en la recta el total.`,
  (q, a, b) => `${q} tenía ${a} en el monedero y le pagaron ${b} por unos limones. Toque en la recta cuánto tiene ahora.`,
  (q, a, b) => `En la natillera, ${minus(q)} metió ${a} en enero y ${b} en febrero. Ubique en la recta lo que lleva ahorrado.`,
  (q, a, b) => `En el pueblo, ${minus(q)} gastó ${a} en el pasaje y ${b} en el almuerzo. Toque en la recta el gasto total.`,
  (_q, a, b) => `Para el mercado de la semana, un hijo le dio ${a} y usted puso ${b}. Ubique en la recta cuánto reunieron.`,
];

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
      enunciado: rng.elegir(RECTA)(q, pesos(a), pesos(b)),
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

/** Lo que se compra por unidades en la vereda: singular, plural, género, precio y dónde. */
type Unidad = { s: string; p: string; g: Genero; precio: number; lugar: string };

const UNIDADES: Unidad[] = [
  { s: 'libra de arroz', p: 'libras de arroz', g: 'f', precio: 2500, lugar: 'en la tienda de la vereda' },
  { s: 'panela', p: 'panelas', g: 'f', precio: 3000, lugar: 'en el trapiche de la vereda' },
  { s: 'libra de fríjol', p: 'libras de fríjol', g: 'f', precio: 4500, lugar: 'en la tienda de la vereda' },
  { s: 'bolsa de leche', p: 'bolsas de leche', g: 'f', precio: 3500, lugar: 'en la tienda de la vereda' },
  { s: 'cuaderno', p: 'cuadernos', g: 'm', precio: 2000, lugar: 'en la papelería del pueblo' },
  { s: 'lápiz', p: 'lápices', g: 'm', precio: 500, lugar: 'en la papelería del pueblo' },
  { s: 'jabón', p: 'jabones', g: 'm', precio: 2500, lugar: 'en la tienda de la vereda' },
  { s: 'arepa', p: 'arepas', g: 'f', precio: 1000, lugar: 'en la panadería del pueblo' },
  { s: 'plántula de cacao', p: 'plántulas de cacao', g: 'f', precio: 3000, lugar: 'en el vivero' },
  { s: 'colino de plátano', p: 'colinos de plátano', g: 'm', precio: 1500, lugar: 'en la finca de un vecino' },
  { s: 'pollito de engorde', p: 'pollitos de engorde', g: 'm', precio: 3500, lugar: 'en el almacén agrícola' },
  { s: 'kilo de concentrado', p: 'kilos de concentrado', g: 'm', precio: 3000, lugar: 'en el almacén agrícola' },
  { s: 'docena de huevos', p: 'docenas de huevos', g: 'f', precio: 12000, lugar: 'en la tienda de la vereda' },
  { s: 'libra de café molido', p: 'libras de café molido', g: 'f', precio: 10000, lugar: 'en el mercado del pueblo' },
  { s: 'metro de manguera', p: 'metros de manguera', g: 'm', precio: 1500, lugar: 'en la ferretería del pueblo' },
  { s: 'kilo de sal mineralizada', p: 'kilos de sal mineralizada', g: 'm', precio: 3500, lugar: 'en el almacén agrícola' },
];

const una = (g: Genero) => (g === 'f' ? 'una' : 'un');

/** ¿Cuántas unidades alcanzan con cierta plata? (justo, sin que sobre). */
const ALCANZA_JUSTO: ((q: string, a: Unidad, total: string, precio: string) => string)[] = [
  (q, a, t, p) => `${q} tiene ${t} para comprar ${a.p} ${a.lugar}. Si ${cada(a.g)} cuesta ${p}, ¿${cuantos(a.g, false)} puede comprar sin que le sobre plata?`,
  (q, a, t, p) => `Con ${t}, ¿${cuantos(a.g, false)} ${a.p} de ${p} alcanza a comprar ${minus(q)} ${a.lugar}?`,
  (q, a, t, p) => `${q} lleva ${t} ${a.lugar}. ${mayus(una(a.g))} ${a.s} vale ${p}. ¿Para ${cuantos(a.g, false)} ${a.p} le alcanza la plata?`,
  (q, a, t, p) => `${q} gastó ${t} ${a.lugar}, todo en ${a.p} de ${p} ${cada(a.g)}. ¿${cuantos(a.g)} compró?`,
];

/** Con sobrante: ¿cuántas alcanzan como máximo? */
const ALCANZA_MAXIMO: ((q: string, a: Unidad, total: string, precio: string) => string)[] = [
  (q, a, t, p) => `${q} tiene ${t} y quiere comprar todas las ${a.p} que pueda ${a.lugar}, a ${p} ${cada(a.g)}. ¿${cuantos(a.g)} alcanza a comprar?`,
  (q, a, t, p) => `Con ${t}, ¿${cuantos(a.g, false)} ${a.p} de ${p} puede comprar ${minus(q)} ${a.lugar} como máximo? Puede sobrarle algo de plata.`,
];

/** Comprar varias unidades: precio por cantidad. */
const COMPRAR_VARIAS: ((q: string, a: Unidad, n: number, precio: string) => string)[] = [
  (q, a, n, p) => `${q} necesita ${n} ${a.p} para la casa. ${mayus(cada(a.g))} cuesta ${p} ${a.lugar}. ¿Cuánto debe pagar?`,
  (_q, a, n, p) => `Para la semana, usted compra ${n} ${a.p} ${a.lugar}, a ${p} ${cada(a.g)}. ¿Cuánto paga en total?`,
  (q, a, n, p) => `${mayus(a.lugar)}, ${minus(q)} pide ${n} ${a.p}. Si ${cada(a.g)} vale ${p}, ¿cuánto le cobran?`,
];

const compraVarios: Plantilla = {
  id: 'fam-compra-varios',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Comprar varias unidades del mismo producto o cuántas alcanzan',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const art = rng.elegir(UNIDADES);
    const n = rng.entero(2, lerp(6, 15, d));
    const total = n * art.precio;
    const q = quien(rng);
    // «alcanzan»: siempre se pregunta cuántas unidades compra la plata (el tema «Cuántas unidades alcanzan»).
    const alcanzan = pt(ctx, 'modo', 'mixto') === 'alcanzan';
    if (alcanzan || (d > 0.4 && rng.azar(0.5))) {
      // Con d alto, a veces sobra plata y se pregunta el máximo.
      const sobra = alcanzan && d > 0.6 && rng.azar(0.4) ? redondo(rng, 100, art.precio - 100, art.precio > 1000 ? 500 : 100) : 0;
      const plata = total + sobra;
      const enunciado = rng.elegir(sobra ? ALCANZA_MAXIMO : ALCANZA_JUSTO)(q, art, pesos(plata), pesos(art.precio));
      return {
        enunciado,
        instruccion: 'Reparta el dinero',
        datos: { total: plata, precio: art.precio },
        respuesta: n,
        unidad: art.p.split(' ')[0],
        ...responder(ctx, n, [n + 1, n - 1, n + 2, n * 10]),
        calculo: { op: 'division', a: plata, b: art.precio },
        operacion: 'division',
        permiteResiduo: sobra > 0 || undefined,
        pistas: [
          `¿Cuántas veces cabe ${pesos(art.precio)} en ${pesos(plata)}?`,
          { tipo: 'texto', texto: `${pesos(plata)} ÷ ${pesos(art.precio)}` },
          sobra
            ? `Vaya sumando ${pesos(art.precio)} sin pasarse de ${pesos(plata)} y cuente las veces.`
            : `Vaya sumando ${pesos(art.precio)} hasta llegar a ${pesos(plata)} y cuente las veces.`,
        ],
        explicacion: sobra
          ? `${n} × ${pesos(art.precio)} = ${pesos(total)} y sobran ${pesos(sobra)}, que no alcanzan para ${una(art.g)} más: le alcanza para ${n}.`
          : `${pesos(plata)} ÷ ${pesos(art.precio)} = ${n}.`,
      };
    }
    return {
      enunciado: rng.elegir(COMPRAR_VARIAS)(q, art, n, pesos(art.precio)),
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

const GASTOS = [
  'Mercado',
  'Pasajes en la chiva',
  'Útiles escolares',
  'Recibo de la luz',
  'Recibo del agua',
  'Gas',
  'Concentrado para las gallinas',
  'Recarga del celular',
  'Droga para el ganado',
  'Cuota del fiado',
  'Gasolina de la moto',
  'Abono para la huerta',
];

/** Periodo del presupuesto: cómo se nombra en la frase y en la tabla. */
const PERIODOS = [
  { de: 'de la semana', tabla: 'Gasto de la semana' },
  { de: 'de la quincena', tabla: 'Gasto de la quincena' },
  { de: 'del mes', tabla: 'Gasto del mes' },
];

/** Dónde se anotaron los gastos. */
const CUADERNOS: ((q: string, pe: string) => string)[] = [
  (q, pe) => `${q} anotó en el cuaderno de la finca los gastos ${pe} (valores de ejemplo).`,
  (q, pe) => `${q} apuntó en una hoja pegada en la nevera los gastos ${pe} (valores de ejemplo).`,
  (q, pe) => `En la libreta de cuentas de la casa, ${minus(q)} escribió los gastos ${pe} (valores de ejemplo).`,
  (q, pe) => `${q} sacó con la familia la cuenta de los gastos ${pe} (valores de ejemplo).`,
  (q, pe) => `${q} guardó en el celular una nota con los gastos ${pe} (valores de ejemplo).`,
  (q, pe) => `Esta es la cuenta de los gastos ${pe} en la casa ${de(minus(q))} (valores de ejemplo).`,
];

/** De dónde salió la plata del presupuesto y la pregunta por el saldo. */
const SALDOS: ((presu: string, pe: string) => string)[] = [
  (p, pe) => `El presupuesto ${pe} era de ${p}. ¿Cuánto dinero queda?`,
  (p) => `Para esos gastos había ${p} del pago de la leche. ¿Cuánto sobró?`,
  (p) => `Para esos gastos se apartaron ${p} de la venta del cacao. ¿Cuánto quedó?`,
  (p) => `Con ${p} que dejaron los jornales se cubrieron esos gastos. ¿Cuánto quedó?`,
  (p) => `Se sacaron ${p} de la natillera para esos gastos. ¿Cuánto queda después de pagarlos?`,
];

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
    const per = rng.elegir(PERIODOS);
    const titulo = rng.elegir(CUADERNOS)(quien(rng), per.de);
    const encabezados = [per.tabla, 'Valor'];
    if (conSaldo) {
      const presu = Math.ceil((total + 10000) / 50000) * 50000;
      const r = presu - total;
      const op = opcionesTabla(ctx, r, [total, presu + total, ...cercanos(r, 5000, d)]);
      return {
        enunciado: `${titulo} ${rng.elegir(SALDOS)(pesos(presu), per.de)}`,
        instruccion: 'Lea la tabla',
        datos: { total, presupuesto: presu },
        respuesta: r,
        unidad: 'pesos',
        distractores: op.distractores,
        interaccion: { tipo: 'tabla', encabezados, filas, opciones: op.opciones },
        calculo: { op: 'resta', a: presu, b: total },
        pistas: [
          'Son dos pasos: ¿cuánto se gastó en total y cuánto queda de la plata que había?',
          { tipo: 'texto', texto: `Gastos: ${valores.map(pesos).join(' + ')}` },
          `Los gastos suman ${pesos(total)}. Ahora haga ${pesos(presu)} − ${pesos(total)}.`,
        ],
        explicacion: `Gastos: ${pesos(total)}. ${pesos(presu)} − ${pesos(total)} = ${pesos(r)}.`,
      };
    }
    if (d > 0.3 && nFilas > 2) {
      const r = valores[0] + valores[1];
      const op = opcionesTabla(ctx, r, [total, Math.abs(valores[0] - valores[1]), ...cercanos(r, 5000, d)]);
      const pregunta = rng.elegir([`¿Cuánto se gastó entre «${nombres[0]}» y «${nombres[1]}»?`, `¿Cuánto suman «${nombres[0]}» y «${nombres[1]}»?`]);
      return {
        enunciado: `${titulo} ${pregunta}`,
        instruccion: 'Lea la tabla',
        datos: { a: valores[0], b: valores[1] },
        respuesta: r,
        unidad: 'pesos',
        distractores: op.distractores,
        interaccion: { tipo: 'tabla', encabezados, filas, opciones: op.opciones },
        calculo: { op: 'suma', a: valores[0], b: valores[1] },
        pistas: ['Solo necesita dos filas de la tabla. ¿Cuáles?', { tipo: 'texto', texto: `${pesos(valores[0])} + ${pesos(valores[1])}` }, `Sume ${pesos(valores[0])} y ${pesos(valores[1])}.`],
        explicacion: `${pesos(valores[0])} + ${pesos(valores[1])} = ${pesos(r)}. Los demás gastos no se necesitan.`,
      };
    }
    const ultimo = valores[valores.length - 1];
    const op = opcionesTabla(ctx, total, [total - ultimo, total + ultimo, ...cercanos(total, 5000, d)]);
    return {
      enunciado: `${titulo} ${rng.elegir(['¿Cuánto se gastó en total?', '¿Cuánto suman todos los gastos?', '¿Cuánta plata se fue en total?'])}`,
      instruccion: 'Lea la tabla',
      datos: { total },
      respuesta: total,
      unidad: 'pesos',
      distractores: op.distractores,
      interaccion: { tipo: 'tabla', encabezados, filas, opciones: op.opciones },
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

/** Cultivos para la producción por árbol: cómo se nombran y cuánto da cada árbol (datos del ejercicio). */
type CultivoRend = {
  arboles: string;
  /** «cada árbol», «cada mata». */
  uno: string;
  /** Lo que se cosecha: «mazorcas», «kilos de café cereza». */
  prod: string;
  g: Genero;
  /** Unidad de la respuesta. */
  u: string;
  /** Árboles: [mínimo con d=0, mínimo con d=1, máximo con d=0, máximo con d=1] y su paso. */
  n: [number, number, number, number];
  pasoN: number;
  /** Producción por árbol: mínimo, máximo con d=0 y con d=1, y su paso. */
  m: [number, number, number];
  pasoM: number;
};

const CULTIVOS_REND: CultivoRend[] = [
  { arboles: 'árboles de cacao', uno: 'cada árbol', prod: 'mazorcas', g: 'f', u: 'mazorcas', n: [10, 40, 60, 300], pasoN: 1, m: [10, 20, 30], pasoM: 1 },
  { arboles: 'matas de café', uno: 'cada mata', prod: 'kilos de café cereza', g: 'm', u: 'kilos', n: [100, 300, 500, 2000], pasoN: 50, m: [2, 4, 5], pasoM: 1 },
  { arboles: 'árboles de aguacate', uno: 'cada árbol', prod: 'kilos de aguacate', g: 'm', u: 'kilos', n: [5, 5, 12, 30], pasoN: 1, m: [20, 40, 80], pasoM: 5 },
  { arboles: 'árboles de naranja', uno: 'cada árbol', prod: 'naranjas', g: 'f', u: 'naranjas', n: [5, 10, 20, 60], pasoN: 1, m: [100, 200, 400], pasoM: 10 },
  { arboles: 'árboles de mandarina', uno: 'cada árbol', prod: 'mandarinas', g: 'f', u: 'mandarinas', n: [5, 10, 20, 60], pasoN: 1, m: [100, 200, 350], pasoM: 10 },
  { arboles: 'árboles de limón', uno: 'cada árbol', prod: 'kilos de limón', g: 'm', u: 'kilos', n: [5, 10, 20, 80], pasoN: 1, m: [10, 30, 60], pasoM: 5 },
];

/** Datos que sobran (con d alto). */
const SOBRAS_REND: ((rng: Rng) => string)[] = [
  (rng) => ` La finca queda a ${rng.entero(1, 3)} horas a pie del casco urbano de San Vicente.`,
  (rng) => ` El lote lo sembró el abuelo hace ${rng.entero(8, 30)} años.`,
  (rng) => ` En la finca también hay ${rng.entero(10, 40)} gallinas.`,
];

const rendimiento: Plantilla = {
  id: 'fam-rendimiento',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Producción por árbol: mazorcas, café y aguacate',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const q = quien(rng);
    const sobra = d > 0.6 ? rng.elegir(SOBRAS_REND)(rng) : '';
    const c = rng.elegir(CULTIVOS_REND);
    const n = redondo(rng, lerp(c.n[0], c.n[1], d), lerp(c.n[2], c.n[3], d), c.pasoN);
    const m = redondo(rng, c.m[0], lerp(c.m[1], c.m[2], d), c.pasoM);
    const t = n * m;
    const Cuantos = cuantos(c.g);
    const forma = rng.entero(0, 2);
    if (forma === 2) {
      // Repartir la cosecha por igual entre los árboles.
      return {
        enunciado: rng.elegir([
          `${q} cosechó ${num(t)} ${c.prod} de ${num(n)} ${c.arboles}, y todos dieron la misma cantidad (dato del ejercicio).${sobra} ¿${Cuantos} ${c.prod} dio ${c.uno}?`,
          `De los ${num(n)} ${c.arboles} de la finca ${de(minus(q))} salieron ${num(t)} ${c.prod} en la cosecha, la misma cantidad de ${c.uno} (dato del ejercicio).${sobra} ¿${Cuantos} ${c.prod} dio ${c.uno}?`,
        ]),
        instruccion: 'Calcule por árbol',
        datos: { t, n },
        respuesta: m,
        unidad: c.u,
        ...responder(ctx, m, [m + c.pasoM, m - c.pasoM, t - n, m * 10, m + 1]),
        calculo: { op: 'division', a: t, b: n },
        operacion: 'division',
        pistas: [`Si reparte la cosecha por igual entre los ${c.arboles}, ¿qué operación hace?`, { tipo: 'texto', texto: `${num(t)} ÷ ${num(n)}` }, `Busque qué número multiplicado por ${num(n)} da ${num(t)}.`],
        explicacion: `${num(t)} ÷ ${num(n)} = ${num(m)} ${c.prod} por ${c.uno.replace('cada ', '')}.`,
      };
    }
    return {
      enunciado:
        forma === 0
          ? `En la última cosecha, ${c.uno} del lote ${de(minus(q))} dio en promedio ${num(m)} ${c.prod} (dato del ejercicio). El lote tiene ${num(n)} ${c.arboles}.${sobra} ¿${cuantos(c.g)} ${c.prod} se recogieron?`
          : `${q} tiene ${num(n)} ${c.arboles} y ${c.uno} da ${num(m)} ${c.prod} en la cosecha (dato del ejercicio).${sobra} ¿${cuantos(c.g)} ${c.prod} recoge en total?`,
      instruccion: 'Calcule la cosecha',
      datos: { n, m },
      respuesta: t,
      unidad: c.u,
      ...responder(ctx, t, [n * (m + 1), n * (m - 1), n + m, t * 10, ...cercanos(t, 10, d)]),
      calculo: { op: 'multiplicacion', a: n, b: m },
      pistas: [`${mayus(c.uno)} aporta lo mismo. ¿Qué operación repite esa cantidad por cada uno?`, { tipo: 'texto', texto: `${num(n)} × ${num(m)}` }, `Multiplique ${num(n)} × ${num(m)}.`],
      explicacion: `${num(n)} × ${num(m)} = ${num(t)} ${c.prod}.`,
    };
  },
};

/** Lo que se empaca en bultos de 50 kilos y para qué. */
const EMPAQUES = [
  { kilos: 'kilos de cacao seco', para: 'para llevar a la cooperativa de cacaoteros' },
  { kilos: 'kilos de café pergamino seco', para: 'para vender en la cooperativa de caficultores' },
  { kilos: 'kilos de maíz desgranado', para: 'para guardar en la bodega de la finca' },
  { kilos: 'kilos de fríjol seco', para: 'para vender en el mercado del pueblo' },
  { kilos: 'kilos de naranja', para: 'para mandar en el camión de los sábados' },
  { kilos: 'kilos de yuca', para: 'para un comprador del pueblo' },
  { kilos: 'kilos de abono orgánico', para: 'que preparó con la pulpa del café y el estiércol' },
  { kilos: 'kilos de cal agrícola', para: 'que trajo a granel la junta de acción comunal' },
  { kilos: 'kilos de café cereza', para: 'para llevar al beneficiadero' },
  { kilos: 'kilos de mandarina', para: 'para vender en la plaza de mercado' },
];

/** Formas de preguntar cuántos bultos (exactos). */
const BULTOS_EXACTOS: ((q: string, k: string, e: (typeof EMPAQUES)[number]) => string)[] = [
  (q, k, e) => `${q} empaca ${k} ${e.kilos} en bultos de 50 kilos ${e.para}. ¿Cuántos bultos llena?`,
  (q, k, e) => `${q} tiene ${k} ${e.kilos} ${e.para}. Si cada costal lleva 50 kilos, ¿cuántos costales necesita?`,
  (_q, k, e) => `Hay que empacar ${k} ${e.kilos} en sacos de 50 kilos ${e.para}. ¿Cuántos sacos salen?`,
  (q, k, e) => `En la báscula, ${minus(q)} pesó ${k} ${e.kilos} ${e.para}. ¿Cuántos bultos de 50 kilos puede llenar?`,
  (q, k, e) => `Ayude ${al(minus(q))} a saber cuántos bultos de 50 kilos llena con ${k} ${e.kilos} ${e.para}.`,
];

/** Bultos completos y lo que sobra. */
const BULTOS_RESIDUO: ((q: string, k: string, e: (typeof EMPAQUES)[number]) => string)[] = [
  (q, k, e) => `${q} tiene ${k} ${e.kilos} ${e.para} y los empaca en bultos de 50 kilos.`,
  (q, k, e) => `${q} pesó ${k} ${e.kilos} ${e.para}. Los va a echar en costales de 50 kilos.`,
  (_q, k, e) => `En la finca hay ${k} ${e.kilos} ${e.para}, y se empacan en sacos de 50 kilos.`,
];

/** Quién carga y por dónde (viajes). */
const CARGUEROS: { quien: string; dibujo?: 'mula' }[] = [{ quien: 'La mula', dibujo: 'mula' }, { quien: 'El caballo' }, { quien: 'El burro' }, { quien: 'La moto' }];
const RECORRIDOS = [
  'bultos de cacao hasta la carretera',
  'bultos de abono desde la carretera hasta la finca',
  'bultos de café pergamino hasta la vía principal',
  'bultos de maíz hasta la bodega',
  'bultos de cal desde la carretera hasta el lote',
  'bultos de concentrado desde la tienda hasta el corral',
];

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
      const c = rng.elegir(CARGUEROS);
      const lleva = `${n} ${rng.elegir(RECORRIDOS)}`;
      return {
        enunciado: rng.elegir([
          `${c.quien} ${de(minus(q))} carga ${k} bultos por viaje. ¿Cuántos viajes necesita para llevar ${lleva}?`,
          `Para llevar ${lleva}, ${minus(q)} usa ${minus(c.quien)}, que carga ${k} bultos por viaje. ¿Cuántos viajes debe hacer?`,
        ]),
        instruccion: 'Cuente los viajes',
        ilustracion: 'bulto',
        datos: { n, k },
        respuesta: r,
        unidad: 'viajes',
        ...responder(ctx, r, [Math.floor(n / k), r + 1, n - k, n * k]),
        calculo: { op: 'division', a: n, b: k, redondearArriba: true },
        pistas: [
          'Si sobran bultos al final, ¿se quedan o necesitan otro viaje?',
          // Un grupo por viaje: los llenos con k bultos y el último con los que sobran.
          { tipo: 'objetos', objeto: 'bulto', grupos: [...Array(Math.floor(n / k)).fill(k), ...(n % k ? [n % k] : [])], grupo: { nombre: 'Viaje', dibujo: c.dibujo } },
          `${n} ÷ ${k} = ${Math.floor(n / k)}, y sobran ${n % k}.`,
        ],
        explicacion: n % k === 0 ? `${n} ÷ ${k} = ${r} viajes.` : `${n} ÷ ${k} = ${Math.floor(n / k)} y sobran ${n % k}; esos también necesitan un viaje: ${r} viajes.`,
      };
    }
    const nb = rng.entero(lerp(3, 10, d), lerp(10, 60, d));
    const e = rng.elegir(EMPAQUES);
    if (modo === 'residuo') {
      const rem = redondo(rng, 5, 45, 5);
      const total = nb * 50 + rem;
      const preguntaSobra = rng.azar(0.4);
      const r = preguntaSobra ? rem : nb;
      const pregunta = preguntaSobra
        ? rng.elegir(['¿Cuántos kilos sobran después de llenar los bultos completos?', '¿Cuántos kilos quedan por fuera de los bultos llenos?'])
        : rng.elegir(['¿Cuántos bultos completos llena?', '¿Cuántos bultos llenos le salen?']);
      return {
        enunciado: `${rng.elegir(BULTOS_RESIDUO)(q, num(total), e)} ${pregunta}`,
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
      enunciado: rng.elegir(BULTOS_EXACTOS)(q, num(total), e),
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

/** Labores pagadas por jornal en la finca. */
const LABORES = [
  'la recolección de cacao',
  'la limpia del cacaotal',
  'la poda de los árboles de cacao',
  'la recolección de café',
  'la desyerba del cafetal',
  'el arreglo de la cerca del potrero',
  'la siembra de las plántulas de cacao',
  'la fumigación del platanal',
  'el abonado de los árboles de aguacate',
  'la cosecha de naranja',
  'el desgrane del maíz',
  'la molienda en el trapiche',
  'el arreglo del camino de la finca',
  'la partida y el desgrane de las mazorcas de cacao',
];

/** Formas de contar la contratación: (labor, quién, trabajadores, días, pago, dato que sobra) → enunciado. */
const CONTRATOS: ((l: string, q: string, t: string, dias: number, pago: string, sobra: string) => string)[] = [
  (l, q, t, dias, pago, sobra) => `Para ${l}, ${minus(q)} contrató ${t} durante ${dias} días. Cada jornal se paga a ${pago} (valor de ejemplo).${sobra} ¿Cuánto debe pagar en total?`,
  (l, q, t, dias, pago, sobra) => `${q} necesita ${t} para ${l}, y el trabajo dura ${dias} días. El jornal está a ${pago} en la vereda (valor de ejemplo).${sobra} ¿Cuánta plata debe tener lista para pagar?`,
  (l, q, t, dias, pago, sobra) => `En la finca ${de(minus(q))} se contrató ${t} durante ${dias} días para ${l}, a ${pago} el jornal (valor de ejemplo).${sobra} ¿Cuánto suman los jornales?`,
  (l, q, t, dias, pago, sobra) => `${q} anotó en el cuaderno que ${l} tomó ${dias} días con ${t}. Pagó cada jornal a ${pago} (valor de ejemplo).${sobra} ¿Cuánto pagó por todo el trabajo?`,
];

/** Datos que sobran en los jornales (con d alto). */
const SOBRAS_JORNAL: ((rng: Rng) => string)[] = [
  (rng) => ` La finca tiene ${num(redondo(rng, 300, 1500, 50))} árboles en producción.`,
  (rng) => ` Cada día se trabaja de ${rng.entero(6, 7)} de la mañana a ${rng.entero(2, 4)} de la tarde.`,
  (rng) => ` El almuerzo lo pone la familia y cuesta unos ${pesos(redondo(rng, 8000, 15000, 1000))} por persona.`,
];

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
    const sobra = d > 0.6 ? rng.elegir(SOBRAS_JORNAL)(rng) : '';
    const trab = t === 1 ? 'a 1 trabajador' : `a ${t} trabajadores`;
    const forma = rng.elegir(CONTRATOS);
    // «a 1 trabajador» después de «contrató» y «se contrató»; en las otras formas va sin la «a».
    const trabTexto = forma === CONTRATOS[0] || forma === CONTRATOS[2] ? trab : trab.slice(2);
    return {
      enunciado: forma(rng.elegir(LABORES), quien(rng), trabTexto, dias, pesos(pago), sobra),
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

/** Escena con varias formas de preguntar: el primer texto es el contexto y los demás, las preguntas. */
function conPregunta(rng: Rng, partes: string[]): string {
  return `${partes[0]} ${rng.elegir(partes.slice(1))}`.trim();
}

/** Situaciones con un porcentaje y una cantidad: ¿qué parte es? */
const PARTE_DE: ((p: number, rng: Rng, q: string) => string[])[] = [
  (p, rng) => [
    `En la feria del pueblo anuncian un descuento del ${p} % en las botas de caucho de ${pesos(redondo(rng, 30000, 70000, 1000))}.`,
    '¿Qué parte del precio le descuentan?',
    '¿A qué parte del precio equivale ese descuento?',
  ],
  (p, rng) => [
    `En el almacén agrícola ofrecen el ${p} % de descuento en el bulto de abono de ${pesos(redondo(rng, 80000, 160000, 1000))}.`,
    '¿A qué parte del precio equivale ese descuento?',
    '¿Qué parte del precio se ahorra quien lo compra?',
  ],
  (p, rng) => [
    `La cooperativa de cacaoteros les devuelve a los socios el ${p} % de lo que gastaron en insumos. Usted gastó ${pesos(redondo(rng, 100000, 900000, 10000))}.`,
    '¿Qué parte de esa plata le devuelven?',
    '¿Qué parte de lo gastado vuelve a su bolsillo?',
  ],
  (p, rng, q) => [`${q} ya sembró de cacao el ${p} % de su lote de ${redondo(rng, 2, 20, 1)} hectáreas.`, '¿Qué parte del lote tiene sembrada?', '¿Qué parte del lote ya está sembrada?'],
  (p, rng, q) => [
    `De una cosecha de ${num(redondo(rng, 100, 2000, 20))} kilos de café, ${minus(q)} guarda el ${p} % para el consumo de la casa.`,
    '¿Qué parte de la cosecha guarda?',
    '¿Qué parte de la cosecha se queda en la casa?',
  ],
  (p, rng, q) => [`En la tienda de la vereda, ${minus(q)} abonó el ${p} % de una deuda de ${pesos(redondo(rng, 20000, 300000, 1000))}.`, '¿Qué parte de la deuda pagó?', '¿Qué parte de lo que debía ya abonó?'],
  (p, rng, q) => [
    `En la natillera, cada socio ahorra el ${p} % de lo que gana. Este mes, ${minus(q)} ganó ${pesos(redondo(rng, 200000, 1500000, 10000))}.`,
    '¿Qué parte de eso debe ahorrar?',
    '¿Qué parte de lo que ganó va para la natillera?',
  ],
  (p, rng) => [
    `Para vender una nevera a crédito, el almacén del pueblo pide una cuota inicial del ${p} % del precio, que es de ${pesos(redondo(rng, 900000, 2500000, 10000))}.`,
    '¿Qué parte del precio es la cuota inicial?',
    '¿Qué parte del precio hay que dar al comienzo?',
  ],
  (p, rng, q) => [`De las ${redondo(rng, 20, 200, 4)} gallinas ${de(minus(q))}, el ${p} % son ponedoras.`, '¿Qué parte de las gallinas pone huevos?', '¿Qué parte del gallinero son ponedoras?'],
  (p, rng) => [`El ${p} % de los ${redondo(rng, 40, 300, 4)} estudiantes del colegio llega a pie.`, '¿Qué parte de los estudiantes es eso?', '¿Qué parte de los estudiantes camina hasta el colegio?'],
  (p, rng) => [
    `Al secar ${num(redondo(rng, 100, 2000, 20))} kilos de cacao en baba se pierde el ${p} % del peso (dato del ejercicio).`,
    '¿Qué parte del peso se pierde?',
    '¿Qué parte del peso se va en el secado?',
  ],
  (p, rng) => [
    `En el mercado del pueblo, un vendedor rebaja el ${p} % del precio del kilo de aguacate, que está a ${pesos(redondo(rng, 2000, 6000, 100))}.`,
    '¿Qué parte del precio rebaja?',
    '¿Qué parte del precio le quita?',
  ],
  (p, rng, q) => [`${q} gasta el ${p} % del pago de la quincena, que fue de ${pesos(redondo(rng, 300000, 900000, 10000))}, en el recibo de la luz y el agua.`, '¿Qué parte del pago es eso?', '¿Qué parte del pago se va en los recibos?'],
];

/** Al revés: se dice la parte y se pregunta el porcentaje. */
const PORCENTAJE_DE: ((parte: string, rng: Rng, q: string) => string[])[] = [
  (parte, rng, q) => [`${q} pagó ${parte} de los ${pesos(redondo(rng, 20000, 400000, 4000))} que debía en la tienda de la vereda.`, '¿Qué porcentaje de la deuda pagó?', '¿Qué tanto por ciento de la deuda abonó?'],
  (parte, rng, q) => [
    `La cooperativa le adelantó ${al(minus(q))} ${parte} del valor de la cosecha, que es de ${pesos(redondo(rng, 400000, 4000000, 40000))}.`,
    '¿Qué porcentaje del valor le adelantaron?',
    '¿Qué tanto por ciento recibió por adelantado?',
  ],
  (parte, rng) => [`De los ${redondo(rng, 40, 400, 20)} árboles de cacao del lote, ${parte} ya dio la primera cosecha.`, '¿Qué porcentaje del lote es?', '¿Qué tanto por ciento de los árboles ya produce?'],
  (parte, rng) => [`En la feria del pueblo rebajan ${parte} del precio de las botas de caucho de ${pesos(redondo(rng, 30000, 70000, 4000))}.`, '¿De qué porcentaje es el descuento?', '¿Qué tanto por ciento le rebajan?'],
  (parte, rng, q) => [`${q} ya recogió ${parte} de los ${num(redondo(rng, 200, 2000, 20))} kilos de café de la cosecha.`, '¿Qué porcentaje de la cosecha lleva?', '¿Qué tanto por ciento ya recogió?'],
];

const PORCENTAJES_TEXTO: Record<number, string> = { 10: '10 %', 25: '25 %', 50: '50 %' };

/** Comparar dos porcentajes de cantidades distintas. */
const COMPARAR_PORCENTAJES: ((o1: string, o2: string, q: string) => string[])[] = [
  (o1, o2) => ['', `¿Qué es más dinero: ${o1} o ${o2}?`, `¿Qué da más plata: ${o1} o ${o2}?`],
  (o1, o2, q) => [`En un almacén le ofrecen ${al(minus(q))} ${o1} de descuento en una compra, y en otro, ${o2}.`, '¿Cuál descuento le ahorra más plata?', '¿En cuál almacén le rebajan más?'],
  (o1, o2, q) => [`${q} puede ahorrar ${o1} de la venta del cacao o ${o2} de la venta del café.`, '¿Con cuál ahorra más?', '¿Cuál ahorro es mayor?'],
  (o1, o2) => [`Para arreglar el camino de herradura, la junta de acción comunal propone aportar ${o1} o ${o2}.`, '¿Cuál aporte es mayor?', '¿Con cuál se recoge más plata?'],
  (o1, o2) => [`Dos vecinos abonaron a sus deudas: uno pagó ${o1} y el otro ${o2}.`, '¿Cuál pagó más plata?', '¿Cuál abonó más?'],
  (o1, o2) => [`Para el bazar de la escuela, una familia regala ${o1} y otra ${o2}.`, '¿Cuál dio más?', '¿Cuál familia aportó más plata?'],
];

const porcentajeConcepto: Plantilla = {
  id: 'fam-porcentaje-concepto',
  dimension: 'comprension',
  operacion: 'division',
  descripcion: 'Qué significa el 10, el 25 y el 50 %',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const q = quien(rng);
    if (d < 0.5 || rng.azar(0.4)) {
      const p = rng.elegir(PORCENTAJES);
      if (rng.azar(0.3)) {
        // Se dice la parte y se elige el porcentaje.
        const opciones = rng.barajar([...PORCENTAJES.map((x) => PORCENTAJES_TEXTO[x]), '75 %']);
        return {
          enunciado: conPregunta(rng, rng.elegir(PORCENTAJE_DE)(PARTE[p].toLowerCase(), rng, q)),
          instruccion: 'Elija el porcentaje',
          datos: { p },
          respuesta: PORCENTAJES_TEXTO[p],
          distractores: opciones.filter((o) => o !== PORCENTAJES_TEXTO[p]),
          interaccion: { tipo: 'opciones', opciones },
          pistas: [
            'El 100 % es el total. ¿En cuántas partes iguales se partió?',
            { tipo: 'texto', texto: `100 ÷ ${100 / p} = ${p}` },
            `${PARTE[p]} es 1 de cada ${100 / p} partes iguales: 100 ÷ ${100 / p}.`,
          ],
          explicacion: `${PARTE[p]} es el ${p} %, porque 100 ÷ ${100 / p} = ${p}.`,
        };
      }
      const opciones = rng.barajar([PARTE[10], PARTE[25], PARTE[50], 'Tres cuartas partes']);
      return {
        enunciado: conPregunta(rng, rng.elegir(PARTE_DE)(p, rng, q)),
        instruccion: 'Elija la parte',
        datos: { p },
        respuesta: PARTE[p],
        distractores: opciones.filter((o) => o !== PARTE[p]),
        interaccion: { tipo: 'opciones', opciones },
        pistas: [
          'El 100 % es el total. ¿Cuántas veces cabe este porcentaje en 100?',
          { tipo: 'texto', texto: `100 ÷ ${p} = ${100 / p}` },
          `El ${p} % es 1 de cada ${100 / p} partes iguales.`,
        ],
        explicacion: `El ${p} % es ${PARTE[p].toLowerCase()} del total, porque 100 ÷ ${p} = ${100 / p}.`,
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
      enunciado: conPregunta(rng, rng.elegir(COMPARAR_PORCENTAJES)(`el ${p1} % de ${pesos(b1)}`, `el ${p2} % de ${pesos(b2)}`, q)),
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

/** Situaciones para calcular un porcentaje de una cantidad de plata: (p, base, quién) → [contexto, preguntas…].
 *  `min`: base mínima para que la situación sea creíble (una novilla no vale veinte mil pesos). */
const CALCULAR_PORCENTAJE: { t: (p: number, b: string, q: string) => string[]; min: number }[] = [
  { t: (p, b) => ['', `Calcule el ${p} % de ${b}.`, `¿Cuánto es el ${p} % de ${b}?`, `Halle el ${p} % de ${b}.`], min: 0 },
  { t: (p, b, q) => [`${q} ahorra el ${p} % de lo que recibió por una venta de cacao de ${b}.`, '¿Cuánto ahorra?', '¿Cuánta plata guarda?', '¿Cuánto va para el ahorro?'], min: 0 },
  {
    t: (p, b) => [`La junta de acción comunal pide aportar el ${p} % de ${b} para arreglar el camino de herradura.`, '¿Cuánto es ese aporte?', '¿Cuánto hay que aportar?', '¿De cuánto es la cuota para el camino?'],
    min: 0,
  },
  {
    t: (p, b, q) => [`La cooperativa le paga ${al(minus(q))} ${b} por el café, pero le descuenta el ${p} % para el fondo de fertilizantes.`, '¿Cuánto le descuentan?', '¿Cuánto va para el fondo?', '¿De cuánto es el descuento?'],
    min: 100000,
  },
  {
    t: (p, b, q) => [`${q} quiere comprar una nevera de ${b} a crédito y en el almacén le piden una cuota inicial del ${p} %.`, '¿De cuánto es la cuota inicial?', '¿Cuánto debe dar al comienzo?', '¿Cuánto paga de entrada?'],
    min: 600000,
  },
  { t: (p, b, q) => [`${q} debe ${b} en la tienda de la vereda y este mes abona el ${p} % de la deuda.`, '¿Cuánto abona?', '¿Cuánto paga este mes?', '¿De cuánto es el abono?'], min: 0 },
  {
    t: (p, b, q) => [`De los ${b} que le pagaron por la leche del mes, ${minus(q)} separa el ${p} % para el mercado.`, '¿Cuánto separa?', '¿Cuánto va para el mercado?', '¿Cuánta plata aparta?'],
    min: 200000,
  },
  {
    t: (p, b, q) => [`En la natillera de la vereda, ${minus(q)} mete cada mes el ${p} % de lo que gana. Este mes ganó ${b}.`, '¿Cuánto mete?', '¿Cuánto ahorra este mes?', '¿Cuánto va a la natillera?'],
    min: 100000,
  },
  { t: (p, b, q) => [`${q} vende una novilla en ${b} y el comprador le adelanta el ${p} %.`, '¿Cuánto le adelanta?', '¿Cuánto recibe por adelantado?', '¿De cuánto es el adelanto?'], min: 800000 },
  {
    t: (p, b) => [`El vivero pide el ${p} % de un pedido de plántulas de ${b} como anticipo.`, '¿Cuánto hay que dar de anticipo?', '¿De cuánto es el anticipo?', '¿Cuánto se paga por adelantado?'],
    min: 40000,
  },
  {
    t: (p, b, q) => [`Del pago de la cosecha, que fue de ${b}, ${minus(q)} gasta el ${p} % en útiles y uniformes de los niños.`, '¿Cuánto gasta en eso?', '¿Cuánto se va en el colegio?', '¿Cuánta plata usa para el colegio?'],
    min: 200000,
  },
  { t: (p, b, q) => [`${q} sacó un crédito de ${b} en el banco y ya pagó el ${p} %.`, '¿Cuánto ha pagado?', '¿Cuánta plata ya devolvió?', '¿Cuánto lleva pagado?'], min: 300000 },
  {
    t: (p, b) => [`Una familia trabaja un lote al partir con el dueño y le entrega el ${p} % de una venta de ${b}.`, '¿Cuánto le entrega?', '¿Cuánto le toca al dueño?', '¿Cuánta plata le da?'],
    min: 100000,
  },
  {
    t: (p, b, q) => [`${q} vendió unos cerdos en ${b} y guarda el ${p} % para comprar los lechones de la próxima camada.`, '¿Cuánto guarda?', '¿Cuánto aparta para los lechones?', '¿Cuánta plata separa?'],
    min: 200000,
  },
  {
    t: (p, b, q) => [`${q} recibió ${b} por los huevos del mes y gasta el ${p} % en concentrado para las gallinas.`, '¿Cuánto gasta en concentrado?', '¿Cuánto se va en concentrado?', '¿Cuánta plata usa en el concentrado?'],
    min: 40000,
  },
];

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
    const escena = rng.elegir(CALCULAR_PORCENTAJE.filter((e) => e.min <= base));
    return {
      enunciado: conPregunta(rng, escena.t(p, pesos(base), quien(rng))),
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

/** Secar la cosecha: dónde y qué (el porcentaje que se pierde es un dato del ejercicio). */
const SECADOS: { intro: (q: string) => string; fresco: string; seco: string }[] = [
  { intro: () => 'Al secarse en la elba, el cacao en baba pierde peso.', fresco: 'cacao en baba', seco: 'cacao seco' },
  { intro: () => 'Al secarse en la marquesina, el cacao en baba pierde peso.', fresco: 'cacao en baba', seco: 'cacao seco' },
  { intro: (q) => `Después de fermentarlo, ${minus(q)} pone el cacao a secar al sol en el patio de cemento.`, fresco: 'cacao fermentado', seco: 'cacao seco' },
  { intro: () => 'En el secador solar de la asociación de cacaoteros, el cacao pierde agua y pesa menos.', fresco: 'cacao en baba', seco: 'cacao seco' },
  { intro: (q) => `${q} extiende el cacao sobre lonas al sol para secarlo, y así pierde peso.`, fresco: 'cacao húmedo', seco: 'cacao seco' },
  { intro: () => 'El café lavado se seca en las paseras de la finca y pierde agua.', fresco: 'café lavado', seco: 'café pergamino seco' },
  { intro: () => 'En la marquesina del beneficiadero, el café lavado se seca y pierde peso.', fresco: 'café lavado', seco: 'café pergamino seco' },
  { intro: (q) => `${q} lleva el café al silo de secado de la vereda, donde pierde humedad.`, fresco: 'café mojado', seco: 'café pergamino seco' },
  { intro: () => 'El maíz recién cosechado se pone a secar en el patio antes de guardarlo en la bodega.', fresco: 'maíz recién cosechado', seco: 'maíz seco' },
  { intro: (q) => `${q} seca al sol el fríjol recién arrancado antes de desgranarlo.`, fresco: 'fríjol recién arrancado', seco: 'fríjol seco' },
  { intro: () => 'La yuca picada se seca al sol para darla a los animales, y al secarse pierde peso.', fresco: 'yuca picada', seco: 'yuca seca' },
  { intro: (q) => `${q} seca en la marquesina las tajadas de plátano verde para hacer harina.`, fresco: 'plátano en tajadas', seco: 'plátano seco' },
];

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
    const s = rng.elegir(SECADOS);
    const preguntaPerdida = d < 0.3 && rng.azar(0.5);
    const resp = preguntaPerdida ? perdida : r;
    const pregunta = preguntaPerdida
      ? rng.elegir(['¿cuántos kilos se pierden?', '¿cuántos kilos de agua se van en el secado?'])
      : rng.elegir([`¿cuántos kilos de ${s.seco} quedan?`, `¿cuántos kilos de ${s.seco} le quedan para vender o guardar?`, `¿cuánto pesa al final el ${s.seco}?`]);
    return {
      enunciado: `${s.intro(quien(rng))} Si de ${num(a)} kilos de ${s.fresco} se pierde el ${p} % (es un dato del ejercicio, no un valor técnico real), ${pregunta}`,
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
      explicacion: `El ${p} % de ${num(a)} es ${num(perdida)} kilos. ${preguntaPerdida ? '' : `Quedan ${num(a)} − ${num(perdida)} = ${num(r)} kilos de ${s.seco}.`}`.trim(),
    };
  },
};

/** Artículos con descuento: nombre con artículo, si es plural, rango de precio y dónde se compran. */
const ARTICULOS_DESCUENTO: { n: string; pl?: boolean; min: number; max: number; lugar: string }[] = [
  { n: 'el bulto de abono', min: 80000, max: 160000, lugar: 'el almacén agrícola del casco urbano de San Vicente' },
  { n: 'las botas de caucho', pl: true, min: 30000, max: 60000, lugar: 'el almacén agrícola' },
  { n: 'la carretilla', min: 150000, max: 250000, lugar: 'la ferretería del pueblo' },
  { n: 'las tijeras de podar', pl: true, min: 40000, max: 80000, lugar: 'el almacén agrícola' },
  { n: 'el uniforme escolar', min: 50000, max: 90000, lugar: 'el almacén de ropa del pueblo' },
  { n: 'la bomba de fumigar', min: 150000, max: 300000, lugar: 'el almacén agrícola' },
  { n: 'el machete', min: 20000, max: 40000, lugar: 'la ferretería del pueblo' },
  { n: 'el morral escolar', min: 40000, max: 80000, lugar: 'la papelería del pueblo' },
  { n: 'los zapatos del colegio', pl: true, min: 60000, max: 120000, lugar: 'el almacén de calzado del pueblo' },
  { n: 'el tanque para el agua', min: 200000, max: 400000, lugar: 'la ferretería del pueblo' },
  { n: 'la estufa de gas', min: 300000, max: 600000, lugar: 'el almacén de electrodomésticos del pueblo' },
  { n: 'el rollo de alambre de púas', min: 120000, max: 200000, lugar: 'la ferretería del pueblo' },
  { n: 'la guadaña', min: 600000, max: 1200000, lugar: 'el almacén agrícola' },
  { n: 'la olla a presión', min: 80000, max: 150000, lugar: 'el almacén del pueblo' },
  { n: 'el bulto de concentrado', min: 70000, max: 110000, lugar: 'el almacén agrícola' },
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
    const bulto = art.n.startsWith('el bulto');
    const varios = bulto && d > 0.6;
    const n = varios ? rng.entero(2, 6) : 1;
    const bruto = precio * n;
    const desc = (bruto * p) / 100;
    const r = bruto - desc;
    const cuesta = art.pl ? 'cuestan' : 'cuesta';
    const pregunta = rng.elegir([`¿Cuánto paga ${minus(q)}?`, `¿Cuánto le toca pagar ${al(minus(q))}?`, '¿Cuál es el precio final?']);
    const queBulto = art.n.replace('el bulto', 'bulto');
    const enunciado = varios
      ? rng.elegir([
          `En ${art.lugar}, ${art.n} ${cuesta} ${pesos(precio)} y, por comprar ${n} bultos, le hacen un descuento del ${p} % sobre el total (precios de ejemplo). ${pregunta}`,
          `${q} necesita ${n} bultos de ${queBulto.replace('bulto de ', '')}. En ${art.lugar} cada bulto vale ${pesos(precio)} y, por llevar varios, le rebajan el ${p} % del total (precios de ejemplo). ${pregunta}`,
        ])
      : rng.elegir([
          `En ${art.lugar}, ${art.n} ${cuesta} ${pesos(precio)} y ${art.pl ? 'tienen' : 'tiene'} un descuento del ${p} % (precios de ejemplo). ${pregunta}`,
          `${q} va a comprar ${art.n}, que ${cuesta} ${pesos(precio)} en ${art.lugar}. Por pagar de contado le rebajan el ${p} % (precios de ejemplo). ${pregunta}`,
        ]);
    return {
      enunciado,
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

/** De arrobas a kilos: (quién, arrobas) → contexto. `min`: arrobas mínimas para que sea creíble (un novillo). */
const ARROBAS_A_KILOS: { t: (q: string, n: number) => string; min?: number }[] = [
  { t: (q, n) => `${q} vende el cacao por arrobas y esta semana sacó ${n} arrobas.` },
  { t: (q, n) => `En la cooperativa de caficultores le recibieron ${al(minus(q))} ${n} arrobas de café pergamino.` },
  { t: (q, n) => `Un ternero ${de(minus(q))} pesa ${n} arrobas.`, min: 6 },
  { t: (q, n) => `Un novillo ${de(minus(q))} pesa ${n} arrobas en la feria ganadera de San Vicente.`, min: 20 },
  { t: (q, n) => `En el trapiche, ${minus(q)} compró ${n} arrobas de panela para revender en la tienda.` },
  { t: (q, n) => `${q} le debe entregar ${n} arrobas de maíz a un vecino.` },
  { t: (_q, n) => `Para el sancocho de la fiesta de la vereda se compraron ${n} arrobas de carne de res.` },
  { t: (q, n) => `${q} recogió ${n} arrobas de fríjol seco en la cosecha.` },
  { t: (_q, n) => `La cosecha de cacao de la quincena fue de ${n} arrobas.` },
  { t: (q, n) => `${q} vendió ${n} arrobas de yuca en el mercado del pueblo.` },
  { t: (q, n) => `Un cerdo ${de(minus(q))} pesa ${n} arrobas.`, min: 6 },
  { t: (q, n) => `${q} compró ${n} arrobas de sal mineralizada para el ganado.` },
];
const PREGUNTAS_KILOS = ['Si una arroba es 12,5 kilos, ¿cuántos kilos son?', 'Una arroba es 12,5 kilos. ¿A cuántos kilos equivale?'];

/** De kilos a arrobas: (quién, kilos) → contexto. `min`: grupos de 25 kilos mínimos. */
const KILOS_A_ARROBAS: { t: (q: string, kg: string) => string; min?: number }[] = [
  { t: (q, kg) => `${q} tiene ${kg} kilos de cacao seco.` },
  { t: (_q, kg) => `La báscula de la cooperativa marcó ${kg} kilos de café pergamino.` },
  { t: (q, kg) => `Un novillo ${de(minus(q))} pesó ${kg} kilos en la feria ganadera de San Vicente.`, min: 10 },
  { t: (q, kg) => `${q} sacó ${kg} kilos de panela en la molienda.` },
  { t: (_q, kg) => `En la bodega de la finca hay ${kg} kilos de maíz.` },
  { t: (q, kg) => `El comprador de cacao pesó ${kg} kilos en la báscula ${de(minus(q))}.` },
  { t: (_q, kg) => `Para el sancocho comunitario se compraron ${kg} kilos de yuca.` },
  { t: (q, kg) => `Un ternero ${de(minus(q))} pesó ${kg} kilos.`, min: 3 },
  { t: (q, kg) => `${q} cosechó ${kg} kilos de fríjol.` },
  { t: (q, kg) => `${q} llevó ${kg} kilos de naranja al mercado del pueblo.` },
  { t: (_q, kg) => `En el beneficiadero se pesaron ${kg} kilos de café seco.` },
  { t: (q, kg) => `${q} compró ${kg} kilos de concentrado para los cerdos.` },
];
const PREGUNTAS_ARROBAS = ['Si una arroba es 12,5 kilos, ¿cuántas arrobas son?', 'Una arroba es 12,5 kilos. ¿A cuántas arrobas equivale?'];

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
      const e = rng.elegir(ARROBAS_A_KILOS);
      const n = Math.max(e.min ?? 0, 2 * rng.entero(1, lerp(5, 20, d)));
      const r = n * 12.5;
      return {
        enunciado: `${e.t(q, n)} ${rng.elegir(PREGUNTAS_KILOS)}`,
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
    const e = rng.elegir(KILOS_A_ARROBAS);
    const m = Math.max(e.min ?? 0, rng.entero(1, lerp(4, 20, d)));
    const kg = 25 * m;
    const r = 2 * m;
    return {
      enunciado: `${e.t(q, num(kg))} ${rng.elegir(PREGUNTAS_ARROBAS)}`,
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

/** Kilos a gramos: (quién, kilos) → contexto. */
const KILOS_A_GRAMOS: ((q: string, k: number) => string)[] = [
  (q, k) => `${q} compró ${k} kilos de panela para la casa.`,
  (q, k) => `Para las arepas de la semana, ${minus(q)} tiene ${k} kilos de maíz pelado.`,
  (q, k) => `En la tienda de la vereda le vendieron ${al(minus(q))} ${k} kilos de azúcar.`,
  (q, k) => `${q} sacó ${k} kilos de queso con la leche de la semana.`,
  (q, k) => `${q} trajo del pueblo ${k} kilos de carne para la fiesta de la vereda.`,
  (_q, k) => `La huerta escolar recibió ${k} kilos de semillas de fríjol.`,
  (q, k) => `${q} tostó ${k} kilos de café para la casa.`,
  (q, k) => `${q} compró ${k} kilos de sal mineralizada para el ganado.`,
];
const PREGUNTAS_GRAMOS = ['¿Cuántos gramos son? (1 kilo = 1.000 gramos)', '¿A cuántos gramos equivalen? Recuerde que 1 kilo = 1.000 gramos.'];

/** Kilos a libras: (quién, kilos) → contexto. */
const KILOS_A_LIBRAS: ((q: string, k: number) => string)[] = [
  (_q, k) => `En la tienda de la vereda se vende el arroz por libras y llegó un bulto de ${k} kilos.`,
  (q, k) => `${q} compró ${k} kilos de fríjol para venderlo por libras en la tienda.`,
  (q, k) => `${q} va a vender ${k} kilos de queso por libras en el mercado del pueblo.`,
  (_q, k) => `A la tienda de la vereda llegaron ${k} kilos de azúcar para vender por libras.`,
  (q, k) => `${q} tiene ${k} kilos de café molido para empacar en paquetes de una libra.`,
  (q, k) => `${q} va a repartir ${k} kilos de carne en porciones de una libra para los vecinos.`,
  (_q, k) => `Para el restaurante escolar llegaron ${k} kilos de lentejas, que se reparten por libras.`,
  (q, k) => `${q} tiene ${k} kilos de cuajada para vender por libras en la vereda.`,
];
const PREGUNTAS_LIBRAS = ['¿Cuántas libras salen? (1 libra = 500 gramos)', 'Si 1 libra son 500 gramos, ¿cuántas libras son?'];

/** Empacar en bolsas o paquetes de 250 o 500 gramos. */
const EMPACAR_GRAMOS: { t: (q: string, k: number) => string; envase: string; g: Genero }[] = [
  { t: (q, k) => `${q} tostó y molió ${k} kilos de café para vender en el mercado del pueblo.`, envase: 'bolsas', g: 'f' },
  { t: (q, k) => `${q} preparó ${k} kilos de chocolate de mesa con el cacao de la finca.`, envase: 'paquetes', g: 'm' },
  { t: (_q, k) => `En la huerta escolar se cosecharon ${k} kilos de fríjol para repartir entre las familias.`, envase: 'bolsas', g: 'f' },
  { t: (q, k) => `${q} va a empacar ${k} kilos de maní tostado para vender en la escuela.`, envase: 'bolsitas', g: 'f' },
  { t: (_q, k) => `La asociación de cacaoteros tiene ${k} kilos de cacao en polvo para vender en la feria.`, envase: 'bolsas', g: 'f' },
  { t: (q, k) => `${q} molió ${k} kilos de maíz para hacer harina de arepas.`, envase: 'paquetes', g: 'm' },
  { t: (q, k) => `${q} tiene ${k} kilos de panela pulverizada para vender en la tienda.`, envase: 'bolsas', g: 'f' },
];

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
        enunciado: `${rng.elegir(KILOS_A_GRAMOS)(q, k)} ${rng.elegir(PREGUNTAS_GRAMOS)}`,
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
        enunciado: `${rng.elegir(KILOS_A_LIBRAS)(q, k)} ${rng.elegir(PREGUNTAS_LIBRAS)}`,
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
    const e = rng.elegir(EMPACAR_GRAMOS);
    const pregunta = rng.elegir([`Si todo se empaca en ${e.envase} de ${g} gramos, ¿${cuantos(e.g, false)} ${e.envase} se llenan?`, `¿${cuantos(e.g)} ${e.envase} de ${g} gramos salen?`]);
    return {
      enunciado: `${e.t(q, k)} ${pregunta}`,
      instruccion: 'Cuente los empaques',
      datos: { k, g },
      respuesta: r,
      unidad: e.envase,
      ...responder(ctx, r, [k * (g === 250 ? 2 : 4), k, r + 1, r - 1]),
      calculo: { op: 'division', a: k * 1000, b: g },
      pistas: [`¿${cuantos(e.g)} ${e.envase} de ${g} gramos salen de un solo kilo?`, { tipo: 'texto', texto: `1 kilo = 1.000 g = ${1000 / g} ${e.envase}` }, `${k} kilos × ${1000 / g} ${e.envase} por kilo.`],
      explicacion: `${num(k * 1000)} g ÷ ${g} = ${r} ${e.envase}.`,
    };
  },
};

/** Cultivos y cuántas plantas se siembran por hectárea (datos del ejercicio). */
const CULTIVOS_HA: { plantas: string; g: Genero; semilla: string; gs: Genero; dens: number[] }[] = [
  { plantas: 'árboles de cacao', g: 'm', semilla: 'plántulas de cacao', gs: 'f', dens: [800, 1000, 1100, 1200] },
  { plantas: 'matas de café', g: 'f', semilla: 'colinos de café', gs: 'm', dens: [4000, 5000, 5500, 6000] },
  { plantas: 'árboles de aguacate', g: 'm', semilla: 'plántulas de aguacate', gs: 'f', dens: [200, 250, 300] },
  { plantas: 'árboles de naranja', g: 'm', semilla: 'plántulas de naranja', gs: 'f', dens: [300, 400, 500] },
  { plantas: 'árboles de limón', g: 'm', semilla: 'plántulas de limón', gs: 'f', dens: [400, 500, 600] },
  { plantas: 'matas de plátano', g: 'f', semilla: 'colinos de plátano', gs: 'm', dens: [1100, 1500, 1600] },
  { plantas: 'árboles de mandarina', g: 'm', semilla: 'plántulas de mandarina', gs: 'f', dens: [300, 400, 500] },
];

/** Lotes que no llegan a una hectárea. */
const LOTES: ((q: string, l: number, w: number) => string)[] = [
  (q, l, w) => `${q} tiene un lote rectangular de ${l} metros de largo y ${w} metros de ancho. ¿Cuántos metros cuadrados le faltan para completar una hectárea?`,
  (q, l, w) => `${q} encerró un potrero rectangular de ${l} metros por ${w} metros. ¿Cuántos metros cuadrados le faltan al potrero para ser una hectárea?`,
  (_q, l, w) => `La huerta escolar es un rectángulo de ${l} metros de largo y ${w} metros de ancho. ¿Cuántos metros cuadrados le faltan para llegar a una hectárea?`,
  (q, l, w) => `${q} compró un lote rectangular de ${l} metros por ${w} metros para sembrar cacao. ¿Cuántos metros cuadrados más necesita para tener una hectárea?`,
  (q, l, w) => `El solar de la casa ${de(minus(q))} mide ${l} metros de largo y ${w} metros de ancho. ¿Cuántos metros cuadrados le faltan para completar una hectárea?`,
  (_q, l, w) => `La junta de acción comunal tiene un lote rectangular de ${l} metros por ${w} metros para la cancha. ¿Cuántos metros cuadrados le faltan para ser una hectárea?`,
  (q, l, w) => `${q} va a arrendar un lote rectangular de ${l} metros de largo por ${w} de ancho para sembrar maíz. ¿Cuántos metros cuadrados le faltan para una hectárea completa?`,
];

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
        enunciado: `Una hectárea tiene 10.000 metros cuadrados. ${rng.elegir(LOTES)(q, l, w)}`,
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
    const c = rng.elegir(CULTIVOS_HA);
    const dens = rng.elegir(c.dens);
    const h = rng.entero(2, lerp(5, 20, d));
    const total = dens * h;
    const plan = `En el plan de siembra se ponen ${num(dens)} ${c.plantas} por hectárea (dato del ejercicio).`;
    if (modo === 'hectareas') {
      return {
        enunciado: rng.elegir([
          `${plan} Si ${minus(q)} tiene ${num(total)} ${c.semilla} en el vivero, ¿cuántas hectáreas puede sembrar?`,
          `${plan} ${q} sembró ${num(total)} ${c.semilla}. ¿Cuántas hectáreas quedaron sembradas?`,
        ]),
        instruccion: 'Calcule las hectáreas',
        datos: { dens, total },
        respuesta: h,
        unidad: 'hectáreas',
        ...responder(ctx, h, [h + 1, h - 1, h * 10, h + 2]),
        calculo: { op: 'division', a: total, b: dens },
        operacion: 'division',
        pistas: [`¿Cuántas veces caben ${num(dens)} en ${num(total)}?`, { tipo: 'texto', texto: `${num(total)} ÷ ${num(dens)}` }, `Pruebe: ${num(dens)} × ${h - 1}, ${num(dens)} × ${h}…`],
        explicacion: `${num(total)} ÷ ${num(dens)} = ${h} hectáreas.`,
      };
    }
    return {
      enunciado: rng.elegir([
        `${plan} ¿${cuantos(c.g)} ${c.plantas.split(' ')[0]} necesita ${minus(q)} para ${h} hectáreas?`,
        `${plan} ${q} va a sembrar ${h} hectáreas. ¿${cuantos(c.gs)} ${c.semilla} debe pedir al vivero?`,
        `${plan} ¿${cuantos(c.g)} ${c.plantas} caben en un lote de ${h} hectáreas?`,
      ]),
      instruccion: 'Calcule las plantas',
      datos: { dens, h },
      respuesta: total,
      unidad: c.plantas.split(' ')[0],
      ...responder(ctx, total, [dens * (h + 1), dens * (h - 1), dens + h, total * 10]),
      calculo: { op: 'multiplicacion', a: dens, b: h },
      pistas: ['Cada hectárea lleva la misma cantidad de plantas. ¿Qué operación usa?', { tipo: 'texto', texto: `${num(dens)} × ${h}` }, `Multiplique ${num(dens)} × ${h}.`],
      explicacion: `${num(dens)} × ${h} = ${num(total)} ${c.plantas}.`,
    };
  },
};

/** Proporción con precios: (a, precio de a, c, quién) → enunciado; `uno` nombra la unidad y [min, max] el precio de una. */
const PROPORCION_PRECIO: { t: (a: number, x: string, c: number, q: string) => string; uno: string; min: number; max: number }[] = [
  { t: (a, x, c) => `Si ${a} bultos de abono cuestan ${x}, ¿cuánto cuestan ${c} bultos del mismo abono?`, uno: 'bulto', min: 60000, max: 150000 },
  { t: (a, x, c, q) => `${q} pagó ${x} por ${a} bultos de concentrado para las gallinas. ¿Cuánto pagará por ${c} bultos?`, uno: 'bulto', min: 70000, max: 110000 },
  { t: (a, x, c) => `En la ferretería del pueblo, ${a} rollos de alambre de púas valen ${x}. ¿Cuánto valen ${c} rollos?`, uno: 'rollo', min: 100000, max: 180000 },
  { t: (a, x, c, q) => `Por ${a} jornales de recolección, ${minus(q)} pagó ${x}. ¿Cuánto pagará por ${c} jornales?`, uno: 'jornal', min: 50000, max: 80000 },
  { t: (a, x, c) => `${a} pasajes en la chiva hasta San Vicente cuestan ${x}. ¿Cuánto cuestan ${c} pasajes?`, uno: 'pasaje', min: 5000, max: 12000 },
  { t: (a, x, c, q) => `En la cooperativa le pagaron ${al(minus(q))} ${x} por ${a} kilos de cacao seco. ¿Cuánto le pagarán por ${c} kilos?`, uno: 'kilo', min: 9000, max: 25000 },
  { t: (a, x, c, q) => `${q} pagó ${x} por ${a} galones de gasolina para la moto. ¿Cuánto le costarán ${c} galones?`, uno: 'galón', min: 14000, max: 17000 },
  { t: (a, x, c) => `En la tienda de la vereda, ${a} docenas de huevos valen ${x}. ¿Cuánto valen ${c} docenas?`, uno: 'docena', min: 8000, max: 15000 },
  { t: (a, x, c, q) => `${q} vendió ${a} libras de café molido por ${x}. ¿Cuánto recibirá por ${c} libras?`, uno: 'libra', min: 8000, max: 15000 },
  { t: (a, x, c) => `Para arreglar el techo, ${a} tejas de zinc cuestan ${x}. ¿Cuánto cuestan ${c} tejas?`, uno: 'teja', min: 25000, max: 45000 },
  { t: (a, x, c) => `En el vivero, ${a} plántulas de cacao injertadas cuestan ${x}. ¿Cuánto cuestan ${c} plántulas?`, uno: 'plántula', min: 2000, max: 5000 },
  { t: (a, x, c, q) => `El carro lechero le pagó ${al(minus(q))} ${x} por ${a} litros de leche. ¿Cuánto le pagará por ${c} litros?`, uno: 'litro', min: 1500, max: 2500 },
  { t: (a, x, c) => `${a} arrobas de panela cuestan ${x} en el trapiche. ¿Cuánto cuestan ${c} arrobas?`, uno: 'arroba', min: 40000, max: 70000 },
  { t: (a, x, c, q) => `${q} pagó ${x} por ${a} pollitos de engorde en el almacén agrícola. ¿Cuánto pagará por ${c} pollitos?`, uno: 'pollito', min: 2000, max: 5000 },
  { t: (a, x, c) => `En la papelería del pueblo, ${a} cuadernos cuestan ${x}. ¿Cuánto cuestan ${c} cuadernos iguales?`, uno: 'cuaderno', min: 2000, max: 6000 },
  { t: (a, x, c, q) => `${q} vendió ${a} racimos de plátano por ${x} al camión de los sábados. ¿Cuánto recibirá por ${c} racimos?`, uno: 'racimo', min: 8000, max: 15000 },
  { t: (a, x, c) => `En la plaza de mercado, ${a} kilos de aguacate valen ${x}. ¿Cuánto valen ${c} kilos?`, uno: 'kilo', min: 2000, max: 6000 },
  { t: (a, x, c, q) => `Por ${a} viajes de la mula hasta la carretera, ${minus(q)} pagó ${x} de arriería. ¿Cuánto pagará por ${c} viajes?`, uno: 'viaje', min: 10000, max: 25000 },
  { t: (a, x, c) => `En la ferretería, ${a} metros de manguera cuestan ${x}. ¿Cuánto cuestan ${c} metros?`, uno: 'metro', min: 1000, max: 3000 },
  { t: (a, x, c, q) => `${q} pagó ${x} por ${a} bultos de cal agrícola. ¿Cuánto le costarán ${c} bultos?`, uno: 'bulto', min: 15000, max: 30000 },
  { t: (a, x, c) => `${a} pipetas de gas cuestan ${x} en el pueblo. ¿Cuánto cuestan ${c} pipetas?`, uno: 'pipeta', min: 60000, max: 90000 },
  { t: (a, x, c, q) => `${q} vendió ${a} kilos de queso por ${x} en el mercado del pueblo. ¿Cuánto recibirá por ${c} kilos?`, uno: 'kilo', min: 12000, max: 18000 },
  { t: (a, x, c) => `En el vivero, ${a} colinos de café cuestan ${x}. ¿Cuánto cuestan ${c} colinos?`, uno: 'colino', min: 500, max: 1500 },
  { t: (a, x, c, q) => `En la droguería veterinaria, ${minus(q)} pagó ${x} por ${a} frascos de vitaminas para el ganado. ¿Cuánto pagará por ${c} frascos?`, uno: 'frasco', min: 15000, max: 35000 },
  { t: (a, x, c) => `${a} canastillas plásticas para la cosecha cuestan ${x}. ¿Cuánto cuestan ${c} canastillas?`, uno: 'canastilla', min: 12000, max: 20000 },
  { t: (a, x, c, q) => `${q} pagó ${x} por ${a} kilos de semilla de maíz. ¿Cuánto pagará por ${c} kilos?`, uno: 'kilo', min: 8000, max: 15000 },
  { t: (a, x, c) => `La recarga para ${a} días de internet del celular cuesta ${x}. ¿Cuánto cuesta para ${c} días?`, uno: 'día', min: 1000, max: 3000 },
];

/** Proporción sin precios: (a, b, c, quién) → enunciado; `m` es lo que corresponde a una unidad. */
const PROPORCION_CANTIDAD: { t: (a: number, b: string, c: number, q: string) => string; por: string; u: string; min: number; max: number; paso: number }[] = [
  { t: (a, b, c) => `Con ${a} bultos de abono se fertilizan ${b} árboles de cacao. ¿Cuántos árboles se fertilizan con ${c} bultos?`, por: 'bulto', u: 'árboles', min: 5, max: 40, paso: 1 },
  { t: (a, b, c, q) => `Para hacer ${a} kilos de queso, ${minus(q)} usa ${b} litros de leche. ¿Cuántos litros necesita para ${c} kilos de queso?`, por: 'kilo de queso', u: 'litros', min: 7, max: 12, paso: 1 },
  { t: (a, b, c, q) => `En ${a} viajes, la mula ${de(minus(q))} baja ${b} bultos de cacao. ¿Cuántos bultos baja en ${c} viajes?`, por: 'viaje', u: 'bultos', min: 2, max: 3, paso: 1 },
  { t: (a, b, c, q) => `Con ${a} bultos de concentrado, ${minus(q)} alimenta las gallinas durante ${b} días. ¿Para cuántos días le alcanzan ${c} bultos?`, por: 'bulto', u: 'días', min: 5, max: 15, paso: 1 },
  { t: (a, b, c) => `Con ${a} rollos de alambre se cercan ${b} metros de potrero. ¿Cuántos metros se cercan con ${c} rollos?`, por: 'rollo', u: 'metros', min: 80, max: 120, paso: 10 },
  { t: (a, b, c, q) => `En ${a} días, ${minus(q)} recoge ${b} kilos de café cereza. Al mismo ritmo, ¿cuántos kilos recoge en ${c} días?`, por: 'día', u: 'kilos', min: 50, max: 120, paso: 10 },
  { t: (a, b, c) => `${a} vacas dan ${b} litros de leche al día, y todas dan lo mismo. ¿Cuántos litros dan ${c} vacas?`, por: 'vaca', u: 'litros', min: 5, max: 15, paso: 1 },
  { t: (a, b, c) => `Con ${a} sobres de semilla de cilantro se siembran ${b} metros de era en la huerta escolar. ¿Cuántos metros se siembran con ${c} sobres?`, por: 'sobre', u: 'metros', min: 3, max: 10, paso: 1 },
  { t: (a, b, c) => `${a} gallinas ponedoras dan ${b} huevos en una semana. ¿Cuántos huevos dan ${c} gallinas en una semana?`, por: 'gallina', u: 'huevos', min: 4, max: 7, paso: 1 },
  { t: (a, b, c) => `Para ${a} hectáreas de cacao se necesitan ${b} plántulas. ¿Cuántas plántulas se necesitan para ${c} hectáreas?`, por: 'hectárea', u: 'plántulas', min: 800, max: 1200, paso: 100 },
  { t: (a, b, c, q) => `En ${a} horas de molienda, ${minus(q)} saca ${b} panelas en el trapiche. ¿Cuántas panelas saca en ${c} horas?`, por: 'hora', u: 'panelas', min: 20, max: 60, paso: 5 },
  { t: (a, b, c) => `${a} bultos de cacao seco pesan ${b} kilos. ¿Cuántos kilos pesan ${c} bultos iguales?`, por: 'bulto', u: 'kilos', min: 40, max: 60, paso: 5 },
  { t: (a, b, c, q) => `En ${a} días, ${minus(q)} llena ${b} bolsas para vivero con tierra. ¿Cuántas bolsas llena en ${c} días?`, por: 'día', u: 'bolsas', min: 100, max: 300, paso: 20 },
  { t: (a, b, c) => `${a} árboles de naranja dan ${b} naranjas en la cosecha, y todos dan lo mismo. ¿Cuántas naranjas dan ${c} árboles?`, por: 'árbol', u: 'naranjas', min: 100, max: 300, paso: 10 },
  { t: (a, b, c) => `Con ${a} galones de gasolina, la moto anda ${b} kilómetros. ¿Cuántos kilómetros anda con ${c} galones?`, por: 'galón', u: 'kilómetros', min: 80, max: 120, paso: 10 },
  { t: (a, b, c, q) => `En ${a} semanas, ${minus(q)} junta ${b} huevos en el gallinero. ¿Cuántos huevos junta en ${c} semanas?`, por: 'semana', u: 'huevos', min: 30, max: 90, paso: 5 },
  { t: (a, b, c) => `${a} cajas de cacao para fermentar reciben ${b} kilos de cacao en baba. ¿Cuántos kilos reciben ${c} cajas?`, por: 'caja', u: 'kilos', min: 50, max: 150, paso: 10 },
  { t: (a, b, c) => `${a} surcos de la huerta escolar tienen ${b} matas de cebolla. ¿Cuántas matas tienen ${c} surcos iguales?`, por: 'surco', u: 'matas', min: 10, max: 30, paso: 1 },
  { t: (a, b, c, q) => `En ${a} ordeños, ${minus(q)} saca ${b} litros de leche. ¿Cuántos litros saca en ${c} ordeños?`, por: 'ordeño', u: 'litros', min: 20, max: 60, paso: 5 },
  { t: (a, b, c) => `${a} canastillas de mandarina pesan ${b} kilos. ¿Cuántos kilos pesan ${c} canastillas?`, por: 'canastilla', u: 'kilos', min: 15, max: 25, paso: 1 },
  { t: (a, b, c) => `En ${a} viajes, la chiva sube ${b} pasajeros a la vereda. Si siempre va llena, ¿cuántos pasajeros sube en ${c} viajes?`, por: 'viaje', u: 'pasajeros', min: 25, max: 40, paso: 1 },
  { t: (a, b, c) => `${a} cerdos comen ${b} kilos de concentrado en una semana. ¿Cuántos kilos comen ${c} cerdos?`, por: 'cerdo', u: 'kilos', min: 10, max: 20, paso: 1 },
  { t: (a, b, c, q) => `En ${a} horas, ${minus(q)} recoge ${b} mazorcas de cacao. Al mismo ritmo, ¿cuántas recoge en ${c} horas?`, por: 'hora', u: 'mazorcas', min: 40, max: 100, paso: 5 },
  { t: (a, b, c) => `Con ${a} kilos de semilla de fríjol se siembran ${b} surcos. ¿Cuántos surcos se siembran con ${c} kilos?`, por: 'kilo', u: 'surcos', min: 5, max: 12, paso: 1 },
  { t: (a, b, c) => `${a} paneles del secador solar secan ${b} kilos de cacao por tanda. ¿Cuántos kilos secan ${c} paneles?`, por: 'panel', u: 'kilos', min: 20, max: 50, paso: 5 },
  { t: (a, b, c, q) => `En ${a} quincenas, ${minus(q)} ahorra ${b} mil pesos en la natillera. ¿Cuántos miles ahorra en ${c} quincenas?`, por: 'quincena', u: 'mil pesos', min: 20, max: 60, paso: 5 },
  { t: (a, b, c) => `${a} mulas cargan ${b} racimos de plátano en un viaje. ¿Cuántos racimos cargan ${c} mulas?`, por: 'mula', u: 'racimos', min: 4, max: 8, paso: 1 },
  { t: (a, b, c) => `${a} colmenas de la finca dan ${b} botellas de miel en la cosecha. ¿Cuántas botellas dan ${c} colmenas?`, por: 'colmena', u: 'botellas', min: 5, max: 15, paso: 1 },
  { t: (a, b, c, q) => `En ${a} tardes, ${minus(q)} teje ${b} canastos para la cosecha. ¿Cuántos canastos teje en ${c} tardes?`, por: 'tarde', u: 'canastos', min: 2, max: 4, paso: 1 },
];

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
    const q = quien(rng);
    if (rng.azar(0.5)) {
      const e = rng.elegir(PROPORCION_PRECIO);
      const u = redondo(rng, e.min, e.max, e.max <= 20000 ? 500 : 1000);
      const x = a * u;
      const r = c * u;
      return {
        enunciado: e.t(a, pesos(x), c, q),
        instruccion: 'Busque el valor de uno',
        datos: { a, c, x },
        respuesta: r,
        unidad: 'pesos',
        ...responder(ctx, r, [x * c, u * (c + 1), u * (c - 1), x + c * 1000, ...cercanos(r, 1000, d)]),
        calculo: { op: 'multiplicacion', a: u, b: c },
        pistas: [`¿Cuánto vale ${e.uno.endsWith('a') ? 'una sola' : 'un solo'} ${e.uno}?`, { tipo: 'texto', texto: `${pesos(x)} ÷ ${a} = ${pesos(u)} por ${e.uno}` }, `Uno vale ${pesos(u)}. Ahora multiplique por ${c}.`],
        explicacion: `${pesos(x)} ÷ ${a} = ${pesos(u)} por ${e.uno}; ${c} × ${pesos(u)} = ${pesos(r)}.`,
      };
    }
    const e = rng.elegir(PROPORCION_CANTIDAD);
    const m = redondo(rng, e.min, Math.max(e.min, lerp(Math.round((e.min + e.max) / 2), e.max, d)), e.paso);
    const b = a * m;
    const r = c * m;
    return {
      enunciado: e.t(a, num(b), c, q),
      instruccion: 'Busque el valor de uno',
      datos: { a, b, c },
      respuesta: r,
      unidad: e.u,
      ...responder(ctx, r, [b * c, b + c - a, m * (c + 1), m * (c - 1)]),
      calculo: { op: 'multiplicacion', a: m, b: c },
      pistas: [`¿Cuánto corresponde a ${e.por.endsWith('a') ? 'una sola' : 'un solo'} ${e.por}?`, { tipo: 'texto', texto: `${num(b)} ÷ ${a} = ${num(m)} por ${e.por}` }, `${num(m)} por ${e.por} × ${c}.`],
      explicacion: `${num(b)} ÷ ${a} = ${num(m)} ${e.u} por ${e.por}; ${c} × ${num(m)} = ${num(r)} ${e.u}.`,
    };
  },
};

/** Comparar dos pesos en distinta unidad: (quién, primero, segundo) → contexto. */
const COMPARAR_ARROBAS: ((q: string, a: string, b: string) => string)[] = [
  (q, a, b) => `${q} tiene un bulto con ${a} de cacao y otro con ${b}.`,
  (_q, a, b) => `En la báscula de la cooperativa, un lote de café pergamino pesó ${a} y otro, ${b}.`,
  (q, a, b) => `${q} compara dos terneros: uno pesa ${a} y el otro, ${b}.`,
  (_q, a, b) => `Dos vecinos llevaron maíz al molino: uno llevó ${a} y el otro, ${b}.`,
  (q, a, b) => `${q} compró ${a} de panela y su vecina compró ${b}.`,
  (_q, a, b) => `En la bodega hay un arrume de fríjol de ${a} y otro de ${b}.`,
  (q, a, b) => `${q} tiene dos cerdos para vender: uno pesa ${a} y el otro, ${b}.`,
  (_q, a, b) => `Esta semana, la finca sacó ${a} de cacao seco y la finca vecina, ${b}.`,
];

const COMPARAR_GRAMOS: ((q: string, a: string, b: string) => string)[] = [
  (_q, a, b) => `En la tienda de la vereda hay una bolsa con ${a} de café y otra con ${b}.`,
  (q, a, b) => `${q} tiene un pedazo de queso de ${a} y otro de ${b}.`,
  (_q, a, b) => `En el mercado del pueblo venden una panela de ${a} y un paquete de panela de ${b}.`,
  (q, a, b) => `${q} compró ${a} de arroz y su vecina, ${b}.`,
  (_q, a, b) => `En la carnicería del pueblo pesaron dos pedazos de carne: uno de ${a} y otro de ${b}.`,
  (_q, a, b) => `La asociación de cacaoteros vende chocolate de mesa en paquetes de ${a} y de ${b}.`,
  (q, a, b) => `Para la huerta escolar, ${minus(q)} trajo ${a} de semillas de fríjol y otra familia, ${b}.`,
];

const COMPARAR_LIBRAS: ((q: string, a: string, b: string) => string)[] = [
  (_q, a, b) => `En la tienda de la vereda hay una bolsa con ${a} de arroz y otra con ${b}.`,
  (q, a, b) => `${q} compró ${a} de fríjol y su vecina, ${b}.`,
  (_q, a, b) => `En el mercado del pueblo, un vendedor ofrece ${a} de queso y otro, ${b}.`,
  (q, a, b) => `${q} empacó ${a} de café molido y su hija empacó ${b}.`,
  (_q, a, b) => `Para el restaurante escolar llegaron ${a} de lentejas y ${b} de garbanzos.`,
];

const PREGUNTAS_PESO = ['¿Cuál pesa más?', '¿Cuál es más pesado?'];

const compararUnidades: Plantilla = {
  id: 'fam-comparar-unidades',
  dimension: 'comprension',
  operacion: 'multiplicacion',
  descripcion: 'Comparar pesos en arrobas, kilos y gramos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const q = quien(rng);
    const veces = (k: number) => (k === 1 ? 'kilo' : 'kilos');
    /** Arma la pregunta con las dos cantidades en cualquier orden. */
    const armar = (escenas: ((q: string, a: string, b: string) => string)[], ta: string, tb: string) => {
      const [x, y] = rng.azar(0.5) ? [ta, tb] : [tb, ta];
      return `${rng.elegir(escenas)(q, x, y)} ${rng.elegir(PREGUNTAS_PESO)}`;
    };
    const tipo = rng.elegir(['arrobas', 'arrobas', 'gramos', 'libras']);
    if (tipo === 'arrobas') {
      const x = 2 * rng.entero(1, 12);
      const delta = rng.elegir([-15, -10, -5, 0, 5, 10, 15]);
      const y = x * 12.5 + delta;
      const oa = `Las ${x} arrobas`;
      const ob = `Los ${num(y)} kilos`;
      const resp = delta === 0 ? 'Pesan lo mismo' : delta > 0 ? ob : oa;
      const opciones = rng.barajar([oa, ob, 'Pesan lo mismo']);
      return {
        enunciado: `${armar(COMPARAR_ARROBAS, `${x} arrobas`, `${num(y)} kilos`)} Recuerde que una arroba es 12,5 kilos.`,
        instruccion: 'Compare',
        datos: { x, y },
        respuesta: resp,
        distractores: opciones.filter((o) => o !== resp),
        interaccion: { tipo: 'opciones', opciones },
        pistas: ['Para comparar, pase todo a la misma unidad.', { tipo: 'texto', texto: `${x} arrobas = ${x / 2} × 25 kilos` }, `${x} arrobas son ${num(x * 12.5)} kilos.`],
        explicacion: `${x} arrobas = ${num(x * 12.5)} kilos, frente a ${num(y)} kilos: ${resp === 'Pesan lo mismo' ? 'pesan lo mismo' : `pesan más ${resp.charAt(0).toLowerCase() + resp.slice(1)}`}.`,
      };
    }
    if (tipo === 'libras') {
      const k = rng.entero(2, 10);
      const lb = 2 * k + rng.elegir([-2, -1, 0, 1, 2]);
      const oa = `Las ${lb} libras`;
      const ob = k === 1 ? 'El kilo' : `Los ${k} kilos`;
      const resp = lb === 2 * k ? 'Pesan lo mismo' : lb > 2 * k ? oa : ob;
      const opciones = rng.barajar([oa, ob, 'Pesan lo mismo']);
      return {
        enunciado: `${armar(COMPARAR_LIBRAS, `${lb} libras`, `${k} ${veces(k)}`)} Recuerde que una libra es 500 gramos.`,
        instruccion: 'Compare',
        datos: { lb, k },
        respuesta: resp,
        distractores: opciones.filter((o) => o !== resp),
        interaccion: { tipo: 'opciones', opciones },
        pistas: ['¿Cuántas libras hay en un kilo?', { tipo: 'texto', texto: '1 kilo = 1.000 gramos = 2 libras' }, `${k} ${veces(k)} ${k === 1 ? 'es' : 'son'} ${2 * k} libras.`],
        explicacion: `${k} ${veces(k)} = ${2 * k} libras, frente a ${lb} libras: ${resp === 'Pesan lo mismo' ? 'pesan lo mismo' : `pesan más ${resp.charAt(0).toLowerCase() + resp.slice(1)}`}.`,
      };
    }
    const k = rng.entero(1, 8);
    const g = k * 1000 + rng.elegir([-750, -500, -250, 0, 250, 500, 750]);
    const oa = `Los ${num(g)} gramos`;
    const ob = k === 1 ? 'El kilo' : `Los ${k} kilos`;
    const resp = g === k * 1000 ? 'Pesan lo mismo' : g > k * 1000 ? oa : ob;
    const opciones = rng.barajar([oa, ob, 'Pesan lo mismo']);
    return {
      enunciado: armar(COMPARAR_GRAMOS, `${num(g)} gramos`, `${k} ${veces(k)}`),
      instruccion: 'Compare',
      datos: { g, k },
      respuesta: resp,
      distractores: opciones.filter((o) => o !== resp),
      interaccion: { tipo: 'opciones', opciones },
      pistas: ['¿Cuántos gramos tiene un kilo?', { tipo: 'texto', texto: '1 kilo = 1.000 gramos' }, `${k} ${k === 1 ? 'kilo es' : 'kilos son'} ${num(k * 1000)} gramos.`],
      explicacion: `${k} ${veces(k)} = ${num(k * 1000)} gramos, frente a ${num(g)} gramos: ${resp === 'Pesan lo mismo' ? 'pesan lo mismo' : `pesan más ${resp.charAt(0).toLowerCase() + resp.slice(1)}`}.`,
    };
  },
};

/** Ventas de la finca: qué se vende, por qué unidad, dónde, precio de ejemplo, gastos y un dato que sobra. */
type VentaFinca = {
  /** «kilos de cacao seco». */
  prod: string;
  /** «el kilo». */
  el: string;
  lugar: string;
  min: number;
  max: number;
  gastos: [string, string];
  sobra: (rng: Rng) => string;
};

const VENTAS_FINCA: VentaFinca[] = [
  { prod: 'kilos de cacao seco', el: 'el kilo', lugar: 'en la cooperativa de cacaoteros', min: 8000, max: 14000, gastos: ['abono', 'jornales'], sobra: (rng) => `La finca tiene ${num(redondo(rng, 300, 1500, 50))} árboles de cacao.` },
  { prod: 'kilos de café pergamino', el: 'el kilo', lugar: 'en la cooperativa de caficultores', min: 10000, max: 16000, gastos: ['jornales de recolección', 'transporte'], sobra: (rng) => `La finca tiene ${num(redondo(rng, 2000, 8000, 500))} matas de café.` },
  { prod: 'kilos de aguacate', el: 'el kilo', lugar: 'a un comprador que sube a la vereda', min: 2000, max: 5000, gastos: ['abono', 'canastillas'], sobra: (rng) => `En el lote hay ${redondo(rng, 40, 200, 10)} árboles de aguacate.` },
  { prod: 'litros de leche', el: 'el litro', lugar: 'al carro lechero', min: 1500, max: 2500, gastos: ['concentrado', 'droga para las vacas'], sobra: (rng) => `En la finca hay ${rng.entero(4, 20)} vacas.` },
  { prod: 'kilos de naranja', el: 'el kilo', lugar: 'en el mercado del pueblo', min: 1000, max: 2500, gastos: ['abono', 'fletes de la chiva'], sobra: (rng) => `El naranjal tiene ${redondo(rng, 50, 300, 10)} árboles.` },
  { prod: 'kilos de queso', el: 'el kilo', lugar: 'en el mercado del pueblo', min: 12000, max: 18000, gastos: ['leche comprada a los vecinos', 'sal y cuajo'], sobra: (rng) => `El queso se hace en ${rng.entero(2, 4)} horas cada mañana.` },
  { prod: 'kilos de cerdo en pie', el: 'el kilo', lugar: 'a la carnicería del pueblo', min: 7000, max: 10000, gastos: ['concentrado', 'lechones'], sobra: (rng) => `La cochera queda a ${redondo(rng, 50, 300, 10)} metros de la casa.` },
  { prod: 'docenas de huevos', el: 'la docena', lugar: 'a la tienda del pueblo', min: 8000, max: 12000, gastos: ['concentrado', 'vacunas para las gallinas'], sobra: (rng) => `En el gallinero hay ${redondo(rng, 50, 300, 10)} gallinas.` },
  { prod: 'kilos de limón', el: 'el kilo', lugar: 'en la plaza de mercado', min: 1000, max: 3000, gastos: ['abono', 'jornales'], sobra: (rng) => `El limonar tiene ${redondo(rng, 50, 300, 10)} árboles.` },
  { prod: 'panelas', el: 'cada una', lugar: 'a la tienda del pueblo', min: 3000, max: 5000, gastos: ['jornales de la molienda', 'leña'], sobra: (rng) => `El trapiche es de la familia hace ${rng.entero(10, 40)} años.` },
  { prod: 'racimos de plátano', el: 'el racimo', lugar: 'al camión que sube los sábados', min: 8000, max: 15000, gastos: ['abono', 'transporte'], sobra: (rng) => `El platanal tiene ${num(redondo(rng, 300, 1500, 50))} matas.` },
  { prod: 'kilos de mandarina', el: 'el kilo', lugar: 'en el mercado del pueblo', min: 1500, max: 3000, gastos: ['abono', 'canastillas'], sobra: (rng) => `La finca queda a ${rng.entero(1, 3)} horas del pueblo.` },
];

/** Precio redondo según el producto: de a cien los baratos, de a quinientos los demás. */
const precioVenta = (rng: Rng, v: VentaFinca) => redondo(rng, v.min, v.max, v.max <= 5000 ? 100 : 500);

const ganancia: Plantilla = {
  id: 'fam-ganancia',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Ingresos, gastos y ganancia de una venta de cacao',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const v = rng.elegir(VENTAS_FINCA);
    const k = redondo(rng, 100, lerp(300, 3000, d), 10);
    const p = precioVenta(rng, v);
    const ingreso = k * p;
    const g = redondo(rng, ingreso * 0.2, ingreso * 0.7, 10000);
    const r = ingreso - g;
    const tresPasos = d > 0.6;
    const g1 = tresPasos ? redondo(rng, 10000, g - 10000, 10000) : g;
    const g2 = g - g1;
    const sobra = tresPasos ? ` ${v.sobra(rng)}` : '';
    const gastos = tresPasos ? `gastó ${pesos(g1)} en ${v.gastos[0]} y ${pesos(g2)} en ${v.gastos[1]}` : `gastó ${pesos(g)} en ${v.gastos[0]} y ${v.gastos[1]}`;
    const quienVende = rng.elegir(['Una familia de la vereda Llana Caliente', quien(rng), `${quien(rng)} con su familia`]);
    const pregunta = rng.elegir(['¿Cuánto ganó?', '¿Cuánto le quedó de ganancia?', '¿Cuál fue la ganancia?']);
    return {
      enunciado: `${quienVende} vendió ${num(k)} ${v.prod} a ${pesos(p)} ${v.el} ${v.lugar} y ${gastos} (valores de ejemplo).${sobra} ${pregunta}`,
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

/** Cultivos para el plan de la cosecha: a quién se le vende (para la fila del transporte). */
const CULTIVOS_PLAN = [
  { c: 'cacao', a: 'la cooperativa de cacaoteros' },
  { c: 'café', a: 'la cooperativa de caficultores' },
  { c: 'plátano', a: 'el camión de los sábados' },
  { c: 'aguacate', a: 'el comprador del pueblo' },
  { c: 'naranja', a: 'la plaza de mercado' },
  { c: 'limón', a: 'la plaza de mercado' },
];

/** Dónde y para cuándo se hizo el plan: (quién, cultivos) → frase. */
const PLANES: ((q: string, cultivos: string) => string)[] = [
  (q, c) => `${q} hizo el plan de la cosecha de ${c} del semestre en el cuaderno de la finca (valores de ejemplo).`,
  (q, c) => `${q} sacó con la familia las cuentas de la cosecha de ${c} de este año (valores de ejemplo).`,
  (q, c) => `En la reunión de la asociación, ${minus(q)} presentó el plan de su cosecha de ${c} (valores de ejemplo).`,
  (q, c) => `Para pedir un crédito en el banco, ${minus(q)} llenó esta tabla con la cosecha de ${c} (valores de ejemplo).`,
  (q, c) => `El técnico de la cooperativa le ayudó ${al(minus(q))} a armar el plan de la cosecha de ${c} (valores de ejemplo).`,
  (q, c) => `${q} apuntó en una hoja lo que espera de la próxima cosecha de ${c} (valores de ejemplo).`,
];
const PREGUNTAS_GASTOS = ['¿Cuánto suman los gastos?', '¿Cuánto se va en gastos?', '¿Cuánta plata hay que invertir en total?'];
const PREGUNTAS_GANANCIA = ['¿Cuál es la ganancia: ingresos menos gastos?', '¿Cuánto queda de ganancia?', '¿Cuánto le queda a la familia después de pagar los gastos?'];

const planCosecha: Plantilla = {
  id: 'fam-plan-cosecha',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Planear la cosecha con una tabla de ingresos y gastos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const d = dif(ctx);
    const [c1, c2] = rng.barajar(CULTIVOS_PLAN);
    const i1 = redondo(rng, 1000000, lerp(3000000, 15000000, d), 50000);
    const conSegundo = d > 0.5;
    const i2 = conSegundo ? redondo(rng, 200000, 2000000, 50000) : 0;
    const ingresos = i1 + i2;
    const gAbono = redondo(rng, ingresos * 0.08, ingresos * 0.2, 10000);
    const gJornales = redondo(rng, ingresos * 0.15, ingresos * 0.35, 10000);
    const gTransporte = redondo(rng, 20000, 200000, 10000);
    const gastos = gAbono + gJornales + gTransporte;
    const filas: (string | number)[][] = [[`Ingreso: venta de ${c1.c}`, pesos(i1)]];
    if (conSegundo) filas.push([`Ingreso: venta de ${c2.c}`, pesos(i2)]);
    filas.push(['Gasto: abono', pesos(gAbono)], ['Gasto: jornales', pesos(gJornales)], [`Gasto: transporte a ${c1.a}`, pesos(gTransporte)]);
    const q = quien(rng);
    const soloGastos = d < 0.4;
    const r = soloGastos ? gastos : ingresos - gastos;
    const op = opcionesTabla(ctx, r, soloGastos ? [gastos - gTransporte, ingresos, ...cercanos(r, 10000, d)] : [ingresos, gastos, i1 - gastos, ingresos + gastos, ...cercanos(r, 10000, d)].filter((x) => x !== r));
    const cultivos = conSegundo ? `${c1.c} y ${c2.c}` : c1.c;
    return {
      enunciado: `${rng.elegir(PLANES)(q, cultivos)} ${rng.elegir(soloGastos ? PREGUNTAS_GASTOS : PREGUNTAS_GANANCIA)}`,
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

/** Formas de contar el cálculo de una venta grande: (quién, venta, propuesto) → enunciado. */
const CALCULOS_VENTA: ((q: string, venta: string, x: string) => string)[] = [
  (q, venta, x) => `${q} calcula que si vende ${venta} recibirá ${x}. ¿Es razonable? Luego elija la mejor estimación.`,
  (q, venta, x) => `${q} anotó en el cuaderno de la finca que por ${venta} le van a pagar ${x}. ¿Le parece razonable? Luego elija la mejor estimación.`,
  (q, venta, x) => `Un vecino le dijo ${al(minus(q))} que por ${venta} le darían ${x}. ¿Es razonable esa cuenta? Luego elija la mejor estimación.`,
];

const razonableCosecha: Plantilla = {
  id: 'fam-razonable-cosecha',
  dimension: 'comprension',
  operacion: 'multiplicacion',
  descripcion: '¿Es razonable el cálculo de una venta grande? Estimación',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const v = rng.elegir(VENTAS_FINCA);
    const k = redondo(rng, 50, 400, 10);
    const p = precioVenta(rng, v);
    const real = k * p;
    const escala = 10 ** (String(real).length - 2);
    const est = Math.round(real / escala) * escala;
    const esRaz = rng.azar(0.5);
    const propuesto = esRaz ? real : rng.elegir([real * 10, real / 10, k + p]);
    const distr = [est * 10, est / 10];
    const q = quien(rng);
    const pRed = Math.max(1, Math.round(p / 1000)) * 1000;
    return {
      enunciado: rng.elegir(CALCULOS_VENTA)(q, `${k} ${v.prod} a ${pesos(p)} ${v.el} ${v.lugar} (precio de ejemplo)`, pesos(propuesto)),
      instruccion: '¿Tiene sentido?',
      datos: { k, p, propuesto, est },
      respuesta: `${esRaz ? 'si' : 'no'}:${est}`,
      distractores: distr,
      interaccion: { tipo: 'razonable', propuesto, esRazonable: esRaz, opciones: rng.barajar([est, ...distr]) },
      calculo: { op: 'multiplicacion', a: k, b: p },
      pistas: [
        'Redondee la cantidad a la decena y el precio al millar. ¿Cuánto da, más o menos?',
        { tipo: 'texto', texto: `${Math.round(k / 10) * 10} × ${pesos(pRed)}` },
        `${Math.round(k / 10) * 10} × ${num(pRed)} = ${num(Math.round(k / 10) * 10 * pRed)}, aproximadamente.`,
      ],
      explicacion: `${k} × ${pesos(p)} = ${pesos(real)}, cerca de ${pesos(est)}. ${esRaz ? 'El cálculo es razonable.' : `${pesos(propuesto)} está muy lejos: no es razonable.`}`,
    };
  },
};

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

/** Plantillas usadas en una lista de temas, sin repetir. */
function plantillasDe(temas: Tema[]): Plantilla[] {
  return [...new Set(temas.flatMap((t) => [...t.usos, ...(t.prueba ? [t.prueba] : [])].map((x) => x.plantilla)))];
}

function ruta(pista: Pista, temas: Tema[]): DefinicionPista {
  return { pista, limite: 100000000, plantillas: plantillasDe(temas), temas };
}

/** Prueba de entrada y salida de las familias: una pregunta por cada competencia. */
export const familia = ruta('familia', [
  { titulo: 'Sumar y restar plata', usos: [u(calculoMental, { max: 50000, op: 'mixta' })] },
  { titulo: 'Vueltos', usos: [u(vueltas)] },
  { titulo: 'Multiplicar precios', usos: [u(calculoMental, { op: 'mult' })] },
  { titulo: 'Cuántas unidades alcanzan', usos: [u(compraVarios, { modo: 'alcanzan' })] },
  { titulo: 'Bultos y viajes', usos: [u(bultos, { modo: 'mixto' })] },
  { titulo: 'Presupuesto semanal', usos: [u(presupuesto, { max: 50000, filas: 3 })] },
  { titulo: 'Porcentajes', usos: [u(porcentajeCalculo)] },
  { titulo: 'Proporciones', usos: [u(proporcion)] },
  { titulo: 'Unidades: arrobas y kilos', usos: [u(arrobas)] },
  { titulo: 'Ganancia de una venta', usos: [u(ganancia)] },
]);

export const famBasica = ruta('fam-basica', [
  { titulo: 'Sumar y restar plata', usos: [u(calculoMental, { max: 20000, op: 'suma' }), u(calculoMental, { max: 20000, op: 'mixta' }), u(rectaDinero, { max: 10000, paso: 500 })] },
  { titulo: 'Vueltos', usos: [u(vueltas)] },
  { titulo: 'Multiplicar precios', usos: [u(calculoMental, { op: 'mult' })] },
  { titulo: 'Cuántas unidades alcanzan', usos: [u(compraVarios, { modo: 'alcanzan' })] },
  { titulo: 'Repartir en bultos iguales', usos: [u(bultos, { modo: 'exacto' })] },
  { titulo: 'Bultos y viajes de la mula', usos: [u(bultos, { modo: 'mixto' })] },
  { titulo: 'Pago de jornales', usos: [u(jornales)] },
  { titulo: 'Presupuesto semanal', usos: [u(presupuesto, { max: 50000, filas: 3 })] },
  { titulo: '¿Es razonable el cobro?', usos: [u(estimarCompra)] },
  { titulo: 'Cuentas de la casa', usos: [u(calculoMental, { op: 'mixta' }), u(vueltas), u(compraVarios), u(presupuesto, { max: 50000, filas: 2 }), u(ventaMercado)] },
]);

export const famIntermedia = ruta('fam-intermedia', [
  { titulo: 'Cálculo mental con plata', usos: [u(calculoMental, { max: 50000, op: 'mixta' }), u(rectaDinero, { max: 20000, paso: 1000 })] },
  { titulo: 'Compras de varios productos', usos: [u(compraVarios), u(estimarCompra)] },
  { titulo: 'Ventas en el mercado', usos: [u(ventaMercado)] },
  { titulo: 'Producción por árbol', usos: [u(rendimiento)] },
  { titulo: 'Bultos y viajes', usos: [u(bultos, { modo: 'mixto' })] },
  { titulo: 'Pago de jornales', usos: [u(jornales)] },
  { titulo: 'Presupuesto con saldo', usos: [u(presupuesto, { conSaldo: true })] },
  { titulo: 'Qué es el 10, el 25 y el 50 %', usos: [u(porcentajeConcepto)] },
  { titulo: 'Calcular porcentajes', usos: [u(porcentajeCalculo), u(descuento)] },
  { titulo: 'Ganancia de una venta', usos: [u(ganancia), u(razonableCosecha)] },
]);

export const famAvanzada = ruta('fam-avanzada', [
  { titulo: 'Porcentajes', usos: [u(porcentajeCalculo), u(porcentajeConcepto)] },
  { titulo: 'Descuentos', usos: [u(descuento)] },
  { titulo: 'Pérdida de peso al secar', usos: [u(secado)] },
  { titulo: 'Arrobas y kilos', usos: [u(arrobas)] },
  { titulo: 'Kilos, gramos y libras', usos: [u(gramos)] },
  { titulo: 'Hectáreas y siembra', usos: [u(hectarea)] },
  { titulo: 'Proporciones', usos: [u(proporcion)] },
  { titulo: 'Comparar unidades de peso', usos: [u(compararUnidades)] },
  { titulo: 'Ingresos, gastos y ganancia', usos: [u(ganancia), u(razonableCosecha)] },
  { titulo: 'Planear la cosecha', usos: [u(planCosecha), u(ganancia), u(rendimiento)] },
]);
