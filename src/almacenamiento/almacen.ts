// Acceso seguro a localStorage: todas las lecturas y escrituras van en try/catch.
// Si localStorage no funciona (modo privado, almacenamiento lleno o bloqueado),
// la app sigue funcionando en memoria y la interfaz muestra un aviso.

export const PREFIJO = 'fincaMat:';
export const PREFIJO_V1 = 'fincaMat:v1:';

const memoria = new Map<string, string>();
let disponible = probar();
const oyentes = new Set<() => void>();

function probar(): boolean {
  try {
    const k = PREFIJO + '__prueba';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function marcarNoDisponible() {
  if (disponible) {
    disponible = false;
    oyentes.forEach((f) => f());
  }
}

export function almacenamientoDisponible(): boolean {
  return disponible;
}

export function alCambiarDisponibilidad(f: () => void): () => void {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

export function leerTexto(clave: string): string | null {
  if (disponible) {
    try {
      return localStorage.getItem(clave);
    } catch {
      marcarNoDisponible();
    }
  }
  return memoria.get(clave) ?? null;
}

export function escribirTexto(clave: string, valor: string): void {
  memoria.set(clave, valor);
  if (!disponible) return;
  try {
    localStorage.setItem(clave, valor);
  } catch {
    marcarNoDisponible();
  }
}

export function borrar(clave: string): void {
  memoria.delete(clave);
  if (!disponible) return;
  try {
    localStorage.removeItem(clave);
  } catch {
    marcarNoDisponible();
  }
}

export function leer<T>(clave: string, defecto: T): T {
  const texto = leerTexto(clave);
  if (texto === null) return defecto;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return defecto;
  }
}

export function escribir(clave: string, valor: unknown): void {
  escribirTexto(clave, JSON.stringify(valor));
}

/** Todas las claves de la app (prefijo fincaMat:). */
export function clavesApp(): string[] {
  const claves = new Set<string>(memoria.keys());
  if (disponible) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) claves.add(k);
      }
    } catch {
      marcarNoDisponible();
    }
  }
  return [...claves].filter((k) => k.startsWith(PREFIJO));
}
