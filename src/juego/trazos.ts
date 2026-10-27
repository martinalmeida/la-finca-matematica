// Reconocimiento de cifras escritas con el dedo, sin internet ni librerías:
// reconocedor de nubes de puntos ($P, Vatavu, Anthony y Wobbrock, 2012). No importa el
// orden ni el sentido de los trazos, pero sí la orientación (un 6 no es un 9).
// También revisa el repaso sobre la guía punteada del Taller.

import { ALTO_CIFRA, ANCHO_CIFRA, FORMAS, type FormaCifra, type Punto, type Trazo } from '../contenido/cifras';

const N = 32;

type PuntoT = Punto & { id: number };
type Nube = PuntoT[];

function aplanar(trazos: Trazo[]): PuntoT[] {
  return trazos.flatMap((t, id) => t.map((q) => ({ x: q.x, y: q.y, id })));
}

function largoTrazos(puntos: PuntoT[]): number {
  let l = 0;
  for (let i = 1; i < puntos.length; i++) if (puntos[i].id === puntos[i - 1].id) l += Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y);
  return l;
}

function remuestrear(puntos: PuntoT[], n: number): Nube {
  const total = largoTrazos(puntos);
  if (total === 0) return Array.from({ length: n }, () => ({ ...puntos[0] }));
  const I = total / (n - 1);
  let D = 0;
  const pts = puntos.map((q) => ({ ...q }));
  const nuevos: Nube = [{ ...pts[0] }];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].id !== pts[i - 1].id) continue;
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (D + d >= I && d > 0) {
      const t = (I - D) / d;
      const q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y), id: pts[i].id };
      nuevos.push(q);
      pts.splice(i, 0, q);
      D = 0;
    } else D += d;
  }
  while (nuevos.length < n) nuevos.push({ ...pts[pts.length - 1] });
  return nuevos.slice(0, n);
}

function normalizar(nube: Nube): Nube {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const q of nube) {
    minX = Math.min(minX, q.x);
    minY = Math.min(minY, q.y);
    maxX = Math.max(maxX, q.x);
    maxY = Math.max(maxY, q.y);
  }
  const escala = Math.max(maxX - minX, maxY - minY) || 1;
  const escalada = nube.map((q) => ({ x: (q.x - minX) / escala, y: (q.y - minY) / escala, id: q.id }));
  const cx = escalada.reduce((s, q) => s + q.x, 0) / escalada.length;
  const cy = escalada.reduce((s, q) => s + q.y, 0) / escalada.length;
  return escalada.map((q) => ({ x: q.x - cx, y: q.y - cy, id: q.id }));
}

function distanciaNubes(a: Nube, b: Nube, inicio: number, mejor: number): number {
  const usado = new Array<boolean>(b.length).fill(false);
  let suma = 0;
  let i = inicio;
  do {
    let min = Infinity;
    let indice = -1;
    for (let j = 0; j < b.length; j++) {
      if (usado[j]) continue;
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d < min) {
        min = d;
        indice = j;
      }
    }
    usado[indice] = true;
    const peso = 1 - ((i - inicio + a.length) % a.length) / a.length;
    suma += peso * min;
    if (suma >= mejor) return suma;
    i = (i + 1) % a.length;
  } while (i !== inicio);
  return suma;
}

function emparejar(a: Nube, b: Nube, mejor = Infinity): number {
  const paso = Math.floor(Math.pow(a.length, 0.5));
  let min = mejor;
  for (let i = 0; i < a.length; i += paso) {
    min = Math.min(min, distanciaNubes(a, b, i, min), distanciaNubes(b, a, i, min));
  }
  return min;
}

function nube(trazos: Trazo[]): Nube {
  return normalizar(remuestrear(aplanar(trazos.filter((t) => t.length > 0)), N));
}

/** Variante de una forma estirada o encogida a lo ancho (los niños escriben cifras anchas o flacas). */
function estirar(forma: FormaCifra, fx: number): FormaCifra {
  return forma.map((t) => t.map((q) => ({ x: ANCHO_CIFRA / 2 + (q.x - ANCHO_CIFRA / 2) * fx, y: q.y })));
}

type Plantilla = { cifra: number; nube: Nube };

let plantillas: Plantilla[] | null = null;
function lasPlantillas(): Plantilla[] {
  if (!plantillas) {
    plantillas = [];
    for (const [c, formas] of Object.entries(FORMAS)) {
      for (const f of formas) {
        // El 1 es solo un palito: estirarlo a lo ancho no cambia nada.
        const anchos = c === '1' ? [1] : [0.75, 1, 1.3];
        for (const fx of anchos) plantillas.push({ cifra: Number(c), nube: nube(estirar(f, fx)) });
      }
    }
  }
  return plantillas;
}

export type Reconocimiento = {
  cifra: number;
  /** Entre 0 y 1: qué tan claro es frente a la segunda cifra más parecida. */
  confianza: number;
  /** Segunda cifra más parecida (para preguntar «¿es un 7 o un 1?»). */
  segunda: number;
};

/** Confianza mínima para aceptar la cifra sin preguntar. */
export const CONFIANZA_MINIMA = 0.18;

/** ¿Es un trazo casi vertical (un 1)? El remuestreo de una línea es muy estable: se mira la forma antes. */
function esPalito(puntos: Punto[]): boolean {
  const xs = puntos.map((q) => q.x);
  const ys = puntos.map((q) => q.y);
  const ancho = Math.max(...xs) - Math.min(...xs);
  const alto = Math.max(...ys) - Math.min(...ys);
  return alto > 0 && ancho / alto < 0.22;
}

export function reconocerCifra(trazos: Trazo[]): Reconocimiento | null {
  const utiles = trazos.filter((t) => t.length > 0);
  const puntos = utiles.flat();
  if (puntos.length < 2) return null;
  const xs = puntos.map((q) => q.x);
  const ys = puntos.map((q) => q.y);
  if (Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < 4) return null;
  // Un solo trazo muy angosto: es un 1, sin dudas.
  if (utiles.length === 1 && esPalito(puntos)) return { cifra: 1, confianza: 1, segunda: 7 };
  const candidata = nube(utiles);
  const mejores = new Map<number, number>();
  for (const pl of lasPlantillas()) {
    const d = emparejar(candidata, pl.nube, mejores.get(pl.cifra) ?? Infinity);
    if (d < (mejores.get(pl.cifra) ?? Infinity)) mejores.set(pl.cifra, d);
  }
  const orden = [...mejores.entries()].sort((a, b) => a[1] - b[1]);
  const [c1, d1] = orden[0];
  const [c2, d2] = orden[1];
  return { cifra: c1, confianza: d2 > 0 ? Math.max(0, Math.min(1, (d2 - d1) / d2)) : 0, segunda: c2 };
}

// --- Repaso sobre la guía del Taller ---

/** Puntos de la forma principal, en las coordenadas de una caja dada. */
export function formaEnCaja(forma: FormaCifra, caja: { x: number; y: number; escala: number }): Trazo[] {
  return forma.map((t) => t.map((q) => ({ x: caja.x + q.x * caja.escala, y: caja.y + q.y * caja.escala })));
}

/** Caja centrada para dibujar una cifra en un lienzo de ancho × alto con margen. */
export function cajaCifra(ancho: number, alto: number, margen: number): { x: number; y: number; escala: number } {
  const escala = Math.min((ancho - 2 * margen) / ANCHO_CIFRA, (alto - 2 * margen) / ALTO_CIFRA);
  return { x: (ancho - ANCHO_CIFRA * escala) / 2, y: (alto - ALTO_CIFRA * escala) / 2, escala };
}

function densificar(trazos: Trazo[], paso: number): Punto[] {
  const salida: Punto[] = [];
  for (const t of trazos) {
    for (let i = 0; i < t.length; i++) {
      if (i === 0) {
        salida.push(t[0]);
        continue;
      }
      const a = t[i - 1];
      const b = t[i];
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / paso));
      for (let k = 1; k <= n; k++) salida.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
    }
  }
  return salida;
}

function distanciaMinima(q: Punto, puntos: Punto[]): number {
  let min = Infinity;
  for (const r of puntos) min = Math.min(min, Math.hypot(q.x - r.x, q.y - r.y));
  return min;
}

export type Repaso = {
  /** Parte de la guía que ya se cubrió (0 a 1). */
  cubierto: number;
  /** Parte de lo dibujado que quedó cerca de la guía (0 a 1). */
  dentro: number;
  /** El primer trazo empezó cerca del punto de inicio. */
  buenInicio: boolean;
  bien: boolean;
};

/** Revisa un repaso: guía y dibujo en las mismas coordenadas; tolerancia en esas unidades. */
export function revisarRepaso(guia: Trazo[], dibujo: Trazo[], tolerancia: number): Repaso {
  const g = densificar(guia, tolerancia / 3);
  const d = densificar(dibujo.filter((t) => t.length > 0), tolerancia / 3);
  if (!d.length) return { cubierto: 0, dentro: 0, buenInicio: false, bien: false };
  const cubierto = g.filter((q) => distanciaMinima(q, d) <= tolerancia).length / g.length;
  const dentro = d.filter((q) => distanciaMinima(q, g) <= tolerancia * 1.3).length / d.length;
  const inicio = guia[0][0];
  const primero = dibujo.find((t) => t.length > 0)![0];
  const buenInicio = Math.hypot(primero.x - inicio.x, primero.y - inicio.y) <= tolerancia * 1.8;
  return { cubierto, dentro, buenInicio, bien: cubierto >= 0.8 && dentro >= 0.75 };
}
