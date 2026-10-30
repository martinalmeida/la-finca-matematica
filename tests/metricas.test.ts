// Motor de informes del profesor: filtros, indicadores, series, desgloses, pre/post y alertas.
import { describe, expect, it } from 'vitest';
import { armarAlumnos } from '../src/profesor/informes';
import {
  alertasDe,
  filasAlumnos,
  filtrar,
  filtrosAnteriores,
  FILTROS_INICIALES,
  indicadores,
  lunesDe,
  mapaAlumnoTema,
  matrizErrores,
  medidas,
  porOperacion,
  porTema,
  prePost,
  rangoDePeriodo,
  serie,
} from '../src/profesor/metricas';
import { datosDemo } from './datosProfesor';

const AHORA = Date.parse('2026-10-30T15:00:00Z');
const d = datosDemo(AHORA);
const alumnos = armarAlumnos(d, AHORA);

describe('filtros', () => {
  it('periodos predefinidos en hora de Colombia', () => {
    expect(rangoDePeriodo('7', AHORA)).toEqual({ desde: '2026-10-24', hasta: '2026-10-30' });
    expect(rangoDePeriodo('mes', AHORA)).toEqual({ desde: '2026-10-01', hasta: '2026-10-30' });
    expect(rangoDePeriodo('todo', AHORA)).toEqual({ desde: null, hasta: null });
    expect(lunesDe('2026-10-30')).toBe('2026-10-26');
    expect(filtrosAnteriores({ ...FILTROS_INICIALES, desde: '2026-10-24', hasta: '2026-10-30' })).toMatchObject({ desde: '2026-10-17', hasta: '2026-10-23' });
  });

  it('cada filtro reduce el conjunto de forma coherente', () => {
    const todo = filtrar(alumnos, d.eventos, FILTROS_INICIALES);
    // Por defecto no entran las cuentas desactivadas.
    expect(todo.alumnos.every((a) => a.fila.activo)).toBe(true);
    expect(filtrar(alumnos, d.eventos, { ...FILTROS_INICIALES, inactivos: true }).alumnos.length).toBe(alumnos.length);
    const g3 = filtrar(alumnos, d.eventos, { ...FILTROS_INICIALES, grupos: ['g3'] });
    expect(g3.alumnos.every((a) => a.grupo === 'g3')).toBe(true);
    expect(g3.eventos.every((e) => g3.alumnos.some((a) => a.fila.id === e.usuario_id))).toBe(true);
    const div = filtrar(alumnos, d.eventos, { ...FILTROS_INICIALES, operaciones: ['division'] });
    expect(div.eventos.length).toBeGreaterThan(0);
    expect(div.eventos.every((e) => e.operacion === 'division')).toBe(true);
    const sem = filtrar(alumnos, d.eventos, { ...FILTROS_INICIALES, ...rangoDePeriodo('7', AHORA) });
    expect(sem.eventos.length).toBeLessThan(todo.eventos.length);
    const pruebas = filtrar(alumnos, d.eventos, { ...FILTROS_INICIALES, actividad: 'pruebas' });
    expect(pruebas.eventos.every((e) => e.tipo !== 'nivel')).toBe(true);
    const uno = filtrar(alumnos, d.eventos, { ...FILTROS_INICIALES, alumnos: [alumnos[0].fila.id] });
    expect(uno.alumnos).toHaveLength(1);
  });
});

describe('métricas', () => {
  const c = filtrar(alumnos, d.eventos, FILTROS_INICIALES);

  it('medidas básicas', () => {
    const m = medidas([
      { correcto: true, intentos: 1, ms: 30_000, pistas_usadas: 0 },
      { correcto: true, intentos: 2, ms: 60_000, pistas_usadas: 1 },
      { correcto: false, intentos: 3, ms: 90_000, pistas_usadas: 2 },
      { correcto: true, intentos: 1, ms: 20_000, pistas_usadas: 0 },
    ] as never);
    expect(m.ejercicios).toBe(4);
    expect(m.primerIntento).toBe(50);
    expect(m.logro).toBe(75);
    expect(m.minutos).toBeCloseTo(200 / 60);
    expect(m.segMediana).toBe(45);
    expect(m.pistasPorEjercicio).toBe(0.75);
    expect(medidas([]).primerIntento).toBeNull();
  });

  it('indicadores y serie cuadran con los eventos', () => {
    const k = indicadores(c);
    expect(k.ejercicios).toBe(c.eventos.length);
    expect(k.activos).toBeLessThanOrEqual(k.alumnos);
    expect(k.primerIntento).toBeGreaterThan(0);
    const s = serie(c);
    expect(s.unidad).toBe('semana');
    expect(s.puntos.reduce((x, p) => x + p.ejercicios, 0)).toBe(c.eventos.length);
    const dias = serie(filtrar(alumnos, d.eventos, { ...FILTROS_INICIALES, ...rangoDePeriodo('30', AHORA) }));
    expect(dias.unidad).toBe('dia');
    expect(dias.puntos).toHaveLength(30);
  });

  it('desgloses por operación y por tema suman el total', () => {
    expect(porOperacion(c).reduce((s, f) => s + f.ejercicios, 0)).toBe(c.eventos.length);
    const temas = porTema(c);
    expect(temas.reduce((s, f) => s + f.ejercicios, 0)).toBe(c.eventos.length);
    expect(temas[0].etiqueta).not.toMatch(/^Nivel/);
    const m = matrizErrores(c);
    expect([...m.valor.values()].reduce((s, x) => s + x, 0)).toBe(m.conError);
  });

  it('prueba de entrada vs. final', () => {
    const pp = prePost(c);
    expect(pp.conEntrada).toBeGreaterThan(pp.conFinal);
    expect(pp.estadistica!.n).toBe(pp.filas.filter((f) => f.antes !== null && f.despues !== null).length);
    expect(pp.estadistica!.mejoraron + pp.estadistica!.iguales + pp.estadistica!.bajaron).toBe(pp.estadistica!.n);
    // Cada grado tiene sus propios temas.
    expect(pp.temas.map((t) => t.pista).sort()).toEqual(['familia', 'g3', 'g4', 'g5']);
    expect(pp.temas[0].temas).toHaveLength(10);
    // Inclusión no hace pruebas.
    expect(pp.filas.some((f) => f.grupo === 'inclusion')).toBe(false);
  });

  it('tabla de alumnos y alertas', () => {
    const filas = filasAlumnos(c, AHORA);
    expect(filas).toHaveLength(c.alumnos.length);
    // Hizo la prueba de entrada y nunca volvió: solo tiene esos 10 ejercicios y aparece inactivo.
    const ausente = filas.find((f) => f.nombre === 'Andrés Celis')!;
    expect(ausente.ejercicios).toBe(10);
    expect(ausente.alertas.some((a) => a.tipo === 'inactivo' && a.tono === 'grave')).toBe(true);
    for (const f of filas) expect(f.avance).toBeGreaterThanOrEqual(0);
    const a = alumnos.find((x) => x.fila.nombre === 'Felipe Serrano')!;
    expect(alertasDe(a, [], AHORA).length).toBeGreaterThan(0);
    const mapa = mapaAlumnoTema(c, 'g3');
    expect(mapa.temas).toHaveLength(10);
    for (const v of mapa.valor.values()) expect(v).toBeGreaterThanOrEqual(0);
  });
});
