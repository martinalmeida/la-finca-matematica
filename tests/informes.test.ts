// Informes del profesor con datos de ejemplo (como llegan de Supabase).
import { describe, expect, it } from 'vitest';
import type { FilaPerfil } from '../src/almacenamiento/datos';
import { armarAlumnos, csvEventos, csvResumen, grupoDe, resumenGrupo, sugerirClave, sugerirUsuario } from '../src/profesor/informes';
import type { Datos } from '../src/profesor/api';

function fila(id: string, extra: Partial<FilaPerfil>): FilaPerfil {
  return {
    id,
    usuario: id,
    nombre: `Nombre ${id}`,
    rol: 'usuario',
    tipo: 'estudiante',
    grado: 3,
    activo: true,
    avatar: null,
    bandas: {},
    finales_permitidos: {},
    generacion: 0,
    profesor_id: 'p',
    creado: '2026-10-01T00:00:00Z',
    ultima_sync: null,
    ...extra,
  };
}

const prueba = (porTema: boolean[]) => ({ fecha: '2026-10-02T00:00:00Z', pista: 'g3', porTema, aciertos: porTema.filter(Boolean).length, total: 10, ms: 1 });
const todos = (n: number) => Array.from({ length: 10 }, (_, k) => k < n);
const AHORA = new Date('2026-10-27T12:00:00Z').getTime();

const datos: Datos = {
  usuarios: [fila('ana', {}), fila('beto', {}), fila('caro', { tipo: 'familia', grado: null }), fila('dani', { activo: false })],
  datos: [
    { usuario_id: 'ana', clave: 'pruebas:g3', valor: { diagnostica: prueba(todos(4)), final: prueba(todos(8)) }, actualizado: '' },
    { usuario_id: 'ana', clave: 'progreso:g3', valor: { nivelMaximoDesbloqueado: 11, niveles: { 1: { estrellas: 3, intentos: 1, mejorAciertos: 10, completado: true } }, semillas: 30, insignias: [], etapaPlanta: 'brote' }, actualizado: '' },
    { usuario_id: 'ana', clave: 'resumen', valor: { porOperacion: { suma: { total: 10, aciertos: 9 }, resta: { total: 10, aciertos: 5 } }, errores: { 'tabla-vecina': 3, otro: 2 }, diasJugados: ['2026-10-25'], pasoAPaso: 0 }, actualizado: '' },
    { usuario_id: 'beto', clave: 'pruebas:g3', valor: { diagnostica: prueba(todos(6)) }, actualizado: '' },
    { usuario_id: 'beto', clave: 'resumen', valor: { porOperacion: { suma: { total: 10, aciertos: 7 } }, errores: { 'tabla-vecina': 1 }, diasJugados: ['2026-09-01'], pasoAPaso: 0 }, actualizado: '' },
  ],
  partidas: [
    { id: '1', usuario_id: 'ana', t: '2026-10-25T10:00:00Z', tipo: 'nivel', pista: 'g3', nivel: 1, aciertos: 10, total: 10, estrellas: 3, ms_total: 100000, repaso: false, banda: 'basico' },
    { id: '2', usuario_id: 'ana', t: '2026-10-26T10:00:00Z', tipo: 'nivel', pista: 'g3', nivel: 2, aciertos: 8, total: 10, estrellas: 2, ms_total: 60000, repaso: false, banda: 'basico' },
  ],
};

describe('informes del profesor', () => {
  const alumnos = armarAlumnos(datos, AHORA);
  const ana = alumnos.find((a) => a.fila.id === 'ana')!;

  it('arma el informe de cada usuario con sus datos de la nube', () => {
    expect(ana.informe.diagnostica).toBe(4);
    expect(ana.informe.final).toBe(8);
    expect(ana.informe.banda).toBe('refuerzo');
    expect(ana.informe.ejercicios).toBe(20);
    expect(ana.informe.porcentajes.resta?.pct).toBe(50);
    expect(ana.informe.erroresFrecuentes[0].n).toBe(3);
    expect(ana.msPorEjercicio).toBe(8000);
    expect(ana.diasActivos).toEqual(['2026-10-25', '2026-10-26']);
    expect(ana.activoSemana).toBe(true);
    expect(alumnos.find((a) => a.fila.id === 'beto')!.activoSemana).toBe(false);
    expect(alumnos.find((a) => a.fila.id === 'caro')!.informe.pista).toBe('fam-intermedia');
  });

  it('agrupa por grado y no cuenta a los desactivados', () => {
    expect(grupoDe({ tipo: 'familia', grado: null })).toBe('familia');
    const r = resumenGrupo(alumnos, 'g3');
    expect(r.usuarios).toBe(2);
    expect(r.activosSemana).toBe(1);
    expect(r.diagnosticaProm).toBe(5);
    expect(r.finalProm).toBe(8);
    expect(r.gananciaProm).toBe(4);
    expect(r.bandas).toEqual({ refuerzo: 1, basico: 1, avanzado: 0 });
    expect(r.porTema).toHaveLength(10);
    // Tema 5: Ana falló en la entrada y Beto acertó (50 %); en la final solo está Ana, que acertó.
    expect(r.porTema[4]).toMatchObject({ antes: 50, despues: 100, nAntes: 2, nDespues: 1 });
    expect(r.porOperacion.suma).toEqual({ total: 20, aciertos: 16 });
    expect(r.errores[0]).toMatchObject({ tipo: 'tabla-vecina', n: 4 });
    expect(r.errores.some((e) => e.tipo === 'otro')).toBe(false);
  });

  it('el CSV abre bien en Excel en español: BOM y punto y coma', () => {
    const texto = csvResumen(alumnos);
    expect(texto.startsWith('﻿')).toBe(true);
    const [enc, primera] = texto.slice(1).split('\r\n');
    expect(enc.split(';')).toContain('"diagnostica_por_tema"');
    expect(primera).toContain('"ana"');
    expect(primera).toContain('"1111000000";"1111111100"');
    // La nube guarda en UTC; el CSV se exporta en la hora de Colombia (UTC−5).
    const ev = csvEventos([{ id: 'e', usuario_id: 'ana', t: '2026-10-25T10:00:00Z', tipo: 'nivel', pista: 'g3', nivel: 1, plantilla: 'p', operacion: 'suma', correcto: true, intentos: 1, pistas_usadas: 0, ms: 900 }], alumnos);
    expect(ev.split('\r\n')[1]).toBe('"ana";"Nombre ana";"3.º grado";"2026-10-25 05:00:00";"nivel";"g3";"1";"p";"suma";"1";"1";"0";"";"900"');
  });

  it('sugiere usuario y contraseña fáciles', () => {
    expect(sugerirUsuario('José Ángel Pérez')).toBe('jose.angel');
    expect(sugerirUsuario('  Lucía ')).toBe('lucia');
    expect(sugerirClave(() => 0)).toBe('mango10');
    expect(sugerirClave()).toMatch(/^[a-z]+\d{2}$/);
  });
});
