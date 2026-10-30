// Escritor mínimo de libros de Excel (.xlsx, OOXML) para los informes del profesor.
// Solo depende de fflate para comprimir. Se importa de forma dinámica desde el panel
// (`await import('./excel')`) para que no entre en el paquete de los estudiantes.

import { strToU8, zipSync } from 'fflate';

export type Formato =
  | 'texto'
  | 'entero'
  | 'decimal'
  | 'porcentaje' // valor de 0 a 100; se guarda como valor/100 y se muestra «72 %»
  | 'fecha' // texto ISO, Date o milisegundos → fecha de Excel (hora de Colombia)
  | 'fechaHora'
  | 'minutos' // número de minutos, con un decimal
  | 'pesos'
  | 'probabilidad'; // valores p y similares: seis decimales fijos (0,000003), nunca notación científica
export type Columna = { titulo: string; formato?: Formato; ancho?: number /* caracteres */ };
/** Celda con un formato distinto al de su columna (p. ej., un valor p en una columna de valores variados). */
export type CeldaConFormato = { valor: number | null | undefined; formato: Formato };
export type Celda = string | number | boolean | Date | CeldaConFormato | null | undefined;
export type Hoja = {
  nombre: string; // se ajusta a las reglas de Excel (≤31 caracteres, sin []:*?/\, único)
  titulo?: string; // título grande en la fila 1, luego `subtitulo`, una fila vacía y la tabla
  subtitulo?: string[]; // p. ej. filtros aplicados, fecha de generación
  columnas: Columna[];
  filas: Celda[][];
  notas?: string[]; // líneas después de la tabla (definiciones de las métricas)
  congelar?: boolean; // por defecto true: inmoviliza las filas hasta el encabezado
  filtro?: boolean; // por defecto true: autofiltro en el encabezado
};
export type MetaLibro = { titulo?: string; autor?: string; fecha?: Date };

export const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ---------- Estilos (índices de cellXfs en styles.xml) ----------

const E = {
  normal: 0,
  titulo: 1,
  encabezado: 2,
  texto: 3, // texto con quotePrefix: nunca se interpreta como fórmula al editarlo
  entero: 4,
  decimal: 5,
  porcentaje: 6,
  fecha: 7,
  fechaHora: 8,
  minutos: 9,
  pesos: 10,
  subtitulo: 11,
  nota: 12,
  probabilidad: 13,
} as const;

const ESTILO_FORMATO: Record<Formato, number> = {
  texto: E.normal,
  entero: E.entero,
  decimal: E.decimal,
  porcentaje: E.porcentaje,
  fecha: E.fecha,
  fechaHora: E.fechaHora,
  minutos: E.minutos,
  pesos: E.pesos,
  probabilidad: E.probabilidad,
};

const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="5">' +
  '<numFmt numFmtId="164" formatCode="dd/mm/yyyy"/>' +
  '<numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/>' +
  '<numFmt numFmtId="166" formatCode="#,##0.0"/>' +
  '<numFmt numFmtId="167" formatCode="&quot;$&quot;#,##0"/>' +
  '<numFmt numFmtId="168" formatCode="0.000000"/>' +
  '</numFmts>' +
  '<fonts count="4">' +
  '<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
  '<font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
  '<font><b/><sz val="14"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
  '<font><i/><sz val="10"/><color rgb="FF595959"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
  '</fonts>' +
  '<fills count="3">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFE2EFDA"/><bgColor indexed="64"/></patternFill></fill>' +
  '</fills>' +
  '<borders count="2">' +
  '<border><left/><right/><top/><bottom/><diagonal/></border>' +
  '<border><left/><right/><top/><bottom style="thin"><color auto="1"/></bottom><diagonal/></border>' +
  '</borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="14">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" quotePrefix="1"/>' +
  '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="168" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '<dxfs count="0"/><tableStyles count="0"/>' +
  '</styleSheet>';

// ---------- Utilidades ----------

const CABECERA_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAX_TEXTO_CELDA = 32767;
const MS_DIA = 86_400_000;
const DESFASE_COLOMBIA_MS = -5 * 3_600_000; // UTC−5, sin horario de verano
const SERIAL_EPOCA_UNIX = 25569; // 1970-01-01 en el sistema 1900 de Excel

/** Quita los caracteres que XML 1.0 no admite (controles y sustitutos sueltos). */
function limpiar(s: string): string {
  return s.replace(
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    '',
  );
}

export function escaparXml(s: string): string {
  return limpiar(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Letras de la columna (0 → A, 26 → AA). */
export function letraColumna(i: number): string {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Serial de Excel (sistema 1900) para una fecha civil y hora, sin zona. */
function serialCivil(anio: number, mes: number, dia: number, h = 0, min = 0, seg = 0): number {
  const ms = Date.UTC(anio, mes - 1, dia, h, min, seg);
  let serial = ms / MS_DIA + SERIAL_EPOCA_UNIX;
  // Error heredado de Lotus: Excel cree que 1900 fue bisiesto (existe el «29/02/1900», serial 60).
  // Antes del 01/03/1900 los seriales van un día atrás.
  if (serial < 61) serial -= 1;
  return serial;
}

/** Serial de Excel de un instante, expresado en la hora de Colombia. */
function serialInstante(ms: number): number {
  const d = new Date(ms + DESFASE_COLOMBIA_MS);
  return serialCivil(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
  );
}

const RE_ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Convierte una fecha a serial de Excel. Acepta Date, milisegundos o texto ISO.
 * «2026-10-30» se toma como fecha civil; un instante con zona («…Z», «…-05:00») o un Date
 * se pasa a la hora de Colombia; «2026-10-30T08:15» sin zona se toma como hora local.
 * Devuelve null si no se puede interpretar.
 */
export function serialExcel(valor: Date | string | number): number | null {
  if (valor instanceof Date) {
    const ms = valor.getTime();
    return Number.isFinite(ms) ? serialInstante(ms) : null;
  }
  if (typeof valor === 'number') return Number.isFinite(valor) ? serialInstante(valor) : null;
  const m = RE_ISO.exec(valor.trim());
  if (!m) return null;
  const [, a, mes, d, h, mi, s, zona] = m;
  if (zona) {
    const ms = Date.parse(valor.trim().replace(' ', 'T'));
    return Number.isFinite(ms) ? serialInstante(ms) : null;
  }
  const serial = serialCivil(+a, +mes, +d, h ? +h : 0, mi ? +mi : 0, s ? +s : 0);
  return Number.isFinite(serial) ? serial : null;
}

/** Nombres de hoja válidos y únicos (sin distinguir mayúsculas). */
export function nombresHojas(nombres: string[]): string[] {
  const usados = new Set<string>();
  return nombres.map((original, i) => {
    let base = limpiar(original)
      .replace(/[[\]:*?/\\]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^'+|'+$/g, '')
      .trim();
    if (!base) base = `Hoja${i + 1}`;
    if (base.toLowerCase() === 'history') base = 'History-';
    base = Array.from(base).slice(0, 31).join('');
    let nombre = base;
    for (let k = 2; usados.has(nombre.toLowerCase()); k++) {
      const sufijo = ` (${k})`;
      nombre = Array.from(base).slice(0, 31 - sufijo.length).join('').trimEnd() + sufijo;
    }
    usados.add(nombre.toLowerCase());
    return nombre;
  });
}

function refHoja(nombre: string): string {
  return `'${nombre.replace(/'/g, "''")}'`;
}

function pareceFormula(s: string): boolean {
  return /^[=+\-@\t\r]/.test(s);
}

// ---------- Cadenas compartidas ----------

class Cadenas {
  private indice = new Map<string, number>();
  private lista: string[] = [];
  total = 0;
  id(s: string): number {
    this.total++;
    let i = this.indice.get(s);
    if (i === undefined) {
      i = this.lista.length;
      this.lista.push(s);
      this.indice.set(s, i);
    }
    return i;
  }
  xml(): string {
    const items = this.lista
      .map((s) => {
        const t = escaparXml(s);
        const preservar = /^\s|\s$|\n/.test(t) ? ' xml:space="preserve"' : '';
        return `<si><t${preservar}>${t}</t></si>`;
      })
      .join('');
    return (
      CABECERA_XML +
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.total}" uniqueCount="${this.lista.length}">` +
      items +
      '</sst>'
    );
  }
}

// ---------- Hojas ----------

type CeldaXml = { xml: string; largo: number };

function textoCelda(ref: string, s: string, cadenas: Cadenas, estilo: number): CeldaXml {
  const limpio = limpiar(s).slice(0, MAX_TEXTO_CELDA);
  const st = pareceFormula(limpio) ? E.texto : estilo;
  const largo = Math.max(0, ...limpio.split('\n').map((l) => l.length));
  return { xml: `<c r="${ref}"${st ? ` s="${st}"` : ''} t="s"><v>${cadenas.id(limpio)}</v></c>`, largo };
}

function numeroCelda(ref: string, n: number, estilo: number, largo: number): CeldaXml {
  return { xml: `<c r="${ref}"${estilo ? ` s="${estilo}"` : ''}><v>${n}</v></c>`, largo };
}

function digitosConMiles(n: number): number {
  const ent = String(Math.trunc(Math.abs(n))).length;
  return ent + Math.floor((ent - 1) / 3) + (n < 0 ? 1 : 0);
}

function celdaXml(ref: string, valor: Celda, formato: Formato, cadenas: Cadenas): CeldaXml | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'object' && !(valor instanceof Date)) return celdaXml(ref, valor.valor, valor.formato, cadenas);
  if (typeof valor === 'boolean') return textoCelda(ref, valor ? 'Sí' : 'No', cadenas, E.normal);

  const esFecha = formato === 'fecha' || formato === 'fechaHora';
  if (valor instanceof Date || (esFecha && (typeof valor === 'string' || typeof valor === 'number'))) {
    let serial = serialExcel(valor);
    if (serial === null) {
      return typeof valor === 'string' ? textoCelda(ref, valor, cadenas, E.normal) : null;
    }
    let fmt: Formato = esFecha ? formato : serial % 1 === 0 ? 'fecha' : 'fechaHora';
    if (fmt === 'fecha') serial = Math.floor(serial);
    // Redondeo al segundo para evitar decimales espurios.
    else serial = Math.round(serial * 86400) / 86400;
    return numeroCelda(ref, serial, ESTILO_FORMATO[fmt], fmt === 'fecha' ? 10 : 16);
  }

  if (typeof valor === 'string') return textoCelda(ref, valor, cadenas, E.normal);

  if (!Number.isFinite(valor)) return null;
  switch (formato) {
    case 'porcentaje':
      return numeroCelda(ref, Number((valor / 100).toPrecision(15)), E.porcentaje, digitosConMiles(valor) + 2);
    case 'entero':
      return numeroCelda(ref, valor, E.entero, digitosConMiles(valor));
    case 'decimal':
      return numeroCelda(ref, valor, E.decimal, digitosConMiles(valor) + 3);
    case 'minutos':
      return numeroCelda(ref, valor, E.minutos, digitosConMiles(valor) + 2);
    case 'pesos':
      return numeroCelda(ref, valor, E.pesos, digitosConMiles(valor) + 1);
    case 'probabilidad':
      return numeroCelda(ref, valor, E.probabilidad, 8);
    default:
      return numeroCelda(ref, valor, E.normal, String(valor).length);
  }
}

type HojaXml = { xml: string; filtro: string | null; encabezado: number | null };

function hojaXml(hoja: Hoja, indice: number, cadenas: Cadenas): HojaXml {
  const cols = hoja.columnas;
  const ncol = cols.length;
  const filas: string[] = [];
  let r = 0;
  let maxCol = 0;
  const largos = cols.map((c) => limpiar(c.titulo).length + 1);

  const filaTexto = (texto: string, estilo: number, alto?: number) => {
    r++;
    const c = textoCelda(`A${r}`, texto, cadenas, estilo);
    // El quotePrefix nunca debe quitar el formato del título o las notas.
    const xml = c.xml.replace(/ s="\d+"/, ` s="${estilo}"`);
    const ht = alto ? ` ht="${alto}" customHeight="1"` : '';
    filas.push(`<row r="${r}"${ht}>${xml}</row>`);
    maxCol = Math.max(maxCol, 1);
  };

  if (hoja.titulo) filaTexto(hoja.titulo, E.titulo, 21);
  for (const s of hoja.subtitulo ?? []) filaTexto(s, E.subtitulo);
  if (hoja.titulo || hoja.subtitulo?.length) r++; // fila vacía

  let encabezado: number | null = null;
  let filtro: string | null = null;
  if (ncol > 0) {
    r++;
    encabezado = r;
    const celdas = cols.map((c, j) => textoCelda(`${letraColumna(j)}${r}`, c.titulo, cadenas, E.encabezado).xml);
    // El encabezado siempre lleva su estilo, aunque empiece por «-» o «=».
    filas.push(`<row r="${r}">${celdas.map((x) => x.replace(/ s="\d+"/, ` s="${E.encabezado}"`)).join('')}</row>`);
    maxCol = Math.max(maxCol, ncol);

    for (const fila of hoja.filas) {
      r++;
      const partes: string[] = [];
      fila.forEach((valor, j) => {
        const formato = cols[j]?.formato ?? 'texto';
        const c = celdaXml(`${letraColumna(j)}${r}`, valor, formato, cadenas);
        if (!c) return;
        partes.push(c.xml);
        if (j < ncol) largos[j] = Math.max(largos[j], c.largo);
        maxCol = Math.max(maxCol, j + 1);
      });
      filas.push(partes.length ? `<row r="${r}">${partes.join('')}</row>` : `<row r="${r}"/>`);
    }
    const ultima = Math.max(r, encabezado);
    filtro = `$A$${encabezado}:$${letraColumna(ncol - 1)}$${ultima}`;
  }

  if (hoja.notas?.length) {
    r++; // fila vacía
    for (const n of hoja.notas) filaTexto(n, E.nota);
  }

  const dimension = r > 0 && maxCol > 0 ? `A1:${letraColumna(maxCol - 1)}${r}` : 'A1';
  const congelar = (hoja.congelar ?? true) && encabezado !== null;
  const conFiltro = (hoja.filtro ?? true) && filtro !== null;

  const vista = congelar
    ? `<sheetView${indice === 0 ? ' tabSelected="1"' : ''} workbookViewId="0">` +
      `<pane ySplit="${encabezado}" topLeftCell="A${encabezado! + 1}" activePane="bottomLeft" state="frozen"/>` +
      `<selection pane="bottomLeft" activeCell="A${encabezado! + 1}" sqref="A${encabezado! + 1}"/>` +
      '</sheetView>'
    : `<sheetView${indice === 0 ? ' tabSelected="1"' : ''} workbookViewId="0"/>`;

  const anchos = cols
    .map((c, j) => {
      const ancho = c.ancho ?? Math.min(60, Math.max(8, largos[j] + 2));
      return `<col min="${j + 1}" max="${j + 1}" width="${Math.round(ancho * 100) / 100}" customWidth="1"/>`;
    })
    .join('');

  const xml =
    CABECERA_XML +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    `<dimension ref="${dimension}"/>` +
    `<sheetViews>${vista}</sheetViews>` +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    (anchos ? `<cols>${anchos}</cols>` : '') +
    (filas.length ? `<sheetData>${filas.join('')}</sheetData>` : '<sheetData/>') +
    (conFiltro ? `<autoFilter ref="${filtro!.replace(/\$/g, '')}"/>` : '') +
    '<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>' +
    '<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>' +
    '</worksheet>';

  return { xml, filtro: conFiltro ? filtro : null, encabezado };
}

// ---------- Libro ----------

function fechaW3c(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Arma el libro completo y lo devuelve comprimido (.xlsx). */
export function crearLibro(hojas: Hoja[], meta: MetaLibro = {}): Uint8Array {
  const lista: Hoja[] = hojas.length ? hojas : [{ nombre: 'Hoja1', columnas: [], filas: [] }];
  const nombres = nombresHojas(lista.map((h) => h.nombre));
  const cadenas = new Cadenas();
  const fecha = meta.fecha ?? new Date();

  const archivos: Record<string, string> = {};
  const nombresDefinidos: string[] = [];

  lista.forEach((h, i) => {
    const res = hojaXml(h, i, cadenas);
    archivos[`xl/worksheets/sheet${i + 1}.xml`] = res.xml;
    if (res.filtro) {
      nombresDefinidos.push(
        `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${escaparXml(refHoja(nombres[i]))}!${res.filtro}</definedName>`,
      );
    }
    if (res.encabezado !== null) {
      nombresDefinidos.push(
        `<definedName name="_xlnm.Print_Titles" localSheetId="${i}">${escaparXml(refHoja(nombres[i]))}!$${res.encabezado}:$${res.encabezado}</definedName>`,
      );
    }
  });

  archivos['[Content_Types].xml'] =
    CABECERA_XML +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    lista
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
    '</Types>';

  archivos['_rels/.rels'] =
    CABECERA_XML +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
    '</Relationships>';

  const w3c = fechaW3c(fecha);
  archivos['docProps/core.xml'] =
    CABECERA_XML +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
    'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
    'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    (meta.titulo ? `<dc:title>${escaparXml(meta.titulo)}</dc:title>` : '') +
    (meta.autor ? `<dc:creator>${escaparXml(meta.autor)}</dc:creator><cp:lastModifiedBy>${escaparXml(meta.autor)}</cp:lastModifiedBy>` : '') +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${w3c}</dcterms:created>` +
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${w3c}</dcterms:modified>` +
    '</cp:coreProperties>';

  archivos['docProps/app.xml'] =
    CABECERA_XML +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ' +
    'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
    '<Application>La Finca Matemática</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop>' +
    '<HeadingPairs><vt:vector size="2" baseType="variant">' +
    `<vt:variant><vt:lpstr>Hojas de cálculo</vt:lpstr></vt:variant><vt:variant><vt:i4>${lista.length}</vt:i4></vt:variant>` +
    '</vt:vector></HeadingPairs>' +
    `<TitlesOfParts><vt:vector size="${lista.length}" baseType="lpstr">` +
    nombres.map((n) => `<vt:lpstr>${escaparXml(n)}</vt:lpstr>`).join('') +
    '</vt:vector></TitlesOfParts>' +
    '<LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0300</AppVersion>' +
    '</Properties>';

  archivos['xl/workbook.xml'] =
    CABECERA_XML +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<workbookPr defaultThemeVersion="164011"/>' +
    '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="16000" windowHeight="9000" activeTab="0"/></bookViews>' +
    '<sheets>' +
    nombres.map((n, i) => `<sheet name="${escaparXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
    '</sheets>' +
    (nombresDefinidos.length ? `<definedNames>${nombresDefinidos.join('')}</definedNames>` : '') +
    '<calcPr calcId="191029"/>' +
    '</workbook>';

  archivos['xl/_rels/workbook.xml.rels'] =
    CABECERA_XML +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    lista
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join('') +
    `<Relationship Id="rId${lista.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `<Relationship Id="rId${lista.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>` +
    '</Relationships>';

  archivos['xl/styles.xml'] = STYLES_XML;
  archivos['xl/sharedStrings.xml'] = cadenas.xml();

  // Orden fijo de las partes (el tipo de contenido primero) y fecha fija: salida determinista.
  const orden = [
    '[Content_Types].xml',
    '_rels/.rels',
    'docProps/core.xml',
    'docProps/app.xml',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/styles.xml',
    'xl/sharedStrings.xml',
    ...lista.map((_, i) => `xl/worksheets/sheet${i + 1}.xml`),
  ];
  const zip: Record<string, [Uint8Array, { mtime: Date }]> = {};
  for (const ruta of orden) zip[ruta] = [strToU8(archivos[ruta]), { mtime: fecha }];
  return zipSync(zip, { level: 6 });
}

/** Arma el libro y lo descarga en el navegador. */
export function descargarLibro(nombreArchivo: string, hojas: Hoja[], meta?: MetaLibro): void {
  // `descargar` de ./descargas recibe texto (CSV); aquí el contenido es binario.
  const datos = crearLibro(hojas, meta);
  const nombre = /\.xlsx$/i.test(nombreArchivo) ? nombreArchivo : `${nombreArchivo}.xlsx`;
  const blob = new Blob([datos as Uint8Array<ArrayBuffer>], { type: MIME_XLSX });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
