// Reglas de progreso: estrellas, semillas, planta, insignias y desbloqueo de los 10 niveles.
// Nunca se pierde progreso ni semillas.

import type { EtapaPlanta, Progreso } from '../almacenamiento/datos';
import type { Banda, Pista } from './tipos';
import { aciertosParaAprobar, NIVEL_MAXIMO } from './motor';

export type ResultadoNivel = {
  pista: Pista;
  nivel: number;
  aciertos: number;
  total: number;
  errores: number;
  pistasUsadas: number;
  /** Número de intento de este nivel (1, 2, 3…). */
  intento: number;
  repaso: boolean;
  /** Semillas ganadas durante los ejercicios. */
  semillas: number;
  /** Banda con la que se jugó (define cuántos aciertos hacen falta). */
  banda?: Banda;
};

export type Insignia = { id: string; nombre: string; descripcion: string; icono: string };

const catalogo: Insignia[] = [
  { id: 'primer-surco', nombre: 'Primer surco', descripcion: 'Terminaste la prueba de entrada.', icono: '🌱' },
  { id: 'explorador', nombre: 'Explorador del surco', descripcion: 'Llegaste a la mitad de la ruta (nivel 5).', icono: '🧭' },
  { id: 'paciencia', nombre: 'Paciencia de cosecha', descripcion: 'Aprobaste un nivel después de varios intentos.', icono: '🐢' },
  { id: 'buen-vecino', nombre: 'Buen vecino', descripcion: 'Completaste un reto en pareja.', icono: '🤝' },
  { id: 'manos-a-la-obra', nombre: 'Aprender del error', descripcion: 'Corregiste una respuesta después de usar una pista.', icono: '💡' },
  { id: 'tres-estrellas', nombre: 'Cosecha limpia', descripcion: 'Lograste 3 estrellas en 5 niveles.', icono: '⭐' },
  { id: 'constancia', nombre: 'Constancia', descripcion: 'Practicaste en 5 días distintos.', icono: '📅' },
  { id: 'ruta-completa', nombre: 'Ruta completa', descripcion: 'Superaste los 10 niveles.', icono: '🧺' },
  { id: 'gran-cosecha', nombre: 'Gran cosecha', descripcion: 'Terminaste la prueba final.', icono: '🏆' },
];

export function catalogoInsignias(): Insignia[] {
  return catalogo;
}

export function insignia(id: string): Insignia | undefined {
  return catalogo.find((i) => i.id === id);
}

/** Agrega una insignia al progreso (si no la tenía). Devuelve true si es nueva. */
export function darInsignia(p: Progreso, id: string): boolean {
  if (p.insignias.includes(id)) return false;
  p.insignias.push(id);
  return true;
}

/** 3 sin errores ni pistas; 2 con una ayuda; 1 si aprobó con más ayudas. */
export function calcularEstrellas(aprobado: boolean, errores: number, pistas: number, repaso = false): 0 | 1 | 2 | 3 {
  if (!aprobado) return 0;
  if (repaso) return 1;
  const ayudas = errores + pistas;
  if (ayudas === 0) return 3;
  if (ayudas === 1) return 2;
  return 1;
}

/** La planta crece con los niveles superados: un paso cada 2 niveles. */
export function etapaPlanta(completados: number): EtapaPlanta {
  if (completados >= 10) return 'cosecha';
  if (completados >= 8) return 'fruto';
  if (completados >= 6) return 'flor';
  if (completados >= 4) return 'planta';
  if (completados >= 2) return 'brote';
  return 'semilla';
}

export const ETAPAS: EtapaPlanta[] = ['semilla', 'brote', 'planta', 'flor', 'fruto', 'cosecha'];

export type Efecto = {
  progreso: Progreso;
  aprobado: boolean;
  estrellas: 0 | 1 | 2 | 3;
  semillasGanadas: number;
  insigniasNuevas: string[];
  etapaAnterior: EtapaPlanta;
  desbloqueado: number | null;
};

export function aprobo(r: Pick<ResultadoNivel, 'pista' | 'aciertos' | 'banda'>): boolean {
  return r.aciertos >= aciertosParaAprobar(r.pista, r.banda);
}

/** Aplica el resultado de un nivel al progreso (función pura). */
export function aplicarResultado(prev: Progreso, r: ResultadoNivel, diasJugados = 0): Efecto {
  const p: Progreso = { ...prev, niveles: { ...prev.niveles }, insignias: [...prev.insignias] };
  const aprobado = aprobo(r);
  // En Inclusión no hay errores que cuenten: siempre 3 estrellas.
  const estrellas = r.pista === 'inclusion' ? 3 : calcularEstrellas(aprobado, r.errores, r.pistasUsadas, r.repaso);
  const anterior = p.niveles[r.nivel] ?? { estrellas: 0, intentos: 0, mejorAciertos: 0, completado: false };
  p.niveles[r.nivel] = {
    estrellas: Math.max(anterior.estrellas, estrellas) as 0 | 1 | 2 | 3,
    intentos: anterior.intentos + 1,
    mejorAciertos: Math.max(anterior.mejorAciertos, r.aciertos),
    completado: anterior.completado || aprobado,
  };

  let semillasGanadas = r.semillas;
  if (aprobado && !anterior.completado) semillasGanadas += 3 + estrellas;
  p.semillas += semillasGanadas;

  let desbloqueado: number | null = null;
  if (aprobado && r.nivel === p.nivelMaximoDesbloqueado && r.nivel < NIVEL_MAXIMO) {
    p.nivelMaximoDesbloqueado = r.nivel + 1;
    desbloqueado = r.nivel + 1;
  }
  const etapaAnterior = prev.etapaPlanta;
  p.etapaPlanta = etapaPlanta(Object.values(p.niveles).filter((n) => n.completado).length);

  const nuevas: string[] = [];
  const dar = (id: string) => {
    if (darInsignia(p, id)) nuevas.push(id);
  };
  if (aprobado) {
    if (r.nivel === 5) dar('explorador');
    if (anterior.intentos + 1 >= 3 && r.pista !== 'inclusion') dar('paciencia');
    if (r.nivel === NIVEL_MAXIMO) dar('ruta-completa');
    if (Object.values(p.niveles).filter((n) => n.estrellas === 3).length >= 5) dar('tres-estrellas');
  }
  if (diasJugados >= 5) dar('constancia');

  return { progreso: p, aprobado, estrellas, semillasGanadas, insigniasNuevas: nuevas, etapaAnterior, desbloqueado };
}

/** Capacidad del silo de la escuela (semillas por cosecha colectiva). */
export const CAPACIDAD_SILO = 300;
