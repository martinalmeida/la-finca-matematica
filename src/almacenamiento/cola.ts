// Cola de lo que falta subir a la nube. Se juega sin internet: cada escritura de una
// clave del usuario (progreso, pruebas, resumen…) se marca como pendiente, y cada
// ejercicio y cada nivel terminado se guardan aquí hasta que haya señal.
// No toca la red: eso lo hace servicios/sincronizacion.ts.

import { alEscribir, borrar, clavesApp, escribir, leer, leerTexto, PREFIJO_V1 } from './almacen';

/** Un ejercicio respondido (tabla «eventos»). */
export type Evento = {
  id: string;
  t: string;
  tipo: TipoPartida;
  pista: string;
  nivel: number;
  plantilla: string;
  operacion: string;
  correcto: boolean;
  intentos: number;
  pistas_usadas: number;
  tipo_error?: string;
  ms: number;
};

export type TipoPartida = 'nivel' | 'prueba-diagnostica' | 'prueba-final';

/** Un nivel o una prueba terminada (tabla «partidas»). */
export type Partida = {
  id: string;
  t: string;
  tipo: TipoPartida;
  pista: string;
  nivel: number | null;
  aciertos: number;
  total: number;
  estrellas: number | null;
  ms_total: number;
  repaso: boolean;
  banda: string | null;
};

export type Fila = { clave: string; valor: unknown; actualizado: string };
export type Lote = { filas: Fila[]; eventos: Evento[]; partidas: Partida[] };

type Cola = { claves: Record<string, string>; eventos: Evento[]; partidas: Partida[] };

const K_COLA = PREFIJO_V1 + 'pendientes';
/** Datos por usuario que viajan a la nube (tabla «datos_usuario»). */
const BASES = ['progreso', 'pruebas', 'resumen', 'historiasVistas', 'reacciones', 'taller', 'preguntasVistas'];
/** Tope de ejercicios guardados sin señal (los más viejos se descartan). */
export const MAX_EVENTOS = 5000;

let usuario: string | null = null;
let silencio = false;
let quitarObservador: (() => void) | null = null;

/** «fincaMat:v1:progreso:{id}:g3» → «progreso:g3». Null si no es una clave sincronizada del usuario. */
export function claveRemota(local: string, id: string): string | null {
  if (!local.startsWith(PREFIJO_V1)) return null;
  const [base, duenno, ...resto] = local.slice(PREFIJO_V1.length).split(':');
  if (!BASES.includes(base) || duenno !== id) return null;
  return [base, ...resto].join(':');
}

/** «progreso:g3» → «fincaMat:v1:progreso:{id}:g3». */
export function claveLocal(remota: string, id: string): string {
  const [base, ...resto] = remota.split(':');
  return PREFIJO_V1 + [base, id, ...resto].join(':');
}

function leerCola(): Cola {
  const c = leer<Partial<Cola> | null>(K_COLA, {}) ?? {};
  return { claves: c.claves ?? {}, eventos: Array.isArray(c.eventos) ? c.eventos : [], partidas: Array.isArray(c.partidas) ? c.partidas : [] };
}

function guardarCola(c: Cola): void {
  escribir(K_COLA, c);
}

/** Empieza a marcar como pendientes las escrituras del usuario. */
export function activarCola(id: string | null): void {
  usuario = id;
  quitarObservador?.();
  quitarObservador = null;
  if (!id) return;
  quitarObservador = alEscribir((clave) => {
    if (silencio || clave === K_COLA) return;
    const remota = claveRemota(clave, id);
    if (!remota) return;
    const c = leerCola();
    c.claves[remota] = new Date().toISOString();
    guardarCola(c);
  });
}

/** Escribe sin marcar pendientes (datos que vienen de la nube). */
export function sinMarcar(f: () => void): void {
  silencio = true;
  try {
    f();
  } finally {
    silencio = false;
  }
}

export function encolarEvento(e: Evento): void {
  if (!usuario) return;
  const c = leerCola();
  c.eventos.push(e);
  if (c.eventos.length > MAX_EVENTOS) c.eventos = c.eventos.slice(c.eventos.length - MAX_EVENTOS);
  guardarCola(c);
}

export function encolarPartida(p: Partida): void {
  if (!usuario) return;
  const c = leerCola();
  c.partidas.push(p);
  guardarCola(c);
}

/** Cuántas cosas faltan por subir. */
export function pendientes(): number {
  const c = leerCola();
  return Object.keys(c.claves).length + c.eventos.length + c.partidas.length;
}

/** Lo que hay que enviar ahora, con el valor actual de cada clave. */
export function tomarLote(id: string): Lote {
  const c = leerCola();
  const filas: Fila[] = [];
  for (const [clave, actualizado] of Object.entries(c.claves)) {
    const texto = leerTexto(claveLocal(clave, id));
    if (texto === null) continue;
    try {
      filas.push({ clave, valor: JSON.parse(texto), actualizado });
    } catch {
      // valor dañado: no se sube
    }
  }
  return { filas, eventos: c.eventos, partidas: c.partidas };
}

/** Quita de la cola lo que ya subió (si una clave cambió mientras tanto, sigue pendiente). */
export function confirmarLote(id: string, lote: Lote): void {
  const c = leerCola();
  for (const f of lote.filas) if (c.claves[f.clave] === f.actualizado) delete c.claves[f.clave];
  // Una clave que ya no existe en el celular no se puede subir.
  for (const clave of Object.keys(c.claves)) if (leerTexto(claveLocal(clave, id)) === null) delete c.claves[clave];
  const ev = new Set(lote.eventos.map((e) => e.id));
  const pa = new Set(lote.partidas.map((p) => p.id));
  c.eventos = c.eventos.filter((e) => !ev.has(e.id));
  c.partidas = c.partidas.filter((p) => !pa.has(p.id));
  guardarCola(c);
}

/** Escribe en el celular lo que llegó de la nube, sin marcarlo como pendiente. */
export function aplicarRemotas(id: string, filas: { clave: string; valor: unknown }[]): void {
  sinMarcar(() => {
    for (const f of filas) if (BASES.includes(f.clave.split(':')[0])) escribir(claveLocal(f.clave, id), f.valor);
  });
}

/** Borra todo lo del usuario en el celular: datos sincronizados, silo y cola. */
export function borrarDatosLocales(id: string): void {
  sinMarcar(() => {
    for (const k of clavesApp()) {
      if (claveRemota(k, id) !== null || k === K_COLA || k === PREFIJO_V1 + 'silo' || k === PREFIJO_V1 + 'siloEscuela' || k === PREFIJO_V1 + 'ultimaSync') borrar(k);
    }
  });
}
