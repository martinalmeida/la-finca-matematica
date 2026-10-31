// Encuesta de satisfacción: cuándo se pide, cómo se guarda sin señal y cómo la resume el panel.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { borrar, clavesApp } from '../src/almacenamiento/almacen';
import { activarCola, borrarDatosLocales } from '../src/almacenamiento/cola';
import { guardarCuenta, guardarProgreso, guardarResultadoPrueba, perfilDeFila, progresoVacio, type FilaPerfil } from '../src/almacenamiento/datos';
import { debeEncuesta, encuestaPorEnviar, guardarEncuesta, leerEncuesta, marcarEncuestaEnviada, type RespuestaEncuesta } from '../src/almacenamiento/encuesta';
import { NIVELES_INCLUSION, RUTA_INCLUSION } from '../src/almacenamiento/rutaInclusion';
import { ABIERTAS, ESCALA, PREGUNTAS_ENCUESTA, PREGUNTAS_INCLUSION, preguntasDe } from '../src/contenido/encuesta';
import { nivelMaximo } from '../src/juego/motor';
import { armarAlumnos } from '../src/profesor/informes';
import { resumenEncuesta, valoresEncuesta, type EncuestaRemota } from '../src/profesor/encuesta';
import { pendientes } from '../src/servicios/sincronizacion';
import { textoParaVoz } from '../src/servicios/numerosEnPalabras';
import { datosDemo } from './datosProfesor';

const fila = (id: string, tipo: FilaPerfil['tipo'], grado: number | null): FilaPerfil => ({
  id,
  usuario: id,
  nombre: 'Prueba',
  rol: 'usuario',
  tipo,
  grado,
  activo: true,
  avatar: 'gallina',
  bandas: {},
  finales_permitidos: {},
  generacion: 0,
  profesor_id: null,
  creado: '2026-10-01T00:00:00Z',
  ultima_sync: null,
});

const resultado = { fecha: '2026-10-31T12:00:00Z', pista: 'g3' as const, porTema: Array(10).fill(true), aciertos: 10, total: 10, ms: 1000 };

const respuesta: RespuestaEncuesta = { id: 'e1', t: '2026-10-31T12:00:00Z', pista: 'g3', respuestas: { facil: 5, videos: null }, gusto: 'La gallina', mejorar: '', version: '1.4.0' };

describe('cuándo se pide la encuesta', () => {
  beforeEach(() => {
    activarCola(null);
    for (const k of clavesApp()) borrar(k);
  });

  it('estudiantes y familias: después de la prueba final, una sola vez', () => {
    const p = perfilDeFila(fila('u1', 'estudiante', 3));
    expect(debeEncuesta(p)).toBe(false);
    guardarResultadoPrueba(p, 'diagnostica', resultado);
    expect(debeEncuesta(p)).toBe(false);
    guardarResultadoPrueba(p, 'final', resultado);
    expect(debeEncuesta(p)).toBe(true);
    guardarEncuesta(p.id, { respuesta, enviada: false });
    expect(debeEncuesta(p)).toBe(false);

    const f = perfilDeFila(fila('u2', 'familia', null));
    guardarResultadoPrueba(f, 'final', { ...resultado, pista: 'familia' });
    expect(debeEncuesta(f)).toBe(true);
  });

  it('Inclusión: al superar el último nivel de su ruta', () => {
    expect(NIVELES_INCLUSION).toBe(nivelMaximo('inclusion'));
    const p = perfilDeFila(fila('u3', 'inclusion', null));
    const prog = { ...progresoVacio(), ruta: RUTA_INCLUSION };
    prog.niveles[NIVELES_INCLUSION - 1] = { estrellas: 3, intentos: 1, mejorAciertos: 5, completado: true };
    guardarProgreso(p.id, 'inclusion', prog);
    expect(debeEncuesta(p)).toBe(false);
    prog.niveles[NIVELES_INCLUSION] = { estrellas: 3, intentos: 1, mejorAciertos: 5, completado: true };
    guardarProgreso(p.id, 'inclusion', prog);
    expect(debeEncuesta(p)).toBe(true);
  });

  it('respondida sin señal queda pendiente y cuenta para no cerrar sesión sin subirla', () => {
    const c = fila('u4', 'estudiante', 4);
    guardarCuenta(c);
    activarCola(c.id);
    expect(pendientes()).toBe(0);
    guardarEncuesta(c.id, { respuesta, enviada: false });
    expect(encuestaPorEnviar(c.id)).toEqual(respuesta);
    expect(pendientes()).toBe(1);
    marcarEncuestaEnviada(c.id);
    expect(encuestaPorEnviar(c.id)).toBeNull();
    expect(pendientes()).toBe(0);
    expect(leerEncuesta(c.id)).toEqual({ respuesta, enviada: true });
  });

  it('ni el reinicio del progreso ni el cierre de sesión la borran del celular', () => {
    guardarEncuesta('u5', { enviada: true });
    borrarDatosLocales('u5');
    expect(leerEncuesta('u5')).toEqual({ enviada: true });
  });
});

describe('contenido de la encuesta', () => {
  it('las claves son exactamente las que acepta la base de datos', () => {
    const sql = readFileSync(new URL('../supabase/migraciones/006_encuestas.sql', import.meta.url), 'utf8');
    const lista = sql.match(/v_par\.key not in \(([^)]*)\)/)![1];
    const claves = [...lista.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    expect(claves).toEqual(PREGUNTAS_ENCUESTA.map((p) => p.clave).sort());
  });

  it('Inclusión responde la versión corta, sin preguntas para escribir', () => {
    expect(preguntasDe(true).map((p) => p.clave)).toEqual(PREGUNTAS_INCLUSION);
    expect(preguntasDe(false)).toHaveLength(7);
  });

  it('todo lo que se lee en voz alta queda sin cifras ni signos', () => {
    const textos = [
      ...PREGUNTAS_ENCUESTA.flatMap((p) => [p.nino, p.adulto]),
      ...Object.values(ABIERTAS).flatMap((a) => [a.nino, a.adulto]),
      ...ESCALA.map((e) => e.texto),
      `Son ${PREGUNTAS_ENCUESTA.length} preguntas cortas.`,
      `Son ${PREGUNTAS_INCLUSION.length} preguntas cortas.`,
    ];
    for (const t of textos) expect(textoParaVoz(t)).not.toMatch(/\d/);
  });
});

describe('encuesta en los informes del profesor', () => {
  const d = datosDemo();
  const alumnos = armarAlumnos(d);

  it('cuenta respuestas, tasa, promedios y «No lo usé»', () => {
    const r = resumenEncuesta(alumnos);
    expect(d.encuestas!.length).toBeGreaterThan(0);
    expect(r.respondieron).toBe(d.encuestas!.length);
    expect(r.terminaron).toBeGreaterThanOrEqual(r.respondieron);
    expect(r.tasa).toBeCloseTo((100 * r.respondieron) / r.terminaron);
    // Las respuestas de ejemplo van de 3 a 5.
    expect(r.promedio).toBeGreaterThanOrEqual(3);
    expect(r.promedio).toBeLessThanOrEqual(5);
    const videos = r.preguntas.find((p) => p.clave === 'videos')!;
    expect(videos.noUso).toBeGreaterThan(0);
    expect(videos.n + videos.noUso).toBe(r.respondieron);
    for (const p of r.preguntas) expect(p.conteo[0] + p.conteo[1]).toBe(0);
  });

  it('sin encuestas: tasa y promedios vacíos', () => {
    const r = resumenEncuesta(armarAlumnos({ ...d, encuestas: [] }));
    expect(r).toMatchObject({ respondieron: 0, satisfaccion: null, promedio: null, comentarios: [] });
    expect(r.terminaron).toBeGreaterThan(0);
  });

  it('quien respondió cuenta como que terminó aunque el profesor reinicie su progreso', () => {
    const e = d.encuestas![0];
    const sinDatos = armarAlumnos({ ...d, datos: d.datos.filter((x) => x.usuario_id !== e.usuario_id) });
    const r = resumenEncuesta(sinDatos.filter((a) => a.fila.id === e.usuario_id));
    expect(r).toMatchObject({ terminaron: 1, respondieron: 1, tasa: 100 });
  });

  it('satisfacción = % de respuestas 4 o 5, y valores raros no cuentan', () => {
    const encuesta = (respuestas: EncuestaRemota['respuestas'], k: number): EncuestaRemota => ({
      id: `e${k}`, usuario_id: d.usuarios[k].id, t: '2026-10-31T12:00:00Z', pista: 'g3', tipo: 'estudiante', grado: 3, version_app: '1.4.0', respuestas, gusto: null, mejorar: null, recibida: '2026-10-31T12:00:00Z',
    });
    const encuestas = [encuesta({ facil: 5, gusto: 1 }, 0), encuesta({ facil: 4, gusto: 3, aprendi: 9 as number }, 1)];
    const r = resumenEncuesta(armarAlumnos({ ...d, encuestas }).filter((a) => a.encuesta));
    expect(r.satisfaccion).toBeCloseTo(50);
    expect(r.promedio).toBeCloseTo(13 / 4);
    expect(r.preguntas.find((p) => p.clave === 'aprendi')!.n).toBe(0);
  });

  it('el Excel distingue «No lo usé» de «no se le preguntó»', () => {
    const e = { ...d.encuestas![0], respuestas: { facil: 4, videos: null }, gusto: 'Todo', mejorar: null };
    const v = valoresEncuesta(e);
    expect(v[0]).toBe(4);
    expect(v[PREGUNTAS_ENCUESTA.findIndex((p) => p.clave === 'videos')]).toBe('No lo usé');
    expect(v[PREGUNTAS_ENCUESTA.findIndex((p) => p.clave === 'recomendar')]).toBe('');
    expect(v.slice(-2)).toEqual(['Todo', '']);
  });
});
