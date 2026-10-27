// Grado Inclusión: actividades muy guiadas y predecibles para niños con autismo y otros
// espectros. Números pequeños, una sola instrucción, dibujos grandes y nada de presión:
// en esta ruta nunca se pierde (ver motor y Ejercicio en modo «inclusion»).

import type { DefinicionPista, EjercicioBase, Objeto, Plantilla, Uso } from '../../juego/tipos';
import { COMO_SE_ESCRIBE, NOMBRES_CIFRA } from '../cifras';
import { plantillasG1 } from './g1';
import { pn } from './util';

const { contar, comparar, sumaJuntar, restaQuitar } = plantillasG1;

const OBJETOS: Objeto[] = ['gallina', 'huevo', 'naranja', 'mazorca', 'aguacate', 'mandarina', 'limon', 'platano', 'arepa', 'moneda'];
const NOMBRES: Record<string, [string, string]> = {
  gallina: ['gallina', 'gallinas'],
  huevo: ['huevo', 'huevos'],
  naranja: ['naranja', 'naranjas'],
  mazorca: ['mazorca', 'mazorcas'],
  aguacate: ['aguacate', 'aguacates'],
  mandarina: ['mandarina', 'mandarinas'],
  limon: ['limón', 'limones'],
  platano: ['plátano', 'plátanos'],
  arepa: ['arepa', 'arepas'],
  moneda: ['moneda', 'monedas'],
};

const trazar: Plantilla = {
  id: 'inc-trazar',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Repasar una cifra con el dedo sobre la guía punteada',
  generar(ctx): EjercicioBase {
    const desde = pn(ctx, 'desde', 0);
    const hasta = pn(ctx, 'hasta', 9);
    const cifra = ctx.rng.entero(desde, hasta);
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
    const max = pn(ctx, 'max', 5);
    const n = rng.entero(1, max);
    const objeto = rng.elegir(OBJETOS);
    const otros = rng.barajar([n - 1, n + 1, n + 2, n - 2].filter((x) => x >= 1 && x <= max + 1));
    const opciones = rng.barajar([n, ...otros.slice(0, 1)]);
    const [uno, varios] = NOMBRES[objeto];
    return {
      enunciado: `Toca el grupo que tiene ${n} ${n === 1 ? uno : varios}.`,
      instruccion: `Busca el ${n}`,
      ilustracion: objeto,
      datos: { n },
      respuesta: n,
      distractores: opciones.filter((o) => o !== n),
      interaccion: { tipo: 'emparejar', objeto, opciones },
      calculo: { op: 'conteo', a: n, b: 0 },
      pistas: ['Cuenta los dibujos de cada grupo.', { tipo: 'objetos', objeto, grupos: [n] }, `Así se ven ${n}.`],
      explicacion: `Este grupo tiene ${n}: ${Array.from({ length: n }, (_, k) => k + 1).join(', ')}.`,
    };
  },
};

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

export const inclusion: DefinicionPista = {
  pista: 'inclusion',
  limite: 20,
  plantillas: [contar, comparar, sumaJuntar, restaQuitar, trazar, emparejar],
  temas: [
    { titulo: 'Mirar y tocar: 1, 2 y 3', usos: [u(contar, { max: 3 })] },
    { titulo: 'Contar hasta 5', usos: [u(contar, { max: 5 }), u(emparejar, { max: 3 })] },
    { titulo: 'Escribir del 0 al 4', usos: [u(trazar, { desde: 0, hasta: 4 })] },
    { titulo: 'Escribir del 5 al 9', usos: [u(trazar, { desde: 5, hasta: 9 })] },
    { titulo: 'Contar hasta 10', usos: [u(contar, { max: 10 }), u(contar, { max: 10, escribir: true })] },
    { titulo: 'Número y cantidad', usos: [u(emparejar, { max: 5 })] },
    { titulo: '¿Dónde hay más?', usos: [u(comparar, { max: 5 })] },
    { titulo: 'Juntar en la canasta', usos: [u(sumaJuntar, { max: 5 })] },
    { titulo: 'Quitar de la canasta', usos: [u(restaQuitar, { max: 5 })] },
    { titulo: 'Repaso: contar, escribir y juntar', usos: [u(contar, { max: 10 }), u(trazar, { desde: 0, hasta: 9 }), u(emparejar, { max: 5 }), u(sumaJuntar, { max: 5 })] },
  ],
};
