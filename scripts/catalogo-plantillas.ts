// Genera docs/PLANTILLAS.md con todas las plantillas y su uso por tema: npx tsx scripts/catalogo-plantillas.ts
import { writeFileSync } from 'node:fs';
import { definiciones } from '../src/contenido/pistas';
import type { Pista } from '../src/juego/tipos';
import { etiquetaNivel, unidadDe } from '../src/juego/complejidad';

const nombres: Record<Pista, string> = {
  g1: '1.º grado',
  g2: '2.º grado',
  g3: '3.º grado',
  g4: '4.º grado',
  g5: '5.º grado',
  inclusion: 'Inclusión',
  familia: 'Familias: prueba de entrada y final',
  'fam-basica': 'Familias: cuaderno básico',
  'fam-intermedia': 'Familias: cuaderno intermedio',
  'fam-avanzada': 'Familias: cuaderno avanzado',
};
let md =
  '# Catálogo de plantillas\n\nGenerado automáticamente desde `src/contenido/plantillas` (`npm run catalogo`).\n\n' +
  'Cada ruta tiene 10 temas (niveles 1 a 10) de 10 preguntas; Inclusión tiene 33 niveles en 8 bloques, de 5 actividades cada uno, llega hasta el 10 y no hace pruebas. La columna «Prueba» es la plantilla de la pregunta de ese tema en la prueba diagnóstica y en la final.\n\n';
const ids = new Set<string>();
for (const [pista, def] of Object.entries(definiciones) as [Pista, (typeof definiciones)[Pista]][]) {
  def.plantillas.forEach((p) => ids.add(p.id));
  md += `## ${nombres[pista]} (${def.plantillas.length} plantillas, números hasta ${def.limite.toLocaleString('es-CO')})\n\n| Plantilla | Dimensión | Operación | Descripción |\n| --- | --- | --- | --- |\n`;
  for (const p of def.plantillas) md += `| \`${p.id}\` | ${p.dimension} | ${p.operacion} | ${p.descripcion} |\n`;
  if (def.bloques) {
    md += '\n| Nivel | Bloque | Tema | Plantillas usadas |\n| --- | --- | --- | --- |\n';
    def.temas.forEach((t, k) => {
      md += `| ${etiquetaNivel(pista, k + 1)} | ${unidadDe(pista, k + 1).titulo} | ${t.titulo} | ${[...new Set(t.usos.map((u) => u.plantilla.id))].join(', ')} |\n`;
    });
  } else {
    md += '\n| Nivel | Tema | Plantillas usadas | Prueba |\n| --- | --- | --- | --- |\n';
    def.temas.forEach((t, k) => {
      md += `| ${k + 1} | ${t.titulo} | ${[...new Set(t.usos.map((u) => u.plantilla.id))].join(', ')} | ${(t.prueba ?? t.usos[0]).plantilla.id} |\n`;
    });
  }
  md += '\n';
}
md = md.replace('\n\n', `\n\nTotal: **${ids.size} plantillas distintas** en ${Object.keys(definiciones).length} rutas (algunas se comparten entre grados).\n\n`);
writeFileSync(new URL('../docs/PLANTILLAS.md', import.meta.url), md);
console.log('docs/PLANTILLAS.md:', ids.size, 'plantillas');
