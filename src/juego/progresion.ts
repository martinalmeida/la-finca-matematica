// Reglas de progreso: estrellas, semillas, planta, insignias y desbloqueo de niveles.
// Nunca se pierde progreso ni semillas.

import type { EtapaPlanta, Progreso } from '../almacenamiento/datos';
import type { Pista } from './tipos';
import { aciertosParaAprobar, esCosecha, NIVEL_MAXIMO } from './motor';

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
};

export type Insignia = { id: string; nombre: string; descripcion: string; icono: string };

export const ZONAS = [
  { nombre: 'Huerta y gallinero', inicio: 0, fin: 20 },
  { nombre: 'Tienda de la vereda', inicio: 21, fin: 40 },
  { nombre: 'Cultivo de cacao', inicio: 41, fin: 60 },
  { nombre: 'Mercado y reparto', inicio: 61, fin: 80 },
  { nombre: 'Cooperativa', inicio: 81, fin: 100 },
];

export function zonaDe(nivel: number): number {
  return ZONAS.findIndex((z) => nivel >= z.inicio && nivel <= z.fin);
}

const base: Insignia[] = [
  { id: 'primer-surco', nombre: 'Primer surco', descripcion: 'Terminaste el tutorial.', icono: '🌱' },
  { id: 'explorador', nombre: 'Explorador del surco', descripcion: 'Completaste una zona entera de la finca.', icono: '🧭' },
  { id: 'paciencia', nombre: 'Paciencia de cosecha', descripcion: 'Aprobaste un nivel después de varios intentos.', icono: '🐢' },
  { id: 'buen-vecino', nombre: 'Buen vecino', descripcion: 'Completaste un reto en pareja.', icono: '🤝' },
  { id: 'manos-a-la-obra', nombre: 'Aprender del error', descripcion: 'Corregiste una respuesta después de usar una pista.', icono: '💡' },
  { id: 'tres-estrellas', nombre: 'Cosecha limpia', descripcion: 'Lograste 3 estrellas en 10 niveles.', icono: '⭐' },
  { id: 'constancia', nombre: 'Constancia', descripcion: 'Practicaste en 5 días distintos.', icono: '📅' },
  { id: 'gran-cosecha', nombre: 'Gran cosecha', descripcion: 'Llegaste al nivel 100.', icono: '🏆' },
];

export function catalogoInsignias(): Insignia[] {
  const cosechas: Insignia[] = [];
  for (let n = 10; n <= 100; n += 10) {
    cosechas.push({ id: `cosechador-${n}`, nombre: `Cosechador ${n}`, descripcion: `Superaste el nivel de cosecha ${n}.`, icono: '🧺' });
  }
  return [...base, ...cosechas];
}

export function insignia(id: string): Insignia | undefined {
  return catalogoInsignias().find((i) => i.id === id);
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

export function etapaPlanta(nivelMaximo: number): EtapaPlanta {
  if (nivelMaximo >= 90) return 'cosecha';
  if (nivelMaximo >= 70) return 'fruto';
  if (nivelMaximo >= 50) return 'flor';
  if (nivelMaximo >= 30) return 'planta';
  if (nivelMaximo >= 10) return 'brote';
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

export function aprobo(r: Pick<ResultadoNivel, 'pista' | 'aciertos'>): boolean {
  return r.aciertos >= aciertosParaAprobar(r.pista);
}

/** Aplica el resultado de un nivel al progreso (función pura). */
export function aplicarResultado(prev: Progreso, r: ResultadoNivel, diasJugados = 0): Efecto {
  const p: Progreso = { ...prev, niveles: { ...prev.niveles }, insignias: [...prev.insignias] };
  const aprobado = aprobo(r);
  const estrellas = calcularEstrellas(aprobado, r.errores, r.pistasUsadas, r.repaso);
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
  const completadoMax = aprobado && r.nivel === NIVEL_MAXIMO ? NIVEL_MAXIMO : p.nivelMaximoDesbloqueado;
  p.etapaPlanta = etapaPlanta(completadoMax);

  const nuevas: string[] = [];
  const dar = (id: string) => {
    if (!p.insignias.includes(id)) {
      p.insignias.push(id);
      nuevas.push(id);
    }
  };
  if (aprobado) {
    if (r.nivel === 0) dar('primer-surco');
    if (esCosecha(r.nivel)) dar(`cosechador-${r.nivel}`);
    if ([20, 40, 60, 80, 100].includes(r.nivel)) dar('explorador');
    if (anterior.intentos + 1 >= 3) dar('paciencia');
    if (r.nivel === NIVEL_MAXIMO) dar('gran-cosecha');
    if (Object.values(p.niveles).filter((n) => n.estrellas === 3).length >= 10) dar('tres-estrellas');
  }
  if (diasJugados >= 5) dar('constancia');

  return { progreso: p, aprobado, estrellas, semillasGanadas, insigniasNuevas: nuevas, etapaAnterior, desbloqueado };
}

/** Capacidad del silo de la escuela (semillas por cosecha colectiva). */
export const CAPACIDAD_SILO = 300;
