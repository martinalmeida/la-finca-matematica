// Silo de la escuela: semillas de todos los usuarios del mismo profesor.
// El total llega de la nube al sincronizar; sin señal se usa el último conocido.

import { guardarSilo, hayRegistroSilo, leerCuenta, leerSilo, leerSiloEscuela, perfilDeFila, siloEscuelaConocido, totalesPerfil } from '../almacenamiento/datos';
import { CAPACIDAD_SILO } from './progresion';

export function estadoSilo() {
  const cuenta = leerCuenta();
  const propias = cuenta ? totalesPerfil(perfilDeFila(cuenta).id).semillas : 0;
  const total = Math.max(leerSiloEscuela(), propias);
  const cosechas = Math.floor(total / CAPACIDAD_SILO);
  return { total, cosechas, enSilo: total % CAPACIDAD_SILO, capacidad: CAPACIDAD_SILO, celebradas: leerSilo().cosechas };
}

/** Devuelve true si hay una cosecha colectiva nueva que celebrar (y la marca como celebrada). */
export function hayCosechaNueva(): boolean {
  const s = estadoSilo();
  // Recién entrado (o tras un reinicio): las cosechas que ya había en la escuela no se celebran;
  // se toman como punto de partida en cuanto se conoce el total de la nube.
  if (!hayRegistroSilo()) {
    if (siloEscuelaConocido()) guardarSilo({ cosechas: s.cosechas });
    return false;
  }
  if (s.cosechas > s.celebradas) {
    guardarSilo({ cosechas: s.cosechas });
    return true;
  }
  return false;
}
