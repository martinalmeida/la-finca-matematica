// Silo de la escuela: suma las semillas de todos los perfiles del mismo celular.

import { guardarSilo, leerSilo, listarPerfiles, totalesPerfil } from '../almacenamiento/datos';
import { CAPACIDAD_SILO } from './progresion';

export function estadoSilo() {
  const total = listarPerfiles().reduce((s, p) => s + totalesPerfil(p.id).semillas, 0);
  const cosechas = Math.floor(total / CAPACIDAD_SILO);
  return { total, cosechas, enSilo: total % CAPACIDAD_SILO, capacidad: CAPACIDAD_SILO, celebradas: leerSilo().cosechas };
}

/** Devuelve true si hay una cosecha colectiva nueva que celebrar (y la marca como celebrada). */
export function hayCosechaNueva(): boolean {
  const s = estadoSilo();
  if (s.cosechas > s.celebradas) {
    guardarSilo({ cosechas: s.cosechas });
    return true;
  }
  return false;
}
