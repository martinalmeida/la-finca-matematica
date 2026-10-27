// Cola de sincronización: qué se marca como pendiente, qué se sube y qué se borra.
import { beforeEach, describe, expect, it } from 'vitest';
import { borrar, clavesApp, escribir, leerTexto } from '../src/almacenamiento/almacen';
import {
  activarCola,
  aplicarRemotas,
  borrarDatosLocales,
  claveLocal,
  claveRemota,
  confirmarLote,
  pendientes,
  tomarLote,
} from '../src/almacenamiento/cola';
import { guardarAjustes, guardarPartida, guardarProgreso, leerAjustes, leerProgreso, progresoVacio, registrar } from '../src/almacenamiento/datos';

const ID = 'u1';

describe('cola de sincronización', () => {
  beforeEach(() => {
    activarCola(null);
    for (const k of clavesApp()) borrar(k);
    activarCola(ID);
  });

  it('traduce claves locales y remotas', () => {
    expect(claveRemota(`fincaMat:v1:progreso:${ID}:g3`, ID)).toBe('progreso:g3');
    expect(claveRemota(`fincaMat:v1:resumen:${ID}`, ID)).toBe('resumen');
    expect(claveRemota('fincaMat:v1:progreso:otro:g3', ID)).toBeNull();
    expect(claveRemota('fincaMat:v1:ajustes', ID)).toBeNull();
    expect(claveLocal('progreso:g3', ID)).toBe(`fincaMat:v1:progreso:${ID}:g3`);
    expect(claveLocal('historiasVistas', ID)).toBe(`fincaMat:v1:historiasVistas:${ID}`);
  });

  it('marca como pendiente lo del usuario y no los ajustes del celular', () => {
    guardarAjustes({ ...leerAjustes(), sonido: false });
    expect(pendientes()).toBe(0);
    guardarProgreso(ID, 'g3', { ...progresoVacio(), semillas: 4 });
    expect(pendientes()).toBe(1);
    const lote = tomarLote(ID);
    expect(lote.filas).toHaveLength(1);
    expect(lote.filas[0].clave).toBe('progreso:g3');
    expect((lote.filas[0].valor as { semillas: number }).semillas).toBe(4);
  });

  it('encola ejercicios y partidas con id único', () => {
    const item = { pista: 'g3', nivel: 1, plantilla: 'x', operacion: 'suma' as const, correcto: true, intentos: 1, pistasUsadas: 0, ms: 1200.6 };
    registrar('nivel', item);
    registrar('nivel', item);
    guardarPartida({ tipo: 'nivel', pista: 'g3', nivel: 1, aciertos: 8, total: 10, estrellas: 2, ms_total: 50000, repaso: false, banda: 'basico' });
    const lote = tomarLote(ID);
    expect(lote.eventos).toHaveLength(2);
    expect(lote.eventos[0].id).not.toBe(lote.eventos[1].id);
    expect(lote.eventos[0].ms).toBe(1201);
    expect(lote.partidas).toHaveLength(1);
  });

  it('confirmar quita lo enviado, pero una clave que cambió mientras subía sigue pendiente', async () => {
    guardarProgreso(ID, 'g3', { ...progresoVacio(), semillas: 1 });
    registrar('nivel', { pista: 'g3', nivel: 1, plantilla: 'x', operacion: 'suma', correcto: true, intentos: 1, pistasUsadas: 0, ms: 1 });
    const lote = tomarLote(ID);
    await new Promise((r) => setTimeout(r, 5));
    guardarProgreso(ID, 'g3', { ...progresoVacio(), semillas: 2 });
    confirmarLote(ID, lote);
    expect(pendientes()).toBe(1);
    expect(tomarLote(ID).eventos).toHaveLength(0);
    confirmarLote(ID, tomarLote(ID));
    expect(pendientes()).toBe(0);
  });

  it('lo que llega de la nube se escribe sin volver a marcarse', () => {
    aplicarRemotas(ID, [
      { clave: 'progreso:g3', valor: { ...progresoVacio(), semillas: 9 } },
      { clave: 'clave-rara', valor: 1 },
    ]);
    expect(leerProgreso(ID, 'g3').semillas).toBe(9);
    expect(pendientes()).toBe(0);
    expect(leerTexto(claveLocal('clave-rara', ID))).toBeNull();
  });

  it('borrar los datos locales deja los ajustes y vacía la cola', () => {
    guardarAjustes({ ...leerAjustes(), sonido: false });
    guardarProgreso(ID, 'g3', { ...progresoVacio(), semillas: 3 });
    escribir('fincaMat:v1:silo', { cosechas: 1 });
    borrarDatosLocales(ID);
    expect(leerProgreso(ID, 'g3').semillas).toBe(0);
    expect(pendientes()).toBe(0);
    expect(leerTexto('fincaMat:v1:silo')).toBeNull();
    expect(leerAjustes().sonido).toBe(false);
  });

  it('sin cuenta activa no se encola nada', () => {
    activarCola(null);
    guardarProgreso(ID, 'g3', progresoVacio());
    registrar('nivel', { pista: 'g3', nivel: 1, plantilla: 'x', operacion: 'suma', correcto: true, intentos: 1, pistasUsadas: 0, ms: 1 });
    expect(pendientes()).toBe(0);
  });
});
