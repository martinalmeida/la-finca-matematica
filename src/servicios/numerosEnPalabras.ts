// Números escritos en palabras para la lectura en voz alta, sin paquetes ni servicios externos.
// La voz del sistema no sabe que en Colombia «4.000» es cuatro mil (lo leía «cuatro coma cero cero
// cero»), así que el texto le llega ya en palabras: «cuatro mil», «doce coma cinco», «$1.500» →
// «mil quinientos pesos». También concuerda con lo que se cuenta: «doscientas mazorcas», «veintiún kilos».

type Uno = 'uno' | 'un' | 'una';

const HASTA_29 = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

/** 1 a 999. `uno` dice cómo termina: «veintiuno» solo, «veintiún kilos», «veintiuna mazorcas». */
function hasta999(n: number, uno: Uno): string {
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const r = n % 100;
  let centena = CENTENAS[c];
  if (uno === 'una' && c > 1) centena = centena.replace(/os$/, 'as');
  let resto = '';
  if (r > 0) {
    const u = r % 10;
    resto = r < 30 ? HASTA_29[r] : DECENAS[Math.floor(r / 10)] + (u ? ' y ' + HASTA_29[u] : '');
    if (u === 1 && r !== 11) resto = resto.replace(/uno$/, uno).replace(/^veintiun$/, 'veintiún');
  }
  return [centena, resto].filter(Boolean).join(' ');
}

/** Entero en palabras: 4000 → «cuatro mil»; 1800000 → «un millón ochocientos mil». */
export function enteroEnPalabras(n: number, uno: Uno = 'uno'): string {
  if (!Number.isSafeInteger(n) || n < 0 || n >= 1e12) return String(n);
  if (n === 0) return 'cero';
  const millones = Math.floor(n / 1e6);
  const miles = Math.floor(n / 1e3) % 1000;
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones) partes.push(millones === 1 ? 'un millón' : enteroEnPalabras(millones, 'un') + ' millones');
  if (miles) partes.push(miles === 1 ? 'mil' : hasta999(miles, uno === 'una' ? 'una' : 'un') + ' mil');
  if (resto) partes.push(hasta999(resto, uno));
  return partes.join(' ');
}

/**
 * Cantidad escrita como en Colombia («4.000», «12,5», «0,05») en palabras.
 * La coma solo se nombra si el número de verdad tiene decimales.
 */
export function cantidadEnPalabras(escrito: string, uno: Uno = 'uno'): string {
  const [ent, dec] = escrito.split(',');
  const entero = Number(ent.replace(/\./g, ''));
  if (dec === undefined) return enteroEnPalabras(entero, uno);
  const ceros = dec.match(/^0*/)![0].length;
  const despues = dec.slice(ceros);
  const decimales = [...Array(ceros).fill('cero'), ...(despues ? [enteroEnPalabras(Number(despues))] : [])];
  return `${enteroEnPalabras(entero)} coma ${decimales.join(' ')}`;
}

// --- Qué viene después del número: ¿un sustantivo? ¿femenino? ---

/** Palabras que no son lo contado: «1 y 2», «1 más», «21 es»… Con ellas se dice «uno». */
const NO_CONTADO = new Set(
  (
    'y o u e ni a al de del en con sin por para entre hacia hasta desde que si no como cuando pero porque ' +
    'el la los las lo le les se su sus es son era eran fue será está están estaba hay da dan va van queda quedan ' +
    'sobra sobran cabe caben sale salen tiene tienen más menos igual también ya solo cada así entonces'
  ).split(' '),
);

const MASCULINOS_EN_A = new Set(['día', 'días', 'mapa', 'mapas', 'problema', 'problemas', 'tema', 'temas', 'planeta', 'planetas', 'sistema', 'sistemas', 'programa', 'programas', 'papá', 'papás', 'sofá', 'sofás']);
const FEMENINOS_SIN_A = new Set(['vez', 'veces', 'flor', 'flores', 'leche', 'llave', 'llaves', 'parte', 'partes', 'noche', 'noches', 'tarde', 'tardes', 'clase', 'clases', 'res', 'reses', 'mano', 'manos', 'mitad', 'mitades', 'nube', 'nubes', 'calle', 'calles', 'gente', 'fuente', 'fuentes']);
const MASCULINOS_EN_ION = new Set(['camión', 'camiones', 'avión', 'aviones']);

function esFemenino(palabra: string): boolean {
  const p = palabra.toLowerCase();
  if (MASCULINOS_EN_A.has(p) || MASCULINOS_EN_ION.has(p)) return false;
  return FEMENINOS_SIN_A.has(p) || /(a|as|ión|iones|dad|dades|tad|tades)$/.test(p);
}

/** Cómo decir el «1» final según la palabra que sigue al número. */
function unoAntesDe(siguiente: string | undefined): Uno {
  if (!siguiente) return 'uno';
  const p = siguiente.toLowerCase();
  // Verbos en pasado o gerundio («1 llegó», «21 quedando») no son lo contado.
  if (NO_CONTADO.has(p) || /(ó|aron|ieron|ando|iendo)$/.test(p)) return 'uno';
  return esFemenino(p) ? 'una' : 'un';
}

const PALABRA_SIGUIENTE = /^\s+([a-záéíóúüñ]+)/i;
/** Número en formato colombiano: 4.000 / 1.800.000 / 12,5 / 7 (no toma el punto final de una frase). */
const CANTIDAD = String.raw`\d{1,3}(?:\.\d{3})+(?!\d)(?:,\d+)?|\d+(?:,\d+)?`;

const ORDINALES = ['', 'primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo'];
const PARTES: Record<number, string> = { 2: 'medio', 3: 'tercio', 4: 'cuarto', 5: 'quinto', 6: 'sexto', 7: 'séptimo', 8: 'octavo', 9: 'noveno', 10: 'décimo', 100: 'centésimo', 1000: 'milésimo' };

function fraccion(a: number, b: number): string {
  let parte = PARTES[b] ?? enteroEnPalabras(b).replace(/o$/, '') + 'avo';
  if (a !== 1) parte += 's';
  return `${enteroEnPalabras(a, 'un')} ${parte}`;
}

/** Cambia cifras y signos por palabras para que cualquier voz en español los lea bien. */
export function textoParaVoz(texto: string): string {
  return (
    texto
      .replace(/[«»"]/g, '')
      // Signos de las cuentas y de las pistas.
      .replace(/\s*[−–]\s*/g, ' menos ')
      .replace(/(\d)\s+-\s+(?=\d)/g, '$1 menos ')
      .replace(/\s*\+\s*/g, ' más ')
      .replace(/\s*×\s*/g, ' por ')
      .replace(/\s*÷\s*/g, ' entre ')
      .replace(/\s*≈\s*/g, ' es más o menos ')
      .replace(/\s*≥\s*/g, ' es mayor o igual que ')
      .replace(/\s*≤\s*/g, ' es menor o igual que ')
      .replace(/\s*>\s*/g, ' es mayor que ')
      .replace(/\s*<\s*/g, ' es menor que ')
      .replace(/\s*=\s*/g, ' es igual a ')
      .replace(/☐/g, 'el cuadro')
      .replace(/_{2,}/g, '…')
      .replace(/\s*[→←|·]\s*/g, ', ')
      .replace(/[─―]+/g, ' ')
      .replace(/\b(k|c)?m²/g, (_, p?: string) => (p === 'k' ? 'kilómetros' : p === 'c' ? 'centímetros' : 'metros') + ' cuadrados')
      .replace(/²/g, ' al cuadrado')
      // 1.º grado, 3.ª vez
      .replace(/\b(10|[1-9])\.?([ºª])/g, (m: string, n: string, o: string, i: number, s: string) => {
        let w = ORDINALES[Number(n)];
        if (o === 'ª') return w.replace(/o$/, 'a');
        const sig = PALABRA_SIGUIENTE.exec(s.slice(i + m.length))?.[1];
        if (sig && unoAntesDe(sig) === 'un') w = w.replace(/^(primer|tercer)o$/, '$1');
        return w;
      })
      // 3/4 → tres cuartos
      .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (_, a: string, b: string) => fraccion(Number(a), Number(b)))
      // $1.500 → mil quinientos pesos; $2.000.000 → dos millones de pesos
      .replace(new RegExp(String.raw`\$\s?(${CANTIDAD})`, 'g'), (_, c: string) => {
        const n = Number(c.replace(/\./g, '').replace(',', '.'));
        const de = n >= 1e6 && n % 1e6 === 0 ? 'de ' : '';
        return `${cantidadEnPalabras(c, 'un')} ${de}${n === 1 ? 'peso' : 'pesos'}`;
      })
      .replace(new RegExp(String.raw`(${CANTIDAD})\s*%`, 'g'), (_, c: string) => `${cantidadEnPalabras(c)} por ciento`)
      // Los demás números, concordando con lo que se cuenta.
      .replace(new RegExp(String.raw`(?<!\d)(${CANTIDAD})`, 'g'), (c: string, _c: string, i: number, s: string) => {
        const sig = PALABRA_SIGUIENTE.exec(s.slice(i + c.length))?.[1];
        const uno = c.includes(',') ? 'uno' : unoAntesDe(sig);
        const n = Number(c.replace(/\./g, ''));
        const de = !c.includes(',') && n >= 1e6 && n % 1e6 === 0 && uno !== 'uno' ? ' de' : '';
        return cantidadEnPalabras(c, uno) + de;
      })
      .replace(/\$/g, '')
      .replace(/\s+([,.;:?!…])/g, '$1')
      .replace(/,…/g, '…')
      .replace(/…\./g, '…')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
