// Generador pseudoaleatorio con semilla (mulberry32) y utilidades.
// La semilla de cada nivel es hash(codigoPerfil + pista + nivel + numeroIntento),
// así cada intento trae ejercicios nuevos pero reproducibles para depurar.

export type Rng = {
  /** Número en [0, 1). */
  siguiente(): number;
  /** Entero en [min, max], ambos incluidos. */
  entero(min: number, max: number): number;
  /** Elemento al azar de una lista no vacía. */
  elegir<T>(lista: readonly T[]): T;
  /** Copia barajada (Fisher-Yates). */
  barajar<T>(lista: readonly T[]): T[];
  /** true con probabilidad p. */
  azar(p: number): boolean;
};

export function mulberry32(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash de texto a entero de 32 bits (cyrb53 recortado). */
export function hashTexto(texto: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 ^ h1) >>> 0;
}

export function crearRng(semilla: number | string): Rng {
  const base = mulberry32(typeof semilla === 'string' ? hashTexto(semilla) : semilla);
  const rng: Rng = {
    siguiente: base,
    entero(min, max) {
      const lo = Math.ceil(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      return lo + Math.floor(base() * (hi - lo + 1));
    },
    elegir(lista) {
      return lista[Math.floor(base() * lista.length)];
    },
    barajar(lista) {
      const copia = [...lista];
      for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(base() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
      }
      return copia;
    },
    azar(p) {
      return base() < p;
    },
  };
  return rng;
}

export function semillaNivel(codigo: string, pista: string, nivel: number, intento: number): number {
  return hashTexto(`${codigo}|${pista}|${nivel}|${intento}`);
}
