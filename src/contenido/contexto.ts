// Banco de contexto: San Vicente de Chucurí y la vereda Llana Caliente (Santander).
// Todas las plantillas toman de aquí lugares, productos, personas y medidas.
// Los precios y porcentajes son ilustrativos: no son precios ni datos técnicos reales.

import type { Objeto } from '../juego/tipos';
import type { Rng } from '../juego/rng';

export type Genero = 'f' | 'm';

export type Persona = { nombre: string; genero: Genero };

export const ninos: Persona[] = [
  { nombre: 'Valentina', genero: 'f' },
  { nombre: 'Santiago', genero: 'm' },
  { nombre: 'Mariana', genero: 'f' },
  { nombre: 'Samuel', genero: 'm' },
  { nombre: 'Luisa', genero: 'f' },
  { nombre: 'Andrés', genero: 'm' },
  { nombre: 'Sofía', genero: 'f' },
  { nombre: 'Juan José', genero: 'm' },
  { nombre: 'Daniela', genero: 'f' },
  { nombre: 'Miguel', genero: 'm' },
  { nombre: 'Isabela', genero: 'f' },
  { nombre: 'Felipe', genero: 'm' },
];

export const adultos: Persona[] = [
  { nombre: 'doña Rosa', genero: 'f' },
  { nombre: 'don Ramiro', genero: 'm' },
  { nombre: 'la abuela Carmen', genero: 'f' },
  { nombre: 'el profe Julián', genero: 'm' },
  { nombre: 'doña Marleny', genero: 'f' },
  { nombre: 'don Efraín', genero: 'm' },
  { nombre: 'la tía Gloria', genero: 'f' },
  { nombre: 'el abuelo Pedro', genero: 'm' },
];

export const lugares = {
  vereda: 'la vereda Llana Caliente',
  finca: 'la finca',
  escuela: 'la escuela de la vereda',
  tienda: 'la tienda de la vereda',
  casco: 'el casco urbano de San Vicente',
  mercado: 'el mercado del pueblo',
  cooperativa: 'la cooperativa de cacaoteros',
  quebrada: 'la quebrada',
  camino: 'el camino de herradura',
  serrania: 'la Serranía de los Yariguíes',
  huerta: 'la huerta escolar',
  feria: 'la feria del pueblo',
} as const;

export const nombresFincas = ['El Mirador', 'La Esperanza', 'Buenavista', 'El Cacaotal', 'La Palmera', 'Los Naranjos', 'El Recreo', 'La Quebradita'];

/** Producto contable con su concordancia gramatical. */
export type Producto = {
  singular: string;
  plural: string;
  genero: Genero;
  objeto: Objeto;
  /** Dónde se recoge o se guarda, con su artículo («el canasto», «la cubeta»). */
  recipiente: string;
  /** Dibujo del recipiente. */
  dibujoRecipiente: Objeto;
  /** Verbo de cosecha en pasado. */
  verbo: string;
};

export const productos: Producto[] = [
  { singular: 'mazorca de cacao', plural: 'mazorcas de cacao', genero: 'f', objeto: 'mazorca', recipiente: 'el canasto', dibujoRecipiente: 'canasta', verbo: 'cortó' },
  { singular: 'huevo', plural: 'huevos', genero: 'm', objeto: 'huevo', recipiente: 'la cubeta', dibujoRecipiente: 'cubeta', verbo: 'recogió' },
  { singular: 'naranja', plural: 'naranjas', genero: 'f', objeto: 'naranja', recipiente: 'la canasta', dibujoRecipiente: 'canasta', verbo: 'cogió' },
  { singular: 'aguacate', plural: 'aguacates', genero: 'm', objeto: 'aguacate', recipiente: 'la canasta', dibujoRecipiente: 'canasta', verbo: 'cogió' },
  { singular: 'mandarina', plural: 'mandarinas', genero: 'f', objeto: 'mandarina', recipiente: 'la canasta', dibujoRecipiente: 'canasta', verbo: 'cogió' },
  { singular: 'limón', plural: 'limones', genero: 'm', objeto: 'limon', recipiente: 'la bolsa', dibujoRecipiente: 'bolsa', verbo: 'cogió' },
  { singular: 'plátano', plural: 'plátanos', genero: 'm', objeto: 'platano', recipiente: 'el racimo', dibujoRecipiente: 'platano', verbo: 'cortó' },
];

export const frutas = productos.filter((p) => ['naranja', 'aguacate', 'mandarina', 'limon'].includes(p.objeto));

/** Cosas que se producen por kilos o bultos. */
export const cultivos = ['cacao', 'café', 'aguacate', 'naranja', 'mandarina', 'limón', 'plátano', 'yuca', 'maíz'];

export const animales = [
  { singular: 'gallina', plural: 'gallinas', genero: 'f' as Genero },
  { singular: 'pollito', plural: 'pollitos', genero: 'm' as Genero },
  { singular: 'cerdo', plural: 'cerdos', genero: 'm' as Genero },
  { singular: 'vaca', plural: 'vacas', genero: 'f' as Genero },
];

/** Artículos de la tienda con precio ilustrativo en pesos (múltiplos redondos). */
export const articulosTienda = [
  { nombre: 'arepa', precio: 1000, genero: 'f' as Genero },
  { nombre: 'libra de arroz', precio: 2500, genero: 'f' as Genero },
  { nombre: 'panela', precio: 3000, genero: 'f' as Genero },
  { nombre: 'libra de fríjol', precio: 4500, genero: 'f' as Genero },
  { nombre: 'bolsa de leche', precio: 3500, genero: 'f' as Genero },
  { nombre: 'cuaderno', precio: 2000, genero: 'm' as Genero },
  { nombre: 'lápiz', precio: 500, genero: 'm' as Genero },
  { nombre: 'jabón', precio: 2500, genero: 'm' as Genero },
  { nombre: 'libra de sal', precio: 1500, genero: 'f' as Genero },
  { nombre: 'banano', precio: 500, genero: 'm' as Genero },
];

export const transportes = ['la chiva', 'el bus', 'la moto del vecino', 'el carro de la cooperativa'];

export const vidaCotidiana = {
  refrigerio: 'el refrigerio escolar',
  huerta: 'la huerta escolar',
  feria: 'la feria del pueblo',
  chiva: 'la chiva que baja al pueblo',
};

export const insumos = ['abono', 'cal', 'semillas', 'bolsas para vivero'];

export const medidas = {
  arrobaKg: 12.5, // 1 arroba = 12,5 kg (uso común en Colombia)
  libraG: 500,
  kilogramoG: 1000,
};

// --- Ayudantes de redacción ---

export function persona(rng: Rng, excluir: string[] = []): Persona {
  const disponibles = ninos.filter((n) => !excluir.includes(n.nombre));
  return rng.elegir(disponibles.length ? disponibles : ninos);
}

export function dosPersonas(rng: Rng): [Persona, Persona] {
  const [a, b] = rng.barajar(ninos);
  return [a, b];
}

export function adulto(rng: Rng, excluir: string[] = []): Persona {
  const disponibles = adultos.filter((n) => !excluir.includes(n.nombre));
  return rng.elegir(disponibles.length ? disponibles : adultos);
}

/** "Cuántas" o "Cuántos" según el género. */
export function cuantos(g: Genero, mayuscula = true): string {
  const w = g === 'f' ? 'cuántas' : 'cuántos';
  return mayuscula ? w[0].toUpperCase() + w.slice(1) : w;
}

/** Singular o plural según la cantidad. */
export function nombreCant(p: { singular: string; plural: string }, n: number): string {
  return n === 1 ? p.singular : p.plural;
}

/** Pone la primera letra en mayúscula (para "doña Rosa" al inicio de frase). */
export function mayus(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Formato de número de Colombia: 1.000 y 12,5. Agrupa también los de 4 cifras. */
export function num(n: number): string {
  const negativo = n < 0;
  const [ent, dec] = Math.abs(n).toString().split('.');
  const conPuntos = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (negativo ? '-' : '') + conPuntos + (dec ? ',' + dec : '');
}

/** Pesos: $1.500 */
export function pesos(n: number): string {
  return '$' + num(n);
}

// --- Dibujo que corresponde a lo que nombra el enunciado ---

/** Árbol (o mata) de un cultivo: «árboles de cacao» se dibujan con mazorcas, los de café con cerezas… */
export function arbolDe(cultivo: string): Objeto {
  const mapa: Record<string, Objeto> = {
    cacao: 'arbol-cacao',
    café: 'arbol-cafe',
    aguacate: 'arbol-aguacate',
    naranja: 'arbol-naranja',
    mandarina: 'arbol-mandarina',
    limón: 'arbol-limon',
    plátano: 'platanera',
  };
  return mapa[cultivo] ?? 'arbol';
}

/**
 * Dibujo para «kilos de …»: la fruta si se cuenta por frutas; el bulto (que dice «kg») para lo que se
 * vende seco o por peso (cacao, café, abono…).
 */
export function dibujoKilosDe(cultivo: string): Objeto {
  const mapa: Record<string, Objeto> = { aguacate: 'aguacate', naranja: 'naranja', mandarina: 'mandarina', limón: 'limon', plátano: 'platano', maíz: 'semilla' };
  return mapa[cultivo] ?? 'bulto';
}
