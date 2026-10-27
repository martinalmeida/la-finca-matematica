// Genera el ícono de La Finca Matemática en todos los formatos a partir de un único diseño en SVG:
// - public/iconos: PWA (192/512 normal, maskable y monocromo), iOS (180) y favicon (SVG y 32 px).
// - docs/marca: piezas para tiendas y material de difusión (1024, 512 de Play y gráfico destacado).
// Uso: npm run iconos (necesita @resvg/resvg-js, solo en desarrollo).
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirIconos = join(raiz, 'public', 'iconos');
const dirMarca = join(raiz, 'docs', 'marca');
mkdirSync(dirIconos, { recursive: true });
mkdirSync(dirMarca, { recursive: true });

// Paleta de marca.
const C = {
  fondo: ['#5fd16d', '#22943f', '#0c5a2b'],
  sol: '#fff1b8',
  mazorca: ['#ffd65c', '#f9a126', '#e8621c', '#9a2c10'],
  surco: '#a63d12',
  luzSurco: '#ffe7ad',
  tallo: ['#9a6634', '#5b3415'],
  hoja: ['#b4ec6a', '#45b649', '#1f7a37'],
  insignia: ['#ffffff', '#fff1d6'],
  mas: '#1d8a3c',
};

/** Mazorca de cacao con hoja, centrada en (0, 0), de unos 300 px de alto. */
function mazorca(id) {
  const contorno = 'M0,-150 C70,-150 106,-86 106,-6 C106,74 58,128 0,158 C-58,128 -106,74 -106,-6 C-106,-86 -70,-150 0,-150 Z';
  const surco = (a) => `M0,-146 C${a * 70},-146 ${a * 106},-86 ${a * 106},-6 C${a * 106},74 ${a * 58},126 0,154`;
  const surcos = [-0.8, -0.52, -0.24, 0.24, 0.52, 0.8];
  return `
  <g filter="url(#${id}-sombra)">
    <path d="M-6,-146 C-8,-160 -6,-174 2,-186" stroke="url(#${id}-tallo)" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M2,-184 C34,-226 104,-226 136,-196 C102,-162 40,-158 2,-184 Z" fill="url(#${id}-hoja)"/>
    <path d="M8,-184 C46,-196 92,-200 128,-196" stroke="#1a6a2f" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="${contorno}" fill="url(#${id}-mazorca)"/>
    <g clip-path="url(#${id}-recorte)">
      ${surcos.map((a) => `<path d="${surco(a)}" stroke="${C.surco}" stroke-opacity=".55" stroke-width="7" fill="none"/>`).join('')}
      ${surcos.map((a) => `<path d="${surco(a)}" transform="translate(-7 0)" stroke="${C.luzSurco}" stroke-opacity=".55" stroke-width="3" fill="none"/>`).join('')}
      <path d="M0,-146 L0,154" stroke="${C.surco}" stroke-opacity=".3" stroke-width="5"/>
      <rect x="-100" y="-160" width="200" height="330" fill="url(#${id}-volumen)"/>
      <ellipse cx="-46" cy="-62" rx="17" ry="56" transform="rotate(12 -46 -62)" fill="#fff" fill-opacity=".6" filter="url(#${id}-suave)"/>
    </g>
  </g>`;
}

function definiciones(id) {
  return `
  <defs>
    <linearGradient id="${id}-fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.fondo[0]}"/><stop offset=".55" stop-color="${C.fondo[1]}"/><stop offset="1" stop-color="${C.fondo[2]}"/>
    </linearGradient>
    <radialGradient id="${id}-sol" cx=".8" cy=".16" r=".6">
      <stop offset="0" stop-color="${C.sol}" stop-opacity=".95"/><stop offset=".35" stop-color="#ffd86b" stop-opacity=".35"/><stop offset="1" stop-color="#ffd86b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-mazorca" x1=".1" y1="0" x2=".9" y2="1">
      <stop offset="0" stop-color="${C.mazorca[0]}"/><stop offset=".32" stop-color="${C.mazorca[1]}"/><stop offset=".7" stop-color="${C.mazorca[2]}"/><stop offset="1" stop-color="${C.mazorca[3]}"/>
    </linearGradient>
    <linearGradient id="${id}-volumen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a1d05" stop-opacity=".38"/>
    </linearGradient>
    <linearGradient id="${id}-tallo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.tallo[0]}"/><stop offset="1" stop-color="${C.tallo[1]}"/>
    </linearGradient>
    <linearGradient id="${id}-hoja" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.hoja[0]}"/><stop offset=".5" stop-color="${C.hoja[1]}"/><stop offset="1" stop-color="${C.hoja[2]}"/>
    </linearGradient>
    <linearGradient id="${id}-insignia" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.insignia[0]}"/><stop offset="1" stop-color="${C.insignia[1]}"/>
    </linearGradient>
    <clipPath id="${id}-recorte">
      <path d="M0,-150 C70,-150 106,-86 106,-6 C106,74 58,128 0,158 C-58,128 -106,74 -106,-6 C-106,-86 -70,-150 0,-150 Z"/>
    </clipPath>
    <filter id="${id}-sombra" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
      <feOffset dx="6" dy="16" result="d"/>
      <feFlood flood-color="#053519" flood-opacity=".5"/>
      <feComposite in2="d" operator="in"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id}-suave" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>`;
}

/** Composición completa en 512 × 512. escala < 1 deja margen (zona segura de los íconos adaptables). */
function icono({ esquinas = 0, escala = 1, id = 'f' } = {}) {
  const forma = esquinas ? `<rect width="512" height="512" rx="${esquinas}"/>` : '<rect width="512" height="512"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${definiciones(id)}
  <clipPath id="${id}-marco">${forma}</clipPath>
  <g clip-path="url(#${id}-marco)">
    <rect width="512" height="512" fill="url(#${id}-fondo)"/>
    <rect width="512" height="512" fill="url(#${id}-sol)"/>
    <path d="M-20 430 C80 380 170 392 260 420 C350 448 430 420 540 380 V540 H-20 Z" fill="#9be36f" fill-opacity=".22"/>
    <path d="M-20 470 C110 430 220 450 300 470 C390 492 460 470 540 450 V540 H-20 Z" fill="#073f1e" fill-opacity=".28"/>
    <g transform="translate(256 256) scale(${escala}) translate(-256 -256)">
      <g transform="translate(236 276) rotate(-18)">${mazorca(id)}</g>
      <g filter="url(#${id}-sombra)">
        <circle cx="384" cy="384" r="66" fill="url(#${id}-insignia)"/>
        <circle cx="384" cy="384" r="66" fill="none" stroke="#fff" stroke-width="5"/>
        <path d="M384 352 V416 M352 384 H416" stroke="${C.mas}" stroke-width="22" stroke-linecap="round"/>
      </g>
    </g>
    <rect width="512" height="512" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="${esquinas ? 6 : 0}" rx="${esquinas}"/>
  </g>
</svg>`;
}

/** Silueta en un solo color para los íconos temáticos de Android 13+. */
function monocromo() {
  const contorno = 'M0,-150 C70,-150 106,-86 106,-6 C106,74 58,128 0,158 C-58,128 -106,74 -106,-6 C-106,-86 -70,-150 0,-150 Z';
  const pod = 'translate(236 276) rotate(-18)';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <mask id="m">
    <rect width="512" height="512" fill="#fff"/>
    <path d="M384 352 V416 M352 384 H416" stroke="#000" stroke-width="22" stroke-linecap="round"/>
    <g transform="${pod}" stroke="#000" stroke-width="8" fill="none">
      <path d="M0,-140 C-40,-140 -64,-86 -64,-6 C-64,74 -36,122 0,148"/>
      <path d="M0,-140 C40,-140 64,-86 64,-6 C64,74 36,122 0,148"/>
    </g>
  </mask>
  <mask id="m2">
    <rect width="512" height="512" fill="#fff"/>
    <circle cx="384" cy="384" r="80" fill="#000"/>
  </mask>
  <g transform="translate(256 256) scale(.72) translate(-256 -256)" fill="#fff">
    <g mask="url(#m2)"><g mask="url(#m)">
      <g transform="${pod}">
        <path d="M-6,-146 C-8,-160 -6,-174 2,-186" stroke="#fff" stroke-width="16" stroke-linecap="round" fill="none"/>
        <path d="M2,-184 C34,-226 104,-226 136,-196 C102,-162 40,-158 2,-184 Z"/>
        <path d="${contorno}"/>
      </g>
    </g></g>
    <g mask="url(#m)"><circle cx="384" cy="384" r="66"/></g>
  </g>
</svg>`;
}

/** Gráfico destacado de Google Play (1024 × 500). */
function destacado() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
  ${definiciones('d')}
  <rect width="1024" height="500" fill="url(#d-fondo)"/>
  <rect width="1024" height="500" fill="url(#d-sol)"/>
  <path d="M0 420 C160 370 330 390 520 420 C700 450 860 410 1024 380 V500 H0 Z" fill="#9be36f" fill-opacity=".22"/>
  <path d="M0 460 C200 430 400 450 600 470 C780 488 900 470 1024 450 V500 H0 Z" fill="#073f1e" fill-opacity=".28"/>
  <g transform="translate(70 70) scale(.7)">
    <rect width="512" height="512" rx="115" fill="#000" fill-opacity=".18" transform="translate(8 14)"/>
  </g>
  <image href="data:image/svg+xml;base64,${Buffer.from(icono({ esquinas: 115, id: 'i' })).toString('base64')}" x="70" y="70" width="358" height="358"/>
  <g font-family="Liberation Sans, Nimbus Sans, Arial, sans-serif" fill="#fff">
    <text x="480" y="210" font-size="62" font-weight="700">La Finca</text>
    <text x="480" y="285" font-size="62" font-weight="700">Matemática</text>
    <text x="482" y="340" font-size="26" font-weight="500" fill-opacity=".9">Suma, resta, multiplica y divide</text>
    <text x="482" y="378" font-size="26" font-weight="500" fill-opacity=".9">con la vida del campo · sin internet</text>
  </g>
</svg>`;
}

function png(svg, ancho, archivo) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: ancho }, font: { loadSystemFonts: true } });
  writeFileSync(archivo, r.render().asPng());
}

// PWA
const normal = icono({ esquinas: 115 });
const adaptable = icono({ escala: 0.8 });
for (const tam of [192, 512]) {
  png(normal, tam, join(dirIconos, `icono-${tam}.png`));
  png(adaptable, tam, join(dirIconos, `icono-maskable-${tam}.png`));
}
png(monocromo(), 512, join(dirIconos, 'icono-monocromo-512.png'));
// iOS recorta sus propias esquinas y pinta de negro lo transparente: cuadrado lleno.
png(icono({ escala: 0.92 }), 180, join(dirIconos, 'icono-apple-180.png'));
// Favicon
png(normal, 32, join(dirIconos, 'favicon-32.png'));
writeFileSync(join(raiz, 'public', 'favicon.svg'), normal.replace(/\n\s*/g, ' '));

// Tiendas y difusión (fuera de la app: no se precargan)
writeFileSync(join(dirMarca, 'icono.svg'), normal);
writeFileSync(join(dirMarca, 'icono-adaptable.svg'), adaptable);
png(icono({ escala: 0.92 }), 1024, join(dirMarca, 'icono-1024.png'));
png(icono(), 512, join(dirMarca, 'icono-play-512.png'));
png(destacado(), 1024, join(dirMarca, 'grafico-destacado-1024x500.png'));

console.log('Íconos generados en public/iconos y docs/marca');
