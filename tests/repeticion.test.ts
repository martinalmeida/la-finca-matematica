// Ninguna pregunta se repite: cada tema tiene un banco grande (muchas preguntas y muchas
// situaciones distintas) y el motor, con el historial del usuario, nunca repite una ya vista.
import { describe, expect, it } from 'vitest';
import { definiciones } from '../src/contenido/pistas';
import { generarConUso, generarNivel, generarParecido, generarPrueba } from '../src/juego/motor';
import { agregarVista, frase, huella, vistasVacias } from '../src/juego/vistas';
import type { Ejercicio, Pista } from '../src/juego/tipos';

const MUESTRA = 2000;
/** Veces que el usuario simulado entra a cada nivel. */
const ENTRADAS = 15;

/** Inclusión (toda la ruta, hasta 10, con pocas opciones y una consigna fija): el banco es más chico por naturaleza. */
const preNumero = (pista: string) => pista === 'inclusion';
const minimos = (pista: string) => (preNumero(pista) ? { preguntas: 500, frases: 25 } : { preguntas: 1000, frases: 40 });

describe('banco de preguntas', () => {
  for (const [pista, def] of Object.entries(definiciones)) {
    def.temas.forEach((tema, k) => {
      const nivel = k + 1;
      it(`${pista} nivel ${nivel} (${tema.titulo}) tiene muchas preguntas y situaciones`, () => {
        const exactas = new Set<string>();
        const frases = new Set<string>();
        for (let s = 0; s < MUESTRA; s++) {
          const uso = tema.usos[s % tema.usos.length];
          const ej = generarConUso(pista as Pista, uso, (s % 11) / 10, nivel, s * 31 + 7);
          exactas.add(huella(ej));
          frases.add(frase(ej));
        }
        const min = minimos(pista);
        expect(exactas.size, 'preguntas distintas').toBeGreaterThanOrEqual(min.preguntas);
        expect(frases.size, 'situaciones distintas').toBeGreaterThanOrEqual(min.frases);
      });
    });
  }
});

describe('un usuario nunca ve dos veces la misma pregunta', () => {
  for (const [pista, def] of Object.entries(definiciones)) {
    it(`${pista}: prueba de entrada, ${ENTRADAS} entradas a cada nivel, parecidos y prueba final`, () => {
      const vistas = vistasVacias();
      const vistas_ = new Set<string>();
      const repetidas: string[] = [];
      const ver = (ejs: Ejercicio[]) => {
        for (const ej of ejs) {
          const h = huella(ej);
          if (vistas_.has(h)) repetidas.push(ej.enunciado);
          vistas_.add(h);
          agregarVista(vistas, ej);
        }
      };
      const conPruebas = pista !== 'inclusion';
      if (conPruebas) ver(generarPrueba({ codigo: 'sim', pista: pista as Pista, tipo: 'diagnostica', vistas }));
      for (let nivel = 1; nivel <= def.temas.length; nivel++) {
        for (let e = 1; e <= ENTRADAS; e++) {
          const banda = (['refuerzo', 'basico', 'avanzado'] as const)[e % 3];
          const ejs = generarNivel({ codigo: 'sim', pista: pista as Pista, nivel, intento: e, variante: e * 7919, repaso: e % 5 === 0, banda, vistas });
          // Dentro de un nivel tampoco se repite la situación.
          expect(new Set(ejs.map(frase)).size, `${pista} nivel ${nivel}: situaciones repetidas en el mismo nivel`).toBe(ejs.length);
          ver(ejs);
          if (e % 4 === 0) ver([generarParecido(ejs[e % ejs.length], e * 104729, vistas)]);
        }
      }
      if (conPruebas) ver(generarPrueba({ codigo: 'sim', pista: pista as Pista, tipo: 'final', vistas }));
      expect(repetidas, 'preguntas repetidas').toEqual([]);
    });
  }
});
