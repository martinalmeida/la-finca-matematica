// Creación automática de perfiles: apodo amigable y código anónimo (sin datos personales).

import type { Grado } from './tipos';
import type { Perfil, Rol } from '../almacenamiento/datos';

const sustantivos = ['Mazorca', 'Semilla', 'Cacao', 'Naranja', 'Arepa', 'Guadua', 'Quebrada', 'Cafetal', 'Aguacate', 'Mandarina', 'Colibrí', 'Lucero'];
const adjetivos = ['Veloz', 'Alegre', 'Valiente', 'Curiosa', 'Brillante', 'Paciente', 'Amable', 'Dorada', 'Feliz', 'Serena', 'Fuerte', 'Viajera'];
const adultos = ['Cuaderno', 'Cosecha', 'Surco', 'Fogón', 'Trapiche', 'Secadero'];
const adjAdultos = ['de la Loma', 'del Río', 'del Monte', 'de la Vega', 'del Alto', 'de la Mata'];

// Sin letras ni números que se confundan (O/0, I/1).
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function azar(n: number): number {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  } catch {
    return Math.floor(Math.random() * n);
  }
}

export function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // contexto no seguro: se usa el respaldo
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = azar(16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function generarApodo(rol: Rol): string {
  if (rol === 'familia') return `${adultos[azar(adultos.length)]} ${adjAdultos[azar(adjAdultos.length)]}`;
  return `${sustantivos[azar(sustantivos.length)]} ${adjetivos[azar(adjetivos.length)]} ${10 + azar(90)}`;
}

/** Código anónimo: FM-3-K7Q2 (3 es el grado; F para familia). */
export function generarCodigo(grado: Grado | null, existentes: string[] = []): string {
  for (let i = 0; i < 50; i++) {
    let s = '';
    for (let j = 0; j < 4; j++) s += ALFABETO[azar(ALFABETO.length)];
    const codigo = `FM-${grado ?? 'F'}-${s}`;
    if (!existentes.includes(codigo)) return codigo;
  }
  return `FM-${grado ?? 'F'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export function crearPerfil(rol: Rol, grado: Grado | null, avatar: string, existentes: Perfil[]): Perfil {
  return {
    id: uuid(),
    codigo: generarCodigo(grado, existentes.map((p) => p.codigo)),
    apodo: generarApodo(rol),
    avatar,
    rol,
    grado: rol === 'familia' ? null : grado,
    creado: new Date().toISOString(),
  };
}

/** Al cambiar de grado, el código conserva su parte aleatoria y actualiza el número. */
export function codigoConGrado(codigo: string, grado: Grado): string {
  return codigo.replace(/^FM-[^-]+-/, `FM-${grado}-`);
}
