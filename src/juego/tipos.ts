import type { Rng } from './rng';

export type Grado = 1 | 2 | 3 | 4 | 5;
export type Pista = 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'familia';
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
  | 'canasta';

export type Respuesta = number | string;

/** Ayuda visual de la pista 2. */
export type Visual =
  | { tipo: 'objetos'; objeto: Objeto; grupos: number[]; tachados?: number }
  | { tipo: 'arreglo'; filas: number; columnas: number; objeto?: Objeto }
  | { tipo: 'recta'; min: number; max: number; desde: number; saltos: number[] }
  | { tipo: 'bloques'; valor: number }
  | { tipo: 'reparto'; total: number; grupos: number; objeto?: Objeto }
  | { tipo: 'texto'; texto: string };

/** Forma de responder: cada variante es un componente táctil. */
export type Interaccion =
  | { tipo: 'opciones'; opciones: Respuesta[] }
  | { tipo: 'numerica' }
  | { tipo: 'contar'; objeto: Objeto; cantidad: number; opciones: number[] }
  | { tipo: 'arrastrar'; objeto: Objeto; modo: 'juntar' | 'quitar' | 'repartir'; a: number; b: number }
  | { tipo: 'arreglo'; filas: number; columnas: number; objeto: Objeto }
  | { tipo: 'recta'; min: number; max: number; paso: number; inicio: number }
  | { tipo: 'bloques'; modo: 'leer' | 'construir'; valor: number }
  | { tipo: 'algoritmo'; operacion: 'suma' | 'resta' | 'multiplicacion'; a: number; b: number }
  | { tipo: 'razonable'; propuesto: number; esRazonable: boolean; opciones: number[] }
  | { tipo: 'tabla'; encabezados: string[]; filas: (string | number)[][]; opciones?: Respuesta[] };

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
  datos: Record<string, number | string>;
  respuesta: Respuesta;
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
};

/** Lo que una plantilla devuelve; el motor completa id, pista y validar. */
export type EjercicioBase = Omit<Ejercicio, 'id' | 'pista' | 'validar' | 'plantilla' | 'dimension' | 'operacion' | 'origen'> & {
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

export type Tramo = {
  inicio: number;
  fin: number;
  titulo: string;
  usos: Uso[];
};

export type DefinicionPista = {
  pista: Pista;
  /** Mayor número permitido en datos y respuestas (prueba de rango). */
  limite: number;
  tramos: Tramo[];
  plantillas: Plantilla[];
};
