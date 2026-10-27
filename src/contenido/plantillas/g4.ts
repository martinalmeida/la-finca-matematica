// Plantillas de 4.º grado: números hasta 6 cifras, suma y resta con estimación,
// multiplicación por 1 y 2 cifras, división con residuo (divisor de 1 cifra),
// interpretación del residuo, doble/triple/cuádruple y problemas con dinero.

import type { Calculo, ContextoGeneracion, DefinicionPista, EjercicioBase, Objeto, Plantilla, Uso, Visual } from '../../juego/tipos';
import { divDos, divProblema, residuoContexto } from './g5';
import { adulto, arbolDe, articulosTienda, cuantos, dosPersonas, mayus, nombresFincas, num, persona, pesos } from '../contexto';
import {
  conCifras,
  contarLlevadas,
  dif,
  distractores,
  distractoresTipicos,
  lerp,
  mezclarOpciones,
  modoRespuesta,
  parResta,
  parSuma,
  pn,
  pt,
} from './util';

const POSICIONES = ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil', 'centenas de mil'];
const POSICIONES_UNA = ['unidad', 'decena', 'centena', 'unidad de mil', 'decena de mil', 'centena de mil'];

/** Desde 3.º, con d alto, se agrega un dato que sobra. */
function datoQueSobra(ctx: ContextoGeneracion): { texto: string; valor: number } | null {
  if (ctx.repaso || dif(ctx) < 0.6 || !ctx.rng.azar(0.6)) return null;
  const { rng } = ctx;
  const opciones = [
    () => {
      const v = rng.entero(3, 18);
      return { texto: ` La finca queda a ${v} kilómetros del casco urbano de San Vicente.`, valor: v };
    },
    () => {
      const v = rng.entero(2, 9);
      return { texto: ` En la finca trabajan ${v} personas.`, valor: v };
    },
    () => {
      const v = rng.entero(20, 60);
      return { texto: ` La finca tiene ${v} gallinas.`, valor: v };
    },
    () => {
      const v = rng.entero(2, 6);
      return { texto: ` La mula hace ${v} viajes por semana.`, valor: v };
    },
  ];
  return rng.elegir(opciones)();
}

/** Interacción algoritmo con distractores típicos. */
function algoritmo(op: 'suma' | 'resta' | 'multiplicacion', a: number, b: number, ctx: ContextoGeneracion) {
  const resp = op === 'suma' ? a + b : op === 'resta' ? a - b : a * b;
  return {
    interaccion: { tipo: 'algoritmo' as const, operacion: op, a, b },
    distractores: distractores(ctx.rng, resp, distractoresTipicos({ op, a, b }), 3, dif(ctx)),
  };
}

/** "de doña Rosa", "del profe Julián". */
function deQuien(nombre: string): string {
  return nombre.startsWith('el ') ? `del ${nombre.slice(3)}` : `de ${nombre}`;
}

function desglose(n: number): string {
  const cifras = String(n).split('').map(Number);
  const partes: string[] = [];
  cifras.forEach((c, i) => {
    const pos = cifras.length - 1 - i;
    // «1 unidad de mil», «3 unidades de mil».
    if (c > 0) partes.push(`${c} ${c === 1 ? POSICIONES_UNA[pos] : POSICIONES[pos]}`);
  });
  return partes.join(' + ');
}

const valorPosicional: Plantilla = {
  id: 'g4-valor-posicional',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Valor de una cifra en números de hasta 6 cifras',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', lerp(4, 6, dif(ctx)));
    const n = conCifras(rng, cifras);
    const digitos = String(n).split('').reverse().map(Number);
    const posibles = digitos.map((c, i) => (c > 0 ? i : -1)).filter((i) => i >= 0);
    const pos = rng.elegir(posibles);
    const cifra = digitos[pos];
    const valor = cifra * 10 ** pos;
    const contextos = [
      `La cooperativa de cacaoteros recibió ${num(n)} kilos de cacao en el año (dato de ejemplo).`,
      `En el vivero de la vereda han sembrado ${num(n)} plántulas de cacao desde que abrió.`,
      `La chiva que baja al pueblo ha recorrido ${num(n)} kilómetros desde que la compraron.`,
      `En la feria del pueblo vendieron ${num(n)} naranjas durante todos estos años.`,
    ];
    const calc: Calculo = { op: 'otra', a: n, b: pos };
    const extras = [cifra, cifra * 10 ** (pos + 1), pos > 0 ? cifra * 10 ** (pos - 1) : cifra * 100, n].filter((x) => x <= 1000000);
    const modo = modoRespuesta(ctx, valor, calc, { extras, abiertaMin: 0.1, abiertaMax: 0.5 });
    return {
      enunciado: `${rng.elegir(contextos)} En el número ${num(n)}, ¿qué valor tiene la cifra que está en las ${POSICIONES[pos]}?`,
      instruccion: 'Valor de la cifra',
      datos: { n, posicion: pos },
      respuesta: valor,
      ...modo,
      calculo: undefined,
      pistas: [
        `Cuenta las posiciones desde la derecha: unidades, decenas, centenas, unidades de mil…`,
        { tipo: 'texto', texto: `${num(n)} = ${desglose(n)}` },
        `La cifra en las ${POSICIONES[pos]} es ${cifra}; vale ${cifra} × ${num(10 ** pos)}.`,
      ],
      explicacion: `En ${num(n)} la cifra ${cifra} está en las ${POSICIONES[pos]}, así que vale ${num(valor)}.`,
    };
  },
};

const compararGrandes: Plantilla = {
  id: 'g4-comparar',
  dimension: 'comprension',
  operacion: 'resta',
  descripcion: 'Comparar y ordenar números de hasta 6 cifras',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', lerp(4, 6, dif(ctx)));
    const base = conCifras(rng, cifras);
    // Con d alto, los números se parecen más (difieren en cifras de menor valor).
    const cambio = 10 ** Math.max(0, lerp(cifras - 2, 1, dif(ctx)));
    const valores = new Set<number>([base]);
    while (valores.size < 3) {
      const v = base + rng.entero(-9, 9) * cambio;
      if (v > 0 && v < 1000000 && String(v).length === cifras) valores.add(v);
      else valores.add(conCifras(rng, cifras));
    }
    const nums = [...valores];
    const fincas = rng.barajar(nombresFincas).slice(0, 3);
    const mayor = rng.azar(0.6);
    const objetivo = mayor ? Math.max(...nums) : Math.min(...nums);
    const respuesta = fincas[nums.indexOf(objetivo)];
    const cultivo = rng.elegir(['naranjas', 'mandarinas', 'aguacates', 'limones']);
    const lista = fincas.map((f, i) => `${f}: ${num(nums[i])}`).join('; ');
    return {
      enunciado: `En un año, estas fincas de la vereda Llana Caliente cosecharon estas cantidades de ${cultivo} (datos de ejemplo): ${lista}. ¿Qué finca cosechó ${mayor ? 'más' : 'menos'}?`,
      instruccion: mayor ? 'Busca el mayor' : 'Busca el menor',
      datos: { a: nums[0], b: nums[1], c: nums[2] },
      respuesta,
      distractores: fincas.filter((f) => f !== respuesta),
      interaccion: { tipo: 'opciones', opciones: fincas },
      pistas: [
        'Primero mira cuántas cifras tiene cada número. Si tienen las mismas, compara de izquierda a derecha.',
        { tipo: 'texto', texto: nums.map((n, i) => `${fincas[i]}: ${desglose(n)}`).join('\n') },
        `Compara la primera cifra distinta, empezando por la izquierda.`,
      ],
      explicacion: `${num(objetivo)} es el ${mayor ? 'mayor' : 'menor'} de los tres números, así que la finca es ${respuesta}.`,
    };
  },
};

const redondeo: Plantilla = {
  id: 'g4-redondeo',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: 'Redondear a la centena o al mil más cercano en la recta',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const unidad = dif(ctx) < 0.5 ? 100 : 1000;
    const cifras = unidad === 100 ? 4 : rng.entero(4, 5);
    let n = conCifras(rng, cifras);
    while (n % unidad === 0 || n % unidad === unidad / 2) n = conCifras(rng, cifras);
    const lo = Math.floor(n / unidad) * unidad;
    const respuesta = Math.round(n / unidad) * unidad;
    const paso = unidad / 10;
    const inicio = Math.round(n / paso) * paso;
    const nombre = unidad === 100 ? 'a la centena más cercana' : 'al mil más cercano';
    const quien = adulto(rng);
    return {
      enunciado: `${mayus(quien.nombre)} pesó ${num(n)} kilos de cacao en la cooperativa. Para contarlo rápido, redondea ${nombre}. Tócalo en la recta.`,
      instruccion: 'Redondea',
      datos: { n, unidad },
      respuesta,
      distractores: [respuesta === lo ? lo + unidad : lo],
      interaccion: { tipo: 'recta', min: lo, max: lo + unidad, paso, inicio },
      calculo: undefined,
      pistas: [
        `¿Entre qué ${unidad === 100 ? 'centenas' : 'miles'} está ${num(n)}? ¿A cuál está más cerca?`,
        { tipo: 'recta', min: lo, max: lo + unidad, desde: inicio, saltos: [] },
        `La mitad entre ${num(lo)} y ${num(lo + unidad)} es ${num(lo + unidad / 2)}. ${num(n)} está ${n > lo + unidad / 2 ? 'después' : 'antes'} de la mitad.`,
      ],
      explicacion: `${num(n)} está más cerca de ${num(respuesta)}.`,
    };
  },
};

const razonable: Plantilla = {
  id: 'g4-razonable',
  dimension: 'comprension',
  operacion: 'suma',
  descripcion: '¿Es razonable? Estimar sumas, restas y productos',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const opParam = pt(ctx, 'op', 'suma');
    const op = opParam === 'mixta' ? rng.elegir(['suma', 'resta', 'multiplicacion'] as const) : (opParam as 'suma' | 'resta' | 'multiplicacion');
    let a: number;
    let b: number;
    let real: number;
    let estimacion: number;
    let simbolo: string;
    let texto: string;
    const quien = persona(rng);
    if (op === 'multiplicacion') {
      a = rng.entero(11, lerp(60, 400, dif(ctx)));
      b = rng.entero(3, 9);
      real = a * b;
      const lugar = 10 ** (String(real).length - 1);
      estimacion = Math.round(real / lugar) * lugar;
      simbolo = '×';
      texto = `En la finca hay ${b} surcos con ${a} matas de café en cada uno. ${quien.nombre} calculó que en total hay`;
    } else {
      const cifras = rng.entero(4, 5);
      [a, b] = op === 'suma' ? parSuma(rng, cifras, 1, 1000000) : parResta(rng, cifras, 1);
      real = op === 'suma' ? a + b : a - b;
      const unidad = 1000;
      estimacion = op === 'suma' ? Math.round(a / unidad) * unidad + Math.round(b / unidad) * unidad : Math.round(a / unidad) * unidad - Math.round(b / unidad) * unidad;
      simbolo = op === 'suma' ? '+' : '−';
      texto =
        op === 'suma'
          ? `La cooperativa recibió ${num(a)} kilos de cacao en junio y ${num(b)} en julio. ${quien.nombre} calculó que en los dos meses recibió`
          : `En la bodega había ${num(a)} kilos de cacao y se despacharon ${num(b)}. ${quien.nombre} calculó que quedaron`;
    }
    if (estimacion < 0) estimacion = 0;
    const lejos = [real * 10, Math.round(real / 10), real + Math.max(2000, Math.round(real * 0.5))].filter(
      (x) => x > 0 && x <= 1000000 && Math.abs(x - real) >= real * 0.3,
    );
    const propuesto = rng.azar(0.5) || !lejos.length ? real : rng.elegir(lejos);
    const esRaz = propuesto === real;
    const paso = Math.max(10, 10 ** (String(Math.max(1, estimacion)).length - 1));
    const distr = [estimacion * 10, estimacion + 2 * paso, estimacion - 2 * paso, Math.round(estimacion / 10)]
      .filter((x) => x > 0 && x !== estimacion && x <= 1000000)
      .filter((x, i, arr) => arr.indexOf(x) === i)
      .slice(0, 2);
    return {
      enunciado: `${texto} ${num(propuesto)}. ¿Es razonable? Después, elige la mejor estimación.`,
      instruccion: '¿Tiene sentido?',
      datos: { a, b, propuesto },
      respuesta: `${esRaz ? 'si' : 'no'}:${estimacion}`,
      distractores: distr,
      interaccion: { tipo: 'razonable', propuesto, esRazonable: esRaz, opciones: rng.barajar([estimacion, ...distr]) },
      operacion: op,
      pistas: [
        'Redondea los números para hacer una cuenta fácil de cabeza.',
        { tipo: 'texto', texto: `${num(a)} ${simbolo} ${num(b)} ≈ ${num(estimacion)}` },
        `Compara ${num(propuesto)} con la estimación ${num(estimacion)}: ¿están cerca?`,
      ],
      explicacion: `${num(a)} ${simbolo} ${num(b)} = ${num(real)}, que es cerca de ${num(estimacion)}. ${esRaz ? 'Sí es razonable.' : `${num(propuesto)} está muy lejos: no es razonable.`}`,
    };
  },
};

const sumaGrande: Plantilla = {
  id: 'g4-suma',
  dimension: 'procedimiento',
  operacion: 'suma',
  descripcion: 'Suma de números de hasta 6 cifras con reagrupación',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', lerp(4, 6, dif(ctx)));
    const llevadas = Math.min(cifras - 1, lerp(1, 3, dif(ctx)));
    const [a, b] = parSuma(rng, cifras, llevadas, 1000000);
    const respuesta = a + b;
    const calc: Calculo = { op: 'suma', a, b };
    const usarAlgoritmo = cifras <= 5 && rng.azar(0.7 - 0.4 * dif(ctx));
    const modo = usarAlgoritmo ? algoritmo('suma', a, b, ctx) : modoRespuesta(ctx, respuesta, calc, { abiertaMin: 0.5, abiertaMax: 0.9 });
    const contextos = [
      `La cooperativa de cacaoteros recibió ${num(a)} kilos de cacao en la primera cosecha y ${num(b)} en la traviesa.`,
      `En el vivero hay ${num(a)} plántulas de café y ${num(b)} de cacao.`,
      `Este año la chiva que baja al pueblo recorrió ${num(a)} kilómetros en el primer semestre y ${num(b)} en el segundo.`,
    ];
    return {
      enunciado: `${rng.elegir(contextos)} Resuelve: ${num(a)} + ${num(b)}.`,
      instruccion: 'Suma',
      datos: { a, b },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: [
        'Empieza por las unidades. Cuando una columna pasa de 9, ¿qué haces?',
        { tipo: 'texto', texto: `${desglose(a)}\n+ ${desglose(b)}` },
        `Unidades: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}${(a % 10) + (b % 10) >= 10 ? '; escribe la unidad y lleva 1 a las decenas' : ''}. Sigue así columna por columna.`,
      ],
      explicacion: `${num(a)} + ${num(b)} = ${num(respuesta)}${contarLlevadas(a, b) ? ' (llevando en las columnas que pasaron de 9)' : ''}.`,
    };
  },
};

const restaGrande: Plantilla = {
  id: 'g4-resta',
  dimension: 'procedimiento',
  operacion: 'resta',
  descripcion: 'Resta de números de hasta 6 cifras, con ceros en el minuendo',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', lerp(4, 6, dif(ctx)));
    const prestamos = Math.min(cifras - 1, lerp(1, 3, dif(ctx)));
    const [a, b] = parResta(rng, cifras, prestamos, dif(ctx) > 0.4);
    const respuesta = a - b;
    const calc: Calculo = { op: 'resta', a, b };
    const usarAlgoritmo = cifras <= 5 && rng.azar(0.7 - 0.4 * dif(ctx));
    const modo = usarAlgoritmo ? algoritmo('resta', a, b, ctx) : modoRespuesta(ctx, respuesta, calc, { abiertaMin: 0.5, abiertaMax: 0.9 });
    const contextos = [
      `En la bodega de la cooperativa había ${num(a)} kilos de cacao seco y se despacharon ${num(b)}.`,
      `En la cosecha de café recogieron ${num(a)} kilos y ya vendieron ${num(b)} kilos en el pueblo.`,
      `El camino de herradura hasta la Serranía de los Yariguíes mide ${num(a)} metros; ya caminaron ${num(b)}.`,
    ];
    return {
      enunciado: `${rng.elegir(contextos)} Resuelve: ${num(a)} − ${num(b)}.`,
      instruccion: 'Resta',
      datos: { a, b },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: [
        'Empieza por las unidades. Si arriba hay menos que abajo, pide prestado a la columna de la izquierda.',
        { tipo: 'texto', texto: `${desglose(a)}\n− ${desglose(b)}` },
        `Si hay un cero arriba, pide prestado más a la izquierda: una unidad de mil son 10 centenas, una centena son 10 decenas.`,
      ],
      explicacion: `${num(a)} − ${num(b)} = ${num(respuesta)}. Comprueba: ${num(respuesta)} + ${num(b)} = ${num(a)}.`,
    };
  },
};

const problemaSumaResta: Plantilla = {
  id: 'g4-problema-cosecha',
  dimension: 'problemas',
  operacion: 'suma',
  descripcion: 'Problemas de suma y resta con números grandes (cambio, combinación, comparación)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', lerp(3, 5, dif(ctx)));
    const [x, y] = rng.barajar(nombresFincas);
    const tipos = ['juntar', 'quitar', 'comparar'];
    if (dif(ctx) > 0.5) tipos.push('inicial', 'cambio');
    const tipo = rng.elegir(tipos);
    const sobra = datoQueSobra(ctx);
    let enunciado: string;
    let respuesta: number;
    let calc: Calculo;
    let pregunta: string;
    let visual: Visual;
    let paso: string;
    // Kilos de cacao o de café: se dibuja el bulto (dice «kg»); los aguacates, como aguacates.
    let dibujo: Objeto = 'bulto';
    if (tipo === 'juntar') {
      const [a, b] = parSuma(rng, cifras, lerp(0, 2, dif(ctx)), 1000000);
      respuesta = a + b;
      calc = { op: 'suma', a, b };
      enunciado = rng.elegir([
        `La finca ${x} cosechó ${num(a)} kilos de cacao en la primera cosecha y ${num(b)} en la traviesa.`,
        `La cooperativa recibió ${num(a)} kilos de café de la vereda Llana Caliente y ${num(b)} de otras veredas.`,
      ]);
      pregunta = '¿Cuántos kilos son en total?';
      visual = { tipo: 'texto', texto: `${num(a)} + ${num(b)}` };
      paso = `Se juntan las dos cantidades: ${num(a)} + ${num(b)}.`;
    } else if (tipo === 'quitar') {
      const [a, b] = parResta(rng, cifras, lerp(0, 2, dif(ctx)));
      respuesta = a - b;
      calc = { op: 'resta', a, b };
      enunciado = `La cooperativa tenía ${num(a)} kilos de cacao seco en la bodega y despachó ${num(b)} kilos a la fábrica.`;
      pregunta = '¿Cuántos kilos quedaron en la bodega?';
      visual = { tipo: 'texto', texto: `${num(a)} − ${num(b)}` };
      paso = `Se quita lo que salió: ${num(a)} − ${num(b)}.`;
    } else if (tipo === 'comparar') {
      const [a, b] = parResta(rng, cifras, lerp(0, 2, dif(ctx)));
      respuesta = a - b;
      calc = { op: 'resta', a, b };
      enunciado = `La finca ${x} produjo ${num(a)} kilos de aguacate y la finca ${y} produjo ${num(b)} kilos.`;
      dibujo = 'aguacate';
      pregunta = `¿Cuántos kilos más produjo la finca ${x}?`;
      visual = { tipo: 'texto', texto: `${num(a)} − ${num(b)}` };
      paso = `La diferencia se halla restando: ${num(a)} − ${num(b)}.`;
    } else if (tipo === 'inicial') {
      const [c, b] = parSuma(rng, cifras, lerp(0, 2, dif(ctx)), 1000000);
      respuesta = c + b;
      calc = { op: 'suma', a: c, b };
      enunciado = `La cooperativa despachó ${num(b)} kilos de cacao y en la bodega le quedaron ${num(c)} kilos.`;
      pregunta = '¿Cuántos kilos tenía antes de despachar?';
      visual = { tipo: 'texto', texto: `? − ${num(b)} = ${num(c)}` };
      paso = `Lo que tenía es lo que quedó más lo que salió: ${num(c)} + ${num(b)}.`;
    } else {
      const [c, a] = parResta(rng, cifras, lerp(0, 2, dif(ctx)));
      respuesta = c - a;
      calc = { op: 'resta', a: c, b: a };
      enunciado = `En la bodega había ${num(a)} kilos de cacao. Después de recibir el cacao de la vereda, hay ${num(c)} kilos.`;
      pregunta = '¿Cuántos kilos recibieron?';
      visual = { tipo: 'texto', texto: `${num(a)} + ? = ${num(c)}` };
      paso = `Busca cuánto falta de ${num(a)} para llegar a ${num(c)}: ${num(c)} − ${num(a)}.`;
    }
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: sobra ? [respuesta + sobra.valor, Math.max(0, respuesta - sobra.valor)] : [] });
    return {
      enunciado: `${enunciado}${sobra ? sobra.texto : ''} ${pregunta}`,
      instruccion: 'Resuelve el problema',
      ilustracion: dibujo,
      datos: { a: calc.a, b: calc.b, extra: sobra?.valor ?? 0 },
      respuesta,
      unidad: 'kilos',
      ...modo,
      calculo: calc,
      operacion: calc.op === 'suma' ? 'suma' : 'resta',
      pistas: [
        sobra ? '¿Qué datos necesitas de verdad? Hay uno que no sirve para la pregunta.' : '¿La cantidad que buscas es mayor o menor que las que conoces?',
        visual,
        paso,
      ],
      explicacion: `${paso.split(': ').pop()?.replace(/\.$/, '')} = ${num(respuesta)}. ${sobra ? 'El otro dato no se necesitaba.' : ''}`.trim(),
    };
  },
};

const multiplicar1: Plantilla = {
  id: 'g4-multiplicar-1cifra',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Multiplicación por 1 cifra con el algoritmo guiado',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cifras = pn(ctx, 'cifras', lerp(2, 4, dif(ctx)));
    const a = conCifras(rng, cifras);
    const b = rng.entero(2, 9);
    const respuesta = a * b;
    const calc: Calculo = { op: 'multiplicacion', a, b };
    const usarAlgoritmo = rng.azar(0.75 - 0.35 * dif(ctx));
    const modo = usarAlgoritmo ? algoritmo('multiplicacion', a, b, ctx) : modoRespuesta(ctx, respuesta, calc, { abiertaMin: 0.5, abiertaMax: 0.9 });
    const contextos = [
      `El vivero entregó ${b} lotes de ${num(a)} bolsas para sembrar cacao.`,
      `En la vereda hay ${b} fincas y cada una sembró ${num(a)} matas de café.`,
      `Cada semana la cooperativa empaca ${num(a)} tabletas de chocolate. Así trabajó durante ${b} semanas.`,
    ];
    return {
      enunciado: `${rng.elegir(contextos)} Resuelve: ${num(a)} × ${b}.`,
      instruccion: 'Multiplica',
      datos: { a, b },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: [
        `Multiplica ${b} por cada cifra, empezando por las unidades. ¿Qué haces si el resultado pasa de 9?`,
        { tipo: 'texto', texto: desglose(a) + ` (cada parte × ${b})` },
        `Unidades: ${a % 10} × ${b} = ${(a % 10) * b}${(a % 10) * b >= 10 ? `; escribe ${((a % 10) * b) % 10} y lleva ${Math.floor(((a % 10) * b) / 10)}` : ''}.`,
      ],
      explicacion: `${num(a)} × ${b} = ${num(respuesta)}.`,
    };
  },
};

const multiplicar2: Plantilla = {
  id: 'g4-multiplicar-2cifras',
  dimension: 'procedimiento',
  operacion: 'multiplicacion',
  descripcion: 'Multiplicación por 2 cifras',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const a = dif(ctx) < 0.5 ? rng.entero(12, 99) : rng.entero(101, 999);
    const b = dif(ctx) < 0.3 ? rng.elegir([10, 20, 30, 40, 50, rng.entero(11, 19)]) : rng.entero(11, 99);
    const respuesta = a * b;
    const calc: Calculo = { op: 'multiplicacion', a, b };
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: [a * (b % 10) + Math.floor(b / 10) * a, a * (b % 10)], abiertaMin: 0.3, abiertaMax: 0.8 });
    const contextos =
      a < 100
        ? [`Un camión lleva ${b} bultos de cacao de ${a} kilos cada uno.`, `En el vivero hay ${b} filas con ${a} plántulas de cacao cada una.`]
        : [`Cada semana la cooperativa empaca ${num(a)} tabletas de chocolate de mesa. Así trabajó durante ${b} semanas.`, `Una finca vende ${num(a)} naranjas por semana durante ${b} semanas.`];
    const decenas = Math.floor(b / 10) * 10;
    return {
      enunciado: `${rng.elegir(contextos)} Resuelve: ${num(a)} × ${b}.`,
      instruccion: 'Multiplica',
      datos: { a, b },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: [
        `Separa ${b} en decenas y unidades: ${decenas} + ${b % 10}.`,
        { tipo: 'texto', texto: `${num(a)} × ${decenas} = ${num(a * decenas)}\n${num(a)} × ${b % 10} = ${num(a * (b % 10))}` },
        `Suma los dos productos parciales: ${num(a * decenas)} + ${num(a * (b % 10))}.`,
      ],
      explicacion: b % 10 === 0 ? `${num(a)} × ${b} = ${num(respuesta)}.` : `${num(a)} × ${b} = ${num(a * decenas)} + ${num(a * (b % 10))} = ${num(respuesta)}.`,
    };
  },
};

const surcos: Plantilla = {
  id: 'g4-surcos',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Arreglos en surcos: multiplicación y división con números de 2 cifras',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const quien = persona(rng);
    const f = rng.entero(lerp(6, 12, dif(ctx)), lerp(12, 45, dif(ctx)));
    const c = rng.entero(lerp(6, 11, dif(ctx)), lerp(12, 35, dif(ctx)));
    const total = f * c;
    const cultivo = rng.elegir(['cacao', 'café', 'aguacate', 'plátano']);
    const division = pt(ctx, 'op', 'multiplicacion') === 'mixta' && rng.azar(0.5);
    const sobra = datoQueSobra(ctx);
    const arbol = arbolDe(cultivo);
    const visual: Visual = f <= 10 && c <= 10 ? { tipo: 'arreglo', filas: f, columnas: c, objeto: arbol } : { tipo: 'texto', texto: `${f} surcos × ${c} árboles` };
    if (division) {
      const calc: Calculo = { op: 'division', a: total, b: f };
      const modo = modoRespuesta(ctx, c, calc);
      return {
        enunciado: `${quien.nombre} sembró ${num(total)} árboles de ${cultivo} en ${f} surcos con la misma cantidad cada uno.${sobra ? sobra.texto : ''} ¿Cuántos árboles hay en cada surco?`,
        instruccion: 'Reparte en surcos',
        ilustracion: arbol,
        datos: { total, f, extra: sobra?.valor ?? 0 },
        respuesta: c,
        unidad: 'árboles',
        ...modo,
        calculo: calc,
        operacion: 'division',
        pistas: [
          '¿Qué número multiplicado por la cantidad de surcos da el total?',
          visual,
          `Busca el número que, por ${f}, da ${num(total)}: ${num(total)} ÷ ${f}.`,
        ],
        explicacion: `${num(total)} ÷ ${f} = ${c}, porque ${f} × ${c} = ${num(total)}.`,
      };
    }
    const calc: Calculo = { op: 'multiplicacion', a: f, b: c };
    const modo = modoRespuesta(ctx, total, calc);
    return {
      enunciado: rng.elegir([
        `${quien.nombre} sembró ${f} surcos de ${cultivo} con ${c} árboles en cada surco.`,
        `En la finca ${deQuien(adulto(rng).nombre)} hay ${f} hileras de ${cultivo} y cada hilera tiene ${c} árboles.`,
      ]) + `${sobra ? sobra.texto : ''} ¿Cuántos árboles hay en total?`,
      instruccion: 'Multiplica',
      ilustracion: arbol,
      datos: { f, c, extra: sobra?.valor ?? 0 },
      respuesta: total,
      unidad: 'árboles',
      ...modo,
      calculo: calc,
      pistas: ['¿Hay grupos iguales? ¿Cuántos grupos y cuántos en cada uno?', visual, `${f} × ${c}: multiplica primero por las unidades y luego por las decenas.`],
      explicacion: `${f} × ${c} = ${num(total)} árboles.`,
    };
  },
};

const divisionResiduo: Plantilla = {
  id: 'g4-division-residuo',
  dimension: 'procedimiento',
  operacion: 'division',
  descripcion: 'División con residuo, divisor de 1 cifra: cociente o residuo',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(2, 9);
    const cociente = rng.entero(lerp(3, 12, dif(ctx)), lerp(15, 120, dif(ctx)));
    const r = rng.entero(dif(ctx) < 0.2 && rng.azar(0.3) ? 0 : 1, k - 1);
    const n = k * cociente + r;
    const preguntaResiduo = r > 0 && rng.azar(0.4);
    const respuesta = preguntaResiduo ? r : cociente;
    const calc: Calculo = { op: 'division', a: n, b: k };
    const extras = preguntaResiduo ? [k - r, r + 1, cociente, Math.max(0, r - 1)] : [cociente + 1, cociente - 1, cociente * 10 + r];
    const modo = modoRespuesta(ctx, respuesta, preguntaResiduo ? undefined : calc, { extras });
    const quien = adulto(rng);
    return {
      enunciado: `${mayus(quien.nombre)} reparte ${num(n)} mandarinas en ${k} canastas iguales. Resuelve ${num(n)} ÷ ${k}. ${preguntaResiduo ? '¿Cuántas mandarinas sobran (residuo)?' : '¿Cuántas van en cada canasta (cociente)?'}`,
      instruccion: preguntaResiduo ? 'Busca el residuo' : 'Busca el cociente',
      ilustracion: 'mandarina',
      datos: { n, k },
      respuesta,
      ...modo,
      calculo: calc,
      permiteResiduo: true,
      pistas: [
        `¿Qué número multiplicado por ${k} se acerca más a ${num(n)} sin pasarse?`,
        { tipo: 'texto', texto: `${k} × ${cociente} = ${num(k * cociente)}\n${num(n)} − ${num(k * cociente)} = ${r}` },
        `Divide cifra por cifra empezando por la izquierda; lo que no alcanza a repartirse es el residuo.`,
      ],
      explicacion: `${num(n)} ÷ ${k} da ${cociente} y sobran ${r}, porque ${k} × ${cociente} + ${r} = ${num(n)}.`,
    };
  },
};

const repartoResiduo: Plantilla = {
  id: 'g4-empacar',
  dimension: 'problemas',
  operacion: 'division',
  descripcion: 'Empacar o repartir con residuo: bolsas completas, sobrantes, reparto',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(3, 9);
    const q = rng.entero(lerp(4, 10, dif(ctx)), lerp(12, 60, dif(ctx)));
    const r = rng.entero(1, k - 1);
    const n = k * q + r;
    const tipo = rng.elegir(['bolsas', 'sobran', 'reparto']);
    const quien = adulto(rng);
    const calc: Calculo = { op: 'division', a: n, b: k };
    let enunciado: string;
    let respuesta: number;
    if (tipo === 'bolsas') {
      enunciado = `${mayus(quien.nombre)} empaca ${num(n)} aguacates en bolsas de ${k}. ¿Cuántas bolsas llena completas?`;
      respuesta = q;
    } else if (tipo === 'sobran') {
      enunciado = `${mayus(quien.nombre)} empaca ${num(n)} limones en mallas de ${k}. ¿Cuántos limones quedan sin empacar?`;
      respuesta = r;
    } else {
      enunciado = `${mayus(quien.nombre)} reparte ${num(n)} huevos entre ${k} familias de la vereda, la misma cantidad a cada una, y guarda los que sobran. ¿Cuántos huevos recibe cada familia?`;
      respuesta = q;
    }
    const modo = modoRespuesta(ctx, respuesta, tipo === 'sobran' ? undefined : calc, { extras: tipo === 'sobran' ? [k - r, r + 1, q] : [q + 1, q - 1, n - k] });
    return {
      enunciado,
      instruccion: 'Empaca y mira lo que sobra',
      ilustracion: tipo === 'reparto' ? 'huevo' : tipo === 'bolsas' ? 'aguacate' : 'limon',
      datos: { n, k },
      respuesta,
      ...modo,
      calculo: calc,
      permiteResiduo: true,
      pistas: [
        tipo === 'sobran' ? 'Lo que sobra es lo que no alcanza para llenar otro paquete.' : '¿Cuántos grupos completos de ese tamaño caben?',
        { tipo: 'texto', texto: `${k} × ${q} = ${num(k * q)}; sobran ${r}` },
        `${num(n)} ÷ ${k} = ${q}, residuo ${r}.`,
      ],
      explicacion: `${num(n)} ÷ ${k} = ${q} con residuo ${r}. ${tipo === 'sobran' ? `Quedan ${r} sin empacar.` : `La respuesta es ${q}.`}`,
    };
  },
};

const comprobarDivision: Plantilla = {
  id: 'g4-comprobar-division',
  dimension: 'comprension',
  operacion: 'mixta',
  descripcion: 'Relación dividendo = divisor × cociente + residuo',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(2, 9);
    const q = rng.entero(lerp(4, 12, dif(ctx)), lerp(12, 80, dif(ctx)));
    const r = rng.entero(0, k - 1);
    const n = k * q + r;
    const quien = persona(rng);
    const calc: Calculo = { op: 'multiplicacion', a: k, b: q };
    const modo = modoRespuesta(ctx, n, calc, { extras: [k * q, k * q - r, k + q + r, k * (q + 1)] });
    return {
      enunciado:
        r > 0
          ? `${quien.nombre} repartió mandarinas entre ${k} amigos de la escuela: le dio ${q} a cada uno y ${r === 1 ? 'le sobró 1' : `le sobraron ${r}`}. ¿Cuántas mandarinas tenía?`
          : `${quien.nombre} repartió mandarinas entre ${k} amigos de la escuela: le dio ${q} a cada uno y no le sobró ninguna. ¿Cuántas mandarinas tenía?`,
      instruccion: 'Arma la cantidad',
      ilustracion: 'mandarina',
      datos: { k, q, r },
      respuesta: n,
      unidad: 'mandarinas',
      ...modo,
      calculo: calc,
      pistas: [
        'Piensa en lo que repartió y en lo que le sobró: ¿cómo lo juntas?',
        { tipo: 'texto', texto: `${k} amigos × ${q} mandarinas + ${r} que sobraron` },
        `${k} × ${q} = ${num(k * q)}; después suma ${r}.`,
      ],
      explicacion: `${k} × ${q} + ${r} = ${num(n)} mandarinas.`,
    };
  },
};

const viajes: Plantilla = {
  id: 'g4-viajes',
  dimension: 'problemas',
  operacion: 'division',
  descripcion: 'Interpretar el residuo: viajes o paquetes necesarios (redondear hacia arriba)',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(2, 9);
    const q = rng.entero(lerp(3, 8, dif(ctx)), lerp(10, 40, dif(ctx)));
    const r = rng.entero(1, k - 1);
    const n = k * q + r;
    const respuesta = q + 1;
    const sobra = datoQueSobra(ctx);
    const variantes: [string, Objeto][] = [
      [`La mula carga ${k} bultos por viaje. ¿Cuántos viajes necesita para llevar ${num(n)} bultos de cacao hasta la carretera?`, 'bulto'],
      [`En la chiva caben ${k} canastos más en el techo por cada viaje. ¿Cuántos viajes se necesitan para bajar ${num(n)} canastos de naranja al mercado del pueblo?`, 'canasta'],
      [`En cada caja caben ${k} kilos de cacao. ¿Cuántas cajas se necesitan para guardar ${num(n)} kilos sin dejar nada por fuera?`, 'caja'],
    ];
    const [texto, dibujo] = rng.elegir(variantes);
    const calc: Calculo = { op: 'division', a: n, b: k, redondearArriba: true };
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: [q, r] });
    return {
      enunciado: (sobra ? sobra.texto.trim() + ' ' : '') + texto,
      instruccion: '¿Y lo que sobra?',
      ilustracion: dibujo,
      datos: { n, k, extra: sobra?.valor ?? 0 },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: [
        'Si después de repartir sobran algunos, ¿se pueden quedar sin llevar?',
        { tipo: 'texto', texto: `${num(n)} ÷ ${k} = ${q}, sobran ${r}` },
        `Con ${q} viajes llevas ${num(k * q)}; los ${r} que sobran necesitan uno más.`,
      ],
      explicacion: `${num(n)} ÷ ${k} = ${q} con residuo ${r}. Como sobran ${r}, se necesita uno más: ${q} + 1 = ${respuesta}.`,
    };
  },
};

const interpretarResiduo: Plantilla = {
  id: 'g4-interpretar-residuo',
  dimension: 'aplicacion',
  operacion: 'division',
  descripcion: '¿Qué hacer con el residuo? Completos, necesarios o sobrantes',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const k = rng.entero(3, 9);
    const q = rng.entero(lerp(4, 10, dif(ctx)), lerp(12, 50, dif(ctx)));
    const r = rng.entero(1, k - 1);
    const n = k * q + r;
    const tipo = rng.elegir(['completos', 'necesarios', 'sobran'] as const);
    const contexto = rng.elegir([
      { cosa: 'huevos', paquete: 'cubetas pequeñas', cab: `caben ${k} huevos`, lugar: 'para venderlos en la tienda de la vereda' },
      { cosa: 'arepas', paquete: 'bolsas', cab: `caben ${k} arepas`, lugar: 'para el refrigerio escolar' },
      { cosa: 'plántulas de cacao', paquete: 'bandejas', cab: `caben ${k} plántulas`, lugar: 'para llevarlas al vivero' },
    ]);
    const base = `En la finca empacan ${num(n)} ${contexto.cosa} en ${contexto.paquete} ${contexto.lugar}. En cada una ${contexto.cab}.`;
    let pregunta: string;
    let respuesta: number;
    let calc: Calculo | undefined;
    if (tipo === 'completos') {
      pregunta = `¿Cuántas ${contexto.paquete} quedan llenas?`;
      respuesta = q;
      calc = { op: 'division', a: n, b: k };
    } else if (tipo === 'necesarios') {
      pregunta = `¿Cuántas ${contexto.paquete} se necesitan para empacar ${contexto.cosa.startsWith('arepas') || contexto.cosa.startsWith('plántulas') ? 'todas' : 'todos'}?`;
      respuesta = q + 1;
      calc = { op: 'division', a: n, b: k, redondearArriba: true };
    } else {
      pregunta = `Si solo se usan ${contexto.paquete} llenas, ¿${cuantos(contexto.cosa.startsWith('huevos') ? 'm' : 'f', false)} ${contexto.cosa} quedan por fuera?`;
      respuesta = r;
      calc = undefined;
    }
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: [q, q + 1, r, k - r].filter((x) => x !== respuesta) });
    return {
      enunciado: `${base} ${pregunta}`,
      instruccion: 'Piensa en lo que sobra',
      datos: { n, k },
      respuesta,
      ...modo,
      calculo: calc ?? { op: 'division', a: n, b: k },
      permiteResiduo: true,
      pistas: [
        'Primero divide. Luego piensa: ¿la pregunta es por lo completo, por todo o por lo que sobra?',
        { tipo: 'texto', texto: `${num(n)} ÷ ${k} = ${q}, residuo ${r}` },
        tipo === 'completos' ? `Llenas quedan ${q}; las ${r} que sobran no alcanzan para otra.` : tipo === 'necesarios' ? `Para que nada quede por fuera se necesita una más: ${q} + 1.` : `Lo que queda por fuera es el residuo.`,
      ],
      explicacion: `${num(n)} ÷ ${k} = ${q} con residuo ${r}. La respuesta es ${respuesta}.`,
    };
  },
};

const veces: Plantilla = {
  id: 'g4-doble-triple',
  dimension: 'problemas',
  operacion: 'multiplicacion',
  descripcion: 'Comparación multiplicativa: doble, triple, cuádruple',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const factor = rng.elegir([2, 3, 4]);
    const palabra = factor === 2 ? 'el doble' : factor === 3 ? 'el triple' : 'el cuádruple';
    const a = conCifras(rng, lerp(2, 4, dif(ctx)));
    const grande = a * factor;
    const inverso = dif(ctx) > 0.5 && rng.azar(0.5);
    const cultivo = rng.elegir(['cacao', 'café', 'aguacate', 'mandarina']);
    const sobra = datoQueSobra(ctx);
    const respuesta = inverso ? a : grande;
    const calc: Calculo = inverso ? { op: 'division', a: grande, b: factor } : { op: 'multiplicacion', a, b: factor };
    const modo = modoRespuesta(ctx, respuesta, calc, { extras: inverso ? [grande - factor, grande * factor] : [a + factor, a * (factor + 1), a * (factor - 1)] });
    const enunciado = inverso
      ? `Este año la finca produjo ${num(grande)} kilos de ${cultivo}, que es ${palabra} de lo que produjo el año pasado.${sobra ? sobra.texto : ''} ¿Cuántos kilos produjo el año pasado?`
      : rng.elegir([
          `Este año la finca produjo ${palabra} de kilos de ${cultivo} que el año pasado, cuando produjo ${num(a)} kilos.${sobra ? sobra.texto : ''} ¿Cuántos kilos produjo este año?`,
          `${mayus(adulto(rng).nombre)} tiene ${num(a)} árboles de ${cultivo} y su vecino tiene ${palabra}.${sobra ? sobra.texto : ''} ¿Cuántos árboles tiene el vecino?`,
        ]);
    return {
      enunciado,
      instruccion: inverso ? 'Busca la cantidad menor' : `Calcula ${palabra}`,
      datos: { a, factor, extra: sobra?.valor ?? 0 },
      respuesta,
      ...modo,
      calculo: calc,
      operacion: inverso ? 'division' : 'multiplicacion',
      pistas: [
        `${mayus(palabra)} quiere decir ${factor} veces la misma cantidad. ¿Cuál es la cantidad que se repite?`,
        { tipo: 'texto', texto: Array(factor).fill(num(a)).join(' + ') + ` = ${num(grande)}` },
        inverso ? `Si ${factor} veces el año pasado da ${num(grande)}, divide: ${num(grande)} ÷ ${factor}.` : `Multiplica: ${num(a)} × ${factor}.`,
      ],
      explicacion: inverso ? `${num(grande)} ÷ ${factor} = ${num(a)}.` : `${num(a)} × ${factor} = ${num(grande)}.`,
    };
  },
};

const tablaProduccion: Plantilla = {
  id: 'g4-tabla',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Leer una tabla de producción de la vereda',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const modoP = pt(ctx, 'modo', 'mixta');
    const modo = modoP === 'mixta' ? rng.elegir(['total', 'diferencia', 'mayor', 'producto']) : modoP;
    const fincas = rng.barajar(nombresFincas).slice(0, 3);
    const cultivo = rng.elegir(['cacao', 'café', 'aguacate']);
    if (modo === 'producto') {
      const arboles = fincas.map(() => rng.entero(lerp(20, 80, dif(ctx)), lerp(90, 600, dif(ctx))));
      const kilos = fincas.map(() => rng.entero(2, 9));
      const i = rng.entero(0, 2);
      const respuesta = arboles[i] * kilos[i];
      const calc: Calculo = { op: 'multiplicacion', a: arboles[i], b: kilos[i] };
      const distr = distractores(rng, respuesta, distractoresTipicos(calc), 3, dif(ctx));
      const abierta = rng.azar(0.3 + 0.5 * dif(ctx));
      return {
        enunciado: `La tabla muestra los árboles de ${cultivo} de tres fincas y los kilos que da cada árbol en una cosecha (datos de ejemplo). ¿Cuántos kilos cosecha la finca ${fincas[i]}?`,
        instruccion: 'Lee la tabla',
        datos: { arboles: arboles[i], kilos: kilos[i] },
        respuesta,
        unidad: 'kilos',
        distractores: distr,
        interaccion: {
          tipo: 'tabla',
          encabezados: ['Finca', 'Árboles', 'Kilos por árbol'],
          filas: fincas.map((f, j) => [f, num(arboles[j]), kilos[j]]),
          opciones: abierta ? undefined : mezclarOpciones(rng, respuesta, distr),
        },
        calculo: calc,
        operacion: 'multiplicacion',
        pistas: ['Busca la fila de la finca. ¿Cuántos árboles tiene y cuánto da cada uno?', { tipo: 'texto', texto: `${num(arboles[i])} árboles × ${kilos[i]} kilos` }, `${num(arboles[i])} × ${kilos[i]}.`],
        explicacion: `${num(arboles[i])} × ${kilos[i]} = ${num(respuesta)} kilos.`,
      };
    }
    const valores = fincas.map(() => rng.entero(lerp(800, 3000, dif(ctx)), lerp(9000, 90000, dif(ctx))));
    const filas = fincas.map((f, j) => [f, num(valores[j])]);
    const encabezados = ['Finca', `Kilos de ${cultivo}`];
    const intro = `La tabla muestra los kilos de ${cultivo} que tres fincas de la vereda vendieron a la cooperativa este año (datos de ejemplo).`;
    if (modo === 'mayor') {
      const mayor = rng.azar(0.5);
      const objetivo = mayor ? Math.max(...valores) : Math.min(...valores);
      const resp = fincas[valores.indexOf(objetivo)];
      return {
        enunciado: `${intro} ¿Qué finca vendió ${mayor ? 'más' : 'menos'}?`,
        instruccion: 'Lee la tabla',
        datos: { a: valores[0], b: valores[1], c: valores[2] },
        respuesta: resp,
        distractores: fincas.filter((f) => f !== resp),
        interaccion: { tipo: 'tabla', encabezados, filas, opciones: [...fincas] },
        operacion: 'resta',
        pistas: ['Compara primero la cantidad de cifras y luego cifra por cifra desde la izquierda.', { tipo: 'texto', texto: valores.map((v, j) => `${fincas[j]}: ${num(v)}`).join('\n') }, `El ${mayor ? 'mayor' : 'menor'} número es ${num(objetivo)}.`],
        explicacion: `${num(objetivo)} es el ${mayor ? 'mayor' : 'menor'}: la finca es ${resp}.`,
      };
    }
    if (modo === 'diferencia') {
      const [i, j] = rng.barajar([0, 1, 2]);
      const may = Math.max(valores[i], valores[j]);
      const men = Math.min(valores[i], valores[j]);
      if (may === men) valores[i] += 100;
      const A = Math.max(valores[i], valores[j]);
      const B = Math.min(valores[i], valores[j]);
      const fa = fincas[valores.indexOf(A)];
      const fb = fincas[valores.indexOf(B)];
      const respuesta = A - B;
      const calc: Calculo = { op: 'resta', a: A, b: B };
      const distr = distractores(rng, respuesta, distractoresTipicos(calc), 3, dif(ctx));
      return {
        enunciado: `${intro} ¿Cuántos kilos más vendió ${fa} que ${fb}?`,
        instruccion: 'Lee la tabla',
        datos: { a: A, b: B },
        respuesta,
        unidad: 'kilos',
        distractores: distr,
        interaccion: { tipo: 'tabla', encabezados, filas: fincas.map((f, k) => [f, num(valores[k])]), opciones: rng.azar(0.5) ? mezclarOpciones(rng, respuesta, distr) : undefined },
        calculo: calc,
        operacion: 'resta',
        pistas: ['¿Cuánto le falta a la cantidad menor para llegar a la mayor?', { tipo: 'texto', texto: `${num(A)} − ${num(B)}` }, `Resta: ${num(A)} − ${num(B)}.`],
        explicacion: `${num(A)} − ${num(B)} = ${num(respuesta)} kilos.`,
      };
    }
    const total = valores[0] + valores[1] + valores[2];
    const calc: Calculo = { op: 'suma', a: valores[0] + valores[1], b: valores[2] };
    const distr = distractores(rng, total, [valores[0] + valores[1], total + 1000, total - 1000, total + 100], 3, dif(ctx));
    return {
      enunciado: `${intro} ¿Cuántos kilos vendieron entre las tres fincas?`,
      instruccion: 'Lee la tabla',
      datos: { a: valores[0], b: valores[1], c: valores[2] },
      respuesta: total,
      unidad: 'kilos',
      distractores: distr,
      interaccion: { tipo: 'tabla', encabezados, filas, opciones: rng.azar(0.5) ? mezclarOpciones(rng, total, distr) : undefined },
      calculo: calc,
      operacion: 'suma',
      pistas: ['¿Qué haces para saber cuánto vendieron entre todas?', { tipo: 'texto', texto: valores.map((v) => num(v)).join(' + ') }, `Suma dos y luego agrega la tercera: ${num(valores[0] + valores[1])} + ${num(valores[2])}.`],
      explicacion: `${valores.map((v) => num(v)).join(' + ')} = ${num(total)} kilos.`,
    };
  },
};

const dinero: Plantilla = {
  id: 'g4-tienda',
  dimension: 'aplicacion',
  operacion: 'mixta',
  descripcion: 'Compras en la tienda de la vereda: total, vueltos y precio por unidad',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const modoP = pt(ctx, 'modo', 'mixta');
    const modo = modoP === 'mixta' ? rng.elegir(['total', 'vueltos', 'unidad', 'presupuesto']) : modoP;
    const quien = persona(rng);
    const aviso = '(precios de ejemplo)';
    if (modo === 'unidad') {
      const art = rng.elegir(articulosTienda);
      const cant = rng.entero(2, 9);
      const total = art.precio * cant;
      const calc: Calculo = { op: 'division', a: total, b: cant };
      const m = modoRespuesta(ctx, art.precio, calc, { extras: [art.precio + 500, Math.max(0, art.precio - 500), total - cant] });
      return {
        enunciado: `${quien.nombre} pagó ${pesos(total)} por ${cant} × ${art.nombre}, ${art.genero === 'f' ? 'todas' : 'todos'} del mismo precio, en la tienda de la vereda ${aviso}. ¿Cuánto costó cada ${art.genero === 'f' ? 'una' : 'uno'}?`,
        instruccion: 'Precio de cada uno',
        ilustracion: 'moneda',
        datos: { total, cant },
        respuesta: art.precio,
        unidad: 'pesos',
        ...m,
        calculo: calc,
        operacion: 'division',
        pistas: ['Si todos cuestan lo mismo, ¿cómo repartes el total entre la cantidad?', { tipo: 'texto', texto: `${pesos(total)} ÷ ${cant}` }, `Busca el precio que, por ${cant}, da ${pesos(total)}.`],
        explicacion: `${pesos(total)} ÷ ${cant} = ${pesos(art.precio)}.`,
      };
    }
    const [x, y] = rng.barajar(articulosTienda);
    const cx = rng.entero(1, lerp(3, 6, dif(ctx)));
    const cy = rng.entero(1, lerp(2, 5, dif(ctx)));
    const total = x.precio * cx + y.precio * cy;
    const compra = `${quien.nombre} compró en la tienda de la vereda: ${cx} × ${x.nombre} (${pesos(x.precio)} c/u) y ${cy} × ${y.nombre} (${pesos(y.precio)} c/u) ${aviso}.`;
    if (modo === 'total') {
      const calc: Calculo = { op: 'suma', a: x.precio * cx, b: y.precio * cy };
      const m = modoRespuesta(ctx, total, calc, { extras: [x.precio + y.precio, x.precio * cx, total + 500, total - 500] });
      return {
        enunciado: `${compra} ¿Cuánto pagó en total?`,
        instruccion: 'Calcula el total',
        ilustracion: 'moneda',
        datos: { px: x.precio, cx, py: y.precio, cy },
        respuesta: total,
        unidad: 'pesos',
        ...m,
        calculo: calc,
        operacion: 'mixta',
        pistas: ['Primero calcula lo que cuesta cada producto según la cantidad, y después junta.', { tipo: 'texto', texto: `${cx} × ${pesos(x.precio)} + ${cy} × ${pesos(y.precio)}` }, `${pesos(x.precio * cx)} + ${pesos(y.precio * cy)}.`],
        explicacion: `${pesos(x.precio * cx)} + ${pesos(y.precio * cy)} = ${pesos(total)}.`,
      };
    }
    const billete = [10000, 20000, 50000, 100000].find((b) => b >= total) ?? 100000;
    if (modo === 'vueltos') {
      const vueltos = billete - total;
      const calc: Calculo = { op: 'resta', a: billete, b: total };
      const m = modoRespuesta(ctx, vueltos, calc, { extras: [billete - x.precio - y.precio, total, vueltos + 1000] });
      return {
        enunciado: `${compra} Pagó con un billete de ${pesos(billete)}. ¿Cuánto le devolvieron?`,
        instruccion: 'Calcula los vueltos',
        ilustracion: 'billete',
        datos: { px: x.precio, cx, py: y.precio, cy, billete },
        respuesta: vueltos,
        unidad: 'pesos',
        ...m,
        calculo: calc,
        operacion: 'mixta',
        pistas: ['Necesitas dos pasos: ¿cuánto costó todo? ¿Cuánto falta para llegar al billete?', { tipo: 'texto', texto: `Total: ${pesos(total)}\n${pesos(billete)} − ${pesos(total)}` }, `El total es ${pesos(total)}. Ahora resta: ${pesos(billete)} − ${pesos(total)}.`],
        explicacion: `Total: ${pesos(total)}. Vueltos: ${pesos(billete)} − ${pesos(total)} = ${pesos(vueltos)}.`,
      };
    }
    // presupuesto: ¿cuánto le queda del dinero del mercado?
    const [p1] = dosPersonas(rng);
    const dineroTotal = billete + (billete < 100000 ? rng.elegir([0, 10000]) : 0);
    const queda = dineroTotal - total;
    const calc: Calculo = { op: 'resta', a: dineroTotal, b: total };
    const m = modoRespuesta(ctx, queda, calc, { extras: [dineroTotal - x.precio - y.precio, total] });
    return {
      enunciado: `${p1.nombre} lleva ${pesos(dineroTotal)} para el mercado de la semana. Compra ${cx} × ${x.nombre} (${pesos(x.precio)} c/u) y ${cy} × ${y.nombre} (${pesos(y.precio)} c/u) ${aviso}. ¿Cuánto dinero le queda?`,
      instruccion: 'Haz el presupuesto',
      ilustracion: 'moneda',
      datos: { px: x.precio, cx, py: y.precio, cy, dinero: dineroTotal },
      respuesta: queda,
      unidad: 'pesos',
      ...m,
      calculo: calc,
      operacion: 'mixta',
      pistas: ['Calcula primero lo que gasta. Después piensa cuánto le sobra.', { tipo: 'texto', texto: `${cx} × ${pesos(x.precio)} + ${cy} × ${pesos(y.precio)} = ${pesos(total)}` }, `${pesos(dineroTotal)} − ${pesos(total)}.`],
      explicacion: `Gasta ${pesos(total)}. Le quedan ${pesos(dineroTotal)} − ${pesos(total)} = ${pesos(queda)}.`,
    };
  },
};

const variasOperaciones: Plantilla = {
  id: 'g4-varias-operaciones',
  dimension: 'problemas',
  operacion: 'mixta',
  descripcion: 'Problemas de dos pasos con varias operaciones',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const tipo = rng.elegir(['bultos', 'ventas', 'camiones']);
    const quien = adulto(rng);
    let enunciado: string;
    let respuesta: number;
    let calc: Calculo;
    let pasos: string;
    if (tipo === 'bultos') {
      const k = rng.elegir([25, 50, 60]);
      const m = rng.entero(lerp(4, 10, dif(ctx)), lerp(12, 40, dif(ctx)));
      const total = k * m;
      const a = rng.entero(Math.floor(total * 0.3), Math.floor(total * 0.7));
      const b = total - a;
      respuesta = m;
      calc = { op: 'division', a: total, b: k };
      enunciado = `${mayus(quien.nombre)} secó ${num(a)} kilos de cacao en la marquesina y ${num(b)} kilos en la elba. Si empaca todo en bultos de ${k} kilos, ¿cuántos bultos llena?`;
      pasos = `${num(a)} + ${num(b)} = ${num(total)}; ${num(total)} ÷ ${k} = ${m}`;
    } else if (tipo === 'ventas') {
      const q = rng.entero(2, lerp(6, 15, dif(ctx)));
      const k = rng.elegir([50, 60, 70]);
      const r = rng.entero(5, 45);
      respuesta = q * k + r;
      calc = { op: 'suma', a: q * k, b: r };
      enunciado = `${mayus(quien.nombre)} vendió en la cooperativa ${q} bultos de ${k} kilos de cacao y otro día ${r} kilos sueltos. ¿Cuántos kilos vendió en total?`;
      pasos = `${q} × ${k} = ${num(q * k)}; ${num(q * k)} + ${r} = ${num(respuesta)}`;
    } else {
      const c = rng.entero(2, 6);
      const cada = rng.entero(lerp(80, 200, dif(ctx)), lerp(300, 2000, dif(ctx)));
      const queda = c * cada;
      const despachado = rng.entero(100, lerp(1000, 20000, dif(ctx)));
      const tenia = queda + despachado;
      respuesta = cada;
      calc = { op: 'division', a: queda, b: c };
      enunciado = `La cooperativa tenía ${num(tenia)} kilos de cacao. Vendió ${num(despachado)} kilos en el pueblo y el resto lo reparte por igual en ${c} camiones. ¿Cuántos kilos lleva cada camión?`;
      pasos = `${num(tenia)} − ${num(despachado)} = ${num(queda)}; ${num(queda)} ÷ ${c} = ${num(cada)}`;
    }
    const modo = modoRespuesta(ctx, respuesta, calc);
    return {
      enunciado,
      instruccion: 'Dos pasos',
      ilustracion: 'bulto',
      datos: { a: calc.a, b: calc.b },
      respuesta,
      ...modo,
      calculo: calc,
      pistas: ['¿Qué necesitas saber primero para poder responder la pregunta?', { tipo: 'texto', texto: pasos.split('; ')[0] }, `Primer paso: ${pasos.split('; ')[0]}. Ahora haz el segundo.`],
      explicacion: `${pasos.replace('; ', '. Luego, ')}.`,
    };
  },
};

const u = (plantilla: Plantilla, params?: Uso['params']): Uso => ({ plantilla, params });

export const g4: DefinicionPista = {
  pista: 'g4',
  limite: 1000000,
  plantillas: [
    valorPosicional,
    compararGrandes,
    redondeo,
    razonable,
    sumaGrande,
    restaGrande,
    problemaSumaResta,
    multiplicar1,
    multiplicar2,
    surcos,
    divisionResiduo,
    repartoResiduo,
    comprobarDivision,
    viajes,
    interpretarResiduo,
    veces,
    tablaProduccion,
    dinero,
    variasOperaciones,
    divDos,
    divProblema,
    residuoContexto,
  ],
  temas: [
    {
      titulo: 'Repaso: sumar y restar números grandes',
      usos: [u(sumaGrande), u(restaGrande), u(valorPosicional), u(compararGrandes), u(redondeo), u(problemaSumaResta), u(razonable, { op: 'suma' })],
    },
    {
      titulo: 'Repaso: multiplicar por 1 y 2 cifras',
      usos: [u(multiplicar2), u(multiplicar1), u(surcos), u(razonable, { op: 'multiplicacion' })],
    },
    {
      titulo: 'Repaso: división con residuo',
      usos: [u(divisionResiduo), u(repartoResiduo)],
    },
    {
      titulo: 'Dividir números grandes entre 1 cifra',
      usos: [u(divDos, { divCifras: 1 }), u(divProblema, { divCifras: 1 }), u(surcos, { op: 'mixta' })],
    },
    {
      titulo: 'Dividir entre 2 cifras',
      usos: [u(divDos), u(divProblema, { maxPesos: 1000000 })],
    },
    {
      titulo: 'Comprobar la división',
      usos: [u(comprobarDivision), u(divisionResiduo)],
    },
    {
      titulo: 'El residuo: viajes y empaques',
      usos: [u(interpretarResiduo), u(viajes), u(residuoContexto)],
    },
    {
      titulo: 'Doble, triple y mitad',
      usos: [u(veces), u(multiplicar1)],
    },
    {
      titulo: 'Problemas con varias operaciones',
      usos: [u(variasOperaciones), u(problemaSumaResta), u(dinero, { modo: 'mixta' })],
    },
    {
      titulo: 'Problemas con tablas y dinero',
      usos: [u(tablaProduccion, { modo: 'mixta' }), u(dinero, { modo: 'total' }), u(dinero, { modo: 'unidad' }), u(tablaProduccion, { modo: 'producto' })],
    },
  ],
};

/** Plantillas de división de 4.º que también usa 3.º. */
export { divisionResiduo, repartoResiduo, comprobarDivision, viajes, interpretarResiduo };
