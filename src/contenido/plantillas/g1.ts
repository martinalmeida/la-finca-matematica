// Plantillas de 1.º grado: conteo, comparación, suma y resta hasta 99 (sin reagrupar),
// decenas y unidades, completar a 10 y repartos en 2 o 3 partes.

import type { ContextoGeneracion, DefinicionPista, EjercicioBase, Plantilla, Uso } from '../../juego/tipos';
import { cuantos, dosPersonas, frutas, mayus, nombreCant, persona, productos, type Producto } from '../contexto';
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

const siguiente: Plantilla = {
  id: 'g1-siguiente',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Número anterior y siguiente en la recta (postes del camino)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 20);
    const n = rng.entero(2, max - 1);
    const despues = rng.azar(0.6);
    const respuesta = despues ? n + 1 : n - 1;
    const min = Math.max(0, Math.min(n - 5, max - 10));
    return {
      enunciado: `En el camino de herradura hay postes con números. ¿Qué número va justo ${despues ? 'después' : 'antes'} del ${n}? Tócalo en la recta.`,
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
      explicacion: `Justo ${despues ? 'después' : 'antes'} del ${n} está el ${respuesta}.`,
    };
  },
};

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
    const quien = persona(rng);
    return {
      enunciado: `${quien.nombre} camina por los postes del camino. Empieza en el ${a} y da ${b} ${b === 1 ? 'salto' : 'saltos'} hacia ${resta ? 'atrás' : 'adelante'}. ¿A qué número llega? Tócalo.`,
      instruccion: 'Salta en la recta',
      datos: { a, b },
      respuesta,
      distractores: [respuesta + 1, respuesta - 1].filter((x) => x >= 0),
      interaccion: { tipo: 'recta', min, max, paso: 1, inicio: a },
      calculo: { op: resta ? 'resta' : 'suma', a, b },
      pistas: [
        `¿Hacia dónde saltas: a los números más grandes o a los más pequeños?`,
        { tipo: 'recta', min, max, desde: a, saltos: Array(b).fill(resta ? -1 : 1) },
        `${a} ${resta ? '−' : '+'} ${b}: cuenta ${b} saltos desde el ${a}.`,
      ],
      explicacion: `Desde ${a}, ${b} saltos hacia ${resta ? 'atrás' : 'adelante'} llegan a ${respuesta}: ${a} ${resta ? '−' : '+'} ${b} = ${respuesta}.`,
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

const sumaJuntar: Plantilla = {
  id: 'g1-juntar',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Juntar arrastrando frutas a una canasta',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = Math.min(20, pn(ctx, 'max', 10));
    const [a, b] = parSumaHasta(ctx, max, false);
    const quien = persona(rng);
    const p = rng.elegir(frutas);
    const c = a + b;
    const distr = distractores(rng, c, [c + 1, c - 1, Math.abs(a - b)], 3, dif(ctx));
    return {
      enunciado: `${quien.nombre} tiene ${a} ${nombreCant(p, a)} en una canasta y ${b} en otra. Pasa ${p.genero === 'f' ? 'todas' : 'todos'} a la canasta grande. ¿${cuantos(p.genero)} ${p.plural} hay en total?`,
      instruccion: 'Arrastra y cuenta',
      ilustracion: p.objeto,
      datos: { a, b },
      respuesta: c,
      unidad: p.plural,
      distractores: distr,
      interaccion: { tipo: 'arrastrar', objeto: p.objeto, modo: 'juntar', a, b },
      calculo: { op: 'suma', a, b },
      pistas: [
        'Cuando juntas dos grupos, ¿tienes más o menos que antes?',
        { tipo: 'objetos', objeto: p.objeto, grupos: [a, b] },
        `Empieza en ${a} y sigue contando ${b} más.`,
      ],
      explicacion: `${a} + ${b} = ${c}. En la canasta grande hay ${c} ${nombreCant(p, c)}.`,
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

const restaQuitar: Plantilla = {
  id: 'g1-quitar',
  dimension: 'problemas',
  operacion: 'resta',
  descripcion: 'Quitar arrastrando: la mula se lleva mazorcas',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = Math.min(20, pn(ctx, 'max', 10));
    const [a, b] = parRestaHasta(ctx, max, false);
    const respuesta = a - b;
    const variantes = [
      {
        p: productos[0],
        texto: `En el canasto hay ${a} mazorcas de cacao. La mula se llevó ${b} para el secadero. Arrástralas a la mula. ¿Cuántas mazorcas quedan en el canasto?`,
        origen: { nombre: 'Canasto', dibujo: 'canasta' as const },
        destino: { nombre: 'La mula', dibujo: 'mula' as const },
      },
      {
        p: productos[1],
        texto: `En la cubeta había ${a} huevos. ${persona(rng).nombre} usó ${b} para las arepas del desayuno. Arrastra los que usó. ¿Cuántos huevos quedan?`,
        origen: { nombre: 'Cubeta', dibujo: 'cubeta' as const },
        destino: { nombre: 'Para las arepas', dibujo: 'arepa' as const },
      },
      {
        p: productos[2],
        texto: `${mayus(persona(rng).nombre)} llevó ${a} naranjas a la escuela y regaló ${b} en el refrigerio. Arrastra las que regaló. ¿Cuántas naranjas le quedan?`,
        origen: { nombre: 'Las que llevó', dibujo: 'nino' as const },
        destino: { nombre: 'Las que regaló' },
      },
    ];
    const v = rng.elegir(variantes);
    const distr = distractores(rng, respuesta, [a + b, respuesta + 1, respuesta - 1], 3, dif(ctx));
    return {
      enunciado: v.texto,
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
      explicacion: `${a} − ${b} = ${respuesta}. Quedan ${respuesta}.`,
    };
  },
};

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
    const variantes = [
      { obj: 'huevo' as const, t: `La cubeta de la abuela Carmen tiene espacio para ${total} huevos. Ya hay ${a}. ¿Cuántos huevos faltan para llenarla?`, u: 'huevos' },
      { obj: 'mazorca' as const, t: `El canasto de don Ramiro se llena con ${total} mazorcas. Ya tiene ${a}. ¿Cuántas mazorcas faltan para llenarlo?`, u: 'mazorcas' },
      { obj: 'naranja' as const, t: `En la canasta caben ${total} naranjas. ${persona(rng).nombre} ya puso ${a}. ¿Cuántas faltan para completar ${total}?`, u: 'naranjas' },
    ];
    const v = rng.elegir(variantes);
    const calc = { op: 'resta' as const, a: total, b: a };
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: [a, total + a] });
    return {
      enunciado: v.t,
      instruccion: `Completa ${total}`,
      ilustracion: v.obj,
      datos: { a, total },
      respuesta,
      unidad: v.u,
      ...modo,
      calculo: calc,
      pistas: [
        `¿Cuántos espacios vacíos quedan en el recipiente?`,
        { tipo: 'objetos', objeto: v.obj, grupos: [a], vacios: respuesta },
        `Cuenta desde ${a} hasta ${total}: ¿cuántos números dijiste?`,
      ],
      explicacion: `${a} + ${respuesta} = ${total}. Faltan ${respuesta}.`,
    };
  },
};

const decenas: Plantilla = {
  id: 'g1-decenas',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Decenas y unidades con cajas de 10',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const max = pn(ctx, 'max', 50);
    const n = rng.entero(11, max);
    const de = Math.floor(n / 10);
    const un = n % 10;
    const construir = rng.azar(0.5);
    const quien = rng.elegir(['Don Ramiro', 'Doña Rosa', 'La abuela Carmen']);
    if (construir) {
      return {
        enunciado: `${quien} va a llevar ${n} naranjas al mercado del pueblo. Arma el número con cajas de 10 y naranjas sueltas.`,
        instruccion: 'Arma el número',
        ilustracion: 'naranja',
        datos: { n, decenas: de, unidades: un },
        respuesta: n,
        distractores: [],
        interaccion: { tipo: 'bloques', modo: 'construir', valor: n, unidad: 'naranja', decena: 'caja' },
        pistas: [
          `¿Cuántos grupos de 10 caben en ${n}?`,
          { tipo: 'bloques', valor: n, unidad: 'naranja', decena: 'caja' },
          `${n} = ${de} cajas de 10 y ${un} sueltas.`,
        ],
        explicacion: `${n} tiene ${de} decenas y ${un} unidades: ${de} cajas y ${un} naranjas sueltas.`,
      };
    }
    const calc = { op: 'suma' as const, a: de * 10, b: un };
    const modo = modoRespuesta(ctx, n, calc, { extras: [un * 10 + de, de + un, n + 10, n - 10] });
    return {
      enunciado: `${quien} empacó naranjas en cajas de 10. Tiene ${de} cajas llenas y ${un} naranjas sueltas. ¿Cuántas naranjas tiene?`,
      instruccion: 'Cuenta de 10 en 10',
      ilustracion: 'naranja',
      datos: { decenas: de, unidades: un },
      respuesta: n,
      unidad: 'naranjas',
      ...modo,
      calculo: calc,
      pistas: [
        'Cuenta las cajas de 10 en 10 y luego suma las sueltas.',
        { tipo: 'bloques', valor: n, unidad: 'naranja', decena: 'caja' },
        `${de} cajas son ${de * 10}; más ${un} sueltas.`,
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
    const [a0, b0] = parRestaHasta(ctx, max, pb(ctx, 'sinReagrupar'));
    const a = a0;
    const b = b0;
    const [x, y] = dosPersonas(rng);
    const p = rng.elegir(contables);
    const respuesta = a - b;
    const menos = rng.azar(0.35);
    const calc = { op: 'resta' as const, a, b };
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: [a + b, a, b] });
    return {
      enunciado: menos
        ? `${y.nombre} ${p.verbo} ${b} ${nombreCant(p, b)} y ${x.nombre} ${p.verbo} ${a}. ¿${cuantos(p.genero)} ${p.plural} menos ${p.verbo} ${y.nombre}?`
        : `${x.nombre} ${p.verbo} ${a} ${nombreCant(p, a)} y ${y.nombre} ${p.verbo} ${b}. ¿${cuantos(p.genero)} ${p.plural} más ${p.verbo} ${x.nombre}?`,
      instruccion: 'Compara',
      ilustracion: p.objeto,
      datos: { a, b },
      respuesta,
      unidad: p.plural,
      ...modo,
      calculo: calc,
      pistas: [
        'Pon los dos grupos uno frente al otro. ¿Cuántos quedan sin pareja?',
        { tipo: 'objetos', objeto: p.objeto, grupos: [a, b] },
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
    const quien = persona(rng);
    return {
      enunciado: `${quien.nombre} juntó ${a} limones y ${b} mandarinas para la feria del pueblo. Dice que tiene ${propuesto} frutas. ¿Es razonable? Después, elige la mejor estimación.`,
      instruccion: '¿Tiene sentido?',
      ilustracion: 'limon',
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
export const plantillasG1 = { contar, comparar, sumaJuntar, restaQuitar };
