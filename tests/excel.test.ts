// Escritor de .xlsx de los informes del profesor.
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { crearLibro, letraColumna, nombresHojas, serialExcel, type Hoja } from '../src/profesor/excel';

const FECHA = new Date('2026-10-30T15:00:00Z');

function abrir(datos: Uint8Array): Record<string, string> {
  const partes = unzipSync(datos);
  return Object.fromEntries(Object.entries(partes).map(([k, v]) => [k, strFromU8(v)]));
}

function cadenas(xml: string): string[] {
  return [...xml.matchAll(/<si><t(?: xml:space="preserve")?>([\s\S]*?)<\/t><\/si>/g)].map((m) => m[1]);
}

type CeldaLeida = { s?: string; t?: string; v?: string };
function celda(hoja: string, ref: string): CeldaLeida | null {
  const m = new RegExp(`<c r="${ref}"([^>]*)>(?:<v>([^<]*)</v>)?</c>`).exec(hoja);
  if (!m) return null;
  const attr = (n: string) => new RegExp(`\\b${n}="([^"]*)"`).exec(m[1])?.[1];
  return { s: attr('s'), t: attr('t'), v: m[2] };
}

function estiloNumFmt(styles: string, s: string | undefined): string {
  const xfs = [...(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)?.[1] ?? '').matchAll(/<xf [^>]*\/>/g)].map((m) => m[0]);
  const xf = xfs[Number(s ?? 0)];
  const id = /numFmtId="(\d+)"/.exec(xf)![1];
  const integrados: Record<string, string> = { '0': 'General', '3': '#,##0', '4': '#,##0.00', '9': '0%' };
  if (integrados[id]) return integrados[id];
  const custom = new RegExp(`<numFmt numFmtId="${id}" formatCode="([^"]*)"/>`).exec(styles)![1];
  return custom.replace(/&quot;/g, '"');
}

const HOJA: Hoja = {
  nombre: 'Resumen',
  titulo: 'Informe del grupo',
  subtitulo: ['Grado 3', 'Generado el 30/10/2026'],
  columnas: [
    { titulo: 'Nombre' },
    { titulo: 'Sesiones', formato: 'entero' },
    { titulo: 'Promedio', formato: 'decimal' },
    { titulo: 'Aciertos', formato: 'porcentaje' },
    { titulo: 'Última vez', formato: 'fecha' },
    { titulo: 'Momento', formato: 'fechaHora' },
    { titulo: 'Tiempo', formato: 'minutos' },
    { titulo: 'Valor', formato: 'pesos' },
    { titulo: 'Activo' },
  ],
  filas: [
    ['Ana & <Luis>', 1234, 3.5, 72, '2026-10-30', '2026-10-30T13:30:00Z', 12.25, 4000, true],
    ['=SUMA(A1:A2)', null, undefined, 100, new Date('2026-10-31T03:00:00Z'), 'no es fecha', 0, -500, false],
    ['+57 300', '-5', '@arroba', 0, null, null, null, null, null],
  ],
  notas: ['Aciertos: porcentaje de respuestas correctas.'],
};

describe('crearLibro', () => {
  const partes = abrir(crearLibro([HOJA, { ...HOJA, nombre: 'Resumen', titulo: undefined, subtitulo: undefined }], { titulo: 'Informe', autor: 'Profe', fecha: FECHA }));
  const hoja = partes['xl/worksheets/sheet1.xml'];
  const ss = cadenas(partes['xl/sharedStrings.xml']);
  const styles = partes['xl/styles.xml'];
  const texto = (ref: string) => {
    const c = celda(hoja, ref)!;
    expect(c.t).toBe('s');
    return ss[Number(c.v)];
  };

  it('incluye todas las partes OOXML', () => {
    for (const p of [
      '[Content_Types].xml',
      '_rels/.rels',
      'docProps/core.xml',
      'docProps/app.xml',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/styles.xml',
      'xl/sharedStrings.xml',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
    ]) {
      expect(partes[p], p).toBeTruthy();
      expect(partes[p].startsWith('<?xml')).toBe(true);
    }
    expect(partes['[Content_Types].xml']).toContain('/xl/worksheets/sheet2.xml');
    expect(partes['docProps/core.xml']).toContain('<dc:title>Informe</dc:title>');
    expect(partes['docProps/core.xml']).toContain('2026-10-30T15:00:00Z');
  });

  it('título, subtítulos, fila vacía y encabezado con estilo', () => {
    expect(texto('A1')).toBe('Informe del grupo');
    expect(texto('A2')).toBe('Grado 3');
    expect(texto('A3')).toBe('Generado el 30/10/2026');
    expect(hoja).not.toContain('<row r="4"');
    expect(texto('A5')).toBe('Nombre');
    expect(texto('I5')).toBe('Activo');
    expect(celda(hoja, 'A1')!.s).toBe('1');
    expect(celda(hoja, 'A5')!.s).toBe('2');
    expect(styles).toContain('<font><b/><sz val="14"/>');
    expect(styles).toMatch(/<bottom style="thin">/);
  });

  it('inmoviliza y filtra respetando las filas del título', () => {
    expect(hoja).toContain('<pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/>');
    expect(hoja).toContain('<autoFilter ref="A5:I8"/>');
    expect(partes['xl/workbook.xml']).toContain(`<definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'Resumen'!$A$5:$I$8</definedName>`);
    expect(hoja).toContain('<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>');
    expect(hoja).toContain('<pageSetUpPr fitToPage="1"/>');
    // Sin título, el encabezado queda en la fila 1.
    expect(partes['xl/worksheets/sheet2.xml']).toContain('<pane ySplit="1" topLeftCell="A2"');
  });

  it('escapa XML y guarda los números con su formato', () => {
    expect(texto('A6')).toBe('Ana &amp; &lt;Luis&gt;');
    const n = (ref: string) => celda(hoja, ref)!;
    expect(n('B6')).toMatchObject({ v: '1234' });
    expect(estiloNumFmt(styles, n('B6').s)).toBe('#,##0');
    expect(estiloNumFmt(styles, n('C6').s)).toBe('#,##0.00');
    expect(n('D6').v).toBe('0.72');
    expect(estiloNumFmt(styles, n('D6').s)).toBe('0%');
    expect(n('D7').v).toBe('1');
    expect(estiloNumFmt(styles, n('G6').s)).toBe('#,##0.0');
    expect(n('H6').v).toBe('4000');
    expect(estiloNumFmt(styles, n('H6').s)).toBe('"$"#,##0');
    expect(n('H7').v).toBe('-500');
  });

  it('fechas como seriales de Excel en hora de Colombia', () => {
    expect(celda(hoja, 'E6')!.v).toBe('46325');
    expect(estiloNumFmt(styles, celda(hoja, 'E6')!.s)).toBe('dd/mm/yyyy');
    // 13:30 UTC = 08:30 en Colombia.
    expect(Number(celda(hoja, 'F6')!.v)).toBeCloseTo(46325 + 8.5 / 24, 9);
    expect(estiloNumFmt(styles, celda(hoja, 'F6')!.s)).toBe('dd/mm/yyyy hh:mm');
    // 31/10 03:00 UTC sigue siendo 30/10 en Colombia.
    expect(celda(hoja, 'E7')!.v).toBe('46325');
    // Texto que no es fecha se queda como texto.
    expect(texto('F7')).toBe('no es fecha');
  });

  it('vacíos, booleanos y nada de fórmulas', () => {
    expect(celda(hoja, 'B7')).toBeNull();
    expect(celda(hoja, 'C7')).toBeNull();
    expect(texto('I6')).toBe('Sí');
    expect(texto('I7')).toBe('No');
    expect(hoja).not.toContain('<f>');
    expect(hoja).not.toContain('<f ');
    for (const [ref, valor] of [['A7', '=SUMA(A1:A2)'], ['A8', '+57 300'], ['B8', '-5'], ['C8', '@arroba']]) {
      expect(texto(ref)).toBe(valor);
      const xf = [...styles.matchAll(/<xf [^>]*\/>/g)].map((m) => m[0]).slice(1)[Number(celda(hoja, ref)!.s)];
      expect(xf).toContain('quotePrefix="1"');
    }
  });

  it('anchos automáticos y notas', () => {
    expect(hoja).toMatch(/<col min="1" max="1" width="\d+(\.\d+)?" customWidth="1"\/>/);
    const ancho = Number(/<col min="1" max="1" width="([\d.]+)"/.exec(hoja)![1]);
    expect(ancho).toBeGreaterThanOrEqual('Ana & <Luis>'.length);
    expect(ancho).toBeLessThanOrEqual(60);
    expect(texto('A10')).toBe('Aciertos: porcentaje de respuestas correctas.');
  });

  it('nombres de hoja únicos', () => {
    expect(partes['xl/workbook.xml']).toContain('<sheet name="Resumen" sheetId="1" r:id="rId1"/>');
    expect(partes['xl/workbook.xml']).toContain('<sheet name="Resumen (2)" sheetId="2" r:id="rId2"/>');
  });
});

describe('utilidades', () => {
  it('serial de fechas (sistema 1900)', () => {
    expect(serialExcel('2026-10-30')).toBe(46325);
    expect(serialExcel(new Date('2026-10-30T05:00:00Z'))).toBe(46325);
    expect(serialExcel('2026-10-30T04:59:59Z')).toBeLessThan(46325);
    expect(serialExcel('1900-01-01')).toBe(1);
    expect(serialExcel('1900-02-28')).toBe(59);
    expect(serialExcel('1900-03-01')).toBe(61);
    expect(serialExcel('1970-01-01')).toBe(25569);
    expect(serialExcel('mañana')).toBeNull();
  });

  it('limpia y desduplica los nombres de hoja', () => {
    expect(nombresHojas(['A/B: [x]*?\\', 'a/b: [x]*?\\', '', "'citado'", 'Un nombre larguísimo que pasa de treinta y un caracteres', 'Un nombre larguísimo que pasa de treinta y un caracteres'])).toEqual([
      'A-B- -x----',
      'a-b- -x---- (2)',
      'Hoja3',
      'citado',
      'Un nombre larguísimo que pasa d',
      'Un nombre larguísimo que pa (2)',
    ]);
    for (const n of nombresHojas(['x'.repeat(40), 'x'.repeat(40), 'x'.repeat(40)])) expect(n.length).toBeLessThanOrEqual(31);
  });

  it('letras de columna', () => {
    expect([0, 25, 26, 701, 702].map(letraColumna)).toEqual(['A', 'Z', 'AA', 'ZZ', 'AAA']);
  });

  it('quita caracteres de control y es determinista', () => {
    const hoja: Hoja = { nombre: 'X', columnas: [{ titulo: 'T' }], filas: [['a\u0001b\u0007c']] };
    const a = crearLibro([hoja], { fecha: FECHA });
    const b = crearLibro([hoja], { fecha: FECHA });
    expect(a).toEqual(b);
    expect(cadenas(abrir(a)['xl/sharedStrings.xml'])).toContain('abc');
  });

  it('libro vacío sigue siendo válido', () => {
    const p = abrir(crearLibro([], { fecha: FECHA }));
    expect(p['xl/worksheets/sheet1.xml']).toContain('<sheetData/>');
    expect(p['xl/workbook.xml']).toContain('<sheet name="Hoja1"');
  });
});

describe('formato por celda', () => {
  it('un valor p en una columna general sale con seis decimales, sin notación científica', () => {
    const libro = crearLibro([{ nombre: 'Resumen', columnas: [{ titulo: 'Indicador' }, { titulo: 'Valor' }], filas: [['p', { valor: 0.0000033574, formato: 'probabilidad' }], ['n', 19]] }], { fecha: new Date('2026-10-30T12:00:00Z') });
    const partes = unzipSync(libro);
    const estilos = strFromU8(partes['xl/styles.xml']);
    expect(estilos).toContain('formatCode="0.000000"');
    const xfs = estilos.match(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/)!;
    expect((xfs[2].match(/<xf /g) ?? []).length).toBe(Number(xfs[1]));
    const hoja = strFromU8(partes['xl/worksheets/sheet1.xml']);
    const celda = hoja.match(/<c r="B2" s="(\d+)"><v>([^<]+)<\/v><\/c>/)!;
    expect(Number(celda[2])).toBeCloseTo(0.0000033574, 12);
    // El estilo apunta al formato 168 (0.000000).
    const lista = [...xfs[2].matchAll(/<xf numFmtId="(\d+)"/g)].map((m) => m[1]);
    expect(lista[Number(celda[1])]).toBe('168');
  });
});
