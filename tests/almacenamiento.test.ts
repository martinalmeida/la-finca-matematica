// Almacenamiento: funciona en memoria si localStorage no existe; copia de seguridad y migración.
import { describe, expect, it } from 'vitest';
import { almacenamientoDisponible, borrar, clavesApp, escribirTexto, leerTexto } from '../src/almacenamiento/almacen';
import { bandaDePerfil, guardarPerfil, guardarPruebas, leerProgreso, listarPerfiles, guardarProgreso, eliminarPerfil, necesitaDiagnostica, registrar, leerRegistro, guardarDocente, MAX_REGISTRO } from '../src/almacenamiento/datos';
import { crearCopia, restaurarCopia } from '../src/almacenamiento/copia';
import { migrar, VERSION_ACTUAL, versionGuardada } from '../src/almacenamiento/migraciones';
import { crearPerfil, generarCodigo } from '../src/juego/perfil';

describe('almacenamiento', () => {
  it('sin localStorage la app funciona en memoria', () => {
    expect(almacenamientoDisponible()).toBe(false);
    const p = crearPerfil('estudiante', 3, 'loro', []);
    guardarPerfil(p);
    expect(listarPerfiles().map((x) => x.id)).toContain(p.id);
  });
  it('código anónimo con el grado', () => {
    expect(generarCodigo(3)).toMatch(/^FM-3-[A-Z2-9]{4}$/);
    expect(generarCodigo(null)).toMatch(/^FM-F-/);
  });
  it('copia de seguridad: exportar, borrar y restaurar', () => {
    const p = crearPerfil('estudiante', 2, 'perro', listarPerfiles());
    guardarPerfil(p);
    guardarProgreso(p.id, 'g2', { ...leerProgreso(p.id, 'g2'), nivelMaximoDesbloqueado: 12, semillas: 40 });
    const copia = JSON.stringify(crearCopia());
    eliminarPerfil(p.id);
    expect(listarPerfiles().find((x) => x.id === p.id)).toBeUndefined();
    expect(restaurarCopia(copia)).toEqual({ ok: true });
    expect(leerProgreso(p.id, 'g2').nivelMaximoDesbloqueado).toBe(12);
    expect(restaurarCopia('{"app":"otra"}').ok).toBe(false);
  });
  it('migración marca la versión', () => {
    migrar();
    expect(versionGuardada()).toBe(VERSION_ACTUAL);
  });
  it('migración v1 → v2: conserva perfiles sin «apoyo» y borra el progreso de 101 niveles', () => {
    for (const k of clavesApp()) borrar(k);
    escribirTexto('fincaMat:version', '1');
    escribirTexto('fincaMat:v1:perfiles', JSON.stringify([{ id: 'p1', codigo: 'FM-2-ABCD', apodo: 'Mazorca', avatar: 'loro', rol: 'estudiante', grado: 2, creado: '', apoyo: true }]));
    escribirTexto('fincaMat:v1:progreso:p1:g2', JSON.stringify({ nivelMaximoDesbloqueado: 57 }));
    escribirTexto('fincaMat:v1:tutorialVisto:p1', 'true');
    migrar();
    expect(versionGuardada()).toBe(VERSION_ACTUAL);
    const [perfil] = listarPerfiles();
    expect(perfil.codigo).toBe('FM-2-ABCD');
    expect('apoyo' in perfil).toBe(false);
    expect(leerTexto('fincaMat:v1:progreso:p1:g2')).toBeNull();
    expect(leerTexto('fincaMat:v1:tutorialVisto:p1')).toBeNull();
    expect(necesitaDiagnostica(perfil)).toBe(true);
  });
  it('migración v2 → v3: borra solo el progreso y las lecciones vistas de Inclusión', () => {
    for (const k of clavesApp()) borrar(k);
    escribirTexto('fincaMat:version', '2');
    escribirTexto('fincaMat:v1:perfiles', JSON.stringify([
      { id: 'i1', codigo: 'FM-I-ABCD', apodo: 'Loro', avatar: 'loro', rol: 'estudiante', grado: 'inclusion', creado: '' },
      { id: 'g1', codigo: 'FM-1-ABCD', apodo: 'Perro', avatar: 'perro', rol: 'estudiante', grado: 1, creado: '' },
    ]));
    escribirTexto('fincaMat:v1:progreso:i1:inclusion', JSON.stringify({ nivelMaximoDesbloqueado: 7 }));
    escribirTexto('fincaMat:v1:historiasVistas:i1', '["0","1"]');
    escribirTexto('fincaMat:v1:progreso:g1:g1', JSON.stringify({ nivelMaximoDesbloqueado: 4 }));
    escribirTexto('fincaMat:v1:historiasVistas:g1', '["0"]');
    migrar();
    expect(versionGuardada()).toBe(3);
    expect(leerTexto('fincaMat:v1:progreso:i1:inclusion')).toBeNull();
    expect(leerTexto('fincaMat:v1:historiasVistas:i1')).toBeNull();
    expect(leerTexto('fincaMat:v1:progreso:g1:g1')).not.toBeNull();
    expect(leerTexto('fincaMat:v1:historiasVistas:g1')).toBe('["0"]');
    expect(listarPerfiles()).toHaveLength(2);
  });
  it('las pruebas se guardan por grado e Inclusión no hace diagnóstica', () => {
    const p = crearPerfil('estudiante', 3, 'loro', []);
    expect(necesitaDiagnostica(p)).toBe(true);
    guardarPruebas(p, { diagnostica: { fecha: '', pista: 'g3', porTema: Array(10).fill(true), aciertos: 9, total: 10, ms: 0 } });
    expect(necesitaDiagnostica(p)).toBe(false);
    expect(bandaDePerfil(p)).toBe('avanzado');
    expect(necesitaDiagnostica({ ...p, grado: 4 })).toBe(true);
    expect(necesitaDiagnostica({ ...p, grado: 'inclusion' })).toBe(false);
    expect(generarCodigo('inclusion')).toMatch(/^FM-I-/);
  });
  it('el registro detallado solo se guarda en modo investigación y se recorta a 3000', () => {
    const p = crearPerfil('estudiante', 1, 'gallina', []);
    const item = { t: '', pista: 'g1', nivel: 1, plantilla: 'x', operacion: 'suma' as const, correcto: true, intentos: 1, pistasUsadas: 0 as const, ms: 1 };
    registrar(p.id, item);
    expect(leerRegistro(p.id).length).toBe(0);
    guardarDocente({ pinHash: null, modoInvestigacion: true });
    for (let i = 0; i < MAX_REGISTRO + 5; i++) registrar(p.id, { ...item, nivel: i });
    const r = leerRegistro(p.id);
    expect(r.length).toBe(MAX_REGISTRO);
    expect(r[0].nivel).toBe(5);
  });
});
