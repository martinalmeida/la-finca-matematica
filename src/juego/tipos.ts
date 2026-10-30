import type { Rng } from './rng';

export type Grado = 1 | 2 | 3 | 4 | 5 | 'inclusion';
/** Rutas de juego. «familia» es la prueba diagnóstica de las familias; sus rutas son fam-*. */
export type Pista = 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'inclusion' | 'familia' | 'fam-basica' | 'fam-intermedia' | 'fam-avanzada';
/** Exigencia del curso según la prueba diagnóstica. */
export type Banda = 'refuerzo' | 'basico' | 'avanzado';
export type Dimension = 'comprension' | 'procedimiento' | 'problemas' | 'aplicacion';
export type Operacion = 'suma' | 'resta' | 'multiplicacion' | 'division' | 'mixta';

/** Objetos que se pueden dibujar (ver componentes/Ilustraciones). */
export type Objeto =
  | 'huevo'
  | 'mazorca'
  | 'naranja'
  | 'aguacate'
  | 'gallina'
  | 'bulto'
  | 'arbol'
  | 'platano'
  | 'mandarina'
  | 'limon'
  | 'arepa'
  | 'moneda'
  | 'cafe'
  | 'canasta'
  | 'semilla'
  | 'pan'
  | 'mata'
  | 'bolsa'
  | 'caja'
  | 'cubeta'
  | 'billete'
  | 'mesa'
  | 'arbol-cacao'
  | 'arbol-cafe'
  | 'arbol-aguacate'
  | 'arbol-naranja'
  | 'arbol-mandarina'
  | 'arbol-limon'
  | 'platanera';

export type Respuesta = number | string;

/** Dónde están o a dónde van los objetos al arrastrar o repartir: el nombre que dice el enunciado y su dibujo. */
export type Recipiente = { nombre: string; dibujo?: Objeto | 'nino' | 'adulto' | 'mula' };

/** Colores y formas del pre-número (Inclusión). */
export type ColorFigura = 'rojo' | 'azul' | 'amarillo' | 'verde' | 'anaranjado' | 'morado' | 'rosado' | 'cafe';
export type FormaFigura = 'circulo' | 'cuadrado' | 'triangulo' | 'rectangulo' | 'estrella' | 'corazon' | 'ovalo';

/** Cosas que se dibujan paradas para comparar su altura (Inclusión). */
export type CosaAlta = 'vela' | 'botella' | 'lapiz';

/** Dibujo sin números para comparar y clasificar (Inclusión). La escala va de 0,4 a 1. */
export type Figura =
  | { forma: FormaFigura; /** Sin color: gris (cuando lo que importa es la forma). */ color?: ColorFigura; escala?: number }
  /** Un objeto; con cantidad, un grupo de objetos dentro de una canasta (0 = canasta vacía). */
  | { objeto: Objeto; escala?: number; cantidad?: number }
  /** Torre de cajas (alta o baja). */
  | { torre: number }
  /** Un lazo: largo de 0,3 a 1. */
  | { lazo: number }
  /** Una vela, una botella o un lápiz parado: alto de 0,4 a 1 (para ordenar por altura). */
  | { cosa: CosaAlta; alto: number }
  /** El botón «igual» (dos grupos con la misma cantidad). */
  | { igual: true }
  /** Cara de un dado con 1 a 6 puntos (reconocer la cantidad sin contar). */
  | { dado: number }
  /** Marco de 10: dos filas de cinco casillas con `cantidad` llenas (con el objeto o con fichas). */
  | { marco: number; objeto?: Objeto };

/** Una figura que se puede tocar: el id es la respuesta; la etiqueta, lo que se lee en voz alta. */
export type OpcionFigura = { id: string; etiqueta: string; figura: Figura };

/** Ayuda visual de la pista 2. */
export type Visual =
  | { tipo: 'objetos'; objeto: Objeto; grupos: number[]; tachados?: number; /** Espacios vacíos (lo que falta para completar). */ vacios?: number; /** Recipiente de cada grupo (cubeta, bolsa…). */ grupo?: Recipiente }
  | { tipo: 'arreglo'; filas: number; columnas: number; objeto?: Objeto }
  | { tipo: 'recta'; min: number; max: number; desde: number; saltos: number[] }
  | { tipo: 'bloques'; valor: number; unidad?: Objeto; decena?: Objeto; centena?: Objeto }
  | { tipo: 'reparto'; total: number; grupos: number; objeto?: Objeto; grupo?: Recipiente }
  /** Monedas y billetes, cada uno con su valor en pesos. */
  | { tipo: 'dinero'; valores: number[] }
  /** Figuras sin números (pre-número). */
  | { tipo: 'figuras'; figuras: OpcionFigura[] }
  | { tipo: 'texto'; texto: string };

/** Forma de responder: cada variante es un componente táctil. */
export type Interaccion =
  | { tipo: 'opciones'; opciones: Respuesta[] }
  | { tipo: 'numerica' }
  | { tipo: 'contar'; objeto: Objeto; cantidad: number; opciones: number[]; /** Responder escribiendo el número con el dedo. */ escribir?: boolean }
  | {
      tipo: 'arrastrar';
      objeto: Objeto;
      modo: 'juntar' | 'quitar' | 'repartir';
      a: number;
      b: number;
      /** Rótulos y dibujos de los depósitos según el enunciado (por defecto, canastas). */
      origen?: Recipiente;
      origen2?: Recipiente;
      /** Al repartir, el nombre en singular de cada grupo («Mesa» → Mesa 1, Mesa 2…). */
      destino?: Recipiente;
    }
  | { tipo: 'arreglo'; filas: number; columnas: number; objeto: Objeto }
  | { tipo: 'recta'; min: number; max: number; paso: number; inicio: number }
  | { tipo: 'bloques'; modo: 'leer' | 'construir'; valor: number; unidad?: Objeto; decena?: Objeto; centena?: Objeto }
  | { tipo: 'algoritmo'; operacion: 'suma' | 'resta' | 'multiplicacion'; a: number; b: number }
  | { tipo: 'razonable'; propuesto: number; esRazonable: boolean; opciones: number[] }
  | { tipo: 'tabla'; encabezados: string[]; filas: (string | number)[][]; opciones?: Respuesta[] }
  /** Escribir el número con el dedo, una cifra por casilla (Inclusión). */
  | { tipo: 'escribir'; cifras: number }
  /** Repasar una cifra sobre la guía punteada (Inclusión). */
  | { tipo: 'trazar'; cifra: number }
  /** Elegir el grupo de dibujos que tiene la cantidad pedida (Inclusión). */
  | { tipo: 'emparejar'; objeto: Objeto; opciones: number[] }
  /** Tocar la figura que se pide (Inclusión, sin números). Con `modelo`, se muestra arriba «igual a este». */
  | { tipo: 'figuras'; opciones: OpcionFigura[]; modelo?: Figura }
  /** Poner `cantidad` objetos en el recipiente tocándolos uno por uno (se cuentan en voz alta). Respuesta: cuántos quedaron dentro. */
  | { tipo: 'poner'; objeto: Objeto; cantidad: number; disponibles: number; recipiente: Recipiente }
  /** Llenar el marco de 10 hasta `cantidad` tocando casillas. Respuesta: cuántas quedaron llenas. */
  | { tipo: 'marco'; cantidad: number; objeto?: Objeto }
  /** Llevar cada figura a su canasta. La respuesta es el número de canasta de cada figura, «0,1,1,0». */
  | { tipo: 'clasificar'; items: OpcionFigura[]; grupos: [OpcionFigura, OpcionFigura] }
  /** Tocar las figuras en orden (del más bajo al más alto). La respuesta son los id en orden, «a|b|c». */
  | { tipo: 'ordenar'; items: OpcionFigura[] };

/** Cálculo principal del ejercicio: lo usa el detector de errores. */
export type Calculo = {
  op: 'suma' | 'resta' | 'multiplicacion' | 'division' | 'conteo' | 'otra';
  a: number;
  b: number;
  /** División en la que la respuesta es el cociente + 1 si hay residuo (p. ej., viajes). */
  redondearArriba?: boolean;
};

export type Ejercicio = {
  id: string;
  plantilla: string;
  pista: Pista;
  dimension: Dimension;
  operacion: Operacion;
  enunciado: string;
  /** Instrucción corta con ícono (para quienes apenas leen). */
  instruccion?: string;
  ilustracion?: Objeto;
  /** Dibujo que acompaña siempre al enunciado (cuentos y cuentas con dibujos). */
  dibujo?: Visual;
  datos: Record<string, number | string>;
  respuesta: Respuesta;
  /** Cómo se dice la respuesta cuando no es un número ni una opción («cada figura en su canasta»). */
  respuestaTexto?: string;
  /** Unidad para mostrar junto al teclado (p. ej., "huevos"). */
  unidad?: string;
  validar(r: Respuesta): boolean;
  distractores: Respuesta[];
  interaccion: Interaccion;
  calculo?: Calculo;
  /** Las 3 pistas: pregunta orientadora, representación visual, paso resuelto. */
  pistas: [string, Visual, string];
  explicacion: string;
  /** Se permiten residuos (para las pruebas). */
  permiteResiduo?: boolean;
  /** Para generar un ejercicio parecido. */
  origen?: { params: Parametros; d: number; nivel: number };
  /** Banda Refuerzo: menos opciones, dibujo de ayuda y paso a paso visibles. */
  apoyo?: boolean;
  /** La respuesta puede llevar coma decimal (muestra la tecla «,»). */
  decimales?: boolean;
};

/** Lo que una plantilla devuelve; el motor completa id, pista y validar. */
export type EjercicioBase = Omit<Ejercicio, 'id' | 'pista' | 'validar' | 'plantilla' | 'dimension' | 'operacion' | 'origen' | 'apoyo'> & {
  validar?: (r: Respuesta) => boolean;
  dimension?: Dimension;
  operacion?: Operacion;
};

export type Parametros = Record<string, number | string | boolean | undefined>;

export type ContextoGeneracion = {
  rng: Rng;
  /** Dificultad dentro del tramo, de 0 a 1. */
  d: number;
  nivel: number;
  pista: Pista;
  repaso: boolean;
  params: Parametros;
};

export type Plantilla = {
  id: string;
  dimension: Dimension;
  operacion: Operacion;
  descripcion: string;
  generar(ctx: ContextoGeneracion): EjercicioBase;
};

/** Uso de una plantilla dentro de un tramo, con parámetros. */
export type Uso = { plantilla: Plantilla; params?: Parametros };

/** Un tema = un nivel de la ruta (10 preguntas). */
export type Tema = {
  titulo: string;
  /** Idea de la lección que se muestra al empezar el nivel (por defecto, la de la lección de su bloque). */
  idea?: string;
  usos: Uso[];
  /** Uso de la pregunta de este tema en la diagnóstica y en la final (por defecto, el primero). */
  prueba?: Uso;
};

export type DefinicionPista = {
  pista: Pista;
  /** Mayor número permitido en datos y respuestas (prueba de rango). */
  limite: number;
  /** Los temas, uno por nivel (10 en las rutas con pruebas). */
  temas: Tema[];
  /** Bloques de la ruta: cada uno agrupa varios niveles seguidos y tiene una lección (Inclusión). */
  bloques?: { titulo: string; niveles: number }[];
  plantillas: Plantilla[];
};
