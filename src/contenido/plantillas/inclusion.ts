// Grado Inclusión: actividades muy guiadas y predecibles para niños con síndrome de Down, autismo
// y otras formas de aprender. Una sola consigna corta, dibujos grandes y nada de presión: en esta
// ruta nunca se pierde (ver motor y Ejercicio en modo «inclusion»).
//
// La ruta tiene 8 bloques y 33 niveles y llega solo hasta el 10: primero mirar y emparejar (sin
// números), luego tamaños y orden, cantidades sin contar, los números 1 a 3, 4 y 5, 6 a 10, y al
// final juntar y quitar con dibujos. Cada nivel trae 5 actividades.
//
// Reglas de todas las plantillas (docs del diseño de la ruta):
// - concreto → dibujo → número: el número escrito aparece al final;
// - aprendizaje sin error: máximo 2 opciones en los bloques 1 a 4 y 3 después;
// - una consigna con la misma forma dentro del nivel (2 o 3 redacciones, sin cambiar la
//   estructura): lo que cambia es la cosa, el color, la forma o el lugar;
// - nada pasa de 10 y todo se hace tocando;
// - las pistas son suaves y se apoyan en un dibujo.

import type { ColorFigura, ContextoGeneracion, CosaAlta, DefinicionPista, EjercicioBase, Figura, FormaFigura, Objeto, OpcionFigura, Plantilla, Recipiente, Uso, Visual } from '../../juego/tipos';
import type { Rng } from '../../juego/rng';
import { COMO_SE_ESCRIBE, NOMBRES_CIFRA } from '../cifras';
import { persona } from '../contexto';
import { plantillasG1 } from './g1';
import { dif, pb, pn } from './util';

const { sumaJuntar, restaQuitar } = plantillasG1;

// --- Cosas de la finca, con su nombre y dónde se encuentran ---

type Cosa = { objeto: Objeto; uno: string; varios: string; f: boolean; /** Lugares donde se ven («en el gallinero»). */ donde: string[] };

const COSAS: Cosa[] = [
  { objeto: 'gallina', uno: 'gallina', varios: 'gallinas', f: true, donde: ['en el gallinero', 'en el patio', 'junto al corral'] },
  { objeto: 'huevo', uno: 'huevo', varios: 'huevos', f: false, donde: ['en el gallinero', 'en la cocina', 'en la tienda'] },
  { objeto: 'naranja', uno: 'naranja', varios: 'naranjas', f: true, donde: ['en la tienda', 'en el mercado', 'bajo el naranjo'] },
  { objeto: 'aguacate', uno: 'aguacate', varios: 'aguacates', f: false, donde: ['en el mercado', 'en la cocina', 'bajo el árbol'] },
  { objeto: 'mandarina', uno: 'mandarina', varios: 'mandarinas', f: true, donde: ['en la tienda', 'en la escuela', 'en el mercado'] },
  { objeto: 'limon', uno: 'limón', varios: 'limones', f: false, donde: ['en la cocina', 'en la huerta', 'en la tienda'] },
  { objeto: 'mazorca', uno: 'mazorca', varios: 'mazorcas', f: true, donde: ['en el cacaotal', 'en el beneficiadero', 'junto al secadero'] },
  { objeto: 'platano', uno: 'plátano', varios: 'plátanos', f: false, donde: ['en la cocina', 'en el mercado', 'en la tienda'] },
  { objeto: 'arepa', uno: 'arepa', varios: 'arepas', f: true, donde: ['en la cocina', 'en la mesa', 'junto al fogón'] },
  { objeto: 'pan', uno: 'pan', varios: 'panes', f: false, donde: ['en la panadería', 'en la tienda', 'en la escuela'] },
  { objeto: 'semilla', uno: 'semilla', varios: 'semillas', f: true, donde: ['en la huerta', 'en el vivero', 'en la escuela'] },
  { objeto: 'moneda', uno: 'moneda', varios: 'monedas', f: true, donde: ['en la alcancía', 'en la tienda', 'en el bolsillo'] },
  { objeto: 'cafe', uno: 'grano de café', varios: 'granos de café', f: false, donde: ['en el beneficiadero', 'en el secadero', 'en la mesa'] },
  { objeto: 'caja', uno: 'caja', varios: 'cajas', f: true, donde: ['en la tienda', 'en la cooperativa', 'en la bodega'] },
  { objeto: 'bolsa', uno: 'bolsa', varios: 'bolsas', f: true, donde: ['en el vivero', 'en la tienda', 'en el mercado'] },
  { objeto: 'mata', uno: 'mata', varios: 'matas', f: true, donde: ['en el vivero', 'en la huerta', 'en la escuela'] },
  { objeto: 'arbol', uno: 'árbol', varios: 'árboles', f: false, donde: ['en la finca', 'junto al río', 'en el potrero'] },
  { objeto: 'bulto', uno: 'bulto', varios: 'bultos', f: false, donde: ['en la bodega', 'en la cooperativa', 'en el camión'] },
];
const cosa = (o: Objeto) => COSAS.find((c) => c.objeto === o)!;
const deObjetos = (lista: Objeto[]) => lista.map(cosa);
/** Lo que cabe en una canasta (uno, muchos o ninguno; más y menos). */
const EN_CANASTA = deObjetos(['gallina', 'huevo', 'naranja', 'aguacate', 'mandarina', 'limon', 'mazorca', 'platano', 'arepa', 'pan', 'semilla', 'moneda', 'cafe']);
/** Cosas que se ven bien grandes y pequeñas. */
const TAMANOS = deObjetos(['gallina', 'naranja', 'aguacate', 'mandarina', 'limon', 'huevo', 'pan', 'arepa', 'mazorca', 'platano', 'caja', 'bolsa', 'bulto', 'mata', 'arbol', 'moneda']);
/** Parejas que se parecen a la vista: nunca van juntas en «igual a este». */
const PARECIDAS_O = ['naranja|mandarina', 'limon|aguacate', 'caja|bulto', 'bolsa|bulto', 'arbol|mata', 'semilla|cafe', 'huevo|pan', 'arepa|pan', 'arepa|moneda'];

const nombre = (c: Cosa, n: number) => (n === 1 ? c.uno : c.varios);
const un = (c: Cosa) => (c.f ? 'una' : 'un');
const los = (c: Cosa) => (c.f ? 'las' : 'los');
const el = (c: Cosa) => (c.f ? 'la' : 'el');
const lo = (c: Cosa) => (c.f ? 'la' : 'lo');
const cuantas = (c: Cosa) => (c.f ? 'Cuántas' : 'Cuántos');
const palabraNumero = (n: number) => (n === 10 ? 'diez' : NOMBRES_CIFRA[n]);
const may = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** Singular o plural según la cantidad («Llegó 1», «Llegaron 3»). */
const v = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);
const nino = (rng: Rng) => persona(rng).nombre;
/** «1, 2, 3»: el conteo en voz alta hasta n. */
const conteo = (n: number) => Array.from({ length: n }, (_, k) => k + 1).join(', ');

/** Avance dentro del nivel, de 0 (primera actividad) a 1 (última). */
function avance(ctx: ContextoGeneracion): number {
  return Math.min(1, Math.max(0, (dif(ctx) - 0.2) / 0.6));
}

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

/** Distractores entre min y max, lo más cerca posible de n pero a `sep` o más si se puede. */
function cercanos(rng: Rng, n: number, cantidad: number, min: number, max: number, sep = 1, excluir: number[] = []): number[] {
  const todos = Array.from({ length: max - min + 1 }, (_, k) => min + k).filter((x) => x !== n && !excluir.includes(x));
  const lejos = todos.filter((x) => Math.abs(x - n) >= sep);
  const base = lejos.length >= cantidad ? lejos : todos;
  // Barajar antes de ordenar: entre dos igual de cerca, cualquiera.
  return rng
    .barajar(base)
    .sort((a, b) => Math.abs(a - n) - Math.abs(b - n))
    .slice(0, cantidad);
}

/** Opciones numéricas: la respuesta y sus distractores, barajados. */
function opcionesCon(rng: Rng, n: number, distr: number[]): number[] {
  return rng.barajar([n, ...distr]);
}

/** Plantilla de 1.º que se usa en Inclusión con su propio id y un tope por fases (primero
 *  un poco menos que `max` y al final hasta `max`). */
function envolver(id: string, base: Plantilla, descripcion: string): Plantilla {
  return {
    id,
    dimension: base.dimension,
    operacion: base.operacion,
    descripcion,
    generar(ctx) {
      const max = Math.min(10, pn(ctx, 'max', 10));
      const tope = avance(ctx) < 0.5 ? Math.ceil(max * 0.7) : max;
      return base.generar({ ...ctx, params: { ...ctx.params, max: tope } });
    },
  };
}

// --- Colores y formas ---

const COLORES: ColorFigura[] = ['rojo', 'azul', 'amarillo', 'verde', 'anaranjado', 'morado', 'rosado', 'cafe'];
const COLOR_F: Record<ColorFigura, { m: string; f: string; mp: string; fp: string }> = {
  rojo: { m: 'rojo', f: 'roja', mp: 'rojos', fp: 'rojas' },
  azul: { m: 'azul', f: 'azul', mp: 'azules', fp: 'azules' },
  amarillo: { m: 'amarillo', f: 'amarilla', mp: 'amarillos', fp: 'amarillas' },
  verde: { m: 'verde', f: 'verde', mp: 'verdes', fp: 'verdes' },
  anaranjado: { m: 'anaranjado', f: 'anaranjada', mp: 'anaranjados', fp: 'anaranjadas' },
  morado: { m: 'morado', f: 'morada', mp: 'morados', fp: 'moradas' },
  rosado: { m: 'rosado', f: 'rosada', mp: 'rosados', fp: 'rosadas' },
  cafe: { m: 'café', f: 'café', mp: 'cafés', fp: 'cafés' },
};
/** Colores que se confunden: nunca van juntos en la misma pregunta. */
const PARECIDOS_C = ['rojo|rosado', 'rojo|anaranjado', 'amarillo|anaranjado', 'azul|morado', 'anaranjado|cafe', 'morado|rosado', 'rojo|cafe', 'rojo|morado'];

const FORMAS_F: FormaFigura[] = ['circulo', 'cuadrado', 'triangulo', 'rectangulo', 'estrella', 'corazon', 'ovalo'];
const FORMA_N: Record<FormaFigura, { s: string; p: string; f: boolean }> = {
  circulo: { s: 'círculo', p: 'círculos', f: false },
  cuadrado: { s: 'cuadrado', p: 'cuadrados', f: false },
  triangulo: { s: 'triángulo', p: 'triángulos', f: false },
  rectangulo: { s: 'rectángulo', p: 'rectángulos', f: false },
  estrella: { s: 'estrella', p: 'estrellas', f: true },
  corazon: { s: 'corazón', p: 'corazones', f: false },
  ovalo: { s: 'óvalo', p: 'óvalos', f: false },
};
/** Formas que se confunden: nunca van juntas en la misma pregunta. */
const PARECIDAS_F = ['circulo|ovalo', 'cuadrado|rectangulo', 'corazon|circulo', 'corazon|ovalo'];

/** Dos elementos distintos que no se confundan entre sí. */
function dosDistintos<T extends string>(rng: Rng, lista: T[], parecidos: string[]): [T, T] {
  for (;;) {
    const [a, b] = rng.barajar(lista);
    if (!parecidos.includes(`${a}|${b}`) && !parecidos.includes(`${b}|${a}`)) return [a, b];
  }
}
/** Otro elemento de la lista que no se confunda con `a`. */
function otroDistinto<T extends string>(rng: Rng, lista: T[], a: T, parecidos: string[]): T {
  return rng.elegir(lista.filter((b) => b !== a && !parecidos.includes(`${a}|${b}`) && !parecidos.includes(`${b}|${a}`)));
}
const colorDe = (forma: FormaFigura, color: ColorFigura) => (FORMA_N[forma].f ? COLOR_F[color].f : COLOR_F[color].m);
/** «estrella roja», «corazón rojo». */
const nombreFigura = (forma: FormaFigura, color: ColorFigura) => `${FORMA_N[forma].s} ${colorDe(forma, color)}`;
const artF = (forma: FormaFigura) => (FORMA_N[forma].f ? 'la' : 'el');
/** «de la estrella», «del círculo». */
const delF = (forma: FormaFigura) => (FORMA_N[forma].f ? 'de la' : 'del');

// =====================================================================
// Bloque 1 · Mirar y emparejar (sin números)
// =====================================================================

const igual: Plantilla = {
  id: 'in-igual',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Igual a este: tocar el dibujo idéntico al modelo (2 opciones)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const objetos = dosDistintos(rng, COSAS.map((c) => c.objeto), PARECIDAS_O);
    const [x, y] = objetos.map(cosa);
    // En la frase, las dos opciones en el orden en que se nombran.
    const [a, b] = rng.barajar([x, y]);
    const nombrar = (c: Cosa) => `${un(c)} ${c.uno}`;
    const nombrarEl = (c: Cosa) => `${el(c)} ${c.uno}`;
    const enunciado = rng.elegir([
      () => `Toca el dibujo igual a este: ${nombrar(a)} o ${nombrar(b)}.`,
      () => `Mira el dibujo de arriba. ¿Cuál es igual: ${nombrarEl(a)} o ${nombrarEl(b)}?`,
      () => `Busca otro dibujo igual a este: ${nombrarEl(a)} o ${nombrarEl(b)}.`,
    ])();
    const opciones: OpcionFigura[] = [x, y].map((c) => ({ id: c.objeto, etiqueta: c.uno, figura: { objeto: c.objeto } }));
    return {
      enunciado,
      instruccion: 'Toca el igual',
      datos: { opciones: 2 },
      respuesta: x.objeto,
      distractores: [y.objeto],
      interaccion: { tipo: 'figuras', opciones: rng.barajar(opciones), modelo: { objeto: x.objeto } },
      pistas: ['Mira bien el dibujo de arriba.', { tipo: 'figuras', figuras: [opciones[0]] }, `Es ${nombrarEl(x)}, igual al de arriba.`],
      explicacion: `${may(nombrarEl(x))} es igual al dibujo de arriba.`,
    };
  },
};

const mismoColor: Plantilla = {
  id: 'in-mismo-color',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Mismo color: tocar la figura del color del modelo (2 opciones, colores muy distintos)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [c0, c1] = dosDistintos(rng, COLORES, PARECIDOS_C);
    const fm = rng.elegir(FORMAS_F);
    // Al principio las opciones tienen la forma del modelo; después, otra forma (solo cuenta el color).
    const fo = avance(ctx) < 0.5 ? fm : otroDistinto(rng, FORMAS_F, fm, PARECIDAS_F);
    const modelo = nombreFigura(fm, c0);
    const enunciado = rng.elegir([
      () => `Toca la figura del mismo color que ${artF(fm)} ${modelo}.`,
      () => `Mira ${artF(fm)} ${modelo}. ¿Qué figura tiene el mismo color? Tócala.`,
      () => `Busca la figura que tiene el color ${delF(fm)} ${modelo}.`,
    ])();
    const opciones: OpcionFigura[] = [
      { id: 'si', etiqueta: nombreFigura(fo, c0), figura: { forma: fo, color: c0 } },
      { id: 'no', etiqueta: nombreFigura(fo, c1), figura: { forma: fo, color: c1 } },
    ];
    return {
      enunciado,
      instruccion: 'Mismo color',
      datos: { opciones: 2 },
      respuesta: 'si',
      distractores: ['no'],
      interaccion: { tipo: 'figuras', opciones: rng.barajar(opciones), modelo: { forma: fm, color: c0 } },
      pistas: ['Mira solo el color.', { tipo: 'figuras', figuras: [opciones[0]] }, `Es ${colorDe(fo, c0)}, como ${artF(fm)} ${FORMA_N[fm].s} de arriba.`],
      explicacion: `${may(artF(fo))} ${opciones[0].etiqueta} tiene el mismo color.`,
    };
  },
};

const mismaForma: Plantilla = {
  id: 'in-misma-forma',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Misma forma: tocar la figura de la forma del modelo (2 opciones, formas muy distintas)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const [f0, f1] = dosDistintos(rng, FORMAS_F, PARECIDAS_F);
    const cm = rng.elegir(COLORES);
    // Al principio las opciones tienen el color del modelo; después, otro color (solo cuenta la forma).
    const co = avance(ctx) < 0.5 ? cm : rng.elegir(COLORES.filter((c) => c !== cm));
    const modelo = nombreFigura(f0, cm);
    const enunciado = rng.elegir([
      () => `Toca la figura con la misma forma que ${artF(f0)} ${modelo}.`,
      () => `Mira ${artF(f0)} ${modelo}. ¿Qué figura tiene la misma forma? Tócala.`,
      () => `Busca la figura que tiene la forma ${delF(f0)} ${modelo}.`,
    ])();
    const opciones: OpcionFigura[] = [
      { id: 'si', etiqueta: nombreFigura(f0, co), figura: { forma: f0, color: co } },
      { id: 'no', etiqueta: nombreFigura(f1, co), figura: { forma: f1, color: co } },
    ];
    return {
      enunciado,
      instruccion: 'Misma forma',
      datos: { opciones: 2 },
      respuesta: 'si',
      distractores: ['no'],
      interaccion: { tipo: 'figuras', opciones: rng.barajar(opciones), modelo: { forma: f0, color: cm } },
      pistas: ['Mira solo la forma, no el color.', { tipo: 'figuras', figuras: [opciones[0]] }, `Es ${FORMA_N[f0].f ? 'otra' : 'otro'} ${FORMA_N[f0].s}, como ${artF(f0)} de arriba.`],
      explicacion: `${may(artF(f0))} ${opciones[0].etiqueta} tiene la misma forma.`,
    };
  },
};

// =====================================================================
// Bloque 2 · Grande, pequeño y en orden (sin números)
// =====================================================================

const pequeno = (c: Cosa) => (c.f ? 'pequeña' : 'pequeño');

const grandePequeno: Plantilla = {
  id: 'in-grande-pequeno',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Grande y pequeño: dos del mismo objeto, tocar el que se pide',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const c = rng.elegir(TAMANOS);
    const grande = rng.azar(0.5);
    const palabra = grande ? 'grande' : pequeno(c);
    const [e0, e1] = rng.elegir([
      [0.45, 1],
      [0.5, 1],
      [0.5, 0.95],
      [0.42, 0.9],
      [0.48, 0.98],
      [0.4, 0.85],
    ]);
    const lugar = rng.elegir(c.donde);
    const enunciado = rng.elegir([
      () => `Toca ${el(c)} ${c.uno} ${palabra}.`,
      () => `${may(lugar)} hay dos ${c.varios}. Toca ${el(c)} más ${palabra}.`,
      () => `Mira ${los(c)} dos ${c.varios}. ¿Cuál es ${el(c)} ${palabra}? Tóca${lo(c)}.`,
    ])();
    const opciones: OpcionFigura[] = [
      { id: 'pequeno', etiqueta: `${c.uno} ${pequeno(c)}`, figura: { objeto: c.objeto, escala: e0 } },
      { id: 'grande', etiqueta: `${c.uno} grande`, figura: { objeto: c.objeto, escala: e1 } },
    ];
    const correcta = opciones[grande ? 1 : 0];
    return {
      enunciado,
      instruccion: grande ? 'Busca el grande' : 'Busca el pequeño',
      ilustracion: c.objeto,
      datos: { opciones: 2 },
      respuesta: correcta.id,
      distractores: [grande ? 'pequeno' : 'grande'],
      interaccion: { tipo: 'figuras', opciones: rng.barajar(opciones) },
      pistas: [grande ? 'Mira cuál ocupa más espacio.' : 'Mira cuál ocupa menos espacio.', { tipo: 'figuras', figuras: [correcta] }, `Es ${el(c)} ${c.uno} ${palabra}.`],
      explicacion: `${may(el(c))} ${correcta.etiqueta} es ${el(c)} más ${palabra}.`,
    };
  },
};

// Cosas que se comparan por su altura: árboles, matas, torres, velas, botellas y lápices.
type Alta = { s: string; p: string; f: boolean; /** Dónde están («del vivero»); '' = sin lugar. */ de: string[]; figura: (alto: number) => Figura };
const porEscala = (objeto: Objeto) => (alto: number): Figura => ({ objeto, escala: alto });
const parada = (c: CosaAlta) => (alto: number): Figura => ({ cosa: c, alto });
const ALTAS: Alta[] = [
  { s: 'torre de cajas', p: 'torres de cajas', f: true, de: ['', ' de la bodega', ' de la tienda'], figura: (alto) => ({ torre: Math.round(alto * 6) }) },
  { s: 'árbol', p: 'árboles', f: false, de: ['', ' de la finca', ' del potrero', ' junto al río'], figura: porEscala('arbol') },
  { s: 'mata', p: 'matas', f: true, de: ['', ' del vivero', ' de la huerta'], figura: porEscala('mata') },
  { s: 'árbol de cacao', p: 'árboles de cacao', f: false, de: ['', ' del cacaotal'], figura: porEscala('arbol-cacao') },
  { s: 'árbol de naranja', p: 'árboles de naranja', f: false, de: ['', ' de la finca'], figura: porEscala('arbol-naranja') },
  { s: 'árbol de aguacate', p: 'árboles de aguacate', f: false, de: ['', ' de la finca'], figura: porEscala('arbol-aguacate') },
  { s: 'árbol de mandarina', p: 'árboles de mandarina', f: false, de: ['', ' del patio'], figura: porEscala('arbol-mandarina') },
  { s: 'árbol de limón', p: 'árboles de limón', f: false, de: ['', ' de la huerta'], figura: porEscala('arbol-limon') },
  { s: 'mata de café', p: 'matas de café', f: true, de: ['', ' del cafetal', ' del vivero'], figura: porEscala('arbol-cafe') },
  { s: 'mata de plátano', p: 'matas de plátano', f: true, de: ['', ' de la finca'], figura: porEscala('platanera') },
  { s: 'vela', p: 'velas', f: true, de: ['', ' de la mesa', ' del cumpleaños'], figura: parada('vela') },
  { s: 'botella', p: 'botellas', f: true, de: ['', ' de la tienda', ' de la cocina'], figura: parada('botella') },
  { s: 'lápiz', p: 'lápices', f: false, de: ['', ' del salón', ' de la cartuchera'], figura: parada('lapiz') },
];
/** Juegos de alturas muy distintas (de menor a mayor). Las torres usan 1 a 6 cajas. */
const ALTURAS = [
  [0.4, 0.7, 1],
  [0.42, 0.7, 0.98],
  [0.45, 0.72, 1],
  [0.4, 0.68, 0.95],
];
const ALTURAS_TORRE = [
  [1 / 6, 3 / 6, 5 / 6],
  [1 / 6, 3 / 6, 1],
  [2 / 6, 4 / 6, 1],
];
const alturas = (rng: Rng, a: Alta) => rng.elegir(a.s.startsWith('torre') ? ALTURAS_TORRE : ALTURAS);
/** «alta», «bajo», «mediana»… según el género. */
const adjAlto = (f: boolean, k: 0 | 1 | 2) => [f ? 'baja' : 'bajo', f ? 'mediana' : 'mediano', f ? 'alta' : 'alto'][k];
/** Dónde está el lazo. */
const LAZOS = ['', ' de la mula', ' del corral', ' del columpio', ' de la cerca', ' de tender la ropa', ' del ternero'];

const altoLargo: Plantilla = {
  id: 'in-alto-largo',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Alto y bajo, largo y corto: dos cosas, tocar la que se pide',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const mayor = rng.azar(0.5);
    let medidas: { figura: Figura; etiqueta: string }[];
    let que: string;
    let palabra: string;
    let f: boolean;
    let pista1: string;
    let lugar: string;
    if (rng.azar(0.7)) {
      const a = rng.elegir(ALTAS);
      f = a.f;
      const h = alturas(rng, a);
      medidas = [
        { figura: a.figura(h[0]), etiqueta: `${a.s} ${adjAlto(f, 0)}` },
        { figura: a.figura(h[2]), etiqueta: `${a.s} ${adjAlto(f, 2)}` },
      ];
      palabra = adjAlto(f, mayor ? 2 : 0);
      que = `${a.s} más ${palabra}`;
      lugar = rng.elegir(a.de);
      pista1 = a.s.startsWith('torre') ? 'Mira hasta dónde llega cada torre.' : 'Mira hasta dónde llega cada uno, desde el suelo.';
    } else {
      f = false;
      const [l0, l1] = rng.elegir([
        [0.35, 1],
        [0.3, 0.9],
        [0.4, 1],
      ]);
      medidas = [
        { figura: { lazo: l0 }, etiqueta: 'lazo corto' },
        { figura: { lazo: l1 }, etiqueta: 'lazo largo' },
      ];
      palabra = mayor ? 'largo' : 'corto';
      que = `lazo más ${palabra}`;
      lugar = rng.elegir(LAZOS);
      pista1 = 'Pasa el dedo por cada lazo, de una punta a la otra.';
    }
    const art = f ? 'la' : 'el';
    const enunciado = rng.elegir([
      () => `Toca ${art} ${que}${lugar}.`,
      () => `Busca ${art} ${que}${lugar}.`,
      () => `¿Cuál es ${art} ${que}${lugar}? Tóca${f ? 'la' : 'lo'}.`,
    ])();
    const correcta = mayor ? 1 : 0;
    const opciones = medidas.map((m, k) => ({ id: `m${k}`, etiqueta: m.etiqueta, figura: m.figura }));
    return {
      enunciado,
      instruccion: 'Compara y toca',
      datos: { opciones: 2 },
      respuesta: `m${correcta}`,
      distractores: [`m${1 - correcta}`],
      interaccion: { tipo: 'figuras', opciones: rng.barajar(opciones) },
      pistas: [pista1, { tipo: 'figuras', figuras: [opciones[correcta]] }, `Busca ${art} más ${palabra}.`],
      explicacion: `La respuesta es: ${medidas[correcta].etiqueta}.`,
    };
  },
};

const clasificar: Plantilla = {
  id: 'in-clasificar',
  dimension: 'procedimiento',
  operacion: 'mixta',
  descripcion: 'Cada uno en su canasta: 4 figuras en 2 canastas, primero por color y después por forma',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const porColor = avance(ctx) < 0.5;
    // «Pon … en la canasta» o «Lleva … a la canasta».
    const [verbo, en] = rng.elegir([
      ['Pon', 'en'],
      ['Lleva', 'a'],
    ]);
    // Dos a cada canasta.
    const destinos = rng.barajar([0, 0, 1, 1]);
    let items: OpcionFigura[];
    let grupos: [OpcionFigura, OpcionFigura];
    let enunciado: string;
    let regla: string;
    if (porColor) {
      const cs = dosDistintos(rng, COLORES, PARECIDOS_C);
      const [c0, c1] = cs;
      // Todas de la misma forma: solo cambia el color.
      const forma = rng.elegir(FORMAS_F);
      items = destinos.map((g, k) => ({ id: `f${k}`, etiqueta: nombreFigura(forma, cs[g]), figura: { forma, color: cs[g] } }));
      grupos = [0, 1].map((g) => ({ id: `g${g}`, etiqueta: `Canasta ${COLOR_F[cs[g]].f}`, figura: { forma: 'circulo', color: cs[g] } as Figura })) as [OpcionFigura, OpcionFigura];
      const p = FORMA_N[forma];
      enunciado = `${verbo} cada ${p.s} ${en} la canasta de su color: ${p.f ? 'las' : 'los'} ${p.f ? COLOR_F[c0].fp : COLOR_F[c0].mp} ${en} la canasta ${COLOR_F[c0].f} y ${p.f ? 'las' : 'los'} ${p.f ? COLOR_F[c1].fp : COLOR_F[c1].mp} ${en} la canasta ${COLOR_F[c1].f}.`;
      regla = 'Mira el color de cada figura.';
    } else {
      const fs = dosDistintos(rng, FORMAS_F, PARECIDAS_F);
      // Todas del mismo color: solo cambia la forma.
      const color = rng.elegir(COLORES);
      items = destinos.map((g, k) => ({ id: `f${k}`, etiqueta: nombreFigura(fs[g], color), figura: { forma: fs[g], color } }));
      grupos = [0, 1].map((g) => ({ id: `g${g}`, etiqueta: `Canasta de ${FORMA_N[fs[g]].p}`, figura: { forma: fs[g] } as Figura })) as [OpcionFigura, OpcionFigura];
      const juntos = (f: FormaFigura) => `${FORMA_N[f].f ? 'las' : 'los'} ${FORMA_N[f].p} ${en} la canasta de ${FORMA_N[f].p}`;
      enunciado = `${verbo} cada figura ${en} la canasta de su forma: ${juntos(fs[0])} y ${juntos(fs[1])}.`;
      regla = 'Mira la forma de cada figura.';
    }
    const rasgo = porColor ? 'el color' : 'la forma';
    return {
      enunciado,
      instruccion: 'Toca una figura y luego su canasta',
      datos: { cantidad: 4 },
      respuesta: destinos.join(','),
      respuestaTexto: `cada una en la canasta que le toca según ${rasgo}`,
      distractores: [],
      interaccion: { tipo: 'clasificar', items, grupos },
      pistas: [regla, { tipo: 'figuras', figuras: grupos }, 'Las que se parecen van juntas en la misma canasta.'],
      explicacion: `Las que tienen ${rasgo === 'el color' ? 'el mismo color' : 'la misma forma'} van juntas en la misma canasta.`,
    };
  },
};

const ordenar: Plantilla = {
  id: 'in-ordenar',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Del más pequeño al más grande: ordenar 3 cosas muy distintas en altura o tamaño',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const ids = ['p', 'm', 'g'];
    let etiquetas: string[];
    let figuras: Figura[];
    let primero: string;
    let ultimo: string;
    let cosas: string;
    let de = '';
    if (rng.azar(0.6)) {
      const a = rng.elegir(ALTAS);
      const h = alturas(rng, a);
      etiquetas = [0, 1, 2].map((k) => `${a.s} ${adjAlto(a.f, k as 0 | 1 | 2)}`);
      figuras = h.map((x) => a.figura(x));
      primero = `${a.f ? 'la' : 'el'} más ${adjAlto(a.f, 0)}`;
      ultimo = `${a.f ? 'la' : 'el'} más ${adjAlto(a.f, 2)}`;
      cosas = `${a.f ? 'las' : 'los'} ${a.p}`;
      de = rng.elegir(a.de);
    } else {
      const c = rng.elegir(TAMANOS);
      const escalas = rng.elegir([
        [0.42, 0.7, 1],
        [0.45, 0.72, 1],
        [0.4, 0.68, 0.95],
        [0.45, 0.7, 0.98],
        [0.4, 0.66, 0.92],
      ]);
      etiquetas = [`${c.uno} ${pequeno(c)}`, `${c.uno} ${c.f ? 'mediana' : 'mediano'}`, `${c.uno} grande`];
      figuras = escalas.map((e) => ({ objeto: c.objeto, escala: e }));
      primero = `${el(c)} más ${pequeno(c)}`;
      ultimo = `${el(c)} más grande`;
      cosas = `${los(c)} ${c.varios}`;
      de = rng.azar(0.5) ? ` ${rng.elegir(c.donde)}` : '';
    }
    const items = figuras.map((figura, k) => ({ id: ids[k], etiqueta: etiquetas[k], figura }));
    // Que no aparezcan ya ordenados.
    let vista = rng.barajar(items);
    if (vista.map((x) => x.id).join() === 'p,m,g') vista = [items[1], items[2], items[0]];
    const como = `primero ${primero} y al final ${ultimo}`;
    const enunciado = rng.elegir([() => `Ordena ${cosas}${de}: ${como}.`, () => `Toca ${cosas}${de} en orden: ${como}.`])();
    return {
      enunciado,
      instruccion: 'Del más pequeño al más grande',
      datos: { cantidad: 3 },
      respuesta: ids.join('|'),
      respuestaTexto: `${etiquetas[0]}, luego ${etiquetas[1]} y al final ${etiquetas[2]}`,
      distractores: [],
      interaccion: { tipo: 'ordenar', items: vista },
      pistas: [`Busca primero ${primero}.`, { tipo: 'figuras', figuras: items }, 'Después, el del medio. Al final, el que queda.'],
      explicacion: `El orden es: ${etiquetas.join(', ')}.`,
    };
  },
};

// =====================================================================
// Bloque 3 · ¿Cuántos hay? (sin contar)
// =====================================================================

/** Dos canastas que se tocan: la primera y la segunda (en ese orden en pantalla). */
function dosCanastas(c: Cosa, a: number, b: number): OpcionFigura[] {
  return [
    { id: 'a', etiqueta: 'primera canasta', figura: { objeto: c.objeto, cantidad: a } },
    { id: 'b', etiqueta: 'segunda canasta', figura: { objeto: c.objeto, cantidad: b } },
  ];
}

/** Dónde están las canastas (a veces no se dice). */
const LUGARES_CANASTA = ['en la cocina', 'en la tienda', 'en el mercado', 'en la escuela', 'en el patio', 'en la huerta', 'en la feria', 'en el corredor'];
const lugarCanasta = (rng: Rng) => (rng.azar(0.5) ? `${may(rng.elegir(LUGARES_CANASTA))}, ` : '');
/** Primera letra en minúscula (después de «En la cocina, …»). */
const minuscula = (t: string) => t.replace(/^([¿¡]?)(\p{L})/u, (_, signo: string, letra: string) => signo + letra.toLowerCase());

/** Cómo se pide la canasta: tres redacciones con la misma forma. */
function pedirCanasta(rng: Rng, busca: string): string {
  const lugar = lugarCanasta(rng);
  const pide = rng.elegir([() => `Toca ${busca}.`, () => `Busca ${busca}.`, () => `Ayuda a ${nino(rng)} a encontrar ${busca}.`])();
  return lugar ? `${lugar}${minuscula(pide)}` : pide;
}

const unoMuchos: Plantilla = {
  id: 'in-uno-muchos',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Uno y muchos: dos canastas (1 y de 6 a 9), tocar la que se pide',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const c = rng.elegir(EN_CANASTA);
    const muchos = rng.entero(6, 9);
    const pideUno = rng.azar(0.5);
    const unoPrimero = rng.azar(0.5);
    const opciones = dosCanastas(c, unoPrimero ? 1 : muchos, unoPrimero ? muchos : 1);
    const respuesta = pideUno === unoPrimero ? 'a' : 'b';
    const muchas = c.f ? 'muchas' : 'muchos';
    const busca = pideUno ? `la canasta con ${c.f ? 'una sola' : 'un solo'} ${c.uno}` : `la canasta con ${muchas} ${c.varios}`;
    const correcta = opciones.find((o) => o.id === respuesta)!;
    return {
      enunciado: pedirCanasta(rng, busca),
      instruccion: pideUno ? 'Busca uno' : 'Busca muchos',
      ilustracion: c.objeto,
      datos: { muchos },
      respuesta,
      distractores: [respuesta === 'a' ? 'b' : 'a'],
      interaccion: { tipo: 'figuras', opciones },
      pistas: [
        pideUno ? `Uno es ${c.f ? 'una sola' : 'un solo'} ${c.uno}.` : 'Muchos es la canasta casi llena.',
        { tipo: 'figuras', figuras: [correcta] },
        'Mira adentro de cada canasta.',
      ],
      explicacion: pideUno ? `Esa canasta tiene ${c.f ? 'una sola' : 'un solo'} ${c.uno}.` : `Esa canasta tiene ${muchas} ${c.varios}.`,
    };
  },
};

const vacia: Plantilla = {
  id: 'in-vacia',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Nada: dos canastas (vacía y con algunos), tocar la que se pide',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const c = rng.elegir(EN_CANASTA);
    const algunos = rng.entero(2, 5);
    const pideVacia = rng.azar(0.7);
    const vaciaPrimero = rng.azar(0.5);
    const opciones = dosCanastas(c, vaciaPrimero ? 0 : algunos, vaciaPrimero ? algunos : 0);
    const respuesta = pideVacia === vaciaPrimero ? 'a' : 'b';
    const busca = pideVacia
      ? rng.elegir([`la canasta vacía, sin ${c.varios}`, `la canasta que no tiene ${c.f ? 'ninguna' : 'ningún'} ${c.uno}`])
      : `la canasta que tiene ${c.varios}`;
    const correcta = opciones.find((o) => o.id === respuesta)!;
    return {
      enunciado: pedirCanasta(rng, busca),
      instruccion: pideVacia ? 'Busca la vacía' : 'Busca la que tiene',
      ilustracion: c.objeto,
      datos: { algunos },
      respuesta,
      distractores: [respuesta === 'a' ? 'b' : 'a'],
      interaccion: { tipo: 'figuras', opciones },
      pistas: [pideVacia ? 'Vacía es sin nada adentro.' : 'Busca la canasta que tiene algo adentro.', { tipo: 'figuras', figuras: [correcta] }, 'Mira adentro de cada canasta.'],
      explicacion: pideVacia ? `Esa canasta está vacía: no tiene ${c.f ? 'ninguna' : 'ningún'} ${c.uno}.` : `Esa canasta tiene ${c.varios}; la otra está vacía.`,
    };
  },
};

/** Cantidades muy distintas para comparar sin contar. */
const PARES_LEJOS: [number, number][] = [
  [1, 5],
  [1, 6],
  [2, 6],
  [1, 4],
  [2, 7],
  [1, 7],
  [3, 8],
  [2, 8],
  [1, 8],
  [3, 9],
  [2, 9],
];

const mas: Plantilla = {
  id: 'in-mas',
  dimension: 'procedimiento',
  operacion: 'mixta',
  descripcion: '¿Dónde hay más? Y luego ¿dónde hay menos? Dos canastas con mucha diferencia',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const c = rng.elegir(EN_CANASTA);
    const par = rng.elegir(PARES_LEJOS);
    const [a, b] = rng.azar(0.5) ? par : [par[1], par[0]];
    // Primera mitad: «más»; segunda mitad: «menos».
    const masQ = avance(ctx) < 0.5;
    const palabra = masQ ? 'más' : 'menos';
    const respuesta = masQ === a > b ? 'a' : 'b';
    const opciones = dosCanastas(c, a, b);
    const lugar = lugarCanasta(rng);
    const pide = rng.elegir([
      () => `¿Dónde hay ${palabra} ${c.varios}? Toca esa canasta.`,
      () => `Toca la canasta con ${palabra} ${c.varios}.`,
      () => `Ayuda a ${nino(rng)} a encontrar la canasta con ${palabra} ${c.varios}.`,
    ])();
    const enunciado = lugar ? `${lugar}${minuscula(pide)}` : pide;
    return {
      enunciado,
      instruccion: masQ ? 'Busca dónde hay más' : 'Busca dónde hay menos',
      ilustracion: c.objeto,
      datos: { a, b },
      respuesta,
      distractores: [respuesta === 'a' ? 'b' : 'a'],
      interaccion: { tipo: 'figuras', opciones },
      pistas: [
        masQ ? 'Mira cuál canasta está más llena.' : 'Mira cuál canasta tiene poquitos.',
        { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] },
        masQ ? 'La canasta más llena tiene más.' : 'La canasta con poquitos tiene menos.',
      ],
      explicacion: `La ${a > b ? 'primera' : 'segunda'} canasta tiene más y la ${a > b ? 'segunda' : 'primera'} tiene menos.`,
    };
  },
};

const igualCantidad: Plantilla = {
  id: 'in-igual-cantidad',
  dimension: 'procedimiento',
  operacion: 'mixta',
  descripcion: 'Igual de muchos: tocar la canasta que tiene tantos como el modelo (hasta 4)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const c = rng.elegir(EN_CANASTA);
    const n = rng.entero(1, 4);
    // Al principio la otra canasta se ve muy distinta; después, solo uno de diferencia.
    const lejos = [1, 2, 3, 4].filter((x) => Math.abs(x - n) >= 2);
    const m = avance(ctx) < 0.5 && lejos.length ? rng.elegir(lejos) : rng.elegir([n - 1, n + 1].filter((x) => x >= 1 && x <= 4));
    const igualPrimero = rng.azar(0.5);
    const opciones = dosCanastas(c, igualPrimero ? n : m, igualPrimero ? m : n);
    const respuesta = igualPrimero ? 'a' : 'b';
    const tantas = c.f ? 'tantas' : 'tantos';
    const lugar = lugarCanasta(rng);
    const pide = rng.elegir([
      () => `Toca la canasta que tiene ${tantas} ${c.varios} como la de arriba.`,
      () => `¿Qué canasta tiene igual cantidad de ${c.varios} que la de arriba? Tócala.`,
      () => `Ayuda a ${nino(rng)} a buscar la canasta con ${tantas} ${c.varios} como la de arriba.`,
    ])();
    const enunciado = lugar ? `${lugar}${minuscula(pide)}` : pide;
    return {
      enunciado,
      instruccion: 'Busca igual',
      ilustracion: c.objeto,
      datos: { n, m },
      respuesta,
      distractores: [respuesta === 'a' ? 'b' : 'a'],
      interaccion: { tipo: 'figuras', opciones, modelo: { objeto: c.objeto, cantidad: n } },
      pistas: [
        `Haz parejas: ${un(c)} ${c.uno} de arriba con ${c.f ? 'una' : 'uno'} de abajo.`,
        { tipo: 'objetos', objeto: c.objeto, grupos: [n, n] },
        'Si a todos les toca pareja y no sobra ninguno, es igual.',
      ],
      explicacion: `Esa canasta tiene igual cantidad que la de arriba: a cada ${c.uno} le toca pareja.`,
    };
  },
};

// =====================================================================
// Bloques 4 a 6 · Los números del 1 al 10
// =====================================================================

/** Cuántas opciones y qué tan lejos: `opciones` fijo, o «mixto» (2 lejanas y luego 3). */
function cuantasOpciones(ctx: ContextoGeneracion): { cantidad: number; sep: number } {
  if (pb(ctx, 'mixto')) return avance(ctx) < 0.5 ? { cantidad: 2, sep: 2 } : { cantidad: 3, sep: 1 };
  return { cantidad: pn(ctx, 'opciones', 2), sep: 1 };
}

const contar: Plantilla = {
  id: 'in-contar',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Contar tocando: cada toque dice el número',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const min = pn(ctx, 'min', 1);
    const max = pn(ctx, 'max', 3);
    const n = rng.entero(Math.max(min, Math.min(max, min + Math.floor(avance(ctx) * (max - min) * 0.6))), max);
    const c = rng.elegir(COSAS);
    const lugar = rng.elegir(c.donde);
    const { cantidad, sep } = cuantasOpciones(ctx);
    const distr = cercanos(rng, n, cantidad - 1, Math.max(1, min - 1), Math.min(10, max + 1), sep);
    const opciones = opcionesCon(rng, n, distr);
    const enunciado = rng.elegir([
      () => `${may(lugar)} hay ${c.varios}. Toca cada ${c.uno} y cuenta. ¿${cuantas(c)} hay?`,
      () => `¿${cuantas(c)} ${c.varios} hay ${lugar}? Toca cada ${c.uno} una vez.`,
      () => `Ayuda a ${nino(rng)} a contar ${los(c)} ${c.varios} ${lugar}. Toca cada ${c.uno} una vez.`,
    ])();
    return {
      enunciado,
      instruccion: 'Toca y cuenta',
      ilustracion: c.objeto,
      datos: { n },
      respuesta: n,
      unidad: c.varios,
      distractores: distr,
      interaccion: { tipo: 'contar', objeto: c.objeto, cantidad: n, opciones },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Toca despacio, uno por uno.', { tipo: 'objetos', objeto: c.objeto, grupos: [n] }, 'El último número que dices es cuántos hay.'],
      explicacion: `Contamos ${conteo(n)}. Hay ${n} ${nombre(c, n)}.`,
    };
  },
};

/** Dónde se tira el dado: la situación cambia, la pregunta es siempre la misma. */
const DADOS: ((rng: Rng) => string)[] = [
  (rng) => `En el recreo, ${nino(rng)} tira el dado.`,
  (rng) => `La abuela juega parqués con ${nino(rng)}. Sale este dado.`,
  (rng) => `${nino(rng)} juega con su hermano en el corredor de la casa.`,
  () => 'En la clase, la profe muestra un dado.',
  (rng) => `${nino(rng)} y sus primos juegan en el patio.`,
  () => 'En la fiesta de la vereda juegan con un dado grande.',
  (rng) => `${nino(rng)} tiró el dado sobre la mesa.`,
  () => 'El abuelo saca un dado de la caja de juegos.',
  (rng) => `En la escuela, ${nino(rng)} juega a la carrera de caballos.`,
  () => 'Los niños juegan con un dado en el salón.',
  (rng) => `${nino(rng)} tira el dado en la casa de la tía.`,
  () => 'En la tienda de la vereda, dos niños juegan con un dado.',
  (rng) => `${nino(rng)} juega a la escalera con su abuelo.`,
  () => 'En la huerta escolar, los niños descansan y juegan con un dado.',
  (rng) => `Llueve y ${nino(rng)} juega con un dado en la cocina.`,
  () => 'La profe tira el dado para escoger una canción.',
  (rng) => `${nino(rng)} juega con su mamá después del almuerzo.`,
  () => 'En el corredor de la escuela hay un dado de cartón.',
];

const dado: Plantilla = {
  id: 'in-dado',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Puntos como en el dado: ver la cantidad sin contar uno por uno',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 3);
    const n = rng.entero(1, max);
    const cantidad = pn(ctx, 'opciones', 2);
    const distr = cercanos(rng, n, cantidad - 1, 1, max);
    const pregunta = rng.elegir(['¿Cuántos puntos tiene el dado?', '¿Cuántos puntos salieron?', 'Toca el número de puntos del dado.']);
    const cara: OpcionFigura = { id: 'dado', etiqueta: `dado con ${palabraNumero(n)} ${v(n, 'punto', 'puntos')}`, figura: { dado: n } };
    return {
      enunciado: `${rng.elegir(DADOS)(rng)} ${pregunta}`,
      instruccion: 'Mira el dado',
      dibujo: { tipo: 'figuras', figuras: [cara] },
      datos: { n },
      respuesta: n,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: opcionesCon(rng, n, distr) },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Pon el dedo en cada punto.', { tipo: 'figuras', figuras: [cara] }, n === 1 ? 'Hay un solo punto: es el 1.' : `Cuenta los puntos: ${conteo(n)}.`],
      explicacion: `El dado tiene ${n} ${v(n, 'punto', 'puntos')}.`,
    };
  },
};

const emparejar: Plantilla = {
  id: 'in-emparejar',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Este número, estos dibujos: tocar el grupo que tiene esa cantidad',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 3);
    const n = rng.entero(1, max);
    const c = rng.elegir(COSAS);
    // Hasta 3, dos grupos; hasta 5, tres grupos.
    const grupos = max <= 3 ? 2 : 3;
    const otros = cercanos(rng, n, grupos - 1, 1, max, max <= 3 ? 1 : 2);
    const opciones = opcionesCon(rng, n, otros);
    const nom = nombre(c, n);
    const enunciado = rng.elegir([
      () => `Toca el grupo que tiene ${n} ${nom}.`,
      () => `¿Dónde hay ${n} ${nom}? Toca ese grupo.`,
      () => `Ayuda a ${nino(rng)} a encontrar ${n} ${nom} ${rng.elegir(c.donde)}.`,
    ])();
    return {
      enunciado,
      instruccion: `Busca el ${n}`,
      ilustracion: c.objeto,
      datos: { n },
      respuesta: n,
      distractores: otros,
      interaccion: { tipo: 'emparejar', objeto: c.objeto, opciones },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Cuenta los dibujos de cada grupo.', { tipo: 'objetos', objeto: c.objeto, grupos: [n] }, `Así se ven ${n}: ${conteo(n)}.`],
      explicacion: `Este grupo tiene ${n}: ${conteo(n)}.`,
    };
  },
};

const numeral: Plantilla = {
  id: 'in-numeral',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Estos dibujos, este número: mirar el grupo y tocar su número',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 3);
    const n = rng.entero(1, max);
    const c = rng.elegir(COSAS);
    const distr = cercanos(rng, n, max <= 3 ? 1 : 2, 1, max);
    const enunciado = rng.elegir([
      () => `Mira ${los(c)} ${c.varios}. ¿Qué número dice cuántos hay?`,
      () => `Mira ${los(c)} ${c.varios} ${rng.elegir(c.donde)}. Toca su número.`,
      () => `${nino(rng)} contó ${los(c)} ${c.varios}. Toca el número que dice cuántos hay.`,
    ])();
    return {
      enunciado,
      instruccion: 'Toca el número',
      dibujo: { tipo: 'objetos', objeto: c.objeto, grupos: [n] },
      datos: { n },
      respuesta: n,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: opcionesCon(rng, n, distr) },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Cuenta los dibujos con el dedo.', { tipo: 'objetos', objeto: c.objeto, grupos: [n] }, 'El último número que dices es el que buscas.'],
      explicacion: `Hay ${n} ${nombre(c, n)}: el número es ${n}.`,
    };
  },
};

const trazar: Plantilla = {
  id: 'in-trazar',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Repasar una cifra con el dedo sobre la guía punteada (y el 10 como un 1 y un 0)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    // El diez se repasa en pareja: primero su 1 o su 0.
    const diez = pb(ctx, 'diez') && rng.azar(0.25);
    const cifra = diez ? rng.elegir([1, 0]) : rng.entero(pn(ctx, 'desde', 1), pn(ctx, 'hasta', 3));
    const x = NOMBRES_CIFRA[cifra];
    const cantidad = diez ? 10 : cifra;
    // La mitad de las veces se escribe el número de algo que se ve: tres naranjas, el tres.
    const c = rng.elegir(COSAS);
    const conCosas = rng.azar(0.5);
    const hay = cantidad === 1 ? `${un(c)} ${c.uno}` : `${palabraNumero(cantidad)} ${c.varios}`;
    let enunciado: string;
    if (diez) {
      enunciado = conCosas
        ? rng.elegir([
            () => `Hay diez ${c.varios}. El diez se escribe con un uno y un cero. Repasa el ${x}.`,
            () => `${may(rng.elegir(c.donde))} hay diez ${c.varios}. El diez tiene un uno y un cero: repasa el ${x}.`,
          ])()
        : rng.elegir([
            () => `El diez se escribe con un uno y un cero. Repasa el ${x} con el dedo.`,
            () => `Vamos a escribir el diez: un uno y un cero. Ahora repasa el ${x}.`,
          ])();
    } else {
      enunciado = conCosas
        ? rng.elegir([
            () => `Hay ${hay}. Escribe el ${x}: sigue los puntitos desde el punto verde.`,
            () => `${nino(rng)} tiene ${hay}. Escribe el ${x} con el dedo.`,
            () => `${may(rng.elegir(c.donde))} hay ${hay}. Repasa el ${x} con el dedo.`,
            () => `Mira: ${hay}. Ayuda a ${nino(rng)} a escribir el ${x}.`,
            () => `${may(rng.elegir(c.donde))}, ${nino(rng)} contó ${hay}. Escribe el ${x} con el dedo.`,
          ])()
        : rng.elegir([
            () => `Vamos a escribir el ${x}. Pon el dedo en el punto verde y sigue los puntitos.`,
            () => `Repasa el ${x} con el dedo. Empieza en el punto verde.`,
            () => `Ayuda a ${nino(rng)} a escribir el ${x}. Sigue los puntitos desde el punto verde.`,
            () => `Escribe el ${x} como en el tablero de la escuela. Empieza en el punto verde.`,
            () => `Dibuja el ${x} como en la arena del río. Sigue los puntitos desde el punto verde.`,
            () => `Escribe el ${x} como con un palito en la tierra. Empieza en el punto verde.`,
            () => `${nino(rng)} escribe el ${x} en su cuaderno. Hazlo tú: sigue los puntitos.`,
          ])();
    }
    return {
      enunciado,
      instruccion: 'Repasa con el dedo',
      dibujo: conCosas && cantidad > 0 ? { tipo: 'objetos', objeto: c.objeto, grupos: [cantidad] } : undefined,
      datos: { cifra, cantidad },
      respuesta: cifra,
      distractores: [],
      interaccion: { tipo: 'trazar', cifra },
      calculo: { op: 'otra', a: cifra, b: 0 },
      pistas: ['Empieza en el punto verde.', { tipo: 'texto', texto: COMO_SE_ESCRIBE[cifra] }, 'Ve despacio, sin levantar el dedo.'],
      explicacion: diez ? `${COMO_SE_ESCRIBE[cifra]} El diez se escribe con un 1 y un 0: 10.` : COMO_SE_ESCRIBE[cifra],
    };
  },
};

/** Qué se pone y dónde: el recipiente se nombra y se dibuja. */
type Poner = { c: Objeto; en: string; recipiente: Recipiente };
const PONER: Poner[] = [
  { c: 'huevo', en: 'la cubeta', recipiente: { nombre: 'Cubeta', dibujo: 'cubeta' } },
  { c: 'huevo', en: 'la canasta', recipiente: { nombre: 'Canasta', dibujo: 'canasta' } },
  { c: 'naranja', en: 'la canasta', recipiente: { nombre: 'Canasta', dibujo: 'canasta' } },
  { c: 'naranja', en: 'la bolsa', recipiente: { nombre: 'Bolsa', dibujo: 'bolsa' } },
  { c: 'naranja', en: 'la caja', recipiente: { nombre: 'Caja', dibujo: 'caja' } },
  { c: 'mandarina', en: 'la canasta', recipiente: { nombre: 'Canasta', dibujo: 'canasta' } },
  { c: 'mandarina', en: 'la caja', recipiente: { nombre: 'Caja', dibujo: 'caja' } },
  { c: 'aguacate', en: 'la canasta', recipiente: { nombre: 'Canasta', dibujo: 'canasta' } },
  { c: 'aguacate', en: 'la caja', recipiente: { nombre: 'Caja', dibujo: 'caja' } },
  { c: 'limon', en: 'la bolsa', recipiente: { nombre: 'Bolsa', dibujo: 'bolsa' } },
  { c: 'limon', en: 'la canasta', recipiente: { nombre: 'Canasta', dibujo: 'canasta' } },
  { c: 'mazorca', en: 'el canasto', recipiente: { nombre: 'Canasto', dibujo: 'canasta' } },
  { c: 'platano', en: 'la canasta', recipiente: { nombre: 'Canasta', dibujo: 'canasta' } },
  { c: 'platano', en: 'la caja', recipiente: { nombre: 'Caja', dibujo: 'caja' } },
  { c: 'arepa', en: 'la mesa', recipiente: { nombre: 'Mesa', dibujo: 'mesa' } },
  { c: 'arepa', en: 'la canasta', recipiente: { nombre: 'Canasta', dibujo: 'canasta' } },
  { c: 'pan', en: 'la bolsa', recipiente: { nombre: 'Bolsa', dibujo: 'bolsa' } },
  { c: 'pan', en: 'la mesa', recipiente: { nombre: 'Mesa', dibujo: 'mesa' } },
  { c: 'semilla', en: 'la bolsa', recipiente: { nombre: 'Bolsa', dibujo: 'bolsa' } },
  { c: 'moneda', en: 'la alcancía', recipiente: { nombre: 'Alcancía' } },
  { c: 'cafe', en: 'la canasta', recipiente: { nombre: 'Canasta', dibujo: 'canasta' } },
  { c: 'gallina', en: 'el gallinero', recipiente: { nombre: 'Gallinero' } },
  { c: 'mata', en: 'la caja', recipiente: { nombre: 'Caja', dibujo: 'caja' } },
  { c: 'caja', en: 'la mesa', recipiente: { nombre: 'Mesa', dibujo: 'mesa' } },
  { c: 'bulto', en: 'la bodega', recipiente: { nombre: 'Bodega' } },
];

const poner: Plantilla = {
  id: 'in-poner',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Poner una cantidad en la canasta tocando uno por uno',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 3);
    const n = rng.entero(Math.max(1, Math.round(avance(ctx) * (max - 1) * 0.5)), max);
    const p = rng.elegir(PONER);
    const c = cosa(p.c);
    const cosas = `${n} ${nombre(c, n)}`;
    const unoPorUno = c.f ? 'una por una' : 'uno por uno';
    const enunciado = rng.elegir([
      () => `Pon ${cosas} en ${p.en}. Toca ${unoPorUno} y cuenta.`,
      () => `${nino(rng)} necesita ${cosas} en ${p.en}. Pon${n === 1 ? lo(c) : `${lo(c)}s`} tocando ${unoPorUno}.`,
      () => `Lleva ${cosas} a ${p.en}. Cuenta cada vez que tocas.`,
    ])();
    return {
      enunciado,
      instruccion: `Pon ${n}`,
      ilustracion: c.objeto,
      datos: { n, disponibles: n + 2 },
      respuesta: n,
      unidad: c.varios,
      distractores: [],
      interaccion: { tipo: 'poner', objeto: c.objeto, cantidad: n, disponibles: n + 2, recipiente: p.recipiente },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Cuenta en voz alta cada vez que tocas.', { tipo: 'objetos', objeto: c.objeto, grupos: [n] }, `Cuando digas ${n}, ya está.`],
      explicacion: `Pusiste ${conteo(n)}: son ${n} ${nombre(c, n)}.`,
    };
  },
};

/** Lo que se pone en el marco de 10: una cosa de la finca o fichas. */
function delMarco(rng: Rng): { c: Cosa | null; varios: string; uno: string; f: boolean; donde: string } {
  if (rng.azar(0.2)) return { c: null, varios: 'fichas', uno: 'ficha', f: true, donde: rng.elegir(['en el salón', 'en la escuela', 'en la mesa', 'en la casa']) };
  const c = rng.elegir(EN_CANASTA);
  return { c, varios: c.varios, uno: c.uno, f: c.f, donde: rng.elegir(c.donde) };
}

const marco: Plantilla = {
  id: 'in-marco',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Llenar el marco de 10 hasta la cantidad pedida',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    // Primero hasta 5 (una fila) y luego del 6 al 10.
    const n = avance(ctx) < 0.5 ? rng.entero(1, 5) : rng.entero(6, 10);
    const m = delMarco(rng);
    const cosas = `${n} ${n === 1 ? m.uno : m.varios}`;
    const enunciado = rng.elegir([
      () => `Llena el marco con ${cosas}: toca ${n} ${v(n, 'casilla', 'casillas')}.`,
      () => `Pon ${cosas} en el marco de diez. Cuenta cada vez que tocas.`,
      () => `${may(m.donde)}, ayuda a ${nino(rng)} a poner ${cosas} en el marco.`,
    ])();
    const figura: Figura = m.c ? { marco: n, objeto: m.c.objeto } : { marco: n };
    return {
      enunciado,
      instruccion: `Llena ${n}`,
      ...(m.c ? { ilustracion: m.c.objeto } : {}),
      datos: { n },
      respuesta: n,
      distractores: [],
      interaccion: m.c ? { tipo: 'marco', cantidad: n, objeto: m.c.objeto } : { tipo: 'marco', cantidad: n },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: [
        'Llena primero la fila de arriba.',
        { tipo: 'figuras', figuras: [{ id: 'marco', etiqueta: `marco con ${cosas}`, figura }] },
        n > 5 ? `Una fila llena son 5. Luego ${n - 5} más en la fila de abajo.` : `Toca ${n} ${v(n, 'casilla', 'casillas')} y para.`,
      ],
      explicacion: n > 5 ? `5 arriba y ${n - 5} abajo: son ${n}.` : `Contamos ${conteo(n)}: son ${n}.`,
    };
  },
};

const leerMarco: Plantilla = {
  id: 'in-leer-marco',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: '¿Cuántos hay en el marco de 10? Mirar y tocar el número (3 opciones)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const a = avance(ctx);
    const n = rng.entero(Math.round(1 + 4 * a), Math.round(6 + 4 * a));
    const m = delMarco(rng);
    const distr = cercanos(rng, n, 2, 1, 10, a < 0.5 ? 2 : 1);
    const cuantos = m.f ? 'Cuántas' : 'Cuántos';
    const enunciado = rng.elegir([
      () => `¿${cuantos} ${m.varios} hay en el marco?`,
      () => `Mira el marco de diez. ¿${cuantos} ${m.varios} tiene?`,
      () => `${may(m.donde)}, ${nino(rng)} puso ${m.varios} en el marco. ¿${cuantos} hay?`,
    ])();
    const figura: Figura = m.c ? { marco: n, objeto: m.c.objeto } : { marco: n };
    const dibujo: Visual = { tipo: 'figuras', figuras: [{ id: 'marco', etiqueta: `marco de diez con ${m.varios}`, figura }] };
    return {
      enunciado,
      instruccion: 'Mira el marco',
      dibujo,
      datos: { n },
      respuesta: n,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: opcionesCon(rng, n, distr) },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Una fila llena son 5.', dibujo, n > 5 ? `5 arriba y ${n - 5} abajo: son ${n}.` : n === 5 ? 'La fila de arriba está llena: son 5.' : `Cuenta: ${conteo(n)}.`],
      explicacion: `En el marco hay ${n} ${n === 1 ? m.uno : m.varios}.`,
    };
  },
};

const sigue: Plantilla = {
  id: 'in-sigue',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: '¿Qué número sigue? Contar hacia adelante dentro del 1 al 10, con dibujos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const largo = avance(ctx) < 0.5 ? 3 : 4;
    const inicio = rng.entero(1, 10 - largo + 1);
    const numeros = Array.from({ length: largo }, (_, k) => inicio + k);
    const respuesta = numeros[largo - 1];
    const antes = respuesta - 1;
    const fila = numeros.map((x, k) => (k === largo - 1 ? '__' : String(x))).join(', ');
    const distr = cercanos(rng, respuesta, 2, 1, 10, 1, numeros);
    const c = rng.elegir(COSAS);
    const lugar = rng.elegir(c.donde);
    const enunciado = rng.elegir([
      () => `${nino(rng)} cuenta ${los(c)} ${c.varios}: ${fila}. ¿Qué número sigue?`,
      () => `Cuenta ${los(c)} ${c.varios} ${lugar}: ${fila}. ¿Qué número sigue?`,
      () => `${may(lugar)} contamos ${c.varios}: ${fila}. ¿Qué número sigue?`,
    ])();
    return {
      enunciado,
      instruccion: 'Qué número sigue',
      dibujo: { tipo: 'objetos', objeto: c.objeto, grupos: [antes], vacios: 1 },
      datos: { inicio, respuesta },
      respuesta,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: opcionesCon(rng, respuesta, distr) },
      calculo: { op: 'suma', a: antes, b: 1 },
      pistas: ['Cuenta en voz alta desde el primero.', { tipo: 'objetos', objeto: c.objeto, grupos: [respuesta] }, `Después del ${antes} viene el ${respuesta}.`],
      explicacion: `${numeros.join(', ')}: después del ${antes} sigue el ${respuesta}.`,
    };
  },
};

// =====================================================================
// Bloques 7 y 8 · Juntar y quitar (hasta 5 y hasta 10)
// =====================================================================

const juntar = envolver('in-juntar', sumaJuntar, 'Juntar dos grupos en la canasta y contar todo (hasta 5 o hasta 10)');
const quitar = envolver('in-quitar', restaQuitar, 'Quitar y contar lo que queda (hasta 5 o hasta 10)');

/** Cuentos cortos: lo que había (a), lo que cambia (b) y la pregunta, en un lugar de la vereda. */
type Escena = { c: Objeto; suma: boolean; texto: (a: number, b: number, quien: string, n: (k: number) => string) => string; pregunta: string };
const ESCENAS: Escena[] = [
  // Juntar
  { c: 'gallina', suma: true, texto: (a, b, _, n) => `En el gallinero había ${a} ${n(a)}. ${v(b, 'Llegó', 'Llegaron')} ${b} más.`, pregunta: 'hay ahora' },
  { c: 'huevo', suma: true, texto: (a, b, q, n) => `${q} recogió ${a} ${n(a)} en el gallinero. Luego encontró ${b} más.`, pregunta: 'tiene ahora' },
  { c: 'mata', suma: true, texto: (a, b, q, n) => `En el vivero había ${a} ${n(a)}. ${q} sembró ${b} más.`, pregunta: 'hay ahora' },
  { c: 'pan', suma: true, texto: (a, b, _, n) => `En la escuela había ${a} ${n(a)}. La profe trajo ${b} más.`, pregunta: 'hay ahora' },
  { c: 'naranja', suma: true, texto: (a, b, _, n) => `En la tienda había ${a} ${n(a)}. ${v(b, 'Llegó', 'Llegaron')} ${b} más.`, pregunta: 'hay ahora' },
  { c: 'mazorca', suma: true, texto: (a, b, q, n) => `${q} cosechó ${a} ${n(a)} en el cacaotal. Luego cosechó ${b} más.`, pregunta: 'tiene ahora' },
  { c: 'semilla', suma: true, texto: (a, b, q, n) => `${q} sembró ${a} ${n(a)} en la huerta. Después sembró ${b} más.`, pregunta: 'sembró en total' },
  { c: 'arepa', suma: true, texto: (a, b, _, n) => `En la cocina había ${a} ${n(a)}. La abuela hizo ${b} más.`, pregunta: 'hay ahora' },
  { c: 'moneda', suma: true, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)} en la alcancía. Guardó ${b} más.`, pregunta: 'tiene ahora' },
  { c: 'mandarina', suma: true, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)}. Su mamá le dio ${b} más.`, pregunta: 'tiene ahora' },
  { c: 'limon', suma: true, texto: (a, b, q, n) => `${q} recogió ${a} ${n(a)} junto al río. Luego recogió ${b} más.`, pregunta: 'tiene ahora' },
  { c: 'aguacate', suma: true, texto: (a, b, _, n) => `Bajo el árbol había ${a} ${n(a)}. ${v(b, 'Cayó', 'Cayeron')} ${b} más.`, pregunta: 'hay ahora' },
  { c: 'platano', suma: true, texto: (a, b, _, n) => `En el mercado había ${a} ${n(a)}. Un señor trajo ${b} más.`, pregunta: 'hay ahora' },
  { c: 'bulto', suma: true, texto: (a, b, _, n) => `En la cooperativa había ${a} ${n(a)}. El camión trajo ${b} más.`, pregunta: 'hay ahora' },
  { c: 'cafe', suma: true, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)} en la mano. Recogió ${b} más.`, pregunta: 'tiene ahora' },
  { c: 'caja', suma: true, texto: (a, b, _, n) => `En la bodega había ${a} ${n(a)}. ${v(b, 'Llegó', 'Llegaron')} ${b} más en la chiva.`, pregunta: 'hay ahora' },
  { c: 'arbol', suma: true, texto: (a, b, _, n) => `Junto al río había ${a} ${n(a)}. Los niños sembraron ${b} más.`, pregunta: 'hay ahora' },
  // Quitar
  { c: 'gallina', suma: false, texto: (a, b, _, n) => `En el gallinero había ${a} ${n(a)}. ${v(b, 'Se fue', 'Se fueron')} ${b} al potrero.`, pregunta: 'quedan en el gallinero' },
  { c: 'huevo', suma: false, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)}. Usó ${b} para el desayuno.`, pregunta: 'le quedan' },
  { c: 'mata', suma: false, texto: (a, b, _, n) => `En el vivero había ${a} ${n(a)}. ${v(b, 'Se vendió', 'Se vendieron')} ${b}.`, pregunta: 'quedan' },
  { c: 'pan', suma: false, texto: (a, b, _, n) => `En la escuela había ${a} ${n(a)}. Los niños se comieron ${b}.`, pregunta: 'quedan' },
  { c: 'naranja', suma: false, texto: (a, b, q, n) => `En la tienda había ${a} ${n(a)}. ${q} vendió ${b}.`, pregunta: 'quedan' },
  { c: 'mazorca', suma: false, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)}. La mula llevó ${b} al secadero.`, pregunta: 'le quedan' },
  { c: 'arepa', suma: false, texto: (a, b, _, n) => `En la mesa había ${a} ${n(a)}. La familia se comió ${b}.`, pregunta: 'quedan' },
  { c: 'moneda', suma: false, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)}. Gastó ${b} en la tienda.`, pregunta: 'le quedan' },
  { c: 'mandarina', suma: false, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)}. Le regaló ${b} a su hermano.`, pregunta: 'le quedan' },
  { c: 'limon', suma: false, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)}. Usó ${b} para la limonada.`, pregunta: 'le quedan' },
  { c: 'aguacate', suma: false, texto: (a, b, _, n) => `En el mercado había ${a} ${n(a)}. ${v(b, 'Se vendió', 'Se vendieron')} ${b}.`, pregunta: 'quedan' },
  { c: 'platano', suma: false, texto: (a, b, _, n) => `En la cocina había ${a} ${n(a)}. La mamá cocinó ${b}.`, pregunta: 'quedan' },
  { c: 'bulto', suma: false, texto: (a, b, _, n) => `En la bodega había ${a} ${n(a)}. El camión se llevó ${b}.`, pregunta: 'quedan' },
  { c: 'semilla', suma: false, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)}. Sembró ${b} en la huerta.`, pregunta: 'le quedan' },
  { c: 'huevo', suma: false, texto: (a, b, _, n) => `En la canasta había ${a} ${n(a)}. ${v(b, 'Se rompió', 'Se rompieron')} ${b}.`, pregunta: 'quedan sanos' },
  { c: 'cafe', suma: false, texto: (a, b, q, n) => `${q} tenía ${a} ${n(a)}. ${v(b, 'Se le cayó', 'Se le cayeron')} ${b} al río.`, pregunta: 'le quedan' },
  { c: 'caja', suma: false, texto: (a, b, _, n) => `En la tienda había ${a} ${n(a)}. Don Efraín se llevó ${b}.`, pregunta: 'quedan' },
];

/** Una escena al azar del tipo pedido, ya escrita: el cuento y la pregunta. */
function escena(rng: Rng, suma: boolean, a: number, b: number) {
  const e = rng.elegir(ESCENAS.filter((x) => x.suma === suma));
  const c = cosa(e.c);
  const texto = e.texto(a, b, nino(rng), (k) => nombre(c, k));
  return { c, texto, pregunta: `¿${cuantas(c)} ${c.varios} ${e.pregunta}?` };
}

/** Par para juntar (a + b ≤ tope) o quitar (b < a ≤ tope). */
function parHasta(rng: Rng, tope: number, resta: boolean): [number, number] {
  if (resta) {
    const a = rng.entero(2, tope);
    return [a, rng.entero(1, a - 1)];
  }
  const a = rng.entero(1, tope - 1);
  return [a, rng.entero(1, tope - a)];
}

/** Tres opciones para una suma o resta con dibujos: el resultado, el error típico y vecinos, todo entre 0 y 10. */
function opcionesCuenta(rng: Rng, r: number, a: number, b: number, resta: boolean, max: number): number[] {
  const tipico = resta ? a + b : Math.abs(a - b);
  const distr = tipico !== r && tipico >= 0 && tipico <= max && rng.azar(0.5) ? [tipico] : [];
  return [...distr, ...cercanos(rng, r, 2 - distr.length, 0, max, 1, distr)];
}

const cuento: Plantilla = {
  id: 'in-cuento',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Cuentos cortos con dibujos: «Tenía 2, llegó 1» (hasta 5 o hasta 10)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = Math.min(10, pn(ctx, 'max', 5));
    const tope = avance(ctx) < 0.5 ? Math.ceil(max * 0.7) : max;
    const resta = rng.azar(0.5);
    const [a, b] = parHasta(rng, Math.max(3, tope), resta);
    const r = resta ? a - b : a + b;
    const { c, texto, pregunta } = escena(rng, !resta, a, b);
    const distr = opcionesCuenta(rng, r, a, b, resta, max);
    const dibujo: Visual = resta ? { tipo: 'objetos', objeto: c.objeto, grupos: [a], tachados: b } : { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] };
    return {
      enunciado: `${texto} ${pregunta}`,
      instruccion: resta ? 'Quita' : 'Junta',
      dibujo,
      datos: { a, b },
      respuesta: r,
      unidad: c.varios,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: opcionesCon(rng, r, distr) },
      calculo: { op: resta ? 'resta' : 'suma', a, b },
      operacion: resta ? 'resta' : 'suma',
      pistas: [resta ? 'Mira el dibujo: los tachados ya no están.' : 'Mira el dibujo: los dos grupos se juntan.', dibujo, resta ? 'Cuenta los que no están tachados.' : 'Cuenta todos los dibujos.'],
      explicacion: `${a} ${resta ? '−' : '+'} ${b} = ${r}. ${resta ? 'Quedan' : 'Ahora son'} ${r} ${nombre(c, r)}.`,
    };
  },
};

const operar: Plantilla = {
  id: 'in-operar',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Sumar y quitar con dibujos, hasta 10',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = Math.min(10, pn(ctx, 'max', 10));
    const tope = avance(ctx) < 0.5 ? Math.ceil(max * 0.6) : max;
    const resta = rng.azar(0.5);
    const [a, b] = parHasta(rng, tope, resta);
    const r = resta ? a - b : a + b;
    const c = rng.elegir(COSAS);
    const distr = opcionesCuenta(rng, r, a, b, resta, max);
    const visual: Visual = resta ? { tipo: 'objetos', objeto: c.objeto, grupos: [a], tachados: b } : { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] };
    const e = `${a} ${resta ? '−' : '+'} ${b}`;
    const lugar = rng.elegir(c.donde);
    const enunciado = rng.elegir([
      () => `Mira ${los(c)} ${c.varios} ${lugar}. ¿Cuánto es ${e}?`,
      () => `Cuenta ${los(c)} ${c.varios}: ¿cuánto es ${e}?`,
      () => `${nino(rng)} mira ${los(c)} ${c.varios} ${lugar}. ¿Cuánto es ${e}?`,
    ])();
    return {
      enunciado,
      instruccion: resta ? 'Quita' : 'Suma',
      dibujo: visual,
      datos: { a, b },
      respuesta: r,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: opcionesCon(rng, r, distr) },
      calculo: { op: resta ? 'resta' : 'suma', a, b },
      operacion: resta ? 'resta' : 'suma',
      pistas: [
        resta ? 'Quitar es tachar: mira los que quedan.' : 'Sumar es juntar: mira los dos grupos.',
        visual,
        resta ? `Tacha ${b} y cuenta los que quedan.` : `Empieza en ${a} y cuenta ${b} más.`,
      ],
      explicacion: `${e} = ${r}.`,
    };
  },
};

export const inclusion: DefinicionPista = {
  pista: 'inclusion',
  limite: 10,
  plantillas: [igual, mismoColor, mismaForma, grandePequeno, altoLargo, clasificar, ordenar, unoMuchos, vacia, mas, igualCantidad, contar, dado, emparejar, numeral, trazar, poner, marco, leerMarco, sigue, juntar, quitar, cuento, operar],
  bloques: [
    { titulo: 'Mirar y emparejar', niveles: 3 },
    { titulo: 'Grande, pequeño y en orden', niveles: 4 },
    { titulo: '¿Cuántos hay?', niveles: 4 },
    { titulo: 'Los números 1, 2 y 3', niveles: 5 },
    { titulo: 'Los números 4 y 5', niveles: 5 },
    { titulo: 'Los números del 6 al 10', niveles: 5 },
    { titulo: 'Juntar y quitar hasta 5', niveles: 3 },
    { titulo: 'Juntar y quitar hasta 10', niveles: 4 },
  ],
  temas: [
    // 1. Mirar y emparejar (sin números)
    { titulo: 'Igual a este', idea: 'Miramos el dibujo de arriba y buscamos otro igual.', usos: [u(igual)] },
    { titulo: 'Mismo color', idea: 'Buscamos la figura que tiene el mismo color.', usos: [u(mismoColor)] },
    { titulo: 'Misma forma', idea: 'Buscamos la figura que tiene la misma forma.', usos: [u(mismaForma)] },
    // 2. Grande, pequeño y en orden (sin números)
    { titulo: 'Grande y pequeño', idea: 'Uno es grande y el otro es pequeño.', usos: [u(grandePequeno)] },
    { titulo: 'Alto y bajo, largo y corto', idea: 'Uno es alto y el otro es bajo. Un lazo es largo y el otro es corto.', usos: [u(altoLargo)] },
    { titulo: 'Cada uno en su canasta', idea: 'Las que se parecen van juntas en la misma canasta.', usos: [u(clasificar)] },
    { titulo: 'Del más pequeño al más grande', idea: 'Primero el más pequeño, luego el del medio y al final el más grande.', usos: [u(ordenar)] },
    // 3. ¿Cuántos hay? (sin contar)
    { titulo: 'Uno y muchos', idea: 'Uno es solo uno. Muchos es la canasta llena.', usos: [u(unoMuchos)] },
    { titulo: 'Nada: la canasta vacía', idea: 'Vacía es sin nada adentro.', usos: [u(vacia)] },
    { titulo: '¿Dónde hay más?', idea: 'La canasta más llena tiene más. La de poquitos tiene menos.', usos: [u(mas)] },
    { titulo: 'Igual de muchos', idea: 'Hacemos parejas: si no sobra ninguno, es igual.', usos: [u(igualCantidad)] },
    // 4. Los números 1, 2 y 3
    { titulo: 'Contar tocando hasta 3', idea: 'Tocamos cada cosa una vez y decimos: 1, 2, 3.', usos: [u(contar, { min: 1, max: 3, opciones: 2 })] },
    { titulo: 'Puntos como en el dado (1 a 3)', idea: 'Miramos los puntos del dado y decimos cuántos son.', usos: [u(dado, { max: 3, opciones: 2 })] },
    { titulo: 'Este número, estos dibujos (1 a 3)', idea: 'Cada número dice cuántas cosas hay: el 2 son dos cosas.', usos: [u(emparejar, { max: 3 }), u(numeral, { max: 3 })] },
    { titulo: 'Repasar el 1, el 2 y el 3', idea: 'Escribimos el número con el dedo, siguiendo los puntitos.', usos: [u(trazar, { desde: 1, hasta: 3 })] },
    { titulo: 'Poner 1, 2 o 3 en la canasta', idea: 'Ponemos las cosas una por una y contamos.', usos: [u(poner, { max: 3 })] },
    // 5. Los números 4 y 5
    { titulo: 'Contar tocando hasta 5', idea: 'Tocamos cada cosa una vez: 1, 2, 3, 4, 5.', usos: [u(contar, { min: 1, max: 5, mixto: true })] },
    { titulo: 'Dado hasta 5', idea: 'El dado muestra los números con puntos.', usos: [u(dado, { max: 5, opciones: 3 })] },
    { titulo: 'Este número, estos dibujos (1 a 5)', idea: 'El 4 son cuatro cosas. El 5 son cinco cosas.', usos: [u(emparejar, { max: 5 }), u(numeral, { max: 5 })] },
    { titulo: 'Repasar el 4 y el 5', idea: 'Escribimos el 4 y el 5 con el dedo.', usos: [u(trazar, { desde: 4, hasta: 5 })] },
    { titulo: 'Poner hasta 5 en la canasta', idea: 'Ponemos las cosas una por una hasta llegar al número.', usos: [u(poner, { max: 5 })] },
    // 6. Los números del 6 al 10
    { titulo: 'Contar tocando hasta 10', idea: 'Contamos despacio, tocando cada cosa una sola vez.', usos: [u(contar, { min: 6, max: 10, opciones: 3 })] },
    { titulo: 'Llenar el marco de 10', idea: 'El marco tiene dos filas de 5. Llenamos una casilla por cada número.', usos: [u(marco)] },
    { titulo: '¿Cuántos hay en el marco?', idea: 'Una fila llena son 5. Contamos los de abajo.', usos: [u(leerMarco)] },
    { titulo: 'Repasar del 6 al 10', idea: 'Escribimos los números con el dedo. El 10 es un 1 y un 0.', usos: [u(trazar, { desde: 6, hasta: 9, diez: true })] },
    { titulo: '¿Qué número sigue?', idea: 'Los números van en orden. Contamos para saber cuál sigue.', usos: [u(sigue)] },
    // 7. Juntar y quitar hasta 5
    { titulo: 'Juntar en la canasta (hasta 5)', idea: 'Juntamos dos grupos en la canasta y contamos todo.', usos: [u(juntar, { max: 5 })] },
    { titulo: 'Quitar y contar lo que queda (hasta 5)', idea: 'Quitamos algunos y contamos los que quedan.', usos: [u(quitar, { max: 5 })] },
    { titulo: 'Cuentos con dibujos (hasta 5)', idea: 'Escuchamos el cuento y miramos el dibujo: tenía 2, llegó 1, ahora tiene 3.', usos: [u(cuento, { max: 5 })] },
    // 8. Juntar y quitar hasta 10
    { titulo: 'Juntar hasta 10', idea: 'Juntamos dos grupos y contamos todo, hasta 10.', usos: [u(juntar, { max: 10 })] },
    { titulo: 'Quitar hasta 10', idea: 'Quitamos algunos y contamos los que quedan, hasta 10.', usos: [u(quitar, { max: 10 })] },
    { titulo: 'Cuentos con dibujos (hasta 10)', idea: 'Escuchamos el cuento: ¿llegan más o se van?', usos: [u(cuento, { max: 10 })] },
    { titulo: 'Sumar y quitar con dibujos', idea: 'Sumar es juntar. Quitar es tachar y contar los que quedan.', usos: [u(operar, { max: 10 })] },
  ],
};
