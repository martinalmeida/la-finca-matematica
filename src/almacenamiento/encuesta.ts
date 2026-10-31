// Encuesta de satisfacción: se guarda en el celular (se responde sin señal) y sube con la
// sincronización por su propia función (enviar_encuesta). Una sola por usuario.
// Su clave no es de las que viajan en «datos_usuario»: así ni el reinicio del progreso ni el cierre
// de sesión la borran, y no se vuelve a pedir en este celular.

import { leer, escribir, PREFIJO_V1 } from './almacen';
import { fuenteLocal, progresoDe, pruebasDe, type Fuente, type Perfil } from './datos';
import { NIVELES_INCLUSION } from './rutaInclusion';
import type { ClavePregunta } from '../contenido/encuesta';

export type RespuestaEncuesta = {
  id: string;
  t: string;
  pista: string;
  respuestas: Partial<Record<ClavePregunta, number | null>>;
  gusto: string;
  mejorar: string;
  version: string;
};

/** Lo guardado en el celular. Sin `respuesta`: ya estaba respondida en la nube (otro celular). */
export type EncuestaLocal = { respuesta?: RespuestaEncuesta; enviada: boolean };

const clave = (id: string) => `${PREFIJO_V1}encuesta:${id}`;

export function leerEncuesta(id: string): EncuestaLocal | null {
  const v = leer<EncuestaLocal | null>(clave(id), null);
  return v && typeof v === 'object' && typeof v.enviada === 'boolean' ? v : null;
}

export function guardarEncuesta(id: string, e: EncuestaLocal): void {
  escribir(clave(id), e);
}

/** La encuesta respondida que falta subir, o null. */
export function encuestaPorEnviar(id: string): RespuestaEncuesta | null {
  const e = leerEncuesta(id);
  return e && !e.enviada && e.respuesta ? e.respuesta : null;
}

/** Ya subió (o ya estaba en la nube). */
export function marcarEncuestaEnviada(id: string): void {
  const e = leerEncuesta(id);
  guardarEncuesta(id, { ...e, enviada: true });
}

/** ¿Terminó la ruta? (Con la fuente de la nube, igual en el panel del profesor.) Estudiantes y familias: hicieron la prueba final. Inclusión: superó el último nivel. */
export function terminoRuta(p: Perfil, f: Fuente = fuenteLocal(p.id)): boolean {
  if (p.grado === 'inclusion') return !!progresoDe(f, 'inclusion').niveles[NIVELES_INCLUSION]?.completado;
  return !!pruebasDe(p, f).final;
}

/** Terminó la ruta y aún no ha respondido la encuesta (es obligatoria). */
export function debeEncuesta(p: Perfil): boolean {
  return !leerEncuesta(p.id) && terminoRuta(p);
}
