// Estado global del usuario que juega: pantalla actual (enrutamiento en memoria), perfil, ajustes y avisos.

import { createContext, useContext } from 'react';
import type { Ajustes, Perfil } from './almacenamiento/datos';
import type { Efecto, ResultadoNivel } from './juego/progresion';
import type { TipoPrueba } from './juego/motor';

export type Pantalla =
  | { nombre: 'inicio' }
  | { nombre: 'mapa' }
  | { nombre: 'aprender' }
  | { nombre: 'nivel'; nivel: number; repaso?: boolean; clave?: number }
  | { nombre: 'resultado'; resultado: ResultadoNivel; efecto: Efecto }
  | { nombre: 'mifinca' }
  | { nombre: 'ajustes' }
  | { nombre: 'familias'; seccion?: 'menu' | 'acompanar' | 'avance' | 'videos' }
  | { nombre: 'taller' }
  | { nombre: 'avatar' }
  | { nombre: 'prueba'; tipo: TipoPrueba };

export type EstadoApp = {
  pantalla: Pantalla;
  perfil: Perfil;
  ajustes: Ajustes;
  ir: (p: Pantalla, opciones?: { reemplazar?: boolean }) => void;
  volver: () => void;
  /** Cierra la sesión (borra del celular los datos de la cuenta). */
  salir: () => Promise<void>;
  cambiarAvatar: (avatar: string) => void;
  cambiarAjustes: (a: Ajustes) => void;
  avisar: (texto: string) => void;
};

export const ContextoApp = createContext<EstadoApp | null>(null);

export function useApp(): EstadoApp {
  const c = useContext(ContextoApp);
  if (!c) throw new Error('useApp fuera del proveedor');
  return c;
}

/** Pantallas de las pestañas inferiores: reinician la pila al entrar. */
export const PESTANAS: Pantalla['nombre'][] = ['inicio', 'mapa', 'aprender', 'mifinca'];

export function esPestana(p: Pantalla): boolean {
  return PESTANAS.includes(p.nombre) || (p.nombre === 'familias' && (p.seccion ?? 'menu') === 'menu');
}
