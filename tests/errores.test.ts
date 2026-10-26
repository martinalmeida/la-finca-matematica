// Detector de errores con casos conocidos.
import { describe, expect, it } from 'vitest';
import { detectarTipoError, mensajeError, restaMenorMayor, sumaSinLlevar } from '../src/juego/errores';

describe('detector de errores', () => {
  it('53 − 28 = 35 es "resta del menor al mayor"', () => {
    expect(restaMenorMayor(53, 28)).toBe(35);
    expect(detectarTipoError({ op: 'resta', a: 53, b: 28 }, 25, 35)).toBe('resta-menor-mayor');
  });
  it('47 + 38 = 75 es "suma sin llevar"', () => {
    expect(sumaSinLlevar(47, 38)).toBe(75);
    expect(detectarTipoError({ op: 'suma', a: 47, b: 38 }, 85, 75)).toBe('suma-sin-llevar');
  });
  it('586 + 247 sin llevar da 723', () => {
    expect(detectarTipoError({ op: 'suma', a: 586, b: 247 }, 833, 723)).toBe('suma-sin-llevar');
  });
  it('operación equivocada: sumar cuando había que restar', () => {
    expect(detectarTipoError({ op: 'resta', a: 15, b: 6 }, 9, 21)).toBe('operacion-equivocada');
    expect(detectarTipoError({ op: 'suma', a: 15, b: 6 }, 21, 9)).toBe('operacion-equivocada');
    expect(detectarTipoError({ op: 'division', a: 24, b: 6 }, 4, 144)).toBe('operacion-equivocada');
  });
  it('tabla vecina: 7 × 8 respondido como 48 o 63', () => {
    expect(detectarTipoError({ op: 'multiplicacion', a: 7, b: 8 }, 56, 48)).toBe('tabla-vecina');
    expect(detectarTipoError({ op: 'multiplicacion', a: 7, b: 8 }, 56, 63)).toBe('tabla-vecina');
    expect(detectarTipoError({ op: 'multiplicacion', a: 7, b: 8 }, 56, 64)).toBe('tabla-vecina');
  });
  it('residuo ignorado: 23 bultos de a 5 por viaje → 4 en vez de 5', () => {
    expect(detectarTipoError({ op: 'division', a: 23, b: 5, redondearArriba: true }, 5, 4)).toBe('residuo-ignorado');
  });
  it('conteo por uno', () => {
    expect(detectarTipoError({ op: 'conteo', a: 12, b: 0 }, 12, 11)).toBe('conteo-por-uno');
    expect(detectarTipoError({ op: 'conteo', a: 12, b: 0 }, 12, 13)).toBe('conteo-por-uno');
  });
  it('un error cualquiera es "otro" y siempre hay mensaje amable', () => {
    const t = detectarTipoError({ op: 'suma', a: 12, b: 5 }, 17, 40);
    expect(t).toBe('otro');
    expect(mensajeError(t, { pista: 'g1' })).not.toMatch(/incorrecto/i);
  });
  it('los mensajes para familias usan "usted"', () => {
    expect(mensajeError('resta-menor-mayor', { pista: 'familia' })).toMatch(/pida|Revise|columna/);
    expect(mensajeError('resta-menor-mayor', { pista: 'g2' })).toBe('En las unidades, ¿alcanza para quitar? Si no, pide prestada una decena.');
  });
});
