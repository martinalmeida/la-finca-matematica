// Estado global: pantalla actual (enrutamiento en memoria), perfil activo, ajustes y avisos.

import { createContext, useContext } from 'react';
import type { Ajustes, Perfil, Rol } from './almacenamiento/datos';
import type { Efecto, ResultadoNivel } from './juego/progresion';

export type Pantalla =
  | { nombre: 'bienvenida' }
  | { nombre: 'quien' }
  | { nombre: 'crear'; rol: Rol }
  | { nombre: 'inicio' }
  | { nombre: 'mapa' }
  | { nombre: 'aprender' }
  | { nombre: 'nivel'; nivel: number; repaso?: boolean; clave?: number }
  | { nombre: 'resultado'; resultado: ResultadoNivel; efecto: Efecto }
  | { nombre: 'mifinca' }
  | { nombre: 'ajustes' }
  | { nombre: 'familias'; seccion?: 'menu' | 'acompanar' | 'avance' | 'videos' }
  | { nombre: 'docente' }
  | { nombre: 'pareja' }
  | { nombre: 'taller' };

export type EstadoApp = {
  pantalla: Pantalla;
  perfil: Perfil | null;
  ajustes: Ajustes;
  ir: (p: Pantalla, opciones?: { reemplazar?: boolean }) => void;
  volver: () => void;
  elegirPerfil: (p: Perfil | null) => void;
  actualizarPerfil: (p: Perfil) => void;
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
