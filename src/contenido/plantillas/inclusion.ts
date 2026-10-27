// Grado Inclusión: actividades muy guiadas y predecibles para niños con autismo y otros
// espectros. Una sola instrucción, dibujos grandes y nada de presión: en esta ruta nunca se
// pierde (ver motor y Ejercicio en modo «inclusion»).
//
// La ruta tiene 7 bloques y 23 niveles, del pre-número (sin cifras) a las decenas y las sumas
// hasta 100. Dentro de un nivel, las preguntas avanzan por fases según d (p. ej., sumas hasta 5
// y luego hasta 10).

import type { ColorFigura, ContextoGeneracion, DefinicionPista, EjercicioBase, Figura, FormaFigura, Objeto, OpcionFigura, Parametros, Plantilla, Uso, Visual } from '../../juego/tipos';
import { COMO_SE_ESCRIBE, NOMBRES_CIFRA } from '../cifras';
import { persona } from '../contexto';
import { plantillasG1 } from './g1';
import { dif, distractores, lerp, mezclarOpciones, modoRespuesta, pb, pn, pt } from './util';

const { siguiente, sumaJuntar, restaQuitar, sumaCambio, comparaDiferencia, decenas, sumaCalculo } = plantillasG1;

// --- Cosas para contar, con su nombre ---

type Cosa = { objeto: Objeto; uno: string; varios: string; f: boolean };

const COSAS: Cosa[] = [
  { objeto: 'gallina', uno: 'gallina', varios: 'gallinas', f: true },
  { objeto: 'huevo', uno: 'huevo', varios: 'huevos', f: false },
  { objeto: 'naranja', uno: 'naranja', varios: 'naranjas', f: true },
  { objeto: 'aguacate', uno: 'aguacate', varios: 'aguacates', f: false },
  { objeto: 'mandarina', uno: 'mandarina', varios: 'mandarinas', f: true },
  { objeto: 'limon', uno: 'limón', varios: 'limones', f: false },
  { objeto: 'mazorca', uno: 'mazorca', varios: 'mazorcas', f: true },
  { objeto: 'platano', uno: 'plátano', varios: 'plátanos', f: false },
  { objeto: 'arepa', uno: 'arepa', varios: 'arepas', f: true },
];
/** Frutas y cosas que se ven bien grandes y pequeñas. */
const TAMANOS: Cosa[] = COSAS.filter((c) => ['gallina', 'naranja', 'aguacate', 'mandarina', 'limon', 'huevo'].includes(c.objeto));

const nombre = (c: Cosa, n: number) => (n === 1 ? c.uno : c.varios);
const un = (c: Cosa) => (c.f ? 'una' : 'un');
const cuantas = (c: Cosa) => (c.f ? 'Cuántas' : 'Cuántos');
const palabraNumero = (n: number) => (n === 10 ? 'diez' : NOMBRES_CIFRA[n]);

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

const COLORES: ColorFigura[] = ['rojo', 'azul', 'amarillo', 'verde'];
const FORMAS_F: FormaFigura[] = ['circulo', 'cuadrado', 'triangulo'];
const COLOR_F: Record<ColorFigura, { m: string; f: string; mp: string; fp: string }> = {
  rojo: { m: 'rojo', f: 'roja', mp: 'rojos', fp: 'rojas' },
  azul: { m: 'azul', f: 'azul', mp: 'azules', fp: 'azules' },
  amarillo: { m: 'amarillo', f: 'amarilla', mp: 'amarillos', fp: 'amarillas' },
  verde: { m: 'verde', f: 'verde', mp: 'verdes', fp: 'verdes' },
};
const FORMA_N: Record<FormaFigura, [string, string]> = {
  circulo: ['círculo', 'círculos'],
  cuadrado: ['cuadrado', 'cuadrados'],
  triangulo: ['triángulo', 'triángulos'],
};

const clasificar: Plantilla = {
  id: 'inc-clasificar',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Clasificar figuras en dos canastas por color, forma o tamaño',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cantidad = avance(ctx) < 0.5 ? 4 : 6;
    const criterio = rng.elegir(['color', 'forma', 'tamano'] as const);
    // La mitad va a cada canasta.
    const destinos = rng.barajar(Array.from({ length: cantidad }, (_, k) => k % 2));
    let items: OpcionFigura[];
    let grupos: [OpcionFigura, OpcionFigura];
    let enunciado: string;
    let regla: string;
    if (criterio === 'color') {
      const [c0, c1] = rng.barajar(COLORES);
      const cs = [c0, c1];
      items = destinos.map((g, k) => {
        const forma = rng.elegir(FORMAS_F);
        return { id: `f${k}`, etiqueta: `${FORMA_N[forma][0]} ${COLOR_F[cs[g]].m}`, figura: { forma, color: cs[g] } };
      });
      grupos = [0, 1].map((g) => ({ id: `g${g}`, etiqueta: `Canasta ${COLOR_F[cs[g]].f}`, figura: { forma: 'circulo', color: cs[g] } as Figura })) as [OpcionFigura, OpcionFigura];
      enunciado = `Pon cada figura en la canasta de su color: las ${COLOR_F[c0].fp} en la canasta ${COLOR_F[c0].f} y las ${COLOR_F[c1].fp} en la canasta ${COLOR_F[c1].f}.`;
      regla = 'Mira el color de cada figura.';
    } else if (criterio === 'forma') {
      const [f0, f1] = rng.barajar(FORMAS_F);
      const fs = [f0, f1];
      items = destinos.map((g, k) => {
        const color = rng.elegir(COLORES);
        return { id: `f${k}`, etiqueta: `${FORMA_N[fs[g]][0]} ${COLOR_F[color].m}`, figura: { forma: fs[g], color } };
      });
      grupos = [0, 1].map((g) => ({ id: `g${g}`, etiqueta: `Canasta de ${FORMA_N[fs[g]][1]}`, figura: { forma: fs[g] } as Figura })) as [OpcionFigura, OpcionFigura];
      enunciado = `Pon cada figura en la canasta de su forma: los ${FORMA_N[f0][1]} con los ${FORMA_N[f0][1]} y los ${FORMA_N[f1][1]} con los ${FORMA_N[f1][1]}.`;
      regla = 'Mira la forma de cada figura, no el color.';
    } else {
      const c = rng.elegir(TAMANOS);
      const g = c.f ? ['grandes', 'pequeñas'] : ['grandes', 'pequeños'];
      const escalas = [1, 0.55];
      items = destinos.map((d, k) => ({ id: `f${k}`, etiqueta: `${c.uno} ${d === 0 ? 'grande' : c.f ? 'pequeña' : 'pequeño'}`, figura: { objeto: c.objeto, escala: escalas[d] } }));
      grupos = [0, 1].map((d) => ({ id: `g${d}`, etiqueta: `Canasta de ${c.f ? 'las' : 'los'} ${g[d]}`, figura: { objeto: c.objeto, escala: escalas[d] * 0.9 } as Figura })) as [OpcionFigura, OpcionFigura];
      enunciado = `Pon cada ${c.uno} en su canasta: ${c.f ? 'las' : 'los'} ${g[0]} con ${c.f ? 'las' : 'los'} ${g[0]} y ${c.f ? 'las' : 'los'} ${g[1]} con ${c.f ? 'las' : 'los'} ${g[1]}.`;
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
    let figuras: Figura[];
    let etiquetas: string[];
    let enunciado: string;
    // Las figuras son masculinas (círculo, cuadrado, triángulo); las cosas, según su nombre.
    let articulo = 'el';
    if (criterio === 'color') {
      const forma = rng.elegir(FORMAS_F);
      const [c0, c1] = rng.barajar(COLORES);
      figuras = Array.from({ length: cantidad }, (_, k) => ({ forma, color: k === raro ? c1 : c0 }));
      etiquetas = figuras.map((_, k) => `${FORMA_N[forma][0]} ${COLOR_F[k === raro ? c1 : c0].m}`);
      enunciado = `Todos estos ${FORMA_N[forma][1]} son ${COLOR_F[c0].mp} menos uno. Toca el ${FORMA_N[forma][0]} de otro color.`;
    } else if (criterio === 'forma') {
      const color = rng.elegir(COLORES);
      const [f0, f1] = rng.barajar(FORMAS_F);
      figuras = Array.from({ length: cantidad }, (_, k) => ({ forma: k === raro ? f1 : f0, color }));
      etiquetas = figuras.map((_, k) => `${FORMA_N[k === raro ? f1 : f0][0]} ${COLOR_F[color].m}`);
      enunciado = `Mira las figuras ${COLOR_F[color].fp}. Toca la que tiene otra forma.`;
    } else {
      const c = rng.elegir(TAMANOS);
      articulo = c.f ? 'la' : 'el';
      const grandes = rng.azar(0.5);
      const [e0, e1] = grandes ? [1, 0.5] : [0.5, 1];
      figuras = Array.from({ length: cantidad }, (_, k) => ({ objeto: c.objeto, escala: k === raro ? e1 : e0 }));
      const t = (e: number) => (e === 1 ? 'grande' : c.f ? 'pequeña' : 'pequeño');
      etiquetas = figuras.map((_, k) => `${c.uno} ${t(k === raro ? e1 : e0)}`);
      enunciado = `Mira ${c.f ? 'las' : 'los'} ${c.varios}. Toca ${c.f ? 'la' : 'el'} que es de otro tamaño.`;
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

const tamanos: Plantilla = {
  id: 'inc-tamanos',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Alto y bajo, grande y pequeño, largo y corto: tocar el que se pide',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const tres = avance(ctx) >= 0.5;
    const tipo = rng.elegir(['alto', 'grande', 'largo'] as const);
    const mayor = rng.azar(0.5);
    // Medidas de menor a mayor; con tres, la del medio no es la respuesta.
    let medidas: { figura: Figura; etiqueta: string }[];
    let pregunta: string;
    let palabra: string;
    let articulo = 'el';
    if (tipo === 'alto') {
      articulo = 'la';
      const altos = tres ? [1, 3, 5] : rng.elegir([[1, 4], [2, 5]]);
      medidas = altos.map((n, k) => ({ figura: { torre: n }, etiqueta: `torre ${k === 0 ? 'baja' : k === altos.length - 1 ? 'alta' : 'mediana'}` }));
      palabra = mayor ? 'alta' : 'baja';
      pregunta = `Toca la torre de cajas más ${palabra}.`;
    } else if (tipo === 'grande') {
      const c = rng.elegir(TAMANOS);
      const escalas = tres ? [0.45, 0.72, 1] : [0.5, 1];
      const peq = c.f ? 'pequeña' : 'pequeño';
      articulo = c.f ? 'la' : 'el';
      medidas = escalas.map((e, k) => ({ figura: { objeto: c.objeto, escala: e }, etiqueta: `${c.uno} ${k === 0 ? peq : k === escalas.length - 1 ? 'grande' : c.f ? 'mediana' : 'mediano'}` }));
      palabra = mayor ? 'grande' : peq;
      pregunta = `Toca ${c.f ? 'la' : 'el'} ${c.uno} más ${palabra}.`;
    } else {
      const largos = tres ? [0.3, 0.6, 1] : [0.35, 1];
      medidas = largos.map((l, k) => ({ figura: { lazo: l }, etiqueta: `lazo ${k === 0 ? 'corto' : k === largos.length - 1 ? 'largo' : 'mediano'}` }));
      palabra = mayor ? 'largo' : 'corto';
      pregunta = `Toca el lazo más ${palabra}.`;
    }
    const correcta = mayor ? medidas.length - 1 : 0;
    const opciones = rng.barajar(medidas.map((m, k) => ({ id: `m${k}`, etiqueta: m.etiqueta, figura: m.figura })));
    return {
      enunciado: pregunta,
      instruccion: 'Compara y toca',
      datos: { opciones: medidas.length },
      respuesta: `m${correcta}`,
      distractores: medidas.map((_, k) => `m${k}`).filter((id) => id !== `m${correcta}`),
      interaccion: { tipo: 'figuras', opciones },
      pistas: [
        tipo === 'alto' ? 'Mira hasta dónde llega cada torre.' : tipo === 'grande' ? 'Mira cuál ocupa más espacio.' : 'Pon el dedo en una punta y recorre cada lazo.',
        { tipo: 'figuras', figuras: [{ id: 'r', etiqueta: medidas[correcta].etiqueta, figura: medidas[correcta].figura }] },
        `Busca ${articulo} más ${palabra}.`,
      ],
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
    const c = rng.elegir(COSAS);
    const muchos = rng.entero(lerp(5, 6, avance(ctx)), lerp(6, 9, avance(ctx)));
    const pide = rng.elegir(['uno', 'muchos', 'ninguno'] as const);
    const muchas = c.f ? 'muchas' : 'muchos';
    const canastas: OpcionFigura[] = [
      { id: 'uno', etiqueta: `canasta con ${un(c)} ${c.uno}`, figura: { objeto: c.objeto, cantidad: 1 } },
      { id: 'muchos', etiqueta: `canasta con ${muchas} ${c.varios}`, figura: { objeto: c.objeto, cantidad: muchos } },
      { id: 'ninguno', etiqueta: 'canasta vacía', figura: { objeto: c.objeto, cantidad: 0 } },
    ];
    const enunciado =
      pide === 'uno'
        ? `Toca la canasta que tiene ${un(c)} ${c.uno}.`
        : pide === 'muchos'
          ? `Toca la canasta que tiene ${muchas} ${c.varios}.`
          : `Toca la canasta que no tiene ${c.f ? 'ninguna' : 'ningún'} ${c.uno}: está vacía.`;
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
    const c = rng.elegir(COSAS);
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
    return {
      enunciado: `¿Qué canasta tiene ${pregunta} ${c.varios}? Si tienen lo mismo, toca «Igual».`,
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
    const distr = max <= 3 ? [1, 2, 3].filter((x) => x !== n) : distractores(rng, n, [n + 1, n - 1], 2, 1).filter((x) => x > 0);
    const opciones = mezclarOpciones(rng, n, distr.length ? distr : [n + 1]);
    return {
      enunciado: `Toca cada ${c.uno} una sola vez para contar${c.f ? 'la' : 'lo'}. ¿${cuantas(c)} ${c.varios} hay?`,
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
    const cifra = pb(ctx, 'pareja') ? cifraDeFase(ctx) : ctx.rng.entero(pn(ctx, 'desde', 0), pn(ctx, 'hasta', 9));
    return {
      enunciado: `Vamos a escribir el ${NOMBRES_CIFRA[cifra]}. Pon el dedo en el punto verde y sigue los puntitos.`,
      instruccion: 'Repasa con el dedo',
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
    return {
      enunciado: `Toca el grupo que tiene ${n} ${nombre(c, n)}.`,
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
    return {
      enunciado: `Mira ${c.f ? 'las' : 'los'} ${c.varios}. ¿Qué número dice cuántos hay?`,
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
    const tipo = rng.elegir(['arbol', 'mata', 'torre'] as const);
    const alReves = avance(ctx) >= 0.5 && rng.azar(0.5);
    const nombres = ['bajo', 'medio', 'alto'];
    const figuras: Figura[] = tipo === 'torre' ? [{ torre: 1 }, { torre: 3 }, { torre: 5 }] : [0.5, 0.75, 1].map((e) => ({ objeto: tipo, escala: e }));
    const cosa = tipo === 'arbol' ? ['árbol', 'árboles'] : tipo === 'mata' ? ['mata', 'matas'] : ['torre', 'torres de cajas'];
    const f = tipo !== 'arbol';
    const etiqueta = (k: number) => `${cosa[0]} ${k === 1 ? (f ? 'mediana' : 'mediano') : k === 0 ? (f ? 'baja' : 'bajo') : f ? 'alta' : 'alto'}`;
    const items = figuras.map((figura, k) => ({ id: nombres[k], etiqueta: etiqueta(k), figura }));
    let vista = rng.barajar(items);
    // Que no aparezcan ya ordenados.
    if (vista.map((x) => x.id).join() === 'bajo,medio,alto' || vista.map((x) => x.id).join() === 'alto,medio,bajo') vista = [items[1], items[2], items[0]];
    const orden = alReves ? [...nombres].reverse() : nombres;
    const extremo = (k: number) => `${f ? 'la' : 'el'} más ${k === 0 ? (f ? 'baja' : 'bajo') : f ? 'alta' : 'alto'}`;
    return {
      enunciado: `Toca ${f ? 'las' : 'los'} ${cosa[1]} en orden: primero ${extremo(alReves ? 2 : 0)} y al final ${extremo(alReves ? 0 : 2)}.`,
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
    return {
      enunciado: `Aquí hay ${palabraNumero(n)} ${nombre(c, n)}. Toca el número ${palabraNumero(n)}.`,
      instruccion: `Busca el ${n}`,
      dibujo: { tipo: 'objetos', objeto: c.objeto, grupos: [n] },
      datos: { n },
      respuesta: n,
      distractores: opciones.filter((o) => o !== n),
      interaccion: { tipo: 'opciones', opciones },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: [`Hoy conocemos el ${nuevos[0]} y el ${nuevos[1]}.`, { tipo: 'texto', texto: n === 10 ? 'El diez se escribe con dos cifras: un 1 y un 0.' : COMO_SE_ESCRIBE[n] }, `Cuenta los dibujos: son ${n}.`],
      explicacion: `Este es el ${palabraNumero(n)}: ${n}.`,
    };
  },
};

const secuencia: Plantilla = {
  id: 'inc-secuencia',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Completar una secuencia de números (1, 2, __)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const a = avance(ctx);
    const largo = a < 0.5 ? 3 : 4;
    const inicio = rng.entero(1, 10 - largo + 1);
    const numeros = Array.from({ length: largo }, (_, k) => inicio + k);
    const hueco = a < 0.4 ? largo - 1 : rng.entero(0, largo - 1);
    const respuesta = numeros[hueco];
    const fila = numeros.map((x, k) => (k === hueco ? '__' : String(x))).join(', ');
    const distr = distractores(rng, respuesta, [respuesta + 2, respuesta - 2, respuesta + 3].filter((x) => x >= 1 && x <= 10 && !numeros.includes(x)), 2, 0.2).filter((x) => x >= 1);
    const opciones = mezclarOpciones(rng, respuesta, distr);
    return {
      enunciado: `Los números van en orden: ${fila}. ¿Qué número falta?`,
      instruccion: 'Completa la fila',
      datos: { inicio, respuesta },
      respuesta,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones },
      calculo: { op: 'suma', a: respuesta - 1, b: 1 },
      pistas: ['Cuenta en voz alta desde el primero.', { tipo: 'recta', min: 0, max: 10, desde: respuesta - 1, saltos: [1] }, respuesta === 1 ? 'Contamos empezando por el 1.' : `Después del ${respuesta - 1} viene el ${respuesta}.`],
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
    return {
      enunciado: `¿Qué número va entre el ${m - 1} y el ${m + 1}?`,
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
    return {
      enunciado: `El ${n} es ${a} y ¿cuánto más? Mira: ${n} ${c.varios}, ${a} a un lado.`,
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

const cuento: Plantilla = {
  id: 'inc-cuento',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Cuentos cortos con dibujos: «Tenía 2, llegó 1»',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const tope = avance(ctx) < 0.5 ? 5 : 8;
    const resta = rng.azar(0.5);
    const c = rng.elegir(COSAS);
    const quien = persona(rng);
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
    const gallina = c.objeto === 'gallina';
    const frase = resta
      ? gallina
        ? `${b === 1 ? 'Se fue' : 'Se fueron'} ${b}.`
        : `Le regaló ${b} a su hermano.`
      : gallina
        ? `${b === 1 ? 'Llegó' : 'Llegaron'} ${b} más.`
        : `Su mamá le dio ${b} más.`;
    const distr = distractores(rng, r, [resta ? a + b : Math.abs(a - b), r + 1, r - 1], 2, 0.2);
    return {
      enunciado: `${quien.nombre} tenía ${a} ${nombre(c, a)}. ${frase} ¿${cuantas(c)} ${c.varios} ${resta ? 'le quedan' : 'tiene ahora'}?`,
      instruccion: resta ? 'Quita' : 'Junta',
      dibujo: resta ? { tipo: 'objetos', objeto: c.objeto, grupos: [a], tachados: b } : { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] },
      datos: { a, b },
      respuesta: r,
      unidad: c.varios,
      distractores: distr,
      interaccion: { tipo: 'opciones', opciones: mezclarOpciones(rng, r, distr) },
      calculo: { op: resta ? 'resta' : 'suma', a, b },
      operacion: resta ? 'resta' : 'suma',
      pistas: ['¿Ahora tiene más o menos que antes?', resta ? { tipo: 'objetos', objeto: c.objeto, grupos: [a], tachados: b } : { tipo: 'objetos', objeto: c.objeto, grupos: [a, b] }, resta ? 'Cuenta los que no están tachados.' : 'Cuenta todos los dibujos.'],
      explicacion: `${a} ${resta ? '−' : '+'} ${b} = ${r}. ${resta ? 'Le quedan' : 'Ahora tiene'} ${r} ${nombre(c, r)}.`,
    };
  },
};

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
    return {
      enunciado: conDibujo ? `Mira ${c.f ? 'las' : 'los'} ${c.varios}. ¿Cuánto es ${a} ${resta ? '−' : '+'} ${b}?` : `¿Cuánto es ${a} ${resta ? '−' : '+'} ${b}?`,
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
      explicacion: `${a} ${resta ? '−' : '+'} ${b} = ${r}.`,
    };
  },
};

// --- Bloques 6 y 7: plantillas de 1.º por fases ---

const problemaJuntar = porFases('inc-problema-juntar', sumaCambio, [{ max: 5, escribir: true }, { max: 10, escribir: true }], 'Problemas de juntar hasta 5 y luego hasta 10');
const problemaComparar = porFases('inc-problema-comparar', comparaDiferencia, [{ max: 5, escribir: true }, { max: 10, escribir: true }], 'Problemas de comparar hasta 5 y luego hasta 10');
const decenaUnidad = porFases('inc-decenas', decenas, [{ max: 30 }, { max: 60 }, { max: 99 }], 'Decenas y unidades con cajas de 10, hasta 30, 60 y 99');
const calculo100 = porFases('inc-calculo', sumaCalculo, [{ max: 20, op: 'mixta', escribir: true }, { max: 99, op: 'mixta', sinReagrupar: true, escribir: true }], 'Sumas y restas hasta 20 y luego hasta 99 sin llevar');

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
