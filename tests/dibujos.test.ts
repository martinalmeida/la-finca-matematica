// Lo que se dibuja tiene que ser lo que dice el enunciado: si la pregunta habla de semillas no se
// dibujan canastas, y si los depósitos dicen «Mesa» el enunciado habla de mesas.
import { describe, expect, it } from 'vitest';
import { definiciones } from '../src/contenido/pistas';
import { generarNivel, generarPrueba, nivelMaximo } from '../src/juego/motor';
import type { Banda, Ejercicio, Objeto, OpcionFigura, Pista, Recipiente, Visual } from '../src/juego/tipos';

/** Palabras del enunciado que justifican cada dibujo (todas las expresiones deben aparecer). */
const PALABRAS: Record<Objeto, RegExp[]> = {
  huevo: [/huevo/i],
  mazorca: [/mazorca/i],
  naranja: [/naranja/i],
  aguacate: [/aguacate/i],
  gallina: [/gallina/i],
  // El bulto lleva «kg»: sirve para bultos, sacos y costales, y para los kilos de lo que se vende seco.
  bulto: [/bulto|saco|costal|kilos? de (cacao|café)|cacao seco|abono/i],
  arbol: [/árbol/i],
  platano: [/plátano/i],
  mandarina: [/mandarina/i],
  limon: [/limón|limones/i],
  arepa: [/arepa/i],
  moneda: [/moneda|\$|pesos|plata|precio/i],
  billete: [/billete|\$/i],
  cafe: [/café/i],
  canasta: [/canast/i],
  semilla: [/semilla/i],
  pan: [/\bpan(es)?\b/i],
  mata: [/mata|plántula/i],
  bolsa: [/bolsa/i],
  caja: [/caja/i],
  cubeta: [/cubeta/i],
  mesa: [/mesa/i],
  'arbol-cacao': [/árbol|surco|hilera/i, /cacao/i],
  'arbol-cafe': [/árbol|surco|hilera|mata/i, /café/i],
  'arbol-aguacate': [/árbol|surco|hilera/i, /aguacate/i],
  'arbol-naranja': [/árbol|surco|hilera/i, /naranj/i],
  'arbol-mandarina': [/árbol|surco|hilera/i, /mandarin/i],
  'arbol-limon': [/árbol|surco|hilera/i, /lim[oó]n/i],
  platanera: [/árbol|surco|hilera|mata/i, /plátano/i],
};

/** Raíz del nombre del recipiente que debe aparecer en el enunciado («Mesa 3» → «mesa»). */
function raiz(nombre: string): RegExp | null {
  const n = nombre.toLowerCase().replace(/\s*\d+$/, '');
  if (/^(lo que|las que|los que|para repartir)/.test(n)) return null;
  const mapa: Record<string, RegExp> = {
    'canasta grande': /canasta grande/i,
    'para las arepas': /arepa/i,
    'la mula': /mula/i,
    canasto: /canasto/i,
  };
  return mapa[n] ?? new RegExp(n.slice(0, Math.max(4, n.length - 2)), 'i');
}

type Fallo = { plantilla: string; motivo: string; enunciado: string };

function revisar(ej: Ejercicio): string[] {
  const texto = ej.enunciado;
  const malos: string[] = [];
  const dibujo = (donde: string, o: Objeto | undefined) => {
    if (!o) return;
    for (const re of PALABRAS[o]) if (!re.test(texto)) malos.push(`${donde}: se dibuja «${o}» pero el texto no dice ${re}`);
  };
  const recipiente = (donde: string, r: Recipiente | undefined) => {
    if (!r) return;
    const re = raiz(r.nombre);
    if (re && !re.test(texto)) malos.push(`${donde}: el rótulo «${r.nombre}» no está en el texto`);
    if (r.dibujo && r.dibujo !== 'nino' && r.dibujo !== 'adulto' && r.dibujo !== 'mula') dibujo(`${donde} (dibujo)`, r.dibujo);
  };
  dibujo('ilustración', ej.ilustracion);
  const i = ej.interaccion;
  if ('objeto' in i) dibujo(`interacción ${i.tipo}`, i.objeto);
  if (i.tipo === 'arrastrar') {
    // Sin rótulos propios, los depósitos dicen «Canasta»: el texto tiene que hablar de canastas.
    const def = { nombre: 'Canasta', dibujo: 'canasta' as const };
    if (i.modo === 'juntar') [i.origen ?? def, i.origen2 ?? def, i.destino ?? def].forEach((r) => recipiente('arrastrar', r));
    else if (i.modo === 'repartir') recipiente('arrastrar', i.destino ?? def);
    else [i.origen, i.destino].forEach((r) => recipiente('arrastrar', r));
  }
  if (i.tipo === 'bloques' && i.unidad) [i.unidad, i.decena, i.centena].forEach((o) => dibujo('bloques', o));
  // Figuras del pre-número: los objetos dibujados y las torres de cajas también deben nombrarse.
  const figuras = (donde: string, lista: OpcionFigura[]) => {
    for (const o of lista) {
      const f = o.figura;
      if ('objeto' in f) dibujo(donde, f.objeto);
      if ('torre' in f && !/torre/i.test(texto)) malos.push(`${donde}: se dibujan torres pero el texto no dice «torre»`);
      if ('lazo' in f && !/lazo/i.test(texto)) malos.push(`${donde}: se dibujan lazos pero el texto no dice «lazo»`);
      if ('cantidad' in f && !/canasta/i.test(texto)) malos.push(`${donde}: se dibujan canastas pero el texto no dice «canasta»`);
    }
  };
  if (i.tipo === 'figuras') figuras('figuras', i.opciones);
  if (i.tipo === 'clasificar') figuras('clasificar', [...i.items, ...i.grupos]);
  if (i.tipo === 'ordenar') figuras('ordenar', i.items);
  const visual = (donde: string, x: Visual | undefined) => {
    if (x?.tipo === 'objetos') dibujo(donde, x.objeto);
  };
  visual('dibujo del enunciado', ej.dibujo);
  const v = ej.pistas[1];
  if ((v.tipo === 'objetos' || v.tipo === 'arreglo' || v.tipo === 'reparto') && v.objeto) dibujo(`pista ${v.tipo}`, v.objeto);
  if (v.tipo === 'objetos' || v.tipo === 'reparto') recipiente(`pista ${v.tipo}`, v.grupo);
  if (v.tipo === 'bloques' && v.unidad) [v.unidad, v.decena, v.centena].forEach((o) => dibujo('pista bloques', o));
  return malos;
}

describe('los dibujos corresponden al enunciado', () => {
  const pistas = Object.keys(definiciones) as Pista[];
  const bandas: Banda[] = ['refuerzo', 'basico', 'avanzado'];
  for (const pista of pistas) {
    it(pista, () => {
      const fallos: Fallo[] = [];
      for (let c = 0; c < 12; c++) {
        const ejs: Ejercicio[] = [];
        for (const banda of bandas) for (let nivel = 1; nivel <= nivelMaximo(pista); nivel++) ejs.push(...generarNivel({ codigo: `D${c}`, pista, nivel, intento: 1 + (c % 3), repaso: c % 4 === 0, banda }));
        if (pista !== 'inclusion') for (const tipo of ['diagnostica', 'final'] as const) ejs.push(...generarPrueba({ codigo: `P${c}`, pista, tipo }));
        for (const ej of ejs) for (const motivo of revisar(ej)) fallos.push({ plantilla: ej.plantilla, motivo, enunciado: ej.enunciado });
      }
      // Un ejemplo por plantilla y motivo, para que el mensaje se pueda leer.
      const unicos = [...new Map(fallos.map((f) => [`${f.plantilla}|${f.motivo}`, f])).values()];
      expect(unicos.map((f) => `${f.plantilla}: ${f.motivo}\n    «${f.enunciado}»`).join('\n')).toBe('');
    });
  }
});
