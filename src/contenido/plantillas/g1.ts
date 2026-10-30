// Plantillas de 1.º grado: conteo, comparación, suma y resta hasta 99 (sin reagrupar),
// decenas y unidades, completar a 10 y repartos en 2 o 3 partes.

import type { ContextoGeneracion, DefinicionPista, EjercicioBase, Objeto, Plantilla, Recipiente, Uso } from '../../juego/tipos';
import type { Rng } from '../../juego/rng';
import { adulto, arbolDe, cuantos, dosPersonas, frutas, mayus, nombreCant, persona, productos, type Genero, type Producto } from '../contexto';
import { contarLlevadas, contarPrestamos, distractores, dif, lerp, mezclarOpciones, modoRespuesta, pb, pn, pt } from './util';

/** Productos fáciles de dibujar y contar en 1.º. */
const contables: Producto[] = productos.filter((p) => ['huevo', 'mazorca', 'naranja', 'aguacate', 'mandarina', 'limon'].includes(p.objeto));

/** Par para sumar con resultado ≤ max (y sin llevar, si se pide). */
function parSumaHasta(ctx: ContextoGeneracion, max: number, sinReagrupar: boolean, minTotal = 2): [number, number] {
  const { rng } = ctx;
  for (let i = 0; i < 300; i++) {
    const total = rng.entero(Math.max(minTotal, lerp(2, Math.floor(max * 0.6), dif(ctx))), max);
    const a = rng.entero(1, total - 1);
    const b = total - a;
    if (b < 1) continue;
    if (sinReagrupar && contarLlevadas(a, b) > 0) continue;
    return [a, b];
  }
  return [1, 1];
}

/** Par para restar a − b ≥ 0 con a ≤ max (y sin prestar, si se pide). */
function parRestaHasta(ctx: ContextoGeneracion, max: number, sinReagrupar: boolean): [number, number] {
  const { rng } = ctx;
  for (let i = 0; i < 300; i++) {
    const a = rng.entero(Math.max(3, lerp(3, Math.floor(max * 0.6), dif(ctx))), max);
    const b = rng.entero(1, a - 1);
    if (sinReagrupar && contarPrestamos(a, b) > 0) continue;
    return [a, b];
  }
  return [5, 2];
}

const contar: Plantilla = {
  id: 'g1-contar',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Contar tocando objetos de la finca',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 10);
    const n = rng.entero(Math.max(2, lerp(2, max - 4, dif(ctx))), max);
    const p = rng.elegir(contables);
    const quien = persona(rng);
    const lugar = p.objeto === 'huevo' ? 'en el gallinero' : p.objeto === 'mazorca' ? 'en el cultivo de cacao' : 'en la finca';
    const distr = distractores(rng, n, [n + 1, n - 1, n + 2], 2, 1);
    return {
      enunciado: `${quien.nombre} ${p.verbo} ${p.genero === 'f' ? 'estas' : 'estos'} ${p.plural} ${lugar}. Toca ${p.genero === 'f' ? 'cada una para contarla' : 'cada uno para contarlo'}. ¿${cuantos(p.genero)} hay?`,
      instruccion: 'Toca y cuenta',
      ilustracion: p.objeto,
      datos: { n },
      respuesta: n,
      unidad: p.plural,
      distractores: distr,
      // Con «escribir», la mitad de las veces se responde escribiendo el número con el dedo.
      interaccion: { tipo: 'contar', objeto: p.objeto, cantidad: n, opciones: mezclarOpciones(rng, n, distr), ...(pb(ctx, 'escribir') && rng.azar(0.5) ? { escribir: true } : {}) },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: [
        '¿Ya tocaste cada uno una sola vez? Los que tocas quedan marcados.',
        { tipo: 'objetos', objeto: p.objeto, grupos: [n] },
        `Cuenta de uno en uno: 1, 2, 3… El último número que dices es el total.`,
      ],
      explicacion: `Al tocar cada ${p.singular} una sola vez y contar 1, 2, 3…, el último número es ${n}. Hay ${n} ${nombreCant(p, n)}.`,
    };
  },
};

const comparar: Plantilla = {
  id: 'g1-comparar',
  dimension: 'comprension',
  operacion: 'resta',
  descripcion: 'Comparar dos cantidades: ¿quién tiene más o menos?',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 10);
    const [x, y] = dosPersonas(rng);
    const p = rng.elegir(contables);
    const a = rng.entero(1, max);
    let b = rng.entero(1, max);
    if (rng.azar(0.15)) b = a;
    // Con d alto, los números quedan más cerca (más difícil).
    if (b !== a && dif(ctx) > 0.5 && Math.abs(a - b) > 3) b = Math.min(max, Math.max(1, a + (rng.azar(0.5) ? 2 : -2)));
    const pregunta = rng.azar(0.5) ? 'más' : 'menos';
    const respuesta = a === b ? 'Tienen igual' : (pregunta === 'más') === a > b ? x.nombre : y.nombre;
    const opciones = rng.barajar([x.nombre, y.nombre, 'Tienen igual']);
    return {
      enunciado: `${x.nombre} tiene ${a} ${nombreCant(p, a)} y ${y.nombre} tiene ${b}. ¿Quién tiene ${pregunta}?`,
      instruccion: 'Compara',
      ilustracion: p.objeto,
      datos: { a, b },
      respuesta,
      distractores: opciones.filter((o) => o !== respuesta),
      interaccion: { tipo: 'opciones', opciones },
      pistas: [
        `Si pones ${p.genero === 'f' ? 'las' : 'los'} ${p.plural} en dos filas, una frente a otra, ¿qué fila es más larga?`,
        { tipo: 'objetos', objeto: p.objeto, grupos: [a, b] },
        `${x.nombre} tiene ${a} y ${y.nombre} tiene ${b}. ${a === b ? 'Son iguales.' : `${a > b ? a : b} es mayor que ${a > b ? b : a}.`}`,
      ],
      explicacion: a === b ? `Los dos tienen ${a}: tienen igual.` : `${Math.max(a, b)} es mayor que ${Math.min(a, b)}, así que ${pregunta === 'más' ? 'tiene más' : 'tiene menos'} ${respuesta}.`,
    };
  },
};

/** Cosas en fila con un número cada una (para antes y después). `hasta`: el número más alto creíble. */
type Fila = { intro: string; cosa: string; f: boolean; hasta?: number };
const filasNumeradas: Fila[] = [
  { intro: 'En el camino de herradura hay postes con números.', cosa: 'poste', f: false },
  { intro: 'Los puestos del mercado del pueblo tienen números.', cosa: 'puesto', f: false },
  { intro: 'Las sillas del salón tienen números pegados.', cosa: 'silla', f: true, hasta: 40 },
  { intro: 'En la huerta escolar, cada surco tiene un letrero con su número.', cosa: 'surco', f: false },
  { intro: 'Los árboles de cacao de la hilera están marcados con números.', cosa: 'árbol', f: false },
  { intro: 'En la fila de la tienda, cada persona tiene una ficha con su turno.', cosa: 'turno', f: false },
  { intro: 'Los nidos del gallinero tienen números.', cosa: 'nido', f: false, hasta: 20 },
  { intro: 'Las vacas del ordeño tienen un número en la oreja.', cosa: 'vaca', f: true },
  { intro: 'Los asientos de la chiva tienen números.', cosa: 'asiento', f: false },
  { intro: 'En la bodega de la cooperativa, cada bulto de cacao tiene un número.', cosa: 'bulto', f: false },
  { intro: 'Las matas del vivero están en bolsas con números.', cosa: 'mata', f: true },
  { intro: 'En el patio de la escuela pintaron una golosa con números.', cosa: 'casilla', f: true, hasta: 20 },
  { intro: 'Las páginas del cuaderno tienen números abajo.', cosa: 'página', f: true },
  { intro: 'Las casas de la vereda tienen números en la puerta.', cosa: 'casa', f: true },
  { intro: 'Los escalones de la escuela tienen números pintados.', cosa: 'escalón', f: false, hasta: 20 },
  { intro: 'Las gallinas del galpón tienen un anillo con su número en la pata.', cosa: 'gallina', f: true },
  { intro: 'Los costales de café en la bodega tienen números.', cosa: 'costal', f: false },
  { intro: 'En la fila del restaurante escolar, cada niño tiene un número.', cosa: 'niño', f: false },
  { intro: 'Los lotes de la finca tienen letreros con números.', cosa: 'lote', f: false },
  { intro: 'En el beneficiadero, los cajones para fermentar el cacao tienen números.', cosa: 'cajón', f: false, hasta: 20 },
];

const siguiente: Plantilla = {
  id: 'g1-siguiente',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Número anterior y siguiente en la recta (postes, sillas, puestos…)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 20);
    const n = rng.entero(2, max - 1);
    const despues = rng.azar(0.6);
    const respuesta = despues ? n + 1 : n - 1;
    // El tramo de recta que se ve cambia: el número no siempre queda en el centro.
    const min = Math.max(0, Math.min(n - rng.entero(1, 9), max - 10));
    const fila = rng.elegir(filasNumeradas.filter((x) => (x.hasta ?? 99) >= max));
    const el = fila.f ? 'la' : 'el';
    const del = fila.f ? 'de la' : 'del';
    const preguntas = despues
      ? [`¿Qué número va justo después del ${n}?`, `¿Qué número sigue al ${n}?`, `¿Qué número viene después del ${n}?`, `¿Qué número está después del ${n}?`]
      : [`¿Qué número va justo antes del ${n}?`, `¿Qué número está antes del ${n}?`, `¿Qué número viene antes del ${n}?`, `¿Qué número va antes del ${n}?`];
    return {
      enunciado: `${fila.intro} ${rng.elegir(preguntas)} Tócalo en la recta.`,
      instruccion: 'Toca el número',
      datos: { n },
      respuesta,
      distractores: [n, despues ? n - 1 : n + 1],
      interaccion: { tipo: 'recta', min, max: min + 10, paso: 1, inicio: n },
      calculo: { op: despues ? 'suma' : 'resta', a: n, b: 1 },
      pistas: [
        `${despues ? 'Después' : 'Antes'} quiere decir un paso ${despues ? 'hacia adelante' : 'hacia atrás'}.`,
        { tipo: 'recta', min, max: min + 10, desde: n, saltos: [despues ? 1 : -1] },
        `Desde el ${n} da un salto ${despues ? 'a la derecha' : 'a la izquierda'}.`,
      ],
      explicacion: `Justo ${despues ? 'después' : 'antes'} ${del} ${fila.cosa} ${n} está ${el} ${fila.cosa} ${respuesta}.`,
    };
  },
};

/** Recorridos con números para saltar en la recta. `salto`: singular y plural de cada movimiento. */
type Recorrido = { texto: (q: string) => string; salto: [string, string] };
const recorridos: Recorrido[] = [
  { texto: (q) => `${q} camina por los postes del camino.`, salto: ['salto', 'saltos'] },
  { texto: (q) => `${q} cruza la quebrada por unas piedras con números.`, salto: ['paso', 'pasos'] },
  { texto: (q) => `${q} juega golosa en el patio de la escuela.`, salto: ['salto', 'saltos'] },
  { texto: () => 'Una rana salta por las piedras de la quebrada. Cada piedra tiene un número.', salto: ['salto', 'saltos'] },
  { texto: () => 'La gallina camina junto a la cerca. Cada tabla tiene un número.', salto: ['paso', 'pasos'] },
  { texto: (q) => `${q} recorre los surcos de la huerta. Cada surco tiene un número.`, salto: ['paso', 'pasos'] },
  { texto: (q) => `${q} pasa por la hilera de árboles de cacao. Cada árbol tiene un número.`, salto: ['paso', 'pasos'] },
  { texto: () => 'La mula sube por el camino. Los postes tienen números.', salto: ['paso', 'pasos'] },
  { texto: (q) => `${q} mueve su ficha en un juego de casillas con números.`, salto: ['salto', 'saltos'] },
  { texto: () => 'El perro de la finca corre junto a la cerca. Los postes tienen números.', salto: ['salto', 'saltos'] },
  { texto: (q) => `${q} camina por los puestos del mercado. Cada puesto tiene un número.`, salto: ['paso', 'pasos'] },
  { texto: () => 'Un pollito camina por las baldosas del corredor. Cada baldosa tiene un número.', salto: ['paso', 'pasos'] },
  { texto: (q) => `${q} pasa junto a las vacas del potrero. Cada vaca tiene un número.`, salto: ['paso', 'pasos'] },
];

const sumaRecta: Plantilla = {
  id: 'g1-recta',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Sumar o restar dando saltos en la recta numérica',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 20);
    const op = pt(ctx, 'op', 'suma');
    const maxSalto = pn(ctx, 'maxSalto', lerp(3, 9, dif(ctx)));
    const resta = op === 'resta' || (op === 'mixta' && rng.azar(0.5));
    const b = rng.entero(1, Math.min(maxSalto, max - 1));
    const a = resta ? rng.entero(b, max) : rng.entero(0, max - b);
    const respuesta = resta ? a - b : a + b;
    const min = 0;
    const r = rng.elegir(recorridos);
    const salto = b === 1 ? r.salto[0] : r.salto[1];
    const pregunta = rng.elegir(['¿A qué número llega?', '¿En qué número queda?', '¿En qué número termina?']);
    return {
      enunciado: `${r.texto(persona(rng).nombre)} Empieza en el ${a} y da ${b} ${salto} hacia ${resta ? 'atrás' : 'adelante'}. ${pregunta} Tócalo.`,
      instruccion: 'Salta en la recta',
      datos: { a, b },
      respuesta,
      distractores: [respuesta + 1, respuesta - 1].filter((x) => x >= 0),
      interaccion: { tipo: 'recta', min, max, paso: 1, inicio: a },
      calculo: { op: resta ? 'resta' : 'suma', a, b },
      pistas: [
        `¿Hacia dónde saltas: a los números más grandes o a los más pequeños?`,
        { tipo: 'recta', min, max, desde: a, saltos: Array(b).fill(resta ? -1 : 1) },
        `${a} ${resta ? '−' : '+'} ${b}: cuenta ${b} ${salto} desde el ${a}.`,
      ],
      explicacion: `Desde ${a}, ${b} ${salto} hacia ${resta ? 'atrás' : 'adelante'} llegan a ${respuesta}: ${a} ${resta ? '−' : '+'} ${b} = ${respuesta}.`,
    };
  },
};

const sumaCambio: Plantilla = {
  id: 'g1-suma-cambio',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Cambio-aumentar: tenía, recibió más, ¿cuántos tiene?',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 10);
    const [a, b] = parSumaHasta(ctx, max, pb(ctx, 'sinReagrupar'));
    const quien = persona(rng);
    const p = rng.elegir(contables);
    const c = a + b;
    // Incógnita en el estado inicial (solo en tramos avanzados y con d alto).
    const inicial = pb(ctx, 'incognita') && dif(ctx) > 0.5 && rng.azar(0.5);
    const redacciones = [
      `${quien.nombre} ${p.verbo} ${a} ${nombreCant(p, a)} y después encontró ${b} más. ¿${cuantos(p.genero)} ${p.plural} tiene ahora?`,
      `En ${p.recipiente} había ${a} ${nombreCant(p, a)}. ${quien.nombre} puso ${b} más. ¿${cuantos(p.genero)} hay ahora en ${p.recipiente}?`,
      `Por la mañana ${quien.nombre} ${p.verbo} ${a} ${nombreCant(p, a)} y por la tarde ${b}. ¿${cuantos(p.genero)} ${p.plural} ${p.verbo} en todo el día?`,
    ];
    const enunciado = inicial
      ? `${quien.nombre} tenía ${p.genero === 'f' ? 'algunas' : 'algunos'} ${p.plural}. Le regalaron ${b} más y ahora tiene ${c}. ¿${cuantos(p.genero)} tenía al principio?`
      : rng.elegir(redacciones);
    const respuesta = inicial ? a : c;
    const calc = inicial ? { op: 'resta' as const, a: c, b } : { op: 'suma' as const, a, b };
    const modo = modoRespuesta(ctx, respuesta, calc);
    return {
      enunciado,
      instruccion: inicial ? 'Busca cuántos había' : 'Junta',
      ilustracion: p.objeto,
      datos: { a, b, c },
      respuesta,
      unidad: p.plural,
      ...modo,
      calculo: calc,
      pistas: [
        inicial ? 'Si sabes cuántos tiene ahora y cuántos le dieron, ¿cómo sabes cuántos tenía?' : '¿Las cantidades se juntan o se quitan?',
        inicial ? { tipo: 'objetos', objeto: p.objeto, grupos: [c], tachados: b } : { tipo: 'objetos', objeto: p.objeto, grupos: [a, b] },
        inicial ? `Quita a ${c} los ${b} que le regalaron: ${c} − ${b}.` : `Junta ${a} y ${b}: ${a} + ${b}.`,
      ],
      explicacion: inicial ? `${c} − ${b} = ${a}. Tenía ${a} al principio.` : `${a} + ${b} = ${c}. Ahora hay ${c} ${nombreCant(p, c)}.`,
    };
  },
};

/** Algo que se cuenta, con su concordancia y su dibujo (los productos de la finca y otras cosas). */
type Cosa = { singular: string; plural: string; genero: Genero; objeto: Objeto };
const cosa = (singular: string, plural: string, genero: Genero, objeto: Objeto): Cosa => ({ singular, plural, genero, objeto });
const huevos = cosa('huevo', 'huevos', 'm', 'huevo');
const mazorcas = cosa('mazorca de cacao', 'mazorcas de cacao', 'f', 'mazorca');
const arepas = cosa('arepa', 'arepas', 'f', 'arepa');
const panes = cosa('pan', 'panes', 'm', 'pan');
const platanos = cosa('plátano', 'plátanos', 'm', 'platano');
const semillas = cosa('semilla de maíz', 'semillas de maíz', 'f', 'semilla');
const matas = cosa('mata de cacao', 'matas de cacao', 'f', 'mata');
const gallinas = cosa('gallina', 'gallinas', 'f', 'gallina');
const bultos = cosa('bulto de cacao', 'bultos de cacao', 'm', 'bulto');
const monedas = cosa('moneda', 'monedas', 'f', 'moneda');

/** «las» o «los» según el género. */
const art = (g: Genero) => (g === 'f' ? 'las' : 'los');
/** «todas» o «todos». */
const todas = (g: Genero) => (g === 'f' ? 'todas' : 'todos');
/** Cultivo del árbol de una fruta (para `arbolDe`). */
const cultivoDe: Partial<Record<Objeto, string>> = { naranja: 'naranja', aguacate: 'aguacate', mandarina: 'mandarina', limon: 'limón' };

/** Escena para juntar dos grupos arrastrando: el texto y los depósitos que nombra. */
type EscenaJuntar = { p: Cosa; texto: string; origen?: Recipiente; origen2?: Recipiente; destino?: Recipiente };

function escenasJuntar(rng: Rng, a: number, b: number): EscenaJuntar[] {
  const p = rng.elegir(frutas);
  const [x, y] = dosPersonas(rng);
  const q = x.nombre;
  const n = (c: Cosa, k: number) => `${k} ${nombreCant(c, k)}`;
  const la = art(p.genero);
  const caja = (nombre: string): Recipiente => ({ nombre, dibujo: 'caja' });
  const canasta: Recipiente = { nombre: 'Canasta', dibujo: 'canasta' };
  const arbol = arbolDe(cultivoDe[p.objeto] ?? '');
  return [
    { p, texto: `${q} tiene ${n(p, a)} en una canasta y ${b} en otra. Pasa ${todas(p.genero)} a la canasta grande.` },
    { p, texto: `${q} trae ${n(p, a)} en una bolsa y ${b} en otra bolsa. Écha${la} en la canasta grande.`, origen: { nombre: 'Bolsa 1', dibujo: 'bolsa' }, origen2: { nombre: 'Bolsa 2', dibujo: 'bolsa' } },
    { p, texto: `${q} cogió ${n(p, a)} de un árbol y ${b} de otro árbol. Pon${la} en la canasta.`, origen: { nombre: 'Árbol 1', dibujo: arbol }, origen2: { nombre: 'Árbol 2', dibujo: arbol }, destino: canasta },
    { p, texto: `${q} tiene ${n(p, a)}. ${y.nombre} tiene ${b}. Júnten${la} en la canasta.`, origen: { nombre: q, dibujo: 'nino' }, origen2: { nombre: y.nombre, dibujo: 'nino' }, destino: canasta },
    { p, texto: `En la mañana ${q} cogió ${n(p, a)}. En la tarde cogió ${b}. Junta ${todas(p.genero)} en la canasta.`, origen: { nombre: 'Mañana' }, origen2: { nombre: 'Tarde' }, destino: canasta },
    { p, texto: `En la tienda hay una caja con ${n(p, a)} y otra caja con ${b}. ${q} ${la} pone en el estante.`, origen: caja('Caja 1'), origen2: caja('Caja 2'), destino: { nombre: 'Estante' } },
    { p, texto: `Para el refrigerio, ${q} trajo ${n(p, a)} y ${y.nombre} trajo ${b}. Pon${la} en la mesa.`, origen: { nombre: q, dibujo: 'nino' }, origen2: { nombre: y.nombre, dibujo: 'nino' }, destino: { nombre: 'Mesa', dibujo: 'mesa' } },
    { p, texto: `En el puesto del mercado hay ${n(p, a)} en un platón y ${b} en otro platón. Pása${la} a la canasta grande.`, origen: { nombre: 'Platón 1' }, origen2: { nombre: 'Platón 2' } },
    { p, texto: `La mula trae ${n(p, a)} en un costal y ${b} en el otro costal. Bája${la} a la canasta grande.`, origen: { nombre: 'Costal 1', dibujo: 'bulto' }, origen2: { nombre: 'Costal 2', dibujo: 'bulto' } },
    { p, texto: `Para la feria, ${q} trae ${n(p, a)} de su casa y ${b} de la casa de la abuela. Pon${la} en la canasta grande.`, origen: { nombre: 'Su casa' }, origen2: { nombre: 'Casa de la abuela', dibujo: 'adulto' } },
    { p, texto: `${q} llevó ${n(p, a)} en la carretilla. Su hermano llevó ${b}. Guárden${la} en la caja grande.`, origen: { nombre: 'Carretilla' }, origen2: { nombre: 'Hermano', dibujo: 'nino' }, destino: caja('Caja grande') },
    { p: huevos, texto: `Una gallina puso ${n(huevos, a)} en un nido. Otra puso ${b} en otro nido. ${q} los pasa a la cubeta.`, origen: { nombre: 'Nido 1', dibujo: 'gallina' }, origen2: { nombre: 'Nido 2', dibujo: 'gallina' }, destino: { nombre: 'Cubeta', dibujo: 'cubeta' } },
    { p: mazorcas, texto: `${q} cortó ${n(mazorcas, a)} en un surco y ${b} en otro surco. Llévalas al canasto.`, origen: { nombre: 'Surco 1', dibujo: 'arbol-cacao' }, origen2: { nombre: 'Surco 2', dibujo: 'arbol-cacao' }, destino: { nombre: 'Canasto', dibujo: 'canasta' } },
    { p: arepas, texto: `${q} asó ${n(arepas, a)} en el fogón y ${b} en la parrilla. Ponlas en la canasta.`, origen: { nombre: 'Fogón' }, origen2: { nombre: 'Parrilla' }, destino: canasta },
    { p: panes, texto: `En la panadería hay ${n(panes, a)} en una bandeja y ${b} en otra bandeja. ${q} los echa en una bolsa.`, origen: { nombre: 'Bandeja 1' }, origen2: { nombre: 'Bandeja 2' }, destino: { nombre: 'Bolsa', dibujo: 'bolsa' } },
    { p: platanos, texto: `${q} cortó ${n(platanos, a)} de un racimo y ${b} de otro racimo. Ponlos en la canasta.`, origen: { nombre: 'Racimo 1', dibujo: 'platano' }, origen2: { nombre: 'Racimo 2', dibujo: 'platano' }, destino: canasta },
    { p: semillas, texto: `${q} tiene ${n(semillas, a)} en una mano y ${b} en la otra. Échalas en la bolsa.`, origen: { nombre: 'Mano 1' }, origen2: { nombre: 'Mano 2' }, destino: { nombre: 'Bolsa', dibujo: 'bolsa' } },
    { p: monedas, texto: `${q} tiene ${n(monedas, a)} en un bolsillo y ${b} en el otro. Ahórralas en la alcancía.`, origen: { nombre: 'Bolsillo 1' }, origen2: { nombre: 'Bolsillo 2' }, destino: { nombre: 'Alcancía' } },
    { p: gallinas, texto: `En el patio hay ${n(gallinas, a)} y en la huerta hay ${b}. ${q} las encierra en el gallinero.`, origen: { nombre: 'Patio' }, origen2: { nombre: 'Huerta' }, destino: { nombre: 'Gallinero' } },
  ];
}

const sumaJuntar: Plantilla = {
  id: 'g1-juntar',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Juntar dos grupos arrastrando: frutas, huevos, mazorcas…',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = Math.min(20, pn(ctx, 'max', 10));
    const [a, b] = parSumaHasta(ctx, max, false);
    const e = rng.elegir(escenasJuntar(rng, a, b));
    const p = e.p;
    const c = a + b;
    const C = cuantos(p.genero);
    const pregunta = rng.elegir([`¿${C} ${p.plural} hay en total?`, `¿${C} ${p.plural} son en total?`, `¿${C} ${p.plural} hay ahora ${p.genero === 'f' ? 'juntas' : 'juntos'}?`]);
    const distr = distractores(rng, c, [c + 1, c - 1, Math.abs(a - b)], 3, dif(ctx));
    return {
      enunciado: `${e.texto} ${pregunta}`,
      instruccion: 'Arrastra y cuenta',
      ilustracion: p.objeto,
      datos: { a, b },
      respuesta: c,
      unidad: p.plural,
      distractores: distr,
      interaccion: { tipo: 'arrastrar', objeto: p.objeto, modo: 'juntar', a, b, origen: e.origen, origen2: e.origen2, destino: e.destino },
      calculo: { op: 'suma', a, b },
      pistas: [
        'Cuando juntas dos grupos, ¿tienes más o menos que antes?',
        { tipo: 'objetos', objeto: p.objeto, grupos: [a, b] },
        `Empieza en ${a} y sigue contando ${b} más.`,
      ],
      explicacion: `${a} + ${b} = ${c}. En total hay ${c} ${nombreCant(p, c)}.`,
    };
  },
};

const sumaCalculo: Plantilla = {
  id: 'g1-calculo',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Cálculo de suma o resta con apoyo de objetos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 10);
    const op = pt(ctx, 'op', 'suma');
    const resta = op === 'resta' || (op === 'mixta' && rng.azar(0.5));
    const sinR = pb(ctx, 'sinReagrupar');
    const [a, b] = resta ? parRestaHasta(ctx, max, sinR) : parSumaHasta(ctx, max, sinR);
    const respuesta = resta ? a - b : a + b;
    const p = rng.elegir(contables);
    const adultoTienda = resta ? `En la tienda de la vereda había ${a} ${nombreCant(p, a)} y se vendieron ${b}.` : `En el patio hay ${a} ${nombreCant(p, a)} y en la cocina ${b}.`;
    const calc = { op: resta ? ('resta' as const) : ('suma' as const), a, b };
    const modo = modoRespuesta(ctx, respuesta, calc, { abiertaMin: 0.3, abiertaMax: 0.9 });
    return {
      enunciado: `${adultoTienda} Resuelve: ${a} ${resta ? '−' : '+'} ${b} = ?`,
      instruccion: resta ? 'Quita' : 'Suma',
      ilustracion: p.objeto,
      datos: { a, b },
      respuesta,
      ...modo,
      calculo: calc,
      operacion: resta ? 'resta' : 'suma',
      pistas: [
        resta ? '¿Quitar hace que queden más o menos?' : '¿Puedes empezar en el número mayor y seguir contando?',
        resta ? { tipo: 'objetos', objeto: p.objeto, grupos: [a], tachados: b } : { tipo: 'objetos', objeto: p.objeto, grupos: [a, b] },
        resta ? `Desde ${a}, cuenta ${b} hacia atrás.` : `Desde ${Math.max(a, b)}, cuenta ${Math.min(a, b)} hacia adelante.`,
      ],
      explicacion: `${a} ${resta ? '−' : '+'} ${b} = ${respuesta}.`,
    };
  },
};

/** Escena para quitar arrastrando: el texto, de dónde salen, a dónde van y dónde se cuentan los que quedan. */
type EscenaQuitar = { p: Cosa; texto: string; origen: Recipiente; destino: Recipiente; donde?: string };

function escenasQuitar(rng: Rng, a: number, b: number): EscenaQuitar[] {
  const p = rng.elegir(frutas);
  const comible = rng.elegir(frutas.filter((f) => f.objeto === 'naranja' || f.objeto === 'mandarina'));
  const q = persona(rng).nombre;
  const n = (c: Cosa, k: number) => `${k} ${nombreCant(c, k)}`;
  const losQue = (c: Cosa, verbo: string) => `${mayus(art(c.genero))} que ${verbo}`;
  const arbol = arbolDe(cultivoDe[p.objeto] ?? '');
  return [
    { p: mazorcas, texto: `En el canasto hay ${n(mazorcas, a)}. La mula se llevó ${b} para el secadero.`, origen: { nombre: 'Canasto', dibujo: 'canasta' }, destino: { nombre: 'La mula', dibujo: 'mula' }, donde: 'en el canasto' },
    { p: huevos, texto: `En la cubeta había ${n(huevos, a)}. ${q} usó ${b} para las arepas del desayuno.`, origen: { nombre: 'Cubeta', dibujo: 'cubeta' }, destino: { nombre: 'Para las arepas', dibujo: 'arepa' }, donde: 'en la cubeta' },
    { p, texto: `${q} llevó ${n(p, a)} a la escuela. En el refrigerio regaló ${b}.`, origen: { nombre: losQue(p, 'llevó'), dibujo: 'nino' }, destino: { nombre: losQue(p, 'regaló') } },
    { p, texto: `En el árbol hay ${n(p, a)}. ${q} cogió ${b} y ${art(p.genero)} puso en la canasta.`, origen: { nombre: 'Árbol', dibujo: arbol }, destino: { nombre: 'Canasta', dibujo: 'canasta' }, donde: 'en el árbol' },
    { p, texto: `En la tienda hay una caja con ${n(p, a)}. ${q} vendió ${b}.`, origen: { nombre: 'Caja', dibujo: 'caja' }, destino: { nombre: losQue(p, 'vendió') }, donde: 'en la caja' },
    { p: cosa('limón', 'limones', 'm', 'limon'), texto: `En la bolsa hay ${a} ${a === 1 ? 'limón' : 'limones'}. ${q} usó ${b} para la limonada.`, origen: { nombre: 'Bolsa', dibujo: 'bolsa' }, destino: { nombre: 'Para la limonada' }, donde: 'en la bolsa' },
    { p: huevos, texto: `En el nido de la gallina hay ${n(huevos, a)}. ${q} recogió ${b} en la cubeta.`, origen: { nombre: 'Nido', dibujo: 'gallina' }, destino: { nombre: 'Cubeta', dibujo: 'cubeta' }, donde: 'en el nido' },
    { p: arepas, texto: `En la mesa hay ${n(arepas, a)}. La familia se comió ${b} en el desayuno.`, origen: { nombre: 'Mesa', dibujo: 'mesa' }, destino: { nombre: 'Las que se comieron' }, donde: 'en la mesa' },
    { p: panes, texto: `En la panadería hay ${n(panes, a)}. ${q} compró ${b} para la casa.`, origen: { nombre: 'Panadería' }, destino: { nombre: 'Para la casa' }, donde: 'en la panadería' },
    { p: matas, texto: `En el vivero hay ${n(matas, a)}. ${q} sembró ${b} en la huerta.`, origen: { nombre: 'Vivero' }, destino: { nombre: 'Huerta' }, donde: 'en el vivero' },
    { p: semillas, texto: `${q} tiene ${n(semillas, a)}. Sembró ${b} en la huerta escolar.`, origen: { nombre: 'Las que tenía' }, destino: { nombre: 'Huerta' } },
    { p: gallinas, texto: `En el gallinero hay ${n(gallinas, a)}. ${b} ${b === 1 ? 'salió' : 'salieron'} al patio.`, origen: { nombre: 'Gallinero' }, destino: { nombre: 'Patio' }, donde: 'en el gallinero' },
    { p, texto: `${q} tiene ${n(p, a)} en una caja. Le regaló ${b} a la vecina.`, origen: { nombre: 'Caja', dibujo: 'caja' }, destino: { nombre: 'La vecina', dibujo: 'adulto' }, donde: 'en la caja' },
    { p: comible, texto: `${q} tiene ${n(comible, a)} en la lonchera. En el descanso se comió ${b}.`, origen: { nombre: 'Lonchera' }, destino: { nombre: losQue(comible, 'se comió') }, donde: 'en la lonchera' },
    { p: platanos, texto: `Del racimo cuelgan ${n(platanos, a)}. ${q} cortó ${b} para el almuerzo.`, origen: { nombre: 'Racimo', dibujo: 'platano' }, destino: { nombre: 'Para el almuerzo' }, donde: 'en el racimo' },
    { p: bultos, texto: `La chiva lleva ${n(bultos, a)}. En la cooperativa bajaron ${b}.`, origen: { nombre: 'Chiva' }, destino: { nombre: 'Cooperativa' }, donde: 'en la chiva' },
    { p, texto: `${q} llevó ${n(p, a)} al mercado del pueblo. Vendió ${b}.`, origen: { nombre: losQue(p, 'llevó') }, destino: { nombre: losQue(p, 'vendió') } },
    { p: mazorcas, texto: `En el canasto hay ${n(mazorcas, a)}. ${q} abrió ${b} para sacar los granos.`, origen: { nombre: 'Canasto', dibujo: 'canasta' }, destino: { nombre: 'Las que abrió' }, donde: 'en el canasto' },
    { p: comible, texto: `En el árbol había ${n(comible, a)}. Los pájaros se comieron ${b}.`, origen: { nombre: 'Árbol', dibujo: arbolDe(cultivoDe[comible.objeto] ?? '') }, destino: { nombre: losQue(comible, 'se comieron') }, donde: 'en el árbol' },
    { p: monedas, texto: `En la alcancía hay ${n(monedas, a)}. ${q} sacó ${b} para el lápiz nuevo.`, origen: { nombre: 'Alcancía' }, destino: { nombre: 'Para el lápiz' }, donde: 'en la alcancía' },
  ];
}

const restaQuitar: Plantilla = {
  id: 'g1-quitar',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Quitar arrastrando: la mula se lleva mazorcas, se venden frutas…',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = Math.min(20, pn(ctx, 'max', 10));
    const [a, b] = parRestaHasta(ctx, max, false);
    const respuesta = a - b;
    const v = rng.elegir(escenasQuitar(rng, a, b));
    const C = cuantos(v.p.genero);
    const donde = v.donde ? ` ${v.donde}` : '';
    const pregunta = rng.elegir([`¿${C} ${v.p.plural} quedan${donde}?`, `¿${C} quedan ahora${donde}?`, `Cuenta ${art(v.p.genero)} que quedan. ¿${C} son?`]);
    const distr = distractores(rng, respuesta, [a + b, respuesta + 1, respuesta - 1], 3, dif(ctx));
    return {
      enunciado: `${v.texto} ${pregunta}`,
      instruccion: 'Arrastra y cuenta lo que queda',
      ilustracion: v.p.objeto,
      datos: { a, b },
      respuesta,
      unidad: v.p.plural,
      distractores: distr,
      interaccion: { tipo: 'arrastrar', objeto: v.p.objeto, modo: 'quitar', a, b, origen: v.origen, destino: v.destino },
      calculo: { op: 'resta', a, b },
      pistas: [
        'Si se llevan algunos, ¿quedan más o menos?',
        { tipo: 'objetos', objeto: v.p.objeto, grupos: [a], tachados: b },
        `Tacha ${b} de los ${a} y cuenta los que no están tachados.`,
      ],
      explicacion: `${a} − ${b} = ${respuesta}. Quedan ${respuesta} ${nombreCant(v.p, respuesta)}.`,
    };
  },
};

/** Escenas para completar un total: qué se cuenta, la situación y para qué falta. */
type EscenaCompletar = { p: Cosa; texto: string; para: string };

function escenasCompletar(rng: Rng, a: number, total: number): EscenaCompletar[] {
  const q = persona(rng).nombre;
  const ad = mayus(adulto(rng).nombre);
  return [
    { p: huevos, texto: `La cubeta tiene espacio para ${total} huevos. Ya hay ${a}.`, para: 'para llenarla' },
    { p: mazorcas, texto: `El canasto de ${adulto(rng).nombre} se llena con ${total} mazorcas de cacao. Ya tiene ${a}.`, para: 'para llenarlo' },
    { p: cosa('naranja', 'naranjas', 'f', 'naranja'), texto: `En la canasta caben ${total} naranjas. ${q} ya puso ${a}.`, para: 'para llenarla' },
    { p: cosa('limón', 'limones', 'm', 'limon'), texto: `En la bolsa caben ${total} limones. ${q} ya echó ${a}.`, para: 'para llenarla' },
    { p: cosa('mandarina', 'mandarinas', 'f', 'mandarina'), texto: `Una caja de mandarinas se llena con ${total}. ${ad} ya empacó ${a}.`, para: 'para llenar la caja' },
    { p: cosa('aguacate', 'aguacates', 'm', 'aguacate'), texto: `Para la feria, ${q} necesita ${total} aguacates. Ya tiene ${a}.`, para: 'para la feria' },
    { p: arepas, texto: `${ad} va a hacer ${total} arepas para el desayuno. Ya hizo ${a}.`, para: 'por hacer' },
    { p: panes, texto: `Para el refrigerio se necesitan ${total} panes. El profe ya trajo ${a}.`, para: 'para el refrigerio' },
    { p: semillas, texto: `En la huerta escolar hay ${total} huecos para sembrar semillas de maíz. Ya sembraron ${a}.`, para: 'por sembrar' },
    { p: matas, texto: `En la fila del vivero caben ${total} matas de cacao. Ya hay ${a}.`, para: 'para llenar la fila' },
    { p: gallinas, texto: `En la finca hay ${total} gallinas. Al atardecer ya entraron ${a} al gallinero.`, para: 'por entrar' },
    { p: monedas, texto: `${q} quiere juntar ${total} monedas en la alcancía. Ya tiene ${a}.`, para: 'para llegar a la meta' },
    { p: platanos, texto: `Para el sancocho de la escuela se necesitan ${total} plátanos. ${q} ya trajo ${a}.`, para: 'para el sancocho' },
    { p: bultos, texto: `El carro de la cooperativa lleva ${total} bultos de cacao. Ya cargaron ${a}.`, para: 'por cargar' },
    { p: cosa('mesa', 'mesas', 'f', 'mesa'), texto: `En el salón deben quedar ${total} mesas. Los niños ya pusieron ${a}.`, para: 'por poner' },
  ];
}

const completar: Plantilla = {
  id: 'g1-completar',
  dimension: 'comprension',
  operacion: 'resta',
  descripcion: 'Completar a 10 (o a 20): ¿cuántos faltan?',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const total = pn(ctx, 'total', 10);
    const a = rng.entero(1, total - 1);
    const respuesta = total - a;
    const v = rng.elegir(escenasCompletar(rng, a, total));
    const C = cuantos(v.p.genero);
    const pregunta = rng.elegir([`¿${C} ${v.p.plural} faltan ${v.para}?`, `¿${C} faltan para completar ${total}?`, `¿${C} ${v.p.plural} más se necesitan?`]);
    const calc = { op: 'resta' as const, a: total, b: a };
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: [a, total + a] });
    return {
      enunciado: `${v.texto} ${pregunta}`,
      instruccion: `Completa ${total}`,
      ilustracion: v.p.objeto,
      datos: { a, total },
      respuesta,
      unidad: v.p.plural,
      ...modo,
      calculo: calc,
      pistas: [
        `¿Cuántos espacios vacíos quedan para llegar a ${total}?`,
        { tipo: 'objetos', objeto: v.p.objeto, grupos: [a], vacios: respuesta },
        `Cuenta desde ${a} hasta ${total}: ¿cuántos números dijiste?`,
      ],
      explicacion: `${a} + ${respuesta} = ${total}. ${respuesta === 1 ? 'Falta' : 'Faltan'} ${respuesta} ${nombreCant(v.p, respuesta)}.`,
    };
  },
};

/** Qué se empaca de a 10 y en qué (cajas, bolsas o canastas, que tienen dibujo propio). */
type Empaque = { p: Cosa; en: 'caja' | 'bolsa' | 'canasta' };
const empaques: Empaque[] = [
  { p: cosa('naranja', 'naranjas', 'f', 'naranja'), en: 'caja' },
  { p: cosa('naranja', 'naranjas', 'f', 'naranja'), en: 'bolsa' },
  { p: cosa('mandarina', 'mandarinas', 'f', 'mandarina'), en: 'caja' },
  { p: cosa('limón', 'limones', 'm', 'limon'), en: 'bolsa' },
  { p: cosa('aguacate', 'aguacates', 'm', 'aguacate'), en: 'canasta' },
  { p: huevos, en: 'caja' },
  { p: mazorcas, en: 'canasta' },
  { p: panes, en: 'bolsa' },
  { p: arepas, en: 'bolsa' },
  { p: semillas, en: 'bolsa' },
];
const destinosVenta = ['al mercado del pueblo', 'a la tienda de la vereda', 'a la feria del pueblo', 'a la escuela para el refrigerio', 'a la casa de la abuela'];

const decenas: Plantilla = {
  id: 'g1-decenas',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Decenas y unidades con cajas, bolsas o canastas de 10',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 50);
    const n = rng.entero(11, max);
    const de = Math.floor(n / 10);
    const un = n % 10;
    const construir = rng.azar(0.5);
    const ad = adulto(rng).nombre;
    const quien = mayus(ad);
    const { p, en } = rng.elegir(empaques);
    const dest = rng.elegir(destinosVenta);
    const envases = `${en}s`;
    /** «1 caja», «3 cajas». */
    const env = (k: number) => (k === 1 ? en : envases);
    const sueltas = p.genero === 'f' ? 'sueltas' : 'sueltos';
    const bloques = { unidad: p.objeto, decena: en } as const;
    if (construir) {
      const intro = rng.elegir([`${quien} va a llevar ${n} ${p.plural} ${dest}.`, `${quien} tiene que empacar ${n} ${p.plural} para llevar ${dest}.`]);
      return {
        enunciado: `${intro} Arma el número con ${envases} de 10 y ${p.plural.split(' de ')[0]} ${sueltas}.`,
        instruccion: 'Arma el número',
        ilustracion: p.objeto,
        datos: { n, decenas: de, unidades: un },
        respuesta: n,
        distractores: [],
        interaccion: { tipo: 'bloques', modo: 'construir', valor: n, ...bloques },
        pistas: [
          `¿Cuántos grupos de 10 caben en ${n}?`,
          { tipo: 'bloques', valor: n, ...bloques },
          `${n} = ${de} ${env(de)} de 10 y ${un} ${sueltas}.`,
        ],
        explicacion: `${n} tiene ${de} decenas y ${un} unidades: ${de} ${env(de)} y ${un} ${p.plural.split(' de ')[0]} ${sueltas}.`,
      };
    }
    const calc = { op: 'suma' as const, a: de * 10, b: un };
    const modo = modoRespuesta(ctx, n, calc, { extras: [un * 10 + de, de + un, n + 10, n - 10] });
    const C = cuantos(p.genero);
    const enunciado = rng.elegir([
      `${quien} empacó ${p.plural} en ${envases} de 10. Tiene ${de} ${env(de)} ${de === 1 ? 'llena' : 'llenas'} y ${un} ${sueltas}. ¿${C} ${p.plural} tiene?`,
      `Para llevar ${dest}, ${ad} tiene ${de} ${env(de)} de 10 ${p.plural} y ${un} ${sueltas}. ¿${C} ${p.plural} lleva en total?`,
      `En la mesa hay ${de} ${env(de)} con 10 ${p.plural}${de === 1 ? '' : ' cada una'} y ${un} ${p.plural.split(' de ')[0]} ${sueltas}. ¿${C} ${p.plural} hay?`,
    ]);
    return {
      enunciado,
      instruccion: 'Cuenta de 10 en 10',
      ilustracion: p.objeto,
      datos: { decenas: de, unidades: un },
      respuesta: n,
      unidad: p.plural,
      ...modo,
      calculo: calc,
      pistas: [
        `Cuenta ${art('f')} ${envases} de 10 en 10 y luego suma ${art(p.genero)} ${sueltas}.`,
        { tipo: 'bloques', valor: n, ...bloques },
        `${de} ${env(de)} ${de === 1 ? 'es' : 'son'} ${de * 10}; más ${un} ${sueltas}.`,
      ],
      explicacion: `${de * 10} + ${un} = ${n}.`,
    };
  },
};

const comparaDiferencia: Plantilla = {
  id: 'g1-diferencia',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Comparación: ¿cuántos más tiene uno que otro?',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 10);
    const [a, b] = parRestaHasta(ctx, max, pb(ctx, 'sinReagrupar'));
    const [x0, y0] = dosPersonas(rng);
    const x = x0.nombre;
    const y = y0.nombre;
    const p = rng.elegir(contables);
    const n = (c: Cosa, k: number) => `${k} ${nombreCant(c, k)}`;
    const C = (c: Cosa) => cuantos(c.genero);
    const mismas = (c: Cosa) => (c.genero === 'f' ? 'las mismas' : 'los mismos');
    // Cada escena: lo que se compara y la pregunta (siempre a − b).
    const escenas: { c: Cosa; t: string }[] = [
      { c: p, t: `${x} ${p.verbo} ${n(p, a)} y ${y} ${p.verbo} ${b}. ¿${C(p)} ${p.plural} más ${p.verbo} ${x}?` },
      { c: p, t: `${y} ${p.verbo} ${n(p, b)} y ${x} ${p.verbo} ${a}. ¿${C(p)} ${p.plural} menos ${p.verbo} ${y}?` },
      { c: p, t: `En ${p.recipiente} de ${x} hay ${n(p, a)}. En ${p.recipiente} de ${y} hay ${b}. ¿${C(p)} más hay en ${p.recipiente} de ${x}?` },
      { c: p, t: `${x} tiene ${n(p, a)} y ${y} tiene ${b}. ¿${C(p)} le faltan a ${y} para tener ${mismas(p)} que ${x}?` },
      { c: p, t: `El lunes ${x} ${p.verbo} ${n(p, a)}. El martes ${p.verbo} ${b}. ¿${C(p)} ${p.plural} más ${p.verbo} el lunes?` },
      { c: p, t: `${x} vendió ${n(p, a)} en el mercado y ${y} vendió ${b}. ¿${C(p)} más vendió ${x}?` },
      { c: p, t: `Hay ${n(p, a)} y ${b} ${b === 1 ? 'niño' : 'niños'}. Cada niño recibe ${p.genero === 'f' ? 'una' : 'uno'}. ¿${C(p)} ${p.plural} sobran?` },
      { c: gallinas, t: `En el gallinero de ${x} hay ${n(gallinas, a)} y en el de ${y} hay ${b}. ¿${C(gallinas)} gallinas más hay en el de ${x}?` },
      { c: matas, t: `${x} sembró ${n(matas, a)} en el vivero y ${y} sembró ${b}. ¿${C(matas)} matas más sembró ${x}?` },
      { c: semillas, t: `${x} tiene ${n(semillas, a)} y ${y} tiene ${b}. ¿${C(semillas)} semillas menos tiene ${y}?` },
      { c: huevos, t: `La gallina pinta puso ${n(huevos, a)} esta semana y la gallina blanca puso ${b}. ¿${C(huevos)} huevos más puso la pinta?` },
      { c: arepas, t: `${x} se comió ${n(arepas, b)} en el desayuno y su papá se comió ${a}. ¿${C(arepas)} arepas más se comió el papá?` },
      { c: monedas, t: `${x} tiene ${n(monedas, a)} en la alcancía y ${y} tiene ${b}. ¿${C(monedas)} monedas más tiene ${x}?` },
    ];
    const e = rng.elegir(escenas);
    const respuesta = a - b;
    const calc = { op: 'resta' as const, a, b };
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: [a + b, a, b] });
    return {
      enunciado: e.t,
      instruccion: 'Compara',
      ilustracion: e.c.objeto,
      datos: { a, b },
      respuesta,
      unidad: e.c.plural,
      ...modo,
      calculo: calc,
      pistas: [
        'Pon los dos grupos uno frente al otro. ¿Cuántos quedan sin pareja?',
        { tipo: 'objetos', objeto: e.c.objeto, grupos: [a, b] },
        `La diferencia entre ${a} y ${b} es ${a} − ${b}.`,
      ],
      explicacion: `${a} − ${b} = ${respuesta}. La diferencia es ${respuesta}.`,
    };
  },
};

const reparto: Plantilla = {
  id: 'g1-reparto',
  dimension: 'aplicacion',
  operacion: 'division',
  descripcion: 'Repartir en 2 o 3 partes iguales arrastrando',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.elegir([2, 2, 3]);
    const cada = rng.entero(2, lerp(3, k === 2 ? 8 : 6, dif(ctx)));
    const n = cada * k;
    const p = rng.elegir(frutas);
    const quien = persona(rng);
    const para = k === 2 ? 'sus 2 hermanos' : 'sus 3 primos';
    const quienRecibe = { nombre: k === 2 ? 'Hermano' : 'Primo', dibujo: 'nino' as const };
    const distr = distractores(rng, cada, [cada + 1, cada - 1, n - k], 3, dif(ctx));
    return {
      enunciado: `${quien.nombre} reparte ${n} ${p.plural} entre ${para}, la misma cantidad a cada uno. Arrastra las frutas a sus ${k === 2 ? 'hermanos' : 'primos'}. ¿${cuantos(p.genero)} recibe cada uno?`,
      instruccion: 'Reparte igual',
      ilustracion: p.objeto,
      datos: { n, k },
      respuesta: cada,
      unidad: p.plural,
      distractores: distr,
      interaccion: { tipo: 'arrastrar', objeto: p.objeto, modo: 'repartir', a: n, b: k, destino: quienRecibe },
      calculo: { op: 'division', a: n, b: k },
      pistas: [
        'Da una fruta a cada uno, por turnos, hasta que no quede ninguna.',
        { tipo: 'reparto', total: n, grupos: k, objeto: p.objeto, grupo: quienRecibe },
        `Si cada uno recibe ${cada}, entre los ${k} son ${cada * k}.`,
      ],
      explicacion: `${n} repartidas en ${k} partes iguales son ${cada} para cada uno.`,
    };
  },
};

const tablaCosecha: Plantilla = {
  id: 'g1-tabla',
  dimension: 'aplicacion',
  operacion: 'suma',
  descripcion: 'Leer una tabla sencilla de la cosecha',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 10);
    const modo = pt(ctx, 'modo', 'total');
    const p = rng.elegir(contables);
    const quien = persona(rng);
    const dias = ['lunes', 'martes'];
    const [a, b] = modo === 'total' ? parSumaHasta(ctx, max, pb(ctx, 'sinReagrupar')) : [rng.entero(1, max), rng.entero(1, max)];
    let bb = b;
    if (modo !== 'total' && a === bb) bb = a === 1 ? 2 : a - 1;
    const filas = [
      [dias[0], a],
      [dias[1], bb],
    ];
    const titulo = `${quien.nombre} anotó en su cuaderno ${p.genero === 'f' ? 'las' : 'los'} ${p.plural} que ${p.verbo} en ${rng.elegir(['la finca', 'la huerta escolar', 'el patio'])}.`;
    if (modo === 'mayor') {
      const resp = a > bb ? 'lunes' : 'martes';
      return {
        enunciado: `${titulo} ¿Qué día ${p.verbo} más?`,
        instruccion: 'Lee la tabla',
        ilustracion: p.objeto,
        datos: { a, b: bb },
        respuesta: resp,
        distractores: [resp === 'lunes' ? 'martes' : 'lunes'],
        interaccion: { tipo: 'tabla', encabezados: ['Día', mayus(p.plural)], filas, opciones: ['lunes', 'martes'] },
        pistas: ['Busca el número más grande en la tabla.', { tipo: 'objetos', objeto: p.objeto, grupos: [a, bb] }, `El lunes: ${a}. El martes: ${bb}.`],
        explicacion: `${Math.max(a, bb)} es mayor que ${Math.min(a, bb)}: ${p.verbo} más el ${resp}.`,
      };
    }
    if (modo === 'diferencia') {
      const mayor = Math.max(a, bb);
      const menor = Math.min(a, bb);
      const resp = mayor - menor;
      const calc = { op: 'resta' as const, a: mayor, b: menor };
      return {
        enunciado: `${titulo} ¿${cuantos(p.genero)} ${p.plural} más ${p.verbo} el ${a > bb ? 'lunes' : 'martes'} que el ${a > bb ? 'martes' : 'lunes'}?`,
        instruccion: 'Lee la tabla',
        ilustracion: p.objeto,
        datos: { a, b: bb },
        respuesta: resp,
        unidad: p.plural,
        distractores: distractores(rng, resp, [mayor + menor, resp + 1, resp - 1], 3, dif(ctx)),
        interaccion: { tipo: 'tabla', encabezados: ['Día', mayus(p.plural)], filas },
        calculo: calc,
        pistas: ['¿Cuántos de más hay en el día mayor?', { tipo: 'objetos', objeto: p.objeto, grupos: [mayor, menor] }, `${mayor} − ${menor}.`],
        explicacion: `${mayor} − ${menor} = ${resp}.`,
      };
    }
    const total = a + bb;
    const calc = { op: 'suma' as const, a, b: bb };
    const distr = distractores(rng, total, [Math.abs(a - bb), total + 1, total - 1, total + 10], 3, dif(ctx));
    const abierta = rng.azar(lerp(30, 80, dif(ctx)) / 100);
    return {
      enunciado: `${titulo} ¿${cuantos(p.genero)} ${p.plural} ${p.verbo} en los dos días?`,
      instruccion: 'Lee la tabla',
      ilustracion: p.objeto,
      datos: { a, b: bb },
      respuesta: total,
      unidad: p.plural,
      distractores: distr,
      interaccion: { tipo: 'tabla', encabezados: ['Día', mayus(p.plural)], filas, opciones: abierta ? undefined : mezclarOpciones(rng, total, distr) },
      calculo: calc,
      pistas: ['¿Qué haces para saber cuántos hay en total: juntar o quitar?', { tipo: 'objetos', objeto: p.objeto, grupos: [a, bb] }, `${a} + ${bb}.`],
      explicacion: `${a} + ${bb} = ${total}.`,
    };
  },
};

const razonable: Plantilla = {
  id: 'g1-razonable',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: '¿Es razonable? Estimar sumas hasta 99',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [a, b] = parSumaHasta(ctx, pn(ctx, 'max', 99), true, 30);
    const real = a + b;
    const esRazonable = rng.azar(0.5);
    const lejanos = [real + 30, real - 30, real + 40, real - 40, a, b].filter((x) => Math.abs(x - real) >= 20 && x > 0 && x <= 99);
    const propuesto = esRazonable || !lejanos.length ? real : rng.elegir(lejanos);
    const esRaz = propuesto === real;
    const estimacion = Math.round(real / 10) * 10;
    const distr = [estimacion + 20, estimacion - 20, estimacion + 40, estimacion - 40].filter((x) => x >= 0 && x <= 100).slice(0, 2);
    const q = persona(rng).nombre;
    const ad = mayus(adulto(rng).nombre);
    const p = propuesto;
    // Escenas: dos cantidades que se juntan y lo que alguien dice del total.
    const escenas: { t: string; o?: Objeto }[] = [
      { t: `${q} juntó ${a} limones y ${b} mandarinas para la feria del pueblo. Dice que tiene ${p} frutas.`, o: 'limon' },
      { t: `En la tienda hay ${a} huevos en una cubeta y ${b} en otra. ${q} dice que hay ${p} huevos.`, o: 'huevo' },
      { t: `${ad} cortó ${a} mazorcas de cacao el lunes y ${b} el martes. Dice que cortó ${p} mazorcas.`, o: 'mazorca' },
      { t: `A la escuela llegaron ${a} niños en la mañana y ${b} en la tarde. El profe dice que son ${p} niños.` },
      { t: `En el vivero hay ${a} matas de cacao y ${b} matas de café. ${q} dice que hay ${p} matas.`, o: 'mata' },
      { t: `${q} vendió ${a} naranjas y ${b} aguacates en el mercado. Dice que vendió ${p} frutas.`, o: 'naranja' },
      { t: `La chiva llevó ${a} pasajeros al pueblo y trajo ${b} de vuelta. El conductor dice que fueron ${p} pasajeros.` },
      { t: `En el gallinero hay ${a} gallinas y ${b} pollitos. ${q} dice que son ${p} animales.`, o: 'gallina' },
      { t: `Para el refrigerio hay ${a} panes y ${b} arepas. La profe dice que son ${p} en total.`, o: 'pan' },
      { t: `${q} sembró ${a} semillas de maíz en un surco y ${b} en otro. Dice que sembró ${p} semillas.`, o: 'semilla' },
      { t: `En la finca hay ${a} árboles de cacao y ${b} de aguacate. ${ad} dice que son ${p} árboles.`, o: 'arbol-cacao' },
      { t: `${q} ahorró ${a} monedas en enero y ${b} en febrero. Dice que tiene ${p} monedas.`, o: 'moneda' },
    ];
    const e = rng.elegir(escenas);
    const pregunta = rng.elegir(['¿Es razonable?', '¿Tiene sentido lo que dice?']);
    return {
      enunciado: `${e.t} ${pregunta} Después, elige la mejor estimación.`,
      instruccion: '¿Tiene sentido?',
      ...(e.o ? { ilustracion: e.o } : {}),
      datos: { a, b, propuesto },
      respuesta: `${esRaz ? 'si' : 'no'}:${estimacion}`,
      distractores: distr,
      interaccion: { tipo: 'razonable', propuesto, esRazonable: esRaz, opciones: rng.barajar([estimacion, ...distr]) },
      pistas: [
        'Piensa en decenas: ¿cuánto es más o menos cada número?',
        { tipo: 'recta', min: 0, max: 100, desde: a, saltos: [b] },
        `${a} es cerca de ${Math.round(a / 10) * 10} y ${b} es cerca de ${Math.round(b / 10) * 10}.`,
      ],
      explicacion: `${a} + ${b} = ${real}, que es cerca de ${estimacion}. ${esRaz ? `Decir ${propuesto} es razonable.` : `${propuesto} está muy lejos: no es razonable.`}`,
    };
  },
};

const plantillas = [contar, comparar, siguiente, sumaRecta, sumaCambio, sumaJuntar, sumaCalculo, restaQuitar, completar, decenas, comparaDiferencia, reparto, tablaCosecha, razonable];

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

export const g1: DefinicionPista = {
  pista: 'g1',
  limite: 100,
  plantillas,
  temas: [
    {
      titulo: 'Contar hasta 10',
      usos: [u(contar, { max: 10 }), u(comparar, { max: 10 }), u(tablaCosecha, { max: 10, modo: 'mayor' })],
    },
    {
      titulo: 'Contar y comparar hasta 20',
      usos: [u(contar, { max: 20 }), u(comparar, { max: 20 }), u(comparaDiferencia, { max: 10 }), u(tablaCosecha, { max: 20, modo: 'mayor' })],
      prueba: u(comparar, { max: 20 }),
    },
    {
      titulo: 'Anterior, siguiente y la recta',
      usos: [u(siguiente, { max: 20 }), u(siguiente, { max: 50 }), u(sumaRecta, { max: 20, maxSalto: 3 })],
      prueba: u(siguiente, { max: 50 }),
    },
    {
      titulo: 'Sumar hasta 10',
      usos: [u(sumaCalculo, { max: 10 }), u(sumaJuntar, { max: 10 }), u(sumaCambio, { max: 10 }), u(sumaRecta, { max: 10 })],
      prueba: u(sumaJuntar, { max: 10 }),
    },
    {
      titulo: 'Sumar hasta 20',
      usos: [u(sumaCalculo, { max: 20 }), u(sumaCambio, { max: 20 }), u(sumaJuntar, { max: 20 }), u(sumaRecta, { max: 20 }), u(tablaCosecha, { max: 20 })],
      prueba: u(sumaCambio, { max: 20 }),
    },
    {
      titulo: 'Restar hasta 20',
      usos: [u(sumaCalculo, { max: 20, op: 'resta' }), u(restaQuitar, { max: 20 }), u(sumaRecta, { max: 20, op: 'resta' }), u(comparaDiferencia, { max: 20 }), u(tablaCosecha, { max: 20, modo: 'diferencia' })],
      prueba: u(restaQuitar, { max: 20 }),
    },
    {
      titulo: 'Completar a 10: ¿cuántos faltan?',
      usos: [u(completar, { total: 10 }), u(completar, { total: 20 }), u(comparaDiferencia, { max: 20 })],
    },
    {
      titulo: 'Decenas y unidades hasta 99',
      usos: [u(decenas, { max: 50 }), u(decenas, { max: 99 }), u(razonable, { max: 99 })],
      prueba: u(decenas, { max: 99 }),
    },
    {
      titulo: 'Sumar y restar hasta 99 sin llevar',
      usos: [u(sumaCalculo, { max: 99, op: 'mixta', sinReagrupar: true }), u(sumaCambio, { max: 99, sinReagrupar: true }), u(tablaCosecha, { max: 99, sinReagrupar: true }), u(razonable, { max: 99 })],
    },
    {
      titulo: 'Problemas de juntar, quitar y comparar',
      usos: [u(sumaCambio, { max: 99, sinReagrupar: true, incognita: true }), u(comparaDiferencia, { max: 99, sinReagrupar: true }), u(restaQuitar, { max: 20 }), u(reparto), u(tablaCosecha, { max: 99, modo: 'diferencia' })],
    },
  ],
};

/** Plantillas de 1.º que también usa el grado Inclusión. */
export const plantillasG1 = { siguiente, sumaJuntar, restaQuitar, sumaCambio, comparaDiferencia, decenas, sumaCalculo };
