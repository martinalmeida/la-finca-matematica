// Reto en pareja: problemas de dos pasos; cada estudiante resuelve un paso por turnos.

import { crearRng, type Rng } from './rng';
import { dosPersonas, nombreCant, productos, num } from '../contenido/contexto';
import type { Grado } from './tipos';

export type PasoPareja = { pregunta: string; respuesta: number };
export type ProblemaPareja = { contexto: string; pasos: [PasoPareja, PasoPareja] };

type GradoNum = Exclude<Grado, 'inclusion'>;

/** Grado numérico para el reto: Inclusión juega con los números de 1.º. */
export function gradoNumerico(g: Grado): GradoNum {
  return g === 'inclusion' ? 1 : g;
}

function rango(g: GradoNum): number {
  return [0, 20, 100, 1000, 10000, 100000][g];
}

function problema(rng: Rng, g: GradoNum): ProblemaPareja {
  const max = rango(g);
  const [x, y] = dosPersonas(rng);
  const p = rng.elegir(productos.filter((q) => q.objeto !== 'huevo' || g <= 2));
  const tipo = g >= 3 && rng.azar(0.5) ? 'mult' : 'suma-resta';
  if (tipo === 'mult') {
    const f = rng.entero(2, g >= 4 ? 12 : 9);
    const c = rng.entero(2, g >= 4 ? 25 : 9);
    const total = f * c;
    const vendidas = rng.entero(1, total - 1);
    const cu = p.genero === 'f' ? 'Cuántas' : 'Cuántos';
    return {
      contexto: `${x.nombre} y ${y.nombre} llenaron ${f} canastos con ${c} ${p.plural} cada uno. Después vendieron ${num(vendidas)} en la tienda de la vereda.`,
      pasos: [
        { pregunta: `¿${cu} ${p.plural} llenaron en total?`, respuesta: total },
        { pregunta: `¿${cu} ${p.plural} les quedaron después de vender?`, respuesta: total - vendidas },
      ],
    };
  }
  const a = rng.entero(2, Math.floor(max / 2));
  const b = rng.entero(1, Math.floor(max / 2));
  const c = rng.entero(1, a + b - 1);
  const cu = p.genero === 'f' ? 'Cuántas' : 'Cuántos';
  return {
    contexto: `En la finca, ${x.nombre} ${p.verbo} ${num(a)} ${nombreCant(p, a)} y ${y.nombre} ${p.verbo} ${num(b)}. Luego regalaron ${num(c)} a la abuela Carmen.`,
    pasos: [
      { pregunta: `¿${cu} ${p.plural} juntaron entre los dos?`, respuesta: a + b },
      { pregunta: `¿${cu} ${p.plural} les quedaron después de regalar?`, respuesta: a + b - c },
    ],
  };
}

/** Tres problemas con números del grado menor de la pareja. */
export function generarReto(gradoA: Grado, gradoB: Grado, semilla: number): ProblemaPareja[] {
  const rng = crearRng(semilla);
  const g = Math.min(gradoNumerico(gradoA), gradoNumerico(gradoB)) as GradoNum;
  return [problema(rng, g), problema(rng, g), problema(rng, g)];
}

export function gradosCercanos(a: Grado, b: Grado): boolean {
  return Math.abs(gradoNumerico(a) - gradoNumerico(b)) <= 1;
}
