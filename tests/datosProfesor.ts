// Datos de ejemplo del panel del profesor (deterministas): usuarios de varios grupos con sus
// ejercicios, partidas, progreso y pruebas. Los usan las pruebas de métricas y las capturas.

import type { FilaPerfil } from '../src/almacenamiento/datos';
import type { Datos, EventoRemoto, PartidaRemota, DatoRemoto } from '../src/profesor/api';
import { crearRng } from '../src/juego/rng';
import { definicion, nivelMaximo } from '../src/juego/motor';
import type { Operacion, Pista } from '../src/juego/tipos';

const NOMBRES = ['Valentina Rueda', 'Santiago Pinto', 'Mariana Gómez', 'Samuel Ardila', 'Luisa Fernanda Díaz', 'Andrés Celis', 'Sofía Quintero', 'Juan José Rojas', 'Daniela Vargas', 'Miguel Ángel Duarte', 'Isabela Mantilla', 'Felipe Serrano', 'Laura Camacho', 'Tomás Becerra', 'Gabriela Niño', 'Emmanuel Ortiz', 'Sara Lucía Prada', 'Nicolás Jaimes', 'Ana María Suárez', 'Kevin Pabón'];
const FAMILIAS = ['Rosa Elvira Peña', 'Ramiro Gualdrón', 'Marleny Cáceres'];
const INCLUSION = ['Mateo Rincón', 'Salomé Arenas'];
const ERRORES = ['suma-sin-llevar', 'resta-menor-mayor', 'operacion-equivocada', 'tabla-vecina', 'residuo-ignorado', 'conteo-por-uno', 'cerca', 'otro'];

const uuid = (k: number) => `00000000-0000-4000-8000-${String(k).padStart(12, '0')}`;

/** `ahora`: fin del periodo de datos (10 semanas hacia atrás). */
export function datosDemo(ahora = Date.parse('2026-10-30T15:00:00Z'), semilla = 7): Datos & { eventos: EventoRemoto[] } {
  const rng = crearRng(semilla);
  const usuarios: FilaPerfil[] = [];
  const datos: DatoRemoto[] = [];
  const partidas: PartidaRemota[] = [];
  const eventos: EventoRemoto[] = [];
  let id = 1;
  let ev = 1;

  const crear = (nombre: string, tipo: FilaPerfil['tipo'], grado: number | null, k: number): FilaPerfil => {
    const usuario = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ').slice(0, 2).join('.');
    const f: FilaPerfil = { id: uuid(id++), usuario, nombre, rol: 'usuario', tipo, grado, activo: k !== 7, avatar: 'gallina', foto: null, bandas: {}, finales_permitidos: {}, generacion: 1, profesor_id: uuid(999), creado: '2026-08-18T13:00:00Z', ultima_sync: new Date(ahora - k * 3600_000).toISOString() };
    usuarios.push(f);
    return f;
  };

  const todos: { f: FilaPerfil; pista: Pista; pistaPrueba: Pista | null; habilidad: number; constancia: number }[] = [];
  NOMBRES.forEach((n, k) => {
    const grado = k < 8 ? 3 : k < 15 ? 4 : 5;
    const f = crear(n, 'estudiante', grado, k);
    todos.push({ f, pista: `g${grado}` as Pista, pistaPrueba: `g${grado}` as Pista, habilidad: 0.35 + rng.siguiente() * 0.5, constancia: k === 5 ? 0 : k === 11 ? 0.15 : 0.4 + rng.siguiente() * 0.6 });
  });
  FAMILIAS.forEach((n, k) => {
    const f = crear(n, 'familia', null, 20 + k);
    todos.push({ f, pista: 'fam-intermedia', pistaPrueba: 'familia', habilidad: 0.5 + rng.siguiente() * 0.4, constancia: 0.3 + rng.siguiente() * 0.4 });
  });
  INCLUSION.forEach((n, k) => {
    const f = crear(n, 'inclusion', null, 30 + k);
    todos.push({ f, pista: 'inclusion', pistaPrueba: null, habilidad: 0.5, constancia: 0.5 });
  });

  const inicio = ahora - 70 * 86_400_000;
  for (const u of todos) {
    const temas = definicion(u.pista).temas;
    const niveles: Record<number, { estrellas: number; intentos: number; mejorAciertos: number; completado: boolean }> = {};
    let nivel = 1;
    let habilidad = u.habilidad;
    // Prueba de entrada al comienzo.
    let porTemaAntes: boolean[] | null = null;
    if (u.pistaPrueba) {
      const t0 = inicio + rng.entero(0, 5) * 86_400_000 + 14 * 3600_000;
      porTemaAntes = definicion(u.pistaPrueba).temas.map(() => rng.siguiente() < habilidad * 0.8);
      porTemaAntes.forEach((ok, k) => {
        eventos.push({ id: uuid(100000 + ev++), usuario_id: u.f.id, t: new Date(t0 + k * 40_000).toISOString(), tipo: 'prueba-diagnostica', pista: u.pistaPrueba!, nivel: k + 1, plantilla: `${u.pistaPrueba}-prueba-${k + 1}`, operacion: 'mixta', correcto: ok, intentos: 1, pistas_usadas: 0, tipo_error: ok ? undefined : rng.elegir(ERRORES), ms: rng.entero(20_000, 90_000) });
      });
      partidas.push({ id: uuid(500000 + ev++), usuario_id: u.f.id, t: new Date(t0 + 500_000).toISOString(), tipo: 'prueba-diagnostica', pista: u.pistaPrueba, nivel: null, aciertos: porTemaAntes.filter(Boolean).length, total: porTemaAntes.length, estrellas: null, ms_total: 600_000, repaso: false, banda: 'basico' });
    }
    // Sesiones de juego.
    for (let dia = 3; dia < 70; dia++) {
      if (rng.siguiente() > u.constancia * 0.6) continue;
      const t0 = inicio + dia * 86_400_000 + rng.entero(13, 21) * 3600_000;
      const uso = temas[nivel - 1].usos;
      let aciertos = 0;
      for (let i = 0; i < 10; i++) {
        const plantilla = rng.elegir(uso).plantilla;
        const op = (plantilla.operacion ?? 'mixta') as Operacion;
        const dificultad = op === 'division' ? 0.15 : op === 'multiplicacion' ? 0.08 : 0;
        const p = Math.min(0.97, habilidad - dificultad + 0.1);
        const primero = rng.siguiente() < p;
        const intentos = primero ? 1 : rng.siguiente() < 0.6 ? 2 : 3;
        const correcto = primero || rng.siguiente() < 0.7;
        if (correcto) aciertos++;
        eventos.push({ id: uuid(100000 + ev++), usuario_id: u.f.id, t: new Date(t0 + i * 50_000).toISOString(), tipo: 'nivel', pista: u.pista, nivel, plantilla: plantilla.id, operacion: op, correcto, intentos, pistas_usadas: primero ? 0 : rng.entero(0, 3), tipo_error: primero ? undefined : rng.elegir(ERRORES.slice(0, op === 'division' ? 8 : 7)), ms: rng.entero(12_000, 110_000) });
      }
      const estrellas = aciertos >= 9 ? 3 : aciertos >= 8 ? 2 : aciertos >= 7 ? 1 : 0;
      const n = (niveles[nivel] ??= { estrellas: 0, intentos: 0, mejorAciertos: 0, completado: false });
      n.intentos++;
      n.mejorAciertos = Math.max(n.mejorAciertos, aciertos);
      n.estrellas = Math.max(n.estrellas, estrellas) as 0;
      partidas.push({ id: uuid(500000 + ev++), usuario_id: u.f.id, t: new Date(t0 + 520_000).toISOString(), tipo: 'nivel', pista: u.pista, nivel, aciertos, total: 10, estrellas, ms_total: 520_000, repaso: false, banda: 'basico' });
      if (estrellas > 0) {
        n.completado = true;
        nivel = Math.min(nivelMaximo(u.pista), nivel + 1);
      }
      habilidad = Math.min(0.95, habilidad + 0.006);
    }
    datos.push({ usuario_id: u.f.id, clave: `progreso:${u.pista}`, valor: { nivelMaximoDesbloqueado: nivel, niveles, semillas: 10, insignias: [], etapaPlanta: 'brote' }, actualizado: new Date(ahora).toISOString() });
    // Prueba final para la mayoría (no para los poco constantes).
    if (u.pistaPrueba && porTemaAntes) {
      const pruebas: Record<string, unknown> = { diagnostica: { fecha: new Date(inicio + 86_400_000).toISOString(), pista: u.pistaPrueba, porTema: porTemaAntes, aciertos: porTemaAntes.filter(Boolean).length, total: porTemaAntes.length, ms: 610_000 } };
      if (u.constancia > 0.35) {
        const t0 = ahora - rng.entero(1, 6) * 86_400_000;
        const porTemaDespues = porTemaAntes.map((ok) => (ok ? rng.siguiente() < 0.92 : rng.siguiente() < habilidad * 0.75));
        porTemaDespues.forEach((ok, k) => {
          eventos.push({ id: uuid(100000 + ev++), usuario_id: u.f.id, t: new Date(t0 + k * 40_000).toISOString(), tipo: 'prueba-final', pista: u.pistaPrueba!, nivel: k + 1, plantilla: `${u.pistaPrueba}-prueba-${k + 1}`, operacion: 'mixta', correcto: ok, intentos: 1, pistas_usadas: 0, tipo_error: ok ? undefined : rng.elegir(ERRORES), ms: rng.entero(18_000, 80_000) });
        });
        pruebas.final = { fecha: new Date(t0).toISOString(), pista: u.pistaPrueba, porTema: porTemaDespues, aciertos: porTemaDespues.filter(Boolean).length, total: porTemaDespues.length, ms: 540_000 };
        partidas.push({ id: uuid(500000 + ev++), usuario_id: u.f.id, t: new Date(t0 + 450_000).toISOString(), tipo: 'prueba-final', pista: u.pistaPrueba, nivel: null, aciertos: porTemaDespues.filter(Boolean).length, total: porTemaDespues.length, estrellas: null, ms_total: 450_000, repaso: false, banda: null });
      }
      datos.push({ usuario_id: u.f.id, clave: `pruebas:${u.pistaPrueba}`, valor: pruebas, actualizado: new Date(ahora).toISOString() });
    }
  }
  eventos.sort((a, b) => a.t.localeCompare(b.t));
  partidas.sort((a, b) => a.t.localeCompare(b.t));
  return { usuarios, datos, partidas, eventos };
}
