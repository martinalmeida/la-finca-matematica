// Almacenamiento: funciona en memoria si localStorage no existe; cuenta, pruebas y migración.
import { beforeEach, describe, expect, it } from 'vitest';
import { almacenamientoDisponible, borrar, clavesApp, escribirTexto, leerTexto } from '../src/almacenamiento/almacen';
import {
  bandaDePerfil,
  guardarProgreso,
  guardarPruebas,
  guardarResultadoPrueba,
  leerProgreso,
  leerPruebas,
  necesitaDiagnostica,
  perfilDeFila,
  pistaDePerfil,
  type FilaPerfil,
  type Perfil,
} from '../src/almacenamiento/datos';
import { migrar, VERSION_ACTUAL, versionGuardada } from '../src/almacenamiento/migraciones';

export function fila(extra: Partial<FilaPerfil> = {}): FilaPerfil {
  return {
    id: 'u1',
    usuario: 'ana.perez',
    nombre: 'Ana Pérez',
    rol: 'usuario',
    tipo: 'estudiante',
    grado: 3,
    activo: true,
    avatar: 'loro',
    bandas: {},
    finales_permitidos: {},
    generacion: 0,
    profesor_id: 'p1',
    creado: '2026-10-01T00:00:00Z',
    ultima_sync: null,
    ...extra,
  };
}

const prueba = (aciertos: number) => ({ fecha: '2026-10-01T00:00:00Z', pista: 'g3' as const, porTema: Array.from({ length: 10 }, (_, k) => k < aciertos), aciertos, total: 10, ms: 0 });

describe('almacenamiento', () => {
  beforeEach(() => {
    for (const k of clavesApp()) borrar(k);
  });

  it('sin localStorage la app funciona en memoria', () => {
    expect(almacenamientoDisponible()).toBe(false);
    const p = perfilDeFila(fila());
    guardarProgreso(p.id, 'g3', { ...leerProgreso(p.id, 'g3'), semillas: 7 });
    expect(leerProgreso(p.id, 'g3').semillas).toBe(7);
  });

  it('la cuenta del profesor se traduce al perfil de juego', () => {
    expect(perfilDeFila(fila()).grado).toBe(3);
    expect(perfilDeFila(fila({ tipo: 'inclusion', grado: null })).grado).toBe('inclusion');
    const fam = perfilDeFila(fila({ tipo: 'familia', grado: null }));
    expect(fam.rol).toBe('familia');
    expect(fam.grado).toBeNull();
  });

  it('migración v4: borra perfiles y progreso anónimos y conserva los ajustes', () => {
    escribirTexto('fincaMat:version', '3');
    escribirTexto('fincaMat:v1:perfiles', JSON.stringify([{ id: 'p1', codigo: 'FM-2-ABCD', apodo: 'Mazorca', avatar: 'loro', rol: 'estudiante', grado: 2, creado: '' }]));
    escribirTexto('fincaMat:v1:progreso:p1:g2', JSON.stringify({ nivelMaximoDesbloqueado: 5 }));
    escribirTexto('fincaMat:v1:docente', JSON.stringify({ pinHash: 'x', modoInvestigacion: true }));
    escribirTexto('fincaMat:v1:ajustes', JSON.stringify({ sonido: false }));
    migrar();
    expect(versionGuardada()).toBe(VERSION_ACTUAL);
    expect(VERSION_ACTUAL).toBe(4);
    expect(leerTexto('fincaMat:v1:perfiles')).toBeNull();
    expect(leerTexto('fincaMat:v1:progreso:p1:g2')).toBeNull();
    expect(leerTexto('fincaMat:v1:docente')).toBeNull();
    expect(leerTexto('fincaMat:v1:ajustes')).toBe(JSON.stringify({ sonido: false }));
  });

  it('las pruebas se guardan por grado e Inclusión no hace diagnóstica', () => {
    const p = perfilDeFila(fila());
    expect(necesitaDiagnostica(p)).toBe(true);
    guardarPruebas(p, { diagnostica: prueba(9) });
    expect(necesitaDiagnostica(p)).toBe(false);
    expect(bandaDePerfil(p)).toBe('avanzado');
    expect(necesitaDiagnostica({ ...p, grado: 4 })).toBe(true);
    expect(necesitaDiagnostica({ ...p, grado: 'inclusion' })).toBe(false);
  });

  it('la exigencia fijada por el profesor manda sobre la diagnóstica', () => {
    const p: Perfil = perfilDeFila(fila({ bandas: { g3: 'refuerzo' } }));
    guardarPruebas(p, { diagnostica: prueba(9) });
    expect(bandaDePerfil(p)).toBe('refuerzo');
  });

  it('repetir la final: un permiso del profesor sirve para una sola vez', () => {
    const p = perfilDeFila(fila());
    guardarResultadoPrueba(p, 'diagnostica', prueba(4));
    guardarResultadoPrueba(p, 'final', prueba(6));
    expect(leerPruebas(p).repetirFinal).toBe(false);
    const conPermiso = perfilDeFila(fila({ finales_permitidos: { g3: 1 } }));
    expect(leerPruebas(conPermiso).repetirFinal).toBe(true);
    guardarResultadoPrueba(conPermiso, 'final', prueba(8));
    expect(leerPruebas(conPermiso).repetirFinal).toBe(false);
    expect(leerPruebas(conPermiso).final?.aciertos).toBe(8);
  });

  it('familias: la diagnóstica asigna el cuaderno', () => {
    const p = perfilDeFila(fila({ tipo: 'familia', grado: null }));
    expect(pistaDePerfil(p)).toBe('fam-intermedia');
    guardarResultadoPrueba(p, 'diagnostica', { ...prueba(2), pista: 'familia' });
    expect(pistaDePerfil(p)).toBe('fam-basica');
  });
});
