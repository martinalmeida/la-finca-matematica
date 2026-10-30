// Preguntas ya vistas por cada usuario, para que no le salga ninguna repetida: ni en otro intento,
// ni en un repaso, ni en las pruebas, ni en «Practicar uno parecido», ni en otro celular (la lista
// viaja a la nube con sus datos y la nube une las de todos sus celulares).
//
// Se guardan dos cosas:
// - la huella exacta de cada pregunta vista (enunciado + respuesta + lo que se ve para responder);
// - las últimas frases (el enunciado sin números ni nombres), para que tampoco salga seguido la
//   misma situación con otros números.

import type { Ejercicio, EjercicioBase } from './tipos';
import { hashTexto } from './rng';
import { leer, escribir, PREFIJO_V1 } from '../almacenamiento/almacen';
import { adultos, ninos, nombresFincas } from '../contenido/contexto';

/** Tope de huellas exactas por usuario (las más viejas se olvidan primero). */
export const MAX_EXACTAS = 30000;
/** Frases recientes que se evitan repetir. */
export const MAX_FRASES = 400;

export type Vistas = {
  exactas: Set<string>;
  /** Frase → orden en que se vio por última vez (0 = la más vieja de la lista). */
  frases: Map<string, number>;
};

type Guardado = { e: string[]; f: string[] };

const clave = (id: string) => `${PREFIJO_V1}preguntasVistas:${id}`;

/** Todos los textos y números de un valor, ordenados (el orden de las opciones no cambia la pregunta). */
function hojas(v: unknown, out: string[]): string[] {
  if (v === null || v === undefined || typeof v === 'function') return out;
  if (typeof v === 'object') {
    for (const x of Array.isArray(v) ? v : Object.values(v as Record<string, unknown>)) hojas(x, out);
  } else out.push(String(v));
  return out;
}

const normalizar = (t: string) => t.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

/** Huella exacta: dos preguntas con la misma huella son la misma pregunta. */
export function huella(ej: EjercicioBase): string {
  const visto = [...hojas(ej.interaccion, []), ...hojas(ej.dibujo, [])].sort().join('¦');
  return hashTexto(`${normalizar(ej.enunciado)}|${String(ej.respuesta)}|${visto}`).toString(36);
}

// Nombres de personas y fincas: cambiar solo el nombre no hace otra situación.
const NOMBRES = [
  ...ninos.map((p) => p.nombre),
  ...adultos.map((p) => p.nombre.replace(/^(doña|don|la abuela|el abuelo|la tía|el tío|el profe|la profe)\s+/i, '')),
  ...nombresFincas,
]
  .sort((a, b) => b.length - a.length)
  .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const RE_NOMBRES = new RegExp(`(?<![\\p{L}])(${NOMBRES.join('|')})(?![\\p{L}])`, 'giu');

const RE_TRATOS = /(?<![\p{L}])(?:(?:a|de)\s+)?(?:(?:el|la|al|del)\s+)?(?:doña|don|abuel[ao]|tí[ao]|profe|vecin[ao]|señora?)\s+@/giu;

/** Frase de la pregunta: el enunciado sin cifras ni nombres propios. */
export function frase(ej: EjercicioBase): string {
  const t = normalizar(ej.enunciado)
    .replace(/\d[\d.,]*/g, '#')
    .replace(RE_NOMBRES, '@')
    // «doña @», «del profe @», «a la tía @»: el trato tampoco cambia la situación.
    .replace(RE_TRATOS, '@');
  return hashTexto(t).toString(36);
}

function leerGuardado(id: string): Guardado {
  const g = leer<Partial<Guardado> | null>(clave(id), null);
  return {
    e: Array.isArray(g?.e) ? g!.e.filter((x): x is string => typeof x === 'string') : [],
    f: Array.isArray(g?.f) ? g!.f.filter((x): x is string => typeof x === 'string') : [],
  };
}

function aVistas(g: Guardado): Vistas {
  return { exactas: new Set(g.e), frases: new Map(g.f.map((f, k) => [f, k])) };
}

/** Lo que ya vio el usuario (para el motor). */
export function leerVistas(id: string): Vistas {
  return aVistas(leerGuardado(id));
}

/** Vistas vacías (para pruebas y para quien no tiene cuenta). */
export function vistasVacias(): Vistas {
  return { exactas: new Set(), frases: new Map() };
}

/** Agrega una pregunta a unas vistas en memoria (lo usa también la simulación de los tests). */
export function agregarVista(v: Vistas, ej: EjercicioBase): void {
  v.exactas.add(huella(ej));
  const f = frase(ej);
  v.frases.delete(f);
  v.frases.set(f, v.frases.size);
  if (v.frases.size > MAX_FRASES) {
    const lista = [...v.frases.keys()].slice(-MAX_FRASES);
    v.frases = new Map(lista.map((x, k) => [x, k]));
  }
}

/** Marca la pregunta como vista (se llama cuando aparece en pantalla). */
export function marcarVista(id: string, ej: Ejercicio): void {
  const g = leerGuardado(id);
  const h = huella(ej);
  const f = frase(ej);
  const yaEstaba = g.e.includes(h);
  if (yaEstaba && g.f[g.f.length - 1] === f) return;
  const e = yaEstaba ? g.e : [...g.e, h].slice(-MAX_EXACTAS);
  const fs = [...g.f.filter((x) => x !== f), f].slice(-MAX_FRASES);
  escribir(clave(id), { e, f: fs });
}
