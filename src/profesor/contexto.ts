// Estado compartido del panel del profesor.

import { createContext, useContext, type ReactNode } from 'react';
import type { Alumno } from './informes';
import type { Credencial } from './Tarjetas';

export type EstadoProfesor = {
  alumnos: Alumno[];
  /** Vuelve a bajar todo de la nube. */
  recargar: () => Promise<void>;
  avisar: (texto: string) => void;
  /** Ejecuta una acción mostrando su error, si lo hay. Devuelve true si salió bien. */
  ejecutar: (accion: () => Promise<unknown>, exito?: string) => Promise<boolean>;
  abrirDetalle: (id: string | null) => void;
  /** Credenciales creadas o cambiadas en esta sesión (para imprimir tarjetas). */
  credenciales: Credencial[];
  agregarCredencial: (c: Credencial) => void;
  /** Muestra el contenido solo en papel (o «Guardar como PDF») y abre el diálogo de impresión. */
  imprimir: (titulo: string, contenido: ReactNode) => void;
};

export const ContextoProfesor = createContext<EstadoProfesor | null>(null);

export function useProfesor(): EstadoProfesor {
  const c = useContext(ContextoProfesor);
  if (!c) throw new Error('useProfesor fuera del panel');
  return c;
}
