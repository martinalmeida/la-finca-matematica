// Genera docs/PLANTILLAS.md con todas las plantillas y su uso por tramo: npx tsx scripts/catalogo-plantillas.ts
import { writeFileSync } from 'node:fs';
import { definiciones } from '../src/contenido/pistas';

const nombres = { g1: '1.º grado', g2: '2.º grado', g3: '3.º grado', g4: '4.º grado', g5: '5.º grado', familia: 'Familia' } as const;
let md = '# Catálogo de plantillas\n\nGenerado automáticamente desde `src/contenido/plantillas` (`npx tsx scripts/catalogo-plantillas.ts`).\n\n';
let total = 0;
for (const [pista, def] of Object.entries(definiciones)) {
  total += def.plantillas.length;
  md += `## ${nombres[pista as keyof typeof nombres]} (${def.plantillas.length} plantillas, números hasta ${def.limite.toLocaleString('es-CO')})\n\n| Plantilla | Dimensión | Operación | Descripción |\n| --- | --- | --- | --- |\n`;
  for (const p of def.plantillas) md += `| \`${p.id}\` | ${p.dimension} | ${p.operacion} | ${p.descripcion} |\n`;
  md += '\n| Niveles | Tramo | Plantillas usadas |\n| --- | --- | --- |\n';
  for (const t of def.tramos) md += `| ${t.inicio === t.fin ? t.inicio : `${t.inicio}–${t.fin}`} | ${t.titulo} | ${[...new Set(t.usos.map((u) => u.plantilla.id))].join(', ')} |\n`;
  md += '\n';
}
md = md.replace('\n\n', `\n\nTotal: **${total} plantillas** en seis pistas.\n\n`);
writeFileSync(new URL('../docs/PLANTILLAS.md', import.meta.url), md);
console.log('docs/PLANTILLAS.md:', total, 'plantillas');
