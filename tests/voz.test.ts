// La voz recibe los números ya en palabras: «4.000» es cuatro mil, no «cuatro coma cero cero cero».
import { describe, expect, it } from 'vitest';
import { definiciones } from '../src/contenido/pistas';
import { generarConUso } from '../src/juego/motor';
import type { Pista } from '../src/juego/tipos';
import { cantidadEnPalabras, enteroEnPalabras, textoParaVoz } from '../src/servicios/numerosEnPalabras';

describe('números en palabras', () => {
  it('enteros', () => {
    const casos: [number, string][] = [
      [0, 'cero'],
      [15, 'quince'],
      [21, 'veintiuno'],
      [45, 'cuarenta y cinco'],
      [100, 'cien'],
      [101, 'ciento uno'],
      [555, 'quinientos cincuenta y cinco'],
      [1000, 'mil'],
      [4000, 'cuatro mil'],
      [21000, 'veintiún mil'],
      [100000, 'cien mil'],
      [1000000, 'un millón'],
      [1800000, 'un millón ochocientos mil'],
      [2500000, 'dos millones quinientos mil'],
    ];
    for (const [n, w] of casos) expect(enteroEnPalabras(n), String(n)).toBe(w);
  });

  it('la coma solo se nombra si el número tiene decimales', () => {
    expect(cantidadEnPalabras('4.000')).toBe('cuatro mil');
    expect(cantidadEnPalabras('12,5')).toBe('doce coma cinco');
    expect(cantidadEnPalabras('0,05')).toBe('cero coma cero cinco');
    expect(cantidadEnPalabras('4,18')).toBe('cuatro coma dieciocho');
    expect(cantidadEnPalabras('1.250,5')).toBe('mil doscientos cincuenta coma cinco');
  });

  it('concuerda con lo que se cuenta', () => {
    expect(textoParaVoz('Hay 21 kilos y 21 mazorcas. Son 21.')).toBe('Hay veintiún kilos y veintiuna mazorcas. Son veintiuno.');
    expect(textoParaVoz('1 unidad, 1 kilo, 1 y 2')).toBe('una unidad, un kilo, uno y dos');
    expect(textoParaVoz('200 naranjas y 200.000 mazorcas')).toBe('doscientas naranjas y doscientas mil mazorcas');
    expect(textoParaVoz('1.º grado y la 3.ª vez')).toBe('primer grado y la tercera vez');
  });

  it('pesos, porcentajes, fracciones y signos', () => {
    expect(textoParaVoz('El 25 % de $56.000 es $56.000 ÷ 4 = $14.000.')).toBe(
      'El veinticinco por ciento de cincuenta y seis mil pesos es cincuenta y seis mil pesos entre cuatro es igual a catorce mil pesos.',
    );
    expect(textoParaVoz('$2.000.000 y $1')).toBe('dos millones de pesos y un peso');
    expect(textoParaVoz('Calcula 1/3 de 15 y 3/4')).toBe('Calcula un tercio de quince y tres cuartos');
    expect(textoParaVoz('10.000 − 800 = 9.200 m²')).toBe('diez mil menos ochocientos es igual a nueve mil doscientos metros cuadrados');
    expect(textoParaVoz('4 × 3 + 1.773 ≈ 2.000 y 14 > 11')).toBe('cuatro por tres más mil setecientos setenta y tres es más o menos dos mil y catorce es mayor que once');
  });

  it('ningún enunciado, pista ni explicación deja cifras o signos para la voz', () => {
    for (const pista of Object.keys(definiciones) as Pista[]) {
      definiciones[pista].temas.forEach((tema, t) => {
        for (const uso of [...tema.usos, ...(tema.prueba ? [tema.prueba] : [])]) {
          for (let s = 0; s < 20; s++) {
            const ej = generarConUso(pista, uso, s % 3 / 2, t + 1, s * 7919 + t * 31);
            for (const texto of [ej.enunciado, ej.explicacion, ej.instruccion ?? '', ...ej.pistas.map((p) => (typeof p === 'string' ? p : 'texto' in p ? p.texto : ''))]) {
              expect(textoParaVoz(texto), texto).not.toMatch(/\d|[$%=+×÷−<>☐²→←|]/);
            }
          }
        }
      });
    }
  });
});
