// Reconocedor de cifras: cada forma se reconoce a sí misma y también deformada
// (temblor de la mano, giro leve, cifras anchas o flacas, trazos al revés).
import { describe, expect, it } from 'vitest';
import { FORMAS, type Trazo } from '../src/contenido/cifras';
import { CONFIANZA_MINIMA, cajaCifra, formaEnCaja, reconocerCifra, revisarRepaso } from '../src/juego/trazos';
import { crearRng } from '../src/juego/rng';

const rng = crearRng(20261026);

function deformar(forma: Trazo[], opciones: { giro: number; fx: number; ruido: number; escala: number; invertir: boolean }): Trazo[] {
  const a = (opciones.giro * Math.PI) / 180;
  return forma.map((t) => {
    const puntos = t.map((q) => {
      const x = (q.x - 30) * opciones.fx;
      const y = q.y - 50;
      return {
        x: 200 + opciones.escala * (x * Math.cos(a) - y * Math.sin(a)) + (rng.siguiente() - 0.5) * opciones.ruido,
        y: 200 + opciones.escala * (x * Math.sin(a) + y * Math.cos(a)) + (rng.siguiente() - 0.5) * opciones.ruido,
      };
    });
    return opciones.invertir ? puntos.reverse() : puntos;
  });
}

describe('reconocer cifras', () => {
  it('cada forma se reconoce a sí misma con confianza', () => {
    for (const [c, formas] of Object.entries(FORMAS)) {
      for (const f of formas) {
        const r = reconocerCifra(f)!;
        expect(r.cifra, `cifra ${c}`).toBe(Number(c));
      }
    }
  });

  it('acierta al menos el 90 % con temblor, giro y proporciones distintas', () => {
    let total = 0;
    let bien = 0;
    const fallos: string[] = [];
    for (const [c, formas] of Object.entries(FORMAS)) {
      for (const f of formas) {
        for (let k = 0; k < 30; k++) {
          const op = { giro: (rng.siguiente() - 0.5) * 20, fx: 0.75 + rng.siguiente() * 0.55, ruido: 6 + rng.siguiente() * 6, escala: 0.8 + rng.siguiente() * 1.6, invertir: rng.siguiente() < 0.3 };
          const r = reconocerCifra(deformar(f, op));
          total++;
          if (r?.cifra === Number(c)) bien++;
          else fallos.push(`${c}→${r?.cifra}`);
        }
      }
    }
    const tasa = bien / total;
    if (tasa < 0.97) console.log('fallos', fallos.join(' '));
    expect(tasa).toBeGreaterThanOrEqual(0.9);
  });

  it('distingue el 6 del 9', () => {
    expect(reconocerCifra(FORMAS[6][0])!.cifra).toBe(6);
    expect(reconocerCifra(FORMAS[9][0])!.cifra).toBe(9);
  });

  it('un garabato mínimo no se reconoce', () => {
    expect(reconocerCifra([[{ x: 0, y: 0 }, { x: 1, y: 1 }]])).toBeNull();
    expect(reconocerCifra([])).toBeNull();
  });

  it('un palito vertical es un 1 seguro', () => {
    const r = reconocerCifra([[{ x: 50, y: 10 }, { x: 53, y: 60 }, { x: 52, y: 120 }]])!;
    expect(r.cifra).toBe(1);
    expect(r.confianza).toBeGreaterThan(CONFIANZA_MINIMA);
  });
});

describe('repaso sobre la guía', () => {
  const caja = cajaCifra(240, 280, 24);
  const guia = formaEnCaja(FORMAS[3][0], caja);

  it('seguir la guía con un poco de temblor está bien', () => {
    const dibujo = guia.map((t) => t.map((q) => ({ x: q.x + (rng.siguiente() - 0.5) * 8, y: q.y + (rng.siguiente() - 0.5) * 8 })));
    expect(revisarRepaso(guia, dibujo, 18).bien).toBe(true);
  });

  it('hacer solo la mitad no basta', () => {
    const mitad = [guia[0].slice(0, Math.floor(guia[0].length / 2))];
    expect(revisarRepaso(guia, mitad, 18).bien).toBe(false);
  });

  it('dibujar otra cifra encima no cuenta', () => {
    expect(revisarRepaso(guia, formaEnCaja(FORMAS[7][0], caja), 18).bien).toBe(false);
  });
});
