// Grado Inclusión: actividades muy guiadas y predecibles para niños con autismo y otros
// espectros. Una sola instrucción, dibujos grandes y nada de presión: en esta ruta nunca se
// pierde (ver motor y Ejercicio en modo «inclusion»).
//
// La ruta tiene 7 bloques y 23 niveles, del pre-número (sin cifras) a las decenas y las sumas
// hasta 100. Dentro de un nivel, las preguntas avanzan por fases según d (p. ej., sumas hasta 5
// y luego hasta 10).
//
// La variedad nunca complica la frase: cambian las cosas, los colores, las formas, las
// cantidades, quién y dónde, y la instrucción se dice de 2 a 4 maneras equivalentes («Toca…»,
// «Busca…», «Ayuda a Sofía a encontrar…»), siempre corta.

import type { Calculo, ColorFigura, ContextoGeneracion, CosaAlta, DefinicionPista, EjercicioBase, Figura, FormaFigura, Objeto, OpcionFigura, Parametros, Plantilla, Uso, Visual } from '../../juego/tipos';
import type { Rng } from '../../juego/rng';
import { COMO_SE_ESCRIBE, NOMBRES_CIFRA } from '../cifras';
import { adulto, persona } from '../contexto';
import { plantillasG1 } from './g1';
import { contarLlevadas, contarPrestamos, dif, distractores, lerp, mezclarOpciones, modoRespuesta, pb, pn, pt } from './util';

const { siguiente, sumaJuntar, restaQuitar, sumaCambio, comparaDiferencia } = plantillasG1;

// --- Cosas para contar, con su nombre y dónde se encuentran ---

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
const TAMANOS = deObjetos(['gallina', 'naranja', 'aguacate', 'mandarina', 'limon', 'huevo', 'pan', 'arepa', 'mazorca', 'platano', 'caja', 'bolsa', 'bulto', 'mata']);

const nombre = (c: Cosa, n: number) => (n === 1 ? c.uno : c.varios);
const un = (c: Cosa) => (c.f ? 'una' : 'un');
const los = (c: Cosa) => (c.f ? 'las' : 'los');
const el = (c: Cosa) => (c.f ? 'la' : 'el');
const cuantas = (c: Cosa) => (c.f ? 'Cuántas' : 'Cuántos');
const palabraNumero = (n: number) => (n === 10 ? 'diez' : NOMBRES_CIFRA[n]);
/** «una naranja», «un limón», «tres naranjas»: el número en palabras que concuerda con la cosa. */
const enPalabras = (c: Cosa, n: number) => (n === 1 ? un(c) : palabraNumero(n));
const may = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** Singular o plural según la cantidad («Llegó 1», «Llegaron 3»). */
const v = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);
const nino = (rng: Rng) => persona(rng).nombre;

/** Avance dentro del nivel, de 0 (primera pregunta) a 1 (última). */
function avance(ctx: ContextoGeneracion): number {
  return Math.min(1, Math.max(0, (dif(ctx) - 0.2) / 0.6));
}

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

/** Plantilla de otra ruta que cambia de parámetros por fases a lo largo del nivel. */
function porFases(id: string, base: Plantilla, fases: Parametros[], descripcion: string): Plantilla {
  return {
    id,
    dimension: base.dimension,
    operacion: base.operacion,
    descripcion,
    generar(ctx) {
      const fase = fases[Math.min(fases.length - 1, Math.floor(avance(ctx) * fases.length))];
      return base.generar({ ...ctx, params: { ...ctx.params, ...fase } });
    },
  };
}

// --- Bloque 1: pre-número (sin cifras) ---

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
const PARECIDOS_C = ['rojo|rosado', 'rojo|anaranjado', 'amarillo|anaranjado', 'azul|morado', 'anaranjado|cafe', 'morado|rosado'];

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
const PARECIDAS_F = ['circulo|ovalo', 'cuadrado|rectangulo'];

/** Dos elementos distintos que no se confundan entre sí. */
function dosDistintos<T extends string>(rng: Rng, lista: T[], parecidos: string[]): [T, T] {
  for (;;) {
    const [a, b] = rng.barajar(lista);
    if (!parecidos.includes(`${a}|${b}`) && !parecidos.includes(`${b}|${a}`)) return [a, b];
  }
}
/** «estrella roja», «corazón rojo». */
const nombreFigura = (forma: FormaFigura, color: ColorFigura) => `${FORMA_N[forma].s} ${FORMA_N[forma].f ? COLOR_F[color].f : COLOR_F[color].m}`;

const clasificar: Plantilla = {
  id: 'inc-clasificar',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Clasificar figuras en dos canastas por color, forma o tamaño',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cantidad = avance(ctx) < 0.5 ? 4 : 6;
    const criterio = rng.elegir(['color', 'forma', 'tamano'] as const);
    // «Pon … en la canasta» o «Lleva … a la canasta».
    const [verbo, en] = rng.elegir([['Pon', 'en'], ['Lleva', 'a']]);
    // La mitad va a cada canasta.
    const destinos = rng.barajar(Array.from({ length: cantidad }, (_, k) => k % 2));
    let items: OpcionFigura[];
    let grupos: [OpcionFigura, OpcionFigura];
    let enunciado: string;
    let regla: string;
    if (criterio === 'color') {
      const cs = dosDistintos(rng, COLORES, PARECIDOS_C);
      const [c0, c1] = cs;
      items = destinos.map((g, k) => {
        const forma = rng.elegir(FORMAS_F);
        return { id: `f${k}`, etiqueta: nombreFigura(forma, cs[g]), figura: { forma, color: cs[g] } };
      });
      grupos = [0, 1].map((g) => ({ id: `g${g}`, etiqueta: `Canasta ${COLOR_F[cs[g]].f}`, figura: { forma: 'circulo', color: cs[g] } as Figura })) as [OpcionFigura, OpcionFigura];
      enunciado = `${verbo} cada figura ${en} la canasta de su color: las ${COLOR_F[c0].fp} ${en} la canasta ${COLOR_F[c0].f} y las ${COLOR_F[c1].fp} ${en} la canasta ${COLOR_F[c1].f}.`;
      regla = 'Mira el color de cada figura.';
    } else if (criterio === 'forma') {
      const fs = dosDistintos(rng, FORMAS_F, PARECIDAS_F);
      items = destinos.map((g, k) => {
        const color = rng.elegir(COLORES);
        return { id: `f${k}`, etiqueta: nombreFigura(fs[g], color), figura: { forma: fs[g], color } };
      });
      grupos = [0, 1].map((g) => ({ id: `g${g}`, etiqueta: `Canasta de ${FORMA_N[fs[g]].p}`, figura: { forma: fs[g] } as Figura })) as [OpcionFigura, OpcionFigura];
      const juntos = (f: FormaFigura) => `${FORMA_N[f].f ? 'las' : 'los'} ${FORMA_N[f].p} con ${FORMA_N[f].f ? 'las' : 'los'} ${FORMA_N[f].p}`;
      enunciado = `${verbo} cada figura ${en} la canasta de su forma: ${juntos(fs[0])} y ${juntos(fs[1])}.`;
      regla = 'Mira la forma de cada figura, no el color.';
    } else {
      const c = rng.elegir(TAMANOS);
      const g = c.f ? ['grandes', 'pequeñas'] : ['grandes', 'pequeños'];
      const escalas = [1, 0.55];
      items = destinos.map((d, k) => ({ id: `f${k}`, etiqueta: `${c.uno} ${d === 0 ? 'grande' : c.f ? 'pequeña' : 'pequeño'}`, figura: { objeto: c.objeto, escala: escalas[d] } }));
      grupos = [0, 1].map((d) => ({ id: `g${d}`, etiqueta: `Canasta de ${los(c)} ${g[d]}`, figura: { objeto: c.objeto, escala: escalas[d] * 0.9 } as Figura })) as [OpcionFigura, OpcionFigura];
      enunciado = `${verbo} cada ${c.uno} ${en} su canasta: ${los(c)} ${g[0]} con ${los(c)} ${g[0]} y ${los(c)} ${g[1]} con ${los(c)} ${g[1]}.`;
      regla = `Mira el tamaño de cada ${c.uno}.`;
    }
    const rasgo = { color: 'el color', forma: 'la forma', tamano: 'el tamaño' }[criterio];
    return {
      enunciado,
      instruccion: 'Toca una figura y luego su canasta',
      datos: { cantidad },
      respuesta: destinos.join(','),
      respuestaTexto: `cada una en la canasta que le toca según ${rasgo}`,
      distractores: [],
      interaccion: { tipo: 'clasificar', items, grupos },
      pistas: [regla, { tipo: 'figuras', figuras: grupos }, 'Las que se parecen van juntas en la misma canasta.'],
      explicacion: `Las que se parecen en ${rasgo} van juntas en la misma canasta.`,
    };
  },
};

const diferente: Plantilla = {
  id: 'inc-diferente',
  dimension: 'procedimiento',
  operacion: 'mixta',
  descripcion: 'Tocar la figura que no es como las demás (color, forma o tamaño)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cantidad = avance(ctx) < 0.5 ? 3 : 4;
    const criterio = rng.elegir(['color', 'forma', 'tamano'] as const);
    const raro = rng.entero(0, cantidad - 1);
    const corta = rng.azar(0.5);
    let figuras: Figura[];
    let etiquetas: string[];
    let enunciado: string;
    let articulo: string;
    if (criterio === 'color') {
      const forma = rng.elegir(FORMAS_F);
      const { s, p, f } = FORMA_N[forma];
      articulo = f ? 'la' : 'el';
      const [c0, c1] = dosDistintos(rng, COLORES, PARECIDOS_C);
      figuras = Array.from({ length: cantidad }, (_, k) => ({ forma, color: k === raro ? c1 : c0 }));
      etiquetas = figuras.map((_, k) => nombreFigura(forma, k === raro ? c1 : c0));
      enunciado = corta
        ? `Busca ${articulo} ${s} que no es ${f ? COLOR_F[c0].f : COLOR_F[c0].m}.`
        : `${f ? 'Todas estas' : 'Todos estos'} ${p} son ${f ? COLOR_F[c0].fp : COLOR_F[c0].mp} menos ${f ? 'una' : 'uno'}. Toca ${articulo} ${s} de otro color.`;
    } else if (criterio === 'forma') {
      const color = rng.elegir(COLORES);
      const [f0, f1] = dosDistintos(rng, FORMAS_F, PARECIDAS_F);
      articulo = FORMA_N[f1].f ? 'la' : 'el';
      figuras = Array.from({ length: cantidad }, (_, k) => ({ forma: k === raro ? f1 : f0, color }));
      etiquetas = figuras.map((_, k) => nombreFigura(k === raro ? f1 : f0, color));
      enunciado = corta ? `Busca la figura ${COLOR_F[color].f} que tiene otra forma.` : `Mira las figuras ${COLOR_F[color].fp}. Toca la que tiene otra forma.`;
    } else {
      const c = rng.elegir(TAMANOS);
      articulo = el(c);
      const grandes = rng.azar(0.5);
      const [e0, e1] = grandes ? [1, 0.5] : [0.5, 1];
      figuras = Array.from({ length: cantidad }, (_, k) => ({ objeto: c.objeto, escala: k === raro ? e1 : e0 }));
      const t = (e: number) => (e === 1 ? 'grande' : c.f ? 'pequeña' : 'pequeño');
      etiquetas = figuras.map((_, k) => `${c.uno} ${t(k === raro ? e1 : e0)}`);
      enunciado = corta ? `Busca ${el(c)} ${c.uno} de otro tamaño.` : `Mira ${los(c)} ${c.varios}. Toca ${el(c)} que es de otro tamaño.`;
    }
    const opciones = figuras.map((figura, k) => ({ id: `f${k}`, etiqueta: etiquetas[k], figura }));
    return {
      enunciado,
      instruccion: 'Busca el diferente',
      datos: { cantidad },
      respuesta: `f${raro}`,
      distractores: opciones.filter((_, k) => k !== raro).map((o) => o.id),
      interaccion: { tipo: 'figuras', opciones },
      pistas: [
        criterio === 'color' ? 'Mira el color de cada una.' : criterio === 'forma' ? 'Mira la forma de cada una.' : 'Mira el tamaño de cada una.',
        { tipo: 'figuras', figuras: [opciones[raro]] },
        `Es ${articulo} ${etiquetas[raro]}.`,
      ],
      explicacion: `Todas se parecen menos una: ${etiquetas[raro]}.`,
    };
  },
};

// Cosas que se comparan por su altura: árboles, matas, torres, velas, botellas y lápices.
type Alta = { s: string; p: string; f: boolean; /** Dónde están («del vivero»); '' = sin lugar. */ de: string[]; figura: (alto: number) => Figura };
const porEscala = (objeto: Objeto) => (alto: number): Figura => ({ objeto, escala: alto });
const parada = (c: CosaAlta) => (alto: number): Figura => ({ cosa: c, alto });
const ALTAS: Alta[] = [
  { s: 'torre de cajas', p: 'torres de cajas', f: true, de: [''], figura: (alto) => ({ torre: Math.round(alto * 6) }) },
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
/** Juegos de alturas (de menor a mayor). Las torres usan 1 a 6 cajas. */
const ALTURAS = [
  [0.5, 0.75, 1],
  [0.45, 0.7, 0.95],
  [0.55, 0.8, 1],
  [0.4, 0.65, 0.9],
];
const ALTURAS_TORRE = [
  [1 / 6, 3 / 6, 5 / 6],
  [2 / 6, 3 / 6, 5 / 6],
  [1 / 6, 2 / 6, 4 / 6],
  [2 / 6, 4 / 6, 1],
];
const alturas = (rng: Rng, a: Alta) => rng.elegir(a.s.startsWith('torre') ? ALTURAS_TORRE : ALTURAS);
/** «alta», «bajo», «mediana»… según el género. */
const adjAlto = (f: boolean, k: 0 | 1 | 2) => [f ? 'baja' : 'bajo', f ? 'mediana' : 'mediano', f ? 'alta' : 'alto'][k];

const tamanos: Plantilla = {
  id: 'inc-tamanos',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Alto y bajo, grande y pequeño, largo y corto: tocar el que se pide',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const tres = avance(ctx) >= 0.5;
    const tipo = rng.elegir(['alto', 'alto', 'grande', 'grande', 'largo'] as const);
    const mayor = rng.azar(0.5);
    // Medidas de menor a mayor; con tres, la del medio no es la respuesta.
    let medidas: { figura: Figura; etiqueta: string }[];
    let que: string;
    let palabra: string;
    let f: boolean;
    let pista1: string;
    let lugar = '';
    if (tipo === 'alto') {
      const a = rng.elegir(ALTAS);
      f = a.f;
      const h = alturas(rng, a);
      const altos = tres ? h : [h[0], h[2]];
      const idx: (0 | 1 | 2)[] = tres ? [0, 1, 2] : [0, 2];
      medidas = altos.map((x, k) => ({ figura: a.figura(x), etiqueta: `${a.s} ${adjAlto(f, idx[k])}` }));
      palabra = adjAlto(f, mayor ? 2 : 0);
      que = `${a.s} más ${palabra}`;
      lugar = rng.elegir(a.de);
      pista1 = a.s.startsWith('torre') ? 'Mira hasta dónde llega cada torre.' : 'Mira hasta dónde llega cada una, desde el suelo.';
    } else if (tipo === 'grande') {
      const c = rng.elegir(TAMANOS);
      f = c.f;
      const escalas = tres ? rng.elegir([[0.45, 0.72, 1], [0.5, 0.75, 1]]) : rng.elegir([[0.5, 1], [0.45, 0.95]]);
      const peq = f ? 'pequeña' : 'pequeño';
      medidas = escalas.map((e, k) => ({ figura: { objeto: c.objeto, escala: e }, etiqueta: `${c.uno} ${k === 0 ? peq : k === escalas.length - 1 ? 'grande' : f ? 'mediana' : 'mediano'}` }));
      palabra = mayor ? 'grande' : peq;
      que = `${c.uno} más ${palabra}`;
      pista1 = 'Mira cuál ocupa más espacio.';
    } else {
      f = false;
      const largos = tres ? rng.elegir([[0.3, 0.6, 1], [0.35, 0.65, 0.95]]) : rng.elegir([[0.35, 1], [0.3, 0.9]]);
      medidas = largos.map((l, k) => ({ figura: { lazo: l }, etiqueta: `lazo ${k === 0 ? 'corto' : k === largos.length - 1 ? 'largo' : 'mediano'}` }));
      palabra = mayor ? 'largo' : 'corto';
      que = `lazo más ${palabra}`;
      lugar = rng.elegir(['', ' de la mula', ' del corral']);
      pista1 = 'Pon el dedo en una punta y recorre cada lazo.';
    }
    const art = f ? 'la' : 'el';
    const forma = rng.entero(0, 3);
    const pregunta = [`Toca ${art} ${que}${lugar}.`, `Busca ${art} ${que}.`, `Ayuda a ${nino(rng)} a encontrar ${art} ${que}.`, `¿Cuál es ${art} ${que}? Tóca${f ? 'la' : 'lo'}.`][forma];
    const correcta = mayor ? medidas.length - 1 : 0;
    const opciones = rng.barajar(medidas.map((m, k) => ({ id: `m${k}`, etiqueta: m.etiqueta, figura: m.figura })));
    return {
      enunciado: pregunta,
      instruccion: 'Compara y toca',
      datos: { opciones: medidas.length },
      respuesta: `m${correcta}`,
      distractores: medidas.map((_, k) => `m${k}`).filter((id) => id !== `m${correcta}`),
      interaccion: { tipo: 'figuras', opciones },
      pistas: [pista1, { tipo: 'figuras', figuras: [{ id: 'r', etiqueta: medidas[correcta].etiqueta, figura: medidas[correcta].figura }] }, `Busca ${art} más ${palabra}.`],
      explicacion: `La respuesta es: ${medidas[correcta].etiqueta}.`,
    };
  },
};

const unoMuchosNinguno: Plantilla = {
  id: 'inc-cuantos-hay',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Uno, muchos o ninguno: tocar la canasta que se pide',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const c = rng.elegir(EN_CANASTA);
    const muchos = rng.entero(lerp(5, 6, avance(ctx)), lerp(6, 9, avance(ctx)));
    const pide = rng.elegir(['uno', 'muchos', 'ninguno'] as const);
    const muchas = c.f ? 'muchas' : 'muchos';
    const canastas: OpcionFigura[] = [
      { id: 'uno', etiqueta: `canasta con ${un(c)} ${c.uno}`, figura: { objeto: c.objeto, cantidad: 1 } },
      { id: 'muchos', etiqueta: `canasta con ${muchas} ${c.varios}`, figura: { objeto: c.objeto, cantidad: muchos } },
      { id: 'ninguno', etiqueta: 'canasta vacía', figura: { objeto: c.objeto, cantidad: 0 } },
    ];
    // Lo que se busca, dicho de cuatro maneras equivalentes.
    const busca = {
      uno: [`la canasta que tiene ${un(c)} ${c.uno}`, `la canasta con ${c.f ? 'una sola' : 'un solo'} ${c.uno}`, `la canasta con ${un(c)} ${c.uno}`],
      muchos: [`la canasta que tiene ${muchas} ${c.varios}`, `la canasta llena de ${c.varios}`, `la canasta con ${muchas} ${c.varios}`],
      ninguno: [`la canasta que no tiene ${c.f ? 'ninguna' : 'ningún'} ${c.uno}`, `la canasta vacía, sin ${c.varios}`, `la canasta sin ${c.varios}`],
    }[pide];
    const forma = rng.entero(0, 3);
    const enunciado = [
      `Toca ${busca[0]}.`,
      `Busca ${busca[1]}.`,
      `Ayuda a ${nino(rng)} a encontrar ${busca[2]}.`,
      `¿Dónde está ${busca[2]}? Tócala.`,
    ][forma];
    return {
      enunciado,
      instruccion: pide === 'uno' ? 'Busca uno' : pide === 'muchos' ? 'Busca muchos' : 'Busca ninguno',
      ilustracion: c.objeto,
      datos: { muchos },
      respuesta: pide,
      distractores: canastas.filter((x) => x.id !== pide).map((x) => x.id),
      interaccion: { tipo: 'figuras', opciones: rng.barajar(canastas) },
      pistas: [
        pide === 'uno' ? `Uno es solo ${un(c)}.` : pide === 'muchos' ? `Muchos: la canasta casi llena.` : 'Ninguno: no hay nada adentro.',
        { tipo: 'figuras', figuras: [canastas.find((x) => x.id === pide)!] },
        'Mira adentro de cada canasta.',
      ],
      explicacion: pide === 'uno' ? `Esa canasta tiene ${un(c)} ${c.uno}.` : pide === 'muchos' ? `Esa canasta tiene ${muchas} ${c.varios}.` : 'Esa canasta está vacía: no tiene ninguno.',
    };
  },
};

const masMenos: Plantilla = {
  id: 'inc-mas-menos',
  dimension: 'procedimiento',
  operacion: 'mixta',
  descripcion: 'Más, menos o igual: comparar dos canastas sin contar con números',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const c = rng.elegir(EN_CANASTA);
    const tope = avance(ctx) < 0.5 ? 5 : 8;
    const igual = rng.azar(0.25);
    let a = rng.entero(1, tope);
    let b = a;
    if (!igual) {
      const separacion = avance(ctx) < 0.5 ? 2 : 1;
      const posibles = Array.from({ length: tope }, (_, k) => k + 1).filter((x) => Math.abs(x - a) >= separacion);
      b = rng.elegir(posibles);
    }
    if (a === b && !igual) [a, b] = [1, tope];
    const pregunta = rng.azar(0.5) ? 'más' : 'menos';
    const respuesta = a === b ? 'igual' : (pregunta === 'más') === a > b ? 'a' : 'b';
    const opciones: OpcionFigura[] = [
      { id: 'a', etiqueta: `primera canasta`, figura: { objeto: c.objeto, cantidad: a } },
      { id: 'b', etiqueta: `segunda canasta`, figura: { objeto: c.objeto, cantidad: b } },
      { id: 'igual', etiqueta: 'Igual: tienen lo mismo', figura: { igual: true } },
    ];
    const forma = rng.entero(0, 2);
    const pide = [`¿Qué canasta tiene ${pregunta} ${c.varios}?`, `Busca la canasta con ${pregunta} ${c.varios}.`, `¿En qué canasta hay ${pregunta} ${c.varios}?`][forma];
    return {
      enunciado: `${pide} Si tienen lo mismo, toca «Igual».`,
      instruccion: pregunta === 'más' ? 'Busca dónde hay más' : 'Busca dónde hay menos',
      ilustracion: c.objeto,
      datos: { a, b },
      respuesta,
      respuestaTexto: respuesta === 'igual' ? 'igual: las dos tienen lo mismo' : respuesta === 'a' ? 'la primera canasta' : 'la segunda canasta',
      distractores: opciones.filter((o) => o.id !== respuesta).map((o) => o.id),
      interaccion: { tipo: 'figuras', opciones },
      pistas: [
        `Haz parejas: ${un(c)} ${c.uno} de una canasta con ${un(c)} de la otra. ¿Dónde sobran?`,
        { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] },
        a === b ? 'Todas tienen pareja: tienen lo mismo.' : `La canasta donde sobran tiene más; la otra tiene menos.`,
      ],
      explicacion: a === b ? 'Las dos canastas tienen lo mismo: igual.' : `La ${a > b ? 'primera' : 'segunda'} canasta tiene más y la ${a > b ? 'segunda' : 'primera'} tiene menos.`,
    };
  },
};

// --- Bloques 2 a 4: los números ---

const contar: Plantilla = {
  id: 'inc-contar',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Contar tocando de uno en uno',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const min = pn(ctx, 'min', 1);
    const max = pn(ctx, 'max', 10);
    const n = rng.entero(Math.max(min, lerp(min, Math.ceil(max * 0.6), avance(ctx))), max);
    const c = rng.elegir(COSAS);
    const lugar = rng.elegir(c.donde);
    const distr = max <= 3 ? [1, 2, 3].filter((x) => x !== n) : distractores(rng, n, [n + 1, n - 1], 2, 1).filter((x) => x > 0);
    const opciones = mezclarOpciones(rng, n, distr.length ? distr : [n + 1]);
    const forma = rng.entero(0, 3);
    const enunciado = [
      `${may(lugar)} hay ${c.varios}. Toca cada ${c.uno} una vez. ¿${cuantas(c)} hay?`,
      `¿${cuantas(c)} ${c.varios} hay ${lugar}? Toca cada ${c.uno} una vez.`,
      `Ayuda a ${nino(rng)} a contar ${los(c)} ${c.varios} ${lugar}. Toca cada ${c.uno} una vez.`,
      `Cuenta ${los(c)} ${c.varios} ${lugar}: toca cada ${c.uno} una sola vez.`,
    ][forma];
    return {
      enunciado,
      instruccion: 'Toca y cuenta',
      ilustracion: c.objeto,
      datos: { n },
      respuesta: n,
      unidad: c.varios,
      distractores: opciones.filter((o) => o !== n),
      interaccion: { tipo: 'contar', objeto: c.objeto, cantidad: n, opciones, ...(pb(ctx, 'escribir') && rng.azar(0.5) ? { escribir: true } : {}) },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Los que tocas quedan marcados. No toques dos veces el mismo.', { tipo: 'objetos', objeto: c.objeto, grupos: [n] }, 'El último número que dices es cuántos hay.'],
      explicacion: `Contamos ${Array.from({ length: Math.min(n, 5) }, (_, k) => k + 1).join(', ')}${n > 5 ? '…' : ''} hasta ${n}. Hay ${n} ${nombre(c, n)}.`,
    };
  },
};

/** Cifra que se trabaja según la fase: en «pareja», la pareja nueva (1-2, 3-4…9). */
function cifraDeFase(ctx: ContextoGeneracion): number {
  const pareja = Math.min(4, Math.floor(avance(ctx) * 5));
  return Math.min(9, 2 * pareja + 1 + (ctx.rng.azar(0.5) ? 1 : 0));
}

const trazar: Plantilla = {
  id: 'inc-trazar',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Repasar una cifra con el dedo sobre la guía punteada',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifra = pb(ctx, 'pareja') ? cifraDeFase(ctx) : rng.entero(pn(ctx, 'desde', 0), pn(ctx, 'hasta', 9));
    const x = NOMBRES_CIFRA[cifra];
    // La mitad de las veces se escribe el número de algo que se ve: tres naranjas, el tres.
    const c = rng.elegir(COSAS);
    const conCosas = cifra > 0 && rng.azar(0.5);
    const hay = `${enPalabras(c, cifra)} ${nombre(c, cifra)}`;
    const enunciado = conCosas
      ? rng.elegir([
          () => `Hay ${hay}. Escribe el ${x}: sigue los puntitos desde el punto verde.`,
          () => `${nino(rng)} tiene ${hay}. Escribe el ${x} con el dedo.`,
          () => `${may(rng.elegir(c.donde))} hay ${hay}. Repasa el ${x} con el dedo.`,
          () => `Mira: ${hay}. Ayuda a ${nino(rng)} a escribir el ${x}.`,
        ])()
      : rng.elegir([
          () => `Vamos a escribir el ${x}. Pon el dedo en el punto verde y sigue los puntitos.`,
          () => `Escribe el ${x} con el dedo. Empieza en el punto verde y sigue los puntitos.`,
          () => `Repasa el ${x} con el dedo. Empieza en el punto verde.`,
          () => `Ayuda a ${nino(rng)} a escribir el ${x}. Sigue los puntitos desde el punto verde.`,
          () => `Escribe el ${x} como en el tablero de la escuela. Empieza en el punto verde.`,
          () => `Dibuja el ${x} como en la arena del río. Sigue los puntitos desde el punto verde.`,
          () => `${nino(rng)} escribe el ${x} en su cuaderno. Hazlo tú: sigue los puntitos.`,
          () => `Escribe el ${x} como con un palito en la tierra. Empieza en el punto verde.`,
        ])();
    return {
      enunciado,
      instruccion: 'Repasa con el dedo',
      dibujo: conCosas ? { tipo: 'objetos', objeto: c.objeto, grupos: [cifra] } : undefined,
      datos: { cifra },
      respuesta: cifra,
      distractores: [],
      interaccion: { tipo: 'trazar', cifra },
      calculo: { op: 'otra', a: cifra, b: 0 },
      pistas: ['Empieza en el punto verde.', { tipo: 'texto', texto: COMO_SE_ESCRIBE[cifra] }, 'Ve despacio, sin levantar el dedo.'],
      explicacion: COMO_SE_ESCRIBE[cifra],
    };
  },
};

const emparejar: Plantilla = {
  id: 'inc-emparejar',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Número y cantidad: tocar el grupo que tiene ese número de dibujos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 3);
    const n = rng.entero(1, max);
    const c = rng.elegir(COSAS);
    const otros = rng.barajar([1, 2, 3, 4].filter((x) => x !== n && x <= max + 1));
    const opciones = rng.barajar([n, ...otros.slice(0, avance(ctx) < 0.5 ? 1 : 2)]);
    const nom = nombre(c, n);
    const forma = rng.entero(0, 3);
    const enunciado = [
      `Toca el grupo que tiene ${n} ${nom}.`,
      `Busca el grupo de ${n} ${nom}.`,
      `Ayuda a ${nino(rng)} a encontrar ${n} ${nom}.`,
      `¿Dónde hay ${n} ${nom}? Toca ese grupo.`,
    ][forma];
    return {
      enunciado,
      instruccion: `Busca el ${n}`,
      ilustracion: c.objeto,
      datos: { n },
      respuesta: n,
      distractores: opciones.filter((o) => o !== n),
      interaccion: { tipo: 'emparejar', objeto: c.objeto, opciones },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Cuenta los dibujos de cada grupo.', { tipo: 'objetos', objeto: c.objeto, grupos: [n] }, `Así se ven ${n}.`],
      explicacion: `Este grupo tiene ${n}: ${Array.from({ length: n }, (_, k) => k + 1).join(', ')}.`,
    };
  },
};

const numeral: Plantilla = {
  id: 'inc-numeral',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Cantidad y número: mirar el grupo y tocar su número',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 3);
    const n = rng.entero(1, max);
    const c = rng.elegir(COSAS);
    const opciones = rng.barajar(Array.from({ length: max }, (_, k) => k + 1));
    const forma = rng.entero(0, 3);
    const enunciado = [
      `Mira ${los(c)} ${c.varios}. ¿Qué número dice cuántos hay?`,
      `Mira ${los(c)} ${c.varios} ${rng.elegir(c.donde)}. Toca su número.`,
      `${nino(rng)} contó ${los(c)} ${c.varios}. ¿Qué número dice cuántos hay?`,
      `¿${cuantas(c)} ${c.varios} ves? Toca el número.`,
    ][forma];
    return {
      enunciado,
      instruccion: 'Toca el número',
      dibujo: { tipo: 'objetos', objeto: c.objeto, grupos: [n] },
      datos: { n },
      respuesta: n,
      distractores: opciones.filter((o) => o !== n),
      interaccion: { tipo: 'opciones', opciones },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Cuenta los dibujos con el dedo.', { tipo: 'objetos', objeto: c.objeto, grupos: [n] }, `Cuando cuentas, el último número es el que buscas.`],
      explicacion: `Hay ${n} ${nombre(c, n)}: el número es ${n}.`,
    };
  },
};

const ordenar: Plantilla = {
  id: 'inc-ordenar',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Ordenar 3 objetos por su altura',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const a = rng.elegir(ALTAS);
    const alReves = avance(ctx) >= 0.5 && rng.azar(0.5);
    const nombres = ['bajo', 'medio', 'alto'];
    const h = alturas(rng, a);
    const f = a.f;
    const etiqueta = (k: number) => `${a.s} ${adjAlto(f, k as 0 | 1 | 2)}`;
    const items = h.map((x, k) => ({ id: nombres[k], etiqueta: etiqueta(k), figura: a.figura(x) }));
    let vista = rng.barajar(items);
    // Que no aparezcan ya ordenados.
    if (vista.map((x) => x.id).join() === 'bajo,medio,alto' || vista.map((x) => x.id).join() === 'alto,medio,bajo') vista = [items[1], items[2], items[0]];
    const orden = alReves ? [...nombres].reverse() : nombres;
    const extremo = (k: 0 | 2) => `${f ? 'la' : 'el'} más ${adjAlto(f, k)}`;
    const cosas = `${f ? 'las' : 'los'} ${a.p}`;
    const como = `primero ${extremo(alReves ? 2 : 0)} y al final ${extremo(alReves ? 0 : 2)}`;
    const forma = rng.entero(0, 2);
    const enunciado = [`Toca ${cosas} en orden: ${como}.`, `Ordena ${cosas}${rng.elegir(a.de)}: ${como}.`, `Ordena ${cosas} de ${nino(rng)}: ${como}.`][forma];
    return {
      enunciado,
      instruccion: alReves ? 'Del más alto al más bajo' : 'Del más bajo al más alto',
      datos: { cantidad: 3 },
      respuesta: orden.join('|'),
      respuestaTexto: orden.map((id) => etiqueta(nombres.indexOf(id))).join(', luego ').replace(/, luego ([^,]*)$/, ' y al final $1'),
      distractores: [],
      interaccion: { tipo: 'ordenar', items: vista },
      pistas: [`Busca primero ${extremo(alReves ? 2 : 0)}.`, { tipo: 'figuras', figuras: orden.map((id) => items[nombres.indexOf(id)]) }, 'Después, el que está en el medio.'],
      explicacion: `El orden es: ${orden.map((id) => etiqueta(nombres.indexOf(id))).join(', ')}.`,
    };
  },
};

const reconocer: Plantilla = {
  id: 'inc-reconocer',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Reconocer las cifras de dos en dos (1 y 2, 3 y 4… 9 y 10)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const pareja = Math.min(4, Math.floor(avance(ctx) * 5));
    const nuevos = [2 * pareja + 1, 2 * pareja + 2];
    const n = rng.elegir(nuevos);
    const otro = nuevos.find((x) => x !== n)!;
    const conocido = pareja > 0 ? [rng.entero(1, 2 * pareja)] : [];
    const opciones = rng.barajar([n, otro, ...conocido]);
    const c = rng.elegir(COSAS);
    const x = palabraNumero(n);
    const hay = `${enPalabras(c, n)} ${nombre(c, n)}`;
    const forma = rng.entero(0, 3);
    const enunciado = [
      `Aquí hay ${hay}. Toca el número ${x}.`,
      `${may(rng.elegir(c.donde))} hay ${hay}. ¿Cuál es el número ${x}?`,
      `${nino(rng)} contó ${hay}. Toca el número ${x}.`,
      `Mira: ${hay} ${rng.elegir(c.donde)}. Busca el número ${x}.`,
    ][forma];
    return {
      enunciado,
      instruccion: `Busca el ${n}`,
      dibujo: { tipo: 'objetos', objeto: c.objeto, grupos: [n] },
      datos: { n },
      respuesta: n,
      distractores: opciones.filter((o) => o !== n),
      interaccion: { tipo: 'opciones', opciones },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: [`Hoy conocemos el ${nuevos[0]} y el ${nuevos[1]}.`, { tipo: 'texto', texto: n === 10 ? 'El diez se escribe con dos cifras: un 1 y un 0.' : COMO_SE_ESCRIBE[n] }, `Cuenta los dibujos: son ${n}.`],
      explicacion: `Este es el ${x}: ${n}.`,
    };
  },
};

// Filas de cosas con número, para secuencias y para «entre».
type Fila = { s: string; p: string; f: boolean; de: string };
const FILAS: Fila[] = [
  { s: 'poste', p: 'postes', f: false, de: 'del camino' },
  { s: 'casa', p: 'casas', f: true, de: 'de la vereda' },
  { s: 'puesto', p: 'puestos', f: false, de: 'del mercado' },
  { s: 'silla', p: 'sillas', f: true, de: 'del salón' },
  { s: 'surco', p: 'surcos', f: false, de: 'de la huerta' },
  { s: 'corral', p: 'corrales', f: false, de: 'de la finca' },
  { s: 'página', p: 'páginas', f: true, de: 'del cuaderno' },
  { s: 'camiseta', p: 'camisetas', f: true, de: 'del equipo' },
  { s: 'caja', p: 'cajas', f: true, de: 'de la bodega' },
  { s: 'escalón', p: 'escalones', f: false, de: 'de la escuela' },
  { s: 'turno', p: 'turnos', f: false, de: 'de la fila' },
  { s: 'casillero', p: 'casilleros', f: false, de: 'del salón' },
  { s: 'puerta', p: 'puertas', f: true, de: 'del colegio' },
  { s: 'mesa', p: 'mesas', f: true, de: 'del comedor' },
];

const secuencia: Plantilla = {
  id: 'inc-secuencia',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Completar una secuencia de números (1, 2, __): de uno en uno, de dos en dos o hacia atrás',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const a = avance(ctx);
    const largo = a < 0.5 ? 3 : 4;
    // Primero de uno en uno con el hueco al final; después hueco en cualquier lugar, hacia atrás y de dos en dos.
    const modo = a < 0.4 ? rng.elegir(['uno', 'fruta'] as const) : a < 0.7 ? rng.elegir(['uno', 'atras', 'fruta'] as const) : rng.elegir(['uno', 'atras', 'dos'] as const);
    const paso = modo === 'dos' ? 2 : modo === 'atras' ? -1 : 1;
    let numeros: number[];
    if (modo === 'dos') {
      const base = rng.elegir([1, 2]);
      const inicio = base + 2 * rng.entero(0, 5 - largo);
      numeros = Array.from({ length: largo }, (_, k) => inicio + 2 * k);
    } else {
      const inicio = rng.entero(1, 10 - largo + 1);
      numeros = Array.from({ length: largo }, (_, k) => inicio + k);
      if (modo === 'atras') numeros.reverse();
    }
    const hueco = a < 0.4 || modo === 'fruta' ? largo - 1 : rng.entero(0, largo - 1);
    const respuesta = numeros[hueco];
    const fila = numeros.map((x, k) => (k === hueco ? '__' : String(x))).join(', ');
    const cand = [respuesta + 1, respuesta - 1, respuesta + 2, respuesta - 2, respuesta + 3].filter((x) => x >= 1 && x <= 10 && !numeros.includes(x));
    const distr = distractores(rng, respuesta, cand, 2, 0.2).filter((x) => x >= 1);
    const opciones = mezclarOpciones(rng, respuesta, distr);
    const fi = rng.elegir(FILAS);
    const sujeto = `${fi.f ? 'Las' : 'Los'} ${fi.p} ${fi.de}`;
    const c = rng.elegir(COSAS);
    let enunciado: string;
    if (modo === 'fruta') enunciado = `${nino(rng)} cuenta ${c.varios}: ${fila}. ¿Qué número sigue?`;
    else if (modo === 'dos') enunciado = `${sujeto} van de dos en dos: ${fila}. ¿Qué número falta?`;
    else if (modo === 'atras') enunciado = rng.azar(0.75) ? `${sujeto} van hacia atrás: ${fila}. ¿Qué número falta?` : `${nino(rng)} cuenta hacia atrás: ${fila}. ¿Qué número falta?`;
    else enunciado = rng.elegir([`${sujeto} van en orden: ${fila}. ¿Qué número falta?`, `${sujeto} van en orden: ${fila}. ¿Qué número falta?`, `Los números van en orden: ${fila}. ¿Qué número falta?`, `${nino(rng)} cuenta ${fi.f ? 'las' : 'los'} ${fi.p}: ${fila}. ¿Qué número falta?`]);
    // El vecino que ayuda: el anterior en la fila o, si el hueco es el primero, el siguiente.
    const vecino = hueco > 0 ? numeros[hueco - 1] : numeros[1];
    const salto = hueco > 0 ? paso : -paso;
    const calculo: Calculo = salto > 0 ? { op: 'suma', a: vecino, b: salto } : { op: 'resta', a: vecino, b: -salto };
    const como = modo === 'dos' ? ', de dos en dos,' : modo === 'atras' ? ', hacia atrás,' : '';
    return {
      enunciado,
      instruccion: 'Completa la fila',
      dibujo: modo === 'fruta' ? { tipo: 'objetos', objeto: c.objeto, grupos: [respuesta] } : undefined,
      datos: { inicio: numeros[0], respuesta, paso: Math.abs(paso) },
      respuesta,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones },
      calculo,
      pistas: [
        modo === 'atras' ? 'Cuenta hacia atrás, despacio.' : modo === 'dos' ? 'Salta de dos en dos: uno sí, uno no.' : 'Cuenta en voz alta desde el primero.',
        { tipo: 'recta', min: 0, max: 10, desde: vecino, saltos: [salto] },
        hueco > 0 ? `Después del ${vecino}${como} viene el ${respuesta}.` : `Antes del ${vecino}${como} va el ${respuesta}.`,
      ],
      explicacion: `${numeros.join(', ')}: falta el ${respuesta}.`,
    };
  },
};

const mayorMenor: Plantilla = {
  id: 'inc-mayor-menor',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Comparar dos números hasta 10: ¿cuál es mayor o menor?',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const lejos = avance(ctx) < 0.5;
    const a = rng.entero(1, 10);
    const posibles = Array.from({ length: 10 }, (_, k) => k + 1).filter((x) => x !== a && (lejos ? Math.abs(x - a) >= 3 : Math.abs(x - a) <= 2));
    const b = rng.elegir(posibles);
    const mayor = rng.azar(0.5);
    const respuesta = mayor ? Math.max(a, b) : Math.min(a, b);
    const c = rng.elegir(COSAS);
    return {
      enunciado: `Mira: ${a} ${nombre(c, a)} y ${b} ${nombre(c, b)}. ¿Qué número es ${mayor ? 'mayor' : 'menor'}, ${a} o ${b}?`,
      instruccion: mayor ? 'Busca el mayor' : 'Busca el menor',
      dibujo: lejos ? { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] } : undefined,
      datos: { a, b },
      respuesta,
      distractores: [respuesta === a ? b : a],
      interaccion: { tipo: 'opciones', opciones: [a, b] },
      calculo: { op: 'resta', a: Math.max(a, b), b: Math.min(a, b) },
      pistas: [mayor ? 'El mayor es el grupo que tiene más.' : 'El menor es el grupo que tiene menos.', { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] }, `Al contar, el ${Math.min(a, b)} llega antes que el ${Math.max(a, b)}.`],
      explicacion: `${Math.max(a, b)} es mayor que ${Math.min(a, b)}. La respuesta es ${respuesta}.`,
    };
  },
};

const entre: Plantilla = {
  id: 'inc-entre',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: '¿Qué número va entre dos números? (hasta 20)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 20);
    const m = rng.entero(lerp(2, 8, avance(ctx)), max - 1);
    const distr = distractores(rng, m, [m + 2, m - 2, m + 10, m + 3].filter((x) => x >= 0 && x <= max), 2, 0.2);
    const min = Math.max(0, Math.min(m - 5, max - 10));
    const fi = rng.elegir(FILAS);
    const art = fi.f ? 'la' : 'el';
    const par = `${art} ${m - 1} y ${art} ${m + 1}`;
    const forma = rng.entero(0, 3);
    const enunciado = [
      `¿Qué número va entre el ${m - 1} y el ${m + 1}?`,
      `¿Qué ${fi.s} ${fi.de} va entre ${par}?`,
      `Busca ${art} ${fi.s} ${fi.de} que va entre ${par}.`,
      `Ayuda a ${nino(rng)} a encontrar ${art} ${fi.s} que va entre ${par}.`,
    ][forma];
    return {
      enunciado,
      instruccion: 'Busca el del medio',
      datos: { m },
      respuesta: m,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: mezclarOpciones(rng, m, distr) },
      calculo: { op: 'suma', a: m - 1, b: 1 },
      pistas: [`Cuenta: ${m - 1}, …, ${m + 1}. ¿Qué número dices en el medio?`, { tipo: 'recta', min, max: min + 10, desde: m - 1, saltos: [1] }, `Después del ${m - 1} viene el ${m}.`],
      explicacion: `${m - 1}, ${m}, ${m + 1}: entre el ${m - 1} y el ${m + 1} está el ${m}.`,
    };
  },
};

const descomponer: Plantilla = {
  id: 'inc-descomponer',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Descomponer un número: el 5 es 3 y 2',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const a0 = avance(ctx);
    const n = rng.entero(lerp(3, 6, a0), lerp(5, 10, a0));
    const a = rng.entero(1, n - 1);
    const b = n - a;
    const c = rng.elegir(COSAS);
    const distr = distractores(rng, b, [n, a, b + 1, b - 1].filter((x) => x >= 0 && x <= 10), 2, 0.2);
    const forma = rng.entero(0, 3);
    const enunciado = [
      `El ${n} es ${a} y ¿cuánto más? Mira: ${n} ${c.varios}, ${a} a un lado.`,
      `Hay ${n} ${c.varios} en dos grupos. En uno hay ${a}. ¿${cuantas(c)} hay en el otro?`,
      `${nino(rng)} hace dos grupos con ${n} ${c.varios}: ${a} y ¿${cuantas(c).toLowerCase()} más?`,
      `${may(rng.elegir(c.donde))} hay ${n} ${c.varios}: ${a} y ¿${cuantas(c).toLowerCase()} más?`,
    ][forma];
    return {
      enunciado,
      instruccion: 'Parte el número',
      dibujo: a0 < 0.5 ? { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] } : undefined,
      datos: { n, a, b },
      respuesta: b,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: mezclarOpciones(rng, b, distr) },
      calculo: { op: 'resta', a: n, b: a },
      pistas: [`Cuenta desde ${a} hasta ${n}. ¿Cuántos números dijiste?`, { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] }, `${a} y ${b} hacen ${n}.`],
      explicacion: `El ${n} es ${a} y ${b}: ${a} + ${b} = ${n}.`,
    };
  },
};

// --- Bloques 5 y 6: unir, quitar, sumar y restar ---

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

const cuento: Plantilla = {
  id: 'inc-cuento',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Cuentos cortos con dibujos: «Tenía 2, llegó 1»',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const tope = avance(ctx) < 0.5 ? 5 : 8;
    const resta = rng.azar(0.5);
    let a: number;
    let b: number;
    if (resta) {
      a = rng.entero(2, tope);
      b = rng.entero(1, a - 1);
    } else {
      a = rng.entero(1, tope - 1);
      b = rng.entero(1, tope - a);
    }
    const r = resta ? a - b : a + b;
    const { c, texto, pregunta } = escena(rng, !resta, a, b);
    const distr = distractores(rng, r, [resta ? a + b : Math.abs(a - b), r + 1, r - 1], 2, 0.2);
    const dibujo: Visual = resta ? { tipo: 'objetos', objeto: c.objeto, grupos: [a], tachados: b } : { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] };
    return {
      enunciado: `${texto} ${pregunta}`,
      instruccion: resta ? 'Quita' : 'Junta',
      dibujo,
      datos: { a, b },
      respuesta: r,
      unidad: c.varios,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: mezclarOpciones(rng, r, distr) },
      calculo: { op: resta ? 'resta' : 'suma', a, b },
      operacion: resta ? 'resta' : 'suma',
      pistas: ['¿Ahora hay más o menos que antes?', dibujo, resta ? 'Cuenta los que no están tachados.' : 'Cuenta todos los dibujos.'],
      explicacion: `${a} ${resta ? '−' : '+'} ${b} = ${r}. ${resta ? 'Quedan' : 'Ahora son'} ${r} ${nombre(c, r)}.`,
    };
  },
};

/** Maneras de pedir una cuenta sin dibujos (e = «3 + 2»). */
const PIDE_CUENTA: ((e: string, rng: Rng) => string)[] = [
  (e) => `¿Cuánto es ${e}?`,
  (e) => `Resuelve: ${e}.`,
  (e) => `Calcula ${e}.`,
  (e, rng) => `Ayuda a ${nino(rng)} con la cuenta: ${e}.`,
  (e) => `En el tablero dice ${e}. ¿Cuánto da?`,
  (e, rng) => `${nino(rng)} escribió ${e} en el cuaderno. ¿Cuánto da?`,
  (e) => `Cuenta con los dedos: ${e}.`,
  (e) => `La profe pregunta: ¿cuánto es ${e}?`,
  (e, rng) => `${nino(rng)} quiere saber cuánto es ${e}.`,
  (e) => `Piensa y responde: ${e}.`,
  (e) => `Haz la cuenta ${e}.`,
  (e) => `¿Qué número da ${e}?`,
  (e, rng) => `En la tienda, ${nino(rng)} hace la cuenta ${e}. ¿Cuánto da?`,
  (e) => `Usa la recta si quieres: ${e}.`,
  (e, rng) => `${nino(rng)} tiene la tarjeta ${e}. ¿Cuánto da?`,
  (e) => `Mira la cuenta ${e}. ¿Cuál es el resultado?`,
  (e) => `Busca el resultado de ${e}.`,
  (e, rng) => `${nino(rng)} y su abuela hacen la cuenta ${e}. ¿Cuánto da?`,
  (e) => `Di cuánto es ${e}.`,
  (e) => `Resuelve con calma: ${e}.`,
  (e) => `En el juego de la escuela sale ${e}. ¿Cuánto da?`,
  (e, rng) => `${nino(rng)} hace cuentas en la huerta escolar: ${e}. ¿Cuánto da?`,
  (e) => `Despacio, con los dedos: ¿cuánto es ${e}?`,
  (e, rng) => `Juega con ${nino(rng)}: ¿cuánto es ${e}?`,
];

const operar: Plantilla = {
  id: 'inc-operar',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Sumas y restas hasta 5 y luego hasta 10, con o sin dibujos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = avance(ctx) < 0.5 ? 5 : 10;
    const op = pt(ctx, 'op', 'suma');
    const resta = op === 'resta' || (op === 'mixta' && rng.azar(0.5));
    const conDibujo = pb(ctx, 'dibujo');
    let a: number;
    let b: number;
    if (resta) {
      a = rng.entero(2, max);
      b = rng.entero(1, a - 1);
    } else {
      a = rng.entero(1, max - 1);
      b = rng.entero(1, max - a);
    }
    const r = resta ? a - b : a + b;
    const c = rng.elegir(COSAS);
    const calc = { op: resta ? ('resta' as const) : ('suma' as const), a, b };
    // Sin dibujos, a veces se responde escribiendo el número con el dedo.
    const modo = conDibujo
      ? (() => {
          const distr = distractores(rng, r, [r + 1, r - 1, resta ? a + b : Math.abs(a - b)], 2, 0.2);
          return { interaccion: { tipo: 'opciones' as const, opciones: mezclarOpciones(rng, r, distr) }, distractores: distr };
        })()
      : modoRespuesta({ ...ctx, params: { ...ctx.params, escribir: true } }, r, calc, { abiertaMin: 0, abiertaMax: 0.5, cantidad: 2 });
    // Sin dibujos, la ayuda es la recta: saltos hacia adelante o hacia atrás.
    const visual: Visual = conDibujo
      ? resta
        ? { tipo: 'objetos', objeto: c.objeto, grupos: [a], tachados: b }
        : { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] }
      : { tipo: 'recta', min: 0, max: 10, desde: a, saltos: Array(b).fill(resta ? -1 : 1) };
    const e = `${a} ${resta ? '−' : '+'} ${b}`;
    const lugar = rng.elegir(c.donde);
    const enunciado = conDibujo
      ? [`Mira ${los(c)} ${c.varios} ${lugar}. ¿Cuánto es ${e}?`, `Mira ${los(c)} ${c.varios}. ¿Cuánto es ${e}?`, `Cuenta ${los(c)} ${c.varios}: ¿cuánto es ${e}?`, `¿Cuánto es ${e}? Mira ${los(c)} ${c.varios}.`][rng.entero(0, 3)]
      : rng.elegir(PIDE_CUENTA)(e, rng);
    return {
      enunciado,
      instruccion: resta ? 'Resta' : 'Suma',
      dibujo: conDibujo ? visual : undefined,
      datos: { a, b },
      respuesta: r,
      ...modo,
      calculo: calc,
      operacion: resta ? 'resta' : 'suma',
      pistas: [
        resta ? `Empieza en ${a} y cuenta ${b} hacia atrás.` : `Empieza en ${Math.max(a, b)} y cuenta ${Math.min(a, b)} más.`,
        visual,
        conDibujo ? (resta ? 'Tacha y cuenta los que quedan.' : 'Junta y cuenta todos.') : `Da ${b} ${b === 1 ? 'salto' : 'saltos'} desde el ${a}.`,
      ],
      explicacion: `${e} = ${r}.`,
    };
  },
};

// --- Bloque 7: decenas y cuentas hasta 100 ---

/** Lo que se empaca de a 10 y en qué (cajas, bolsas, canastas). */
const EMPAQUES: { c: Objeto; en: 'caja' | 'bolsa' | 'canasta' }[] = [
  { c: 'naranja', en: 'caja' },
  { c: 'mandarina', en: 'caja' },
  { c: 'aguacate', en: 'caja' },
  { c: 'huevo', en: 'caja' },
  { c: 'platano', en: 'caja' },
  { c: 'limon', en: 'bolsa' },
  { c: 'pan', en: 'bolsa' },
  { c: 'arepa', en: 'bolsa' },
  { c: 'semilla', en: 'bolsa' },
  { c: 'moneda', en: 'bolsa' },
  { c: 'mazorca', en: 'canasta' },
];
const LLEVAR = ['al mercado del pueblo', 'a la tienda de la vereda', 'a la cooperativa', 'a la escuela'];
const EN_LUGAR = ['en el mercado', 'en la tienda', 'en la cooperativa', 'en la escuela'];

const decenaUnidad: Plantilla = {
  id: 'inc-decenas',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Decenas y unidades con cajas de 10, hasta 30, 60 y 99',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = [30, 60, 99][Math.min(2, Math.floor(avance(ctx) * 3))];
    const emp = rng.elegir(EMPAQUES);
    const c = cosa(emp.c);
    const recs = `${emp.en}s`;
    const suelta = (k: number) => (c.f ? v(k, 'suelta', 'sueltas') : v(k, 'suelto', 'sueltos'));
    const construir = rng.azar(0.5);
    // Leyendo, siempre hay sueltas (para no decir «y 0 sueltas»).
    let n = rng.entero(11, max);
    if (!construir && n % 10 === 0) n = n < max ? n + rng.entero(1, Math.min(9, max - n)) : n - rng.entero(1, 9);
    const de = Math.floor(n / 10);
    const un_ = n % 10;
    const quien = adulto(rng).nombre;
    const bloques = { unidad: c.objeto, decena: emp.en };
    if (construir) {
      const enunciado = rng.elegir([
        `${may(quien)} va a llevar ${n} ${c.varios} ${rng.elegir(LLEVAR)}. Arma el número con ${recs} de 10 y ${c.varios} ${suelta(2)}.`,
        `Arma el ${n} con ${recs} de 10 y ${c.varios} ${suelta(2)}: son ${los(c)} ${c.varios} ${quien.startsWith('el ') ? `del ${quien.slice(3)}` : `de ${quien}`}.`,
        `${may(quien)} necesita ${n} ${c.varios}. Ayúdale: usa ${recs} de 10 y ${c.varios} ${suelta(2)}.`,
        `Lleva ${n} ${c.varios} ${rng.elegir(LLEVAR)}. Usa ${recs} de 10 y ${c.varios} ${suelta(2)}.`,
      ]);
      return {
        enunciado,
        instruccion: 'Arma el número',
        ilustracion: c.objeto,
        datos: { n, decenas: de, unidades: un_ },
        respuesta: n,
        distractores: [],
        interaccion: { tipo: 'bloques', modo: 'construir', valor: n, ...bloques },
        pistas: [`¿Cuántos grupos de 10 caben en ${n}?`, { tipo: 'bloques', valor: n, ...bloques }, `${n} = ${de} ${v(de, emp.en, recs)} de 10${un_ ? ` y ${un_} ${suelta(un_)}` : ', sin sueltas'}.`],
        explicacion: `${n} tiene ${de} ${v(de, 'decena', 'decenas')} y ${un_} ${v(un_, 'unidad', 'unidades')}: ${de} ${v(de, emp.en, recs)}${un_ ? ` y ${un_} ${nombre(c, un_)} ${suelta(un_)}` : ' y nada suelto'}.`,
      };
    }
    const calc = { op: 'suma' as const, a: de * 10, b: un_ };
    const modo = modoRespuesta(ctx, n, calc, { extras: [un_ * 10 + de, de + un_, n + 10, n - 10] });
    const tiene = `${de} ${v(de, emp.en, recs)} de 10 y ${un_} ${nombre(c, un_)} ${suelta(un_)}`;
    const enunciado = rng.elegir([
      `${may(quien)} empacó ${c.varios} en ${recs} de 10. Tiene ${de} ${v(de, emp.en, recs)} y ${un_} ${suelta(un_)}. ¿${cuantas(c)} ${c.varios} tiene?`,
      `${may(rng.elegir(EN_LUGAR))} hay ${tiene}. ¿${cuantas(c)} ${c.varios} hay?`,
      `Mira: ${tiene}. ¿${cuantas(c)} ${c.varios} son?`,
      `Ayuda a ${quien} a contar: ${tiene}. ¿${cuantas(c)} son?`,
    ]);
    return {
      enunciado,
      instruccion: 'Cuenta de 10 en 10',
      ilustracion: c.objeto,
      datos: { decenas: de, unidades: un_ },
      respuesta: n,
      unidad: c.varios,
      ...modo,
      calculo: calc,
      pistas: [`Cuenta las ${recs} de 10 en 10 y luego suma ${los(c)} ${suelta(2)}.`, { tipo: 'bloques', valor: n, ...bloques }, `${de} ${v(de, emp.en, recs)} ${v(de, 'es', 'son')} ${de * 10}; más ${un_} ${suelta(un_)}.`],
      explicacion: `${de * 10} + ${un_} = ${n}.`,
    };
  },
};

/** Par para sumar con resultado ≤ max (y sin llevar, si se pide). */
function parSuma(ctx: ContextoGeneracion, max: number, sinLlevar: boolean): [number, number] {
  const { rng } = ctx;
  for (let i = 0; i < 300; i++) {
    const total = rng.entero(Math.max(2, lerp(2, Math.floor(max * 0.6), dif(ctx))), max);
    const a = rng.entero(1, total - 1);
    const b = total - a;
    if (sinLlevar && contarLlevadas(a, b) > 0) continue;
    return [a, b];
  }
  return [1, 1];
}

/** Par para restar a − b > 0 con a ≤ max (y sin prestar, si se pide). */
function parResta(ctx: ContextoGeneracion, max: number, sinPrestar: boolean): [number, number] {
  const { rng } = ctx;
  for (let i = 0; i < 300; i++) {
    const a = rng.entero(Math.max(3, lerp(3, Math.floor(max * 0.6), dif(ctx))), max);
    const b = rng.entero(1, a - 1);
    if (sinPrestar && contarPrestamos(a, b) > 0) continue;
    return [a, b];
  }
  return [5, 2];
}

const calculo100: Plantilla = {
  id: 'inc-calculo',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Sumas y restas hasta 20 y luego hasta 99 sin llevar',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const hasta20 = avance(ctx) < 0.5;
    const max = hasta20 ? 20 : 99;
    const resta = rng.azar(0.5);
    const [a, b] = resta ? parResta(ctx, max, !hasta20) : parSuma(ctx, max, !hasta20);
    const r = resta ? a - b : a + b;
    const { c, texto } = escena(rng, !resta, a, b);
    const e = `${a} ${resta ? '−' : '+'} ${b}`;
    const calc = { op: resta ? ('resta' as const) : ('suma' as const), a, b };
    const modo = modoRespuesta({ ...ctx, params: { ...ctx.params, escribir: true } }, r, calc, { abiertaMin: 0.3, abiertaMax: 0.9 });
    // Hasta 20 se ayuda con dibujos; hasta 99, con decenas y unidades.
    const visual: Visual = hasta20 ? (resta ? { tipo: 'objetos', objeto: c.objeto, grupos: [a], tachados: b } : { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] }) : { tipo: 'bloques', valor: a };
    return {
      enunciado: `${texto} ${rng.azar(0.5) ? `Resuelve: ${e} = ?` : `¿Cuánto es ${e}?`}`,
      instruccion: resta ? 'Quita' : 'Suma',
      ilustracion: c.objeto,
      datos: { a, b },
      respuesta: r,
      ...modo,
      calculo: calc,
      operacion: resta ? 'resta' : 'suma',
      pistas: [
        hasta20 ? (resta ? '¿Quitar hace que queden más o menos?' : '¿Puedes empezar en el número mayor y seguir contando?') : resta ? 'Quita primero las unidades y luego las decenas.' : 'Suma primero las unidades y luego las decenas.',
        visual,
        hasta20
          ? resta
            ? `Desde ${a}, cuenta ${b} hacia atrás.`
            : `Desde ${Math.max(a, b)}, cuenta ${Math.min(a, b)} hacia adelante.`
          : `Unidades: ${a % 10} ${resta ? '−' : '+'} ${b % 10} = ${resta ? (a % 10) - (b % 10) : (a % 10) + (b % 10)}. Decenas: ${Math.floor(a / 10)} ${resta ? '−' : '+'} ${Math.floor(b / 10)} = ${resta ? Math.floor(a / 10) - Math.floor(b / 10) : Math.floor(a / 10) + Math.floor(b / 10)}.`,
      ],
      explicacion: `${e} = ${r}.`,
    };
  },
};

// --- Bloque 6: plantillas de 1.º por fases ---

const problemaJuntar = porFases('inc-problema-juntar', sumaCambio, [{ max: 5, escribir: true }, { max: 10, escribir: true }], 'Problemas de juntar hasta 5 y luego hasta 10');
const problemaComparar = porFases('inc-problema-comparar', comparaDiferencia, [{ max: 5, escribir: true }, { max: 10, escribir: true }], 'Problemas de comparar hasta 5 y luego hasta 10');

export const inclusion: DefinicionPista = {
  pista: 'inclusion',
  limite: 100,
  plantillas: [
    clasificar,
    diferente,
    tamanos,
    unoMuchosNinguno,
    masMenos,
    contar,
    trazar,
    emparejar,
    numeral,
    ordenar,
    reconocer,
    secuencia,
    mayorMenor,
    siguiente,
    entre,
    descomponer,
    sumaJuntar,
    restaQuitar,
    cuento,
    operar,
    problemaJuntar,
    problemaComparar,
    decenaUnidad,
    calculo100,
  ],
  bloques: [
    { titulo: 'Antes de los números', niveles: 4 },
    { titulo: 'Números del 1 al 3', niveles: 3 },
    { titulo: 'Números del 1 al 10', niveles: 4 },
    { titulo: 'Números del 1 al 20', niveles: 3 },
    { titulo: 'Unir y quitar con objetos', niveles: 3 },
    { titulo: 'Suma y resta', niveles: 4 },
    { titulo: 'Decenas y números hasta 100', niveles: 2 },
  ],
  temas: [
    // 1. Antes de los números (sin cifras)
    { titulo: 'Clasificar por color, forma y tamaño', idea: 'Las cosas que se parecen van juntas: por su color, por su forma o por su tamaño.', usos: [u(clasificar), u(diferente)] },
    { titulo: 'Alto y bajo, grande y pequeño, largo y corto', idea: 'Miramos dos cosas y decimos cuál es más alta, más grande o más larga.', usos: [u(tamanos)] },
    { titulo: 'Uno, muchos y ninguno', idea: 'Uno es solo uno. Muchos es la canasta llena. Ninguno es la canasta vacía.', usos: [u(unoMuchosNinguno)] },
    { titulo: 'Más, menos e igual', idea: 'Hacemos parejas: donde sobran hay más; si no sobra ninguno, es igual.', usos: [u(masMenos)] },
    // 2. Números del 1 al 3
    { titulo: 'Reconocer y contar 1, 2 y 3', idea: 'Tocamos cada cosa una vez y decimos: 1, 2, 3.', usos: [u(contar, { min: 1, max: 3 }), u(trazar, { desde: 1, hasta: 3 })] },
    { titulo: 'Cantidad y número', idea: 'Cada número dice cuántas cosas hay: el 2 son dos cosas.', usos: [u(emparejar, { max: 3 }), u(numeral, { max: 3 })] },
    { titulo: 'Ordenar 3 objetos por su altura', idea: 'Primero el más bajo, luego el del medio y al final el más alto.', usos: [u(ordenar)] },
    // 3. Números del 1 al 10
    { titulo: 'Contar de uno en uno hasta 10', idea: 'Contamos despacio, tocando cada cosa una sola vez.', usos: [u(contar, { min: 1, max: 10 })] },
    { titulo: 'Conocer los números de dos en dos', idea: 'Conocemos los números de a dos: el 1 y el 2, luego el 3 y el 4… hasta el 10.', usos: [u(reconocer), u(trazar, { pareja: true })] },
    { titulo: 'Completar la fila: 1, 2, __', idea: 'Los números van en orden. Contamos para saber cuál falta.', usos: [u(secuencia)] },
    { titulo: 'Mayor y menor', idea: 'El número mayor tiene más cosas. El menor tiene menos.', usos: [u(mayorMenor)] },
    // 4. Números del 1 al 20
    { titulo: 'Contar y escribir hasta 20', idea: 'Contamos hasta 20 y escribimos el número con el dedo.', usos: [u(contar, { min: 5, max: 20, escribir: true })] },
    { titulo: 'Antes, después y entre', idea: 'Después del 7 viene el 8. Antes del 7 está el 6. Entre el 6 y el 8 está el 7.', usos: [u(siguiente, { max: 20 }), u(entre, { max: 20 })] },
    { titulo: 'Partir un número: el 5 es 3 y 2', idea: 'Un número se puede partir en dos grupos: el 5 es 3 y 2.', usos: [u(descomponer)] },
    // 5. Unir y quitar con objetos
    { titulo: 'Juntar dos grupos y contar todo', idea: 'Juntamos dos grupos en la canasta grande y contamos todo.', usos: [u(sumaJuntar, { max: 10 })] },
    { titulo: 'Quitar y contar lo que queda', idea: 'Quitamos algunos y contamos los que quedan.', usos: [u(restaQuitar, { max: 10 })] },
    { titulo: 'Cuentos cortos con dibujos', idea: 'Escuchamos el cuento y miramos el dibujo: tenía 2, llegó 1, ahora tiene 3.', usos: [u(cuento)] },
    // 6. Suma y resta
    { titulo: 'Sumas hasta 5 y luego hasta 10', idea: 'Sumar es juntar. 3 + 2 es juntar 3 y 2.', usos: [u(operar, { op: 'suma', dibujo: true })] },
    { titulo: 'Restas hasta 5 y luego hasta 10', idea: 'Restar es quitar. 5 − 2 es quitar 2 de 5.', usos: [u(operar, { op: 'resta', dibujo: true })] },
    { titulo: 'Sumar y restar sin dibujos', idea: 'Ahora sin dibujos: puedes contar con los dedos.', usos: [u(operar, { op: 'mixta' })] },
    { titulo: 'Problemas sencillos', idea: 'Leemos el problema y pensamos: ¿se junta o se quita?', usos: [u(problemaJuntar), u(problemaComparar)] },
    // 7. Decenas y números hasta 100
    { titulo: 'Decena y unidad', idea: 'Una decena es una caja de 10. Las sueltas son las unidades.', usos: [u(decenaUnidad)] },
    { titulo: 'Sumas y restas hasta 20 y hasta 100', idea: 'Primero hasta 20. Después hasta 100: sumamos las unidades y luego las decenas.', usos: [u(calculo100)] },
  ],
};
