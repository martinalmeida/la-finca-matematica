// Almacenamiento: funciona en memoria si localStorage no existe; copia de seguridad y migración.
import { describe, expect, it } from 'vitest';
import { almacenamientoDisponible } from '../src/almacenamiento/almacen';
import { guardarPerfil, leerProgreso, listarPerfiles, guardarProgreso, eliminarPerfil, registrar, leerRegistro, guardarDocente, MAX_REGISTRO } from '../src/almacenamiento/datos';
import { crearCopia, restaurarCopia } from '../src/almacenamiento/copia';
import { migrar, versionGuardada } from '../src/almacenamiento/migraciones';
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
    expect(versionGuardada()).toBe(1);
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
