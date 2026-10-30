// Prueba de cada generador: 1.000 ejercicios por plantilla (uso) y dificultad de muestra.
import { describe, expect, it } from 'vitest';
import { definiciones } from '../src/contenido/pistas';
import { generarConUso } from '../src/juego/motor';
import type { Ejercicio, Pista } from '../src/juego/tipos';

const POR_MUESTRA = Number(process.env.MUESTRAS ?? 1000);
const PISTAS = (process.env.PISTAS?.split(',') ?? Object.keys(definiciones)) as Pista[];

function textos(ej: Ejercicio): string[] {
  return [ej.enunciado, ej.explicacion, ej.pistas[0], ej.pistas[2], ej.instruccion ?? '', ej.pistas[1].tipo === 'texto' ? ej.pistas[1].texto : ''];
}

export function revisar(ej: Ejercicio, limite: number): string | null {
  const r = ej.respuesta;
  if (!ej.validar(r)) return 'validar(respuesta) es falso';
  for (const t of textos(ej)) {
    if (/undefined|NaN|null|\[object|Infinity/.test(t)) return `texto con valor inválido: ${t}`;
  }
  if (!ej.enunciado.trim()) return 'enunciado vacío';
  if (typeof r === 'number') {
    if (ej.decimales) {
      if (Math.abs(r * 100 - Math.round(r * 100)) > 1e-9) return `respuesta con más de dos decimales: ${r}`;
    } else if (!Number.isInteger(r)) return `respuesta no entera: ${r}`;
    if (r < 0) return `respuesta negativa: ${r}`;
    if (r > limite) return `respuesta fuera de rango: ${r} > ${limite}`;
  }
  for (const [k, v] of Object.entries(ej.datos)) {
    if (typeof v !== 'number') continue;
    if (!Number.isFinite(v)) return `dato ${k} no finito`;
    if (v < 0) return `dato ${k} negativo: ${v}`;
    if (v > limite) return `dato ${k} fuera de rango: ${v} > ${limite}`;
  }
  // Distractores: distintos de la respuesta y entre sí.
  const vistos = new Set<string>();
  for (const d of ej.distractores) {
    const s = String(d);
    if (s === String(r)) return `distractor igual a la respuesta: ${s}`;
    if (vistos.has(s)) return `distractor repetido: ${s}`;
    if (typeof d === 'number' && d < 0) return `distractor negativo: ${d}`;
    vistos.add(s);
  }
  // División exacta salvo donde se trabaja el residuo.
  const c = ej.calculo;
  if (c?.op === 'division' && !c.redondearArriba && !ej.permiteResiduo) {
    if (c.b === 0) return 'división entre cero';
    if (c.a % c.b !== 0) return `división inexacta no prevista: ${c.a} ÷ ${c.b}`;
  }
  const i = ej.interaccion;
  const opciones = i.tipo === 'opciones' || i.tipo === 'contar' || i.tipo === 'razonable' || i.tipo === 'emparejar' ? i.opciones : i.tipo === 'tabla' ? i.opciones : undefined;
  if (opciones) {
    if (opciones.length < 2 || opciones.length > 4) return `cantidad de opciones: ${opciones.length}`;
    if (new Set(opciones.map(String)).size !== opciones.length) return `opciones repetidas: ${opciones.join(', ')}`;
    const objetivo = i.tipo === 'razonable' ? Number(String(r).split(':')[1]) : r;
    if (!opciones.some((o) => String(o) === String(objetivo))) return `la respuesta ${objetivo} no está entre las opciones ${opciones.join(', ')}`;
    if (opciones.some((o) => typeof o === 'number' && o < 0)) return 'opción negativa';
  }
  const conFiguras = i.tipo === 'figuras' || i.tipo === 'clasificar' || i.tipo === 'ordenar';
  if (typeof r === 'string' && i.tipo !== 'razonable' && !opciones && !conFiguras) return 'respuesta de texto sin opciones';
  switch (i.tipo) {
    case 'contar':
      if (i.cantidad !== r || i.cantidad > 20) return `contar: cantidad ${i.cantidad}`;
      break;
    case 'arrastrar':
      if (i.a + (i.modo === 'juntar' ? i.b : 0) > 20) return `arrastrar: demasiados objetos (${i.a}, ${i.b})`;
      if (i.modo === 'repartir' && (i.a % i.b !== 0 || i.a / i.b !== r)) return 'arrastrar: reparto inexacto';
      if (i.modo === 'quitar' && i.b > i.a) return 'arrastrar: quita más de lo que hay';
      break;
    case 'recta':
      if (typeof r !== 'number' || r < i.min || r > i.max) return `recta: respuesta ${r} fuera de [${i.min}, ${i.max}]`;
      if ((r - i.min) % i.paso !== 0) return 'recta: respuesta fuera de las marcas';
      if ((i.max - i.min) / i.paso > 30) return 'recta: demasiadas marcas';
      break;
    case 'bloques':
      if (i.modo === 'construir' && i.valor !== r) return 'bloques: valor distinto de la respuesta';
      if (i.valor > 999) return 'bloques: valor mayor que 999';
      break;
    case 'algoritmo': {
      const v = i.operacion === 'suma' ? i.a + i.b : i.operacion === 'resta' ? i.a - i.b : i.a * i.b;
      if (v !== r) return `algoritmo: ${i.a} ${i.operacion} ${i.b} ≠ ${r}`;
      if (v < 0) return 'algoritmo negativo';
      break;
    }
    case 'arreglo':
      if (i.filas > 10 || i.columnas > 10 || i.filas < 1 || i.columnas < 1) return `arreglo de ${i.filas} × ${i.columnas}`;
      break;
    case 'razonable':
      if (!/^(si|no):\d+$/.test(String(r))) return `razonable: respuesta mal formada ${r}`;
      break;
    case 'escribir':
      if (typeof r !== 'number' || String(r).length > i.cifras) return `escribir: ${r} no cabe en ${i.cifras} casillas`;
      break;
    case 'trazar':
      if (i.cifra !== r || i.cifra < 0 || i.cifra > 9) return `trazar: cifra ${i.cifra}`;
      break;
    case 'emparejar':
      if (i.opciones.some((o) => o < 1 || o > 10)) return `emparejar: grupo fuera de 1 a 10 (${i.opciones.join(', ')})`;
      break;
    case 'figuras': {
      const ids = i.opciones.map((o) => o.id);
      if (ids.length < 2 || ids.length > 4) return `figuras: ${ids.length} opciones`;
      if (new Set(ids).size !== ids.length) return `figuras: ids repetidos ${ids.join(', ')}`;
      if (!ids.includes(String(r))) return `figuras: la respuesta ${r} no está entre ${ids.join(', ')}`;
      if (ej.validar(ids.find((x) => x !== String(r))!)) return 'figuras: una opción equivocada también valida';
      if (i.opciones.some((o) => !o.etiqueta.trim())) return 'figuras: opción sin etiqueta';
      break;
    }
    case 'clasificar': {
      const destinos = String(r).split(',');
      if (destinos.length !== i.items.length) return `clasificar: ${destinos.length} destinos para ${i.items.length} figuras`;
      if (destinos.some((x) => x !== '0' && x !== '1')) return `clasificar: destino inválido en ${r}`;
      if (!destinos.includes('0') || !destinos.includes('1')) return 'clasificar: una canasta queda vacía';
      if (new Set(i.items.map((o) => o.id)).size !== i.items.length) return 'clasificar: ids repetidos';
      break;
    }
    case 'ordenar': {
      const orden = String(r).split('|');
      const ids = i.items.map((o) => o.id);
      if (orden.length !== ids.length || [...orden].sort().join() !== [...ids].sort().join()) return `ordenar: ${r} no ordena ${ids.join(', ')}`;
      if (ids.join('|') === orden.join('|')) return 'ordenar: ya aparecen en orden';
      break;
    }
    default:
      break;
  }
  return null;
}

describe('generadores de ejercicios', () => {
  for (const pista of PISTAS) {
    const def = definiciones[pista];
    describe(pista, () => {
      it('cada plantilla está registrada y se usa en algún tema; hay 10 temas (33 en Inclusión, en 8 bloques)', () => {
        const usadas = new Set(def.temas.flatMap((t) => [...t.usos, ...(t.prueba ? [t.prueba] : [])].map((u) => u.plantilla.id)));
        for (const p of def.plantillas) expect(usadas.has(p.id), p.id).toBe(true);
        for (const id of usadas) expect(def.plantillas.some((p) => p.id === id), `${id} no está en plantillas`).toBe(true);
        expect(new Set(def.plantillas.map((p) => p.id)).size).toBe(def.plantillas.length);
        if (def.bloques) {
          expect(def.temas.length).toBe(33);
          expect(def.bloques.length).toBe(8);
          expect(def.bloques.reduce((s, b) => s + b.niveles, 0)).toBe(def.temas.length);
        } else expect(def.temas.length).toBe(10);
      });

      def.temas.forEach((tema, t) => {
        const nivel = t + 1;
        const usos = [...tema.usos, ...(tema.prueba && !tema.usos.includes(tema.prueba) ? [tema.prueba] : [])];
        usos.forEach((uso, k) => {
          for (const d of [0, 0.5, 1]) {
            it(`${uso.plantilla.id} [tema ${nivel}, uso ${k}] d=${d}`, () => {
              for (let s = 0; s < POR_MUESTRA; s++) {
                // Una de cada 10 muestras con la ayuda de Refuerzo (menos opciones).
                const ej = generarConUso(pista, uso, d, nivel, s * 7919 + nivel * 31 + k, s % 5 === 0, s % 10 === 3);
                const error = revisar(ej, def.limite);
                if (error) {
                  throw new Error(`${uso.plantilla.id} tema ${nivel} d=${d} semilla ${s}: ${error}\n${ej.enunciado}\nrespuesta=${String(ej.respuesta)} datos=${JSON.stringify(ej.datos)} distractores=${JSON.stringify(ej.distractores)} interaccion=${JSON.stringify(ej.interaccion)}`);
                }
              }
            });
          }
        });
      });
    });
  }
});
