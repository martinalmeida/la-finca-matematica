// Ilustraciones en SVG en línea (sin archivos de imagen): objetos, avatares, planta y finca.

import type { ReactElement } from 'react';
import type { Objeto } from '../juego/tipos';
import type { EtapaPlanta } from '../almacenamiento/datos';

const nombresObjeto: Record<Objeto, string> = {
  huevo: 'huevo',
  mazorca: 'mazorca de cacao',
  naranja: 'naranja',
  aguacate: 'aguacate',
  gallina: 'gallina',
  bulto: 'bulto',
  arbol: 'árbol',
  platano: 'plátano',
  mandarina: 'mandarina',
  limon: 'limón',
  arepa: 'arepa',
  moneda: 'moneda',
  cafe: 'granos de café',
  canasta: 'canasta',
};

/** Dibujos de 40 × 40. */
const formas: Record<Objeto, ReactElement> = {
  huevo: (
    <g>
      <ellipse cx="20" cy="22" rx="12" ry="15" fill="#fff4dc" stroke="#b08b57" strokeWidth="1.5" />
      <ellipse cx="15" cy="16" rx="3" ry="5" fill="#fff" opacity=".8" />
    </g>
  ),
  mazorca: (
    <g>
      <path d="M20 3 L20 7" stroke="#5b3a1c" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="20" cy="22" rx="11" ry="16" fill="#d9822b" stroke="#7a4211" strokeWidth="1.5" />
      <path d="M14 10 Q12 22 14 34 M20 6 L20 38 M26 10 Q28 22 26 34" stroke="#a65a17" strokeWidth="1.3" fill="none" />
      <ellipse cx="16" cy="16" rx="2" ry="5" fill="#f2b45c" opacity=".7" />
    </g>
  ),
  naranja: (
    <g>
      <circle cx="20" cy="22" r="14" fill="#f39220" stroke="#b5600c" strokeWidth="1.5" />
      <path d="M20 8 Q26 2 31 6 Q26 10 20 8Z" fill="#3f8a2e" />
      <circle cx="15" cy="17" r="3" fill="#ffc06b" opacity=".7" />
    </g>
  ),
  mandarina: (
    <g>
      <ellipse cx="20" cy="23" rx="14" ry="11" fill="#ef7d1a" stroke="#a9520a" strokeWidth="1.5" />
      <path d="M20 12 Q25 6 30 9 Q25 13 20 12Z" fill="#3f8a2e" />
      <path d="M13 23 Q20 28 27 23" stroke="#c9650f" fill="none" />
    </g>
  ),
  limon: (
    <g>
      <path d="M5 21 Q8 9 20 9 Q32 9 35 21 Q32 33 20 33 Q8 33 5 21Z" fill="#7cbf3a" stroke="#3f7a1b" strokeWidth="1.5" />
      <ellipse cx="15" cy="17" rx="4" ry="2" fill="#c7ec8b" opacity=".8" />
    </g>
  ),
  aguacate: (
    <g>
      <path d="M20 4 Q28 4 28 14 Q34 22 32 29 Q28 38 20 38 Q12 38 8 29 Q6 22 12 14 Q12 4 20 4Z" fill="#3c6b24" stroke="#22411a" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="2" ry="4" fill="#6f9c47" opacity=".8" />
    </g>
  ),
  gallina: (
    <g>
      <ellipse cx="19" cy="25" rx="12" ry="10" fill="#c96f2d" stroke="#7a3d12" strokeWidth="1.3" />
      <circle cx="28" cy="13" r="6" fill="#c96f2d" stroke="#7a3d12" strokeWidth="1.3" />
      <path d="M26 7 Q27 3 29 6 Q30 3 32 7" fill="#d32f2f" />
      <path d="M33 13 L38 15 L33 16Z" fill="#f4b400" />
      <circle cx="29.5" cy="12" r="1.3" fill="#222" />
      <path d="M8 22 Q3 16 6 26" fill="#8a4316" />
      <path d="M16 35 L16 39 M22 35 L22 39" stroke="#f4b400" strokeWidth="2" />
    </g>
  ),
  bulto: (
    <g>
      <path d="M10 12 Q8 34 12 37 L28 37 Q32 34 30 12Z" fill="#d8c08a" stroke="#8a6d33" strokeWidth="1.5" />
      <path d="M12 12 Q20 6 28 12" fill="#c7ab6c" stroke="#8a6d33" strokeWidth="1.5" />
      <path d="M14 10 L26 10" stroke="#5b4a22" strokeWidth="2.5" />
      <text x="20" y="28" fontSize="8" textAnchor="middle" fill="#6b5424" fontWeight="bold">kg</text>
    </g>
  ),
  arbol: (
    <g>
      <rect x="17" y="22" width="6" height="16" fill="#7a4a21" />
      <circle cx="20" cy="16" r="12" fill="#3f8a2e" />
      <circle cx="13" cy="20" r="7" fill="#4f9d3a" />
      <circle cx="27" cy="20" r="7" fill="#4f9d3a" />
    </g>
  ),
  platano: (
    <g>
      <path d="M6 10 Q8 32 32 32 Q36 30 34 28 Q14 26 12 8 Q9 6 6 10Z" fill="#f5d33b" stroke="#a68a12" strokeWidth="1.5" />
      <path d="M6 10 L5 7" stroke="#5b4a12" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  arepa: (
    <g>
      <ellipse cx="20" cy="22" rx="15" ry="12" fill="#f1d9a2" stroke="#b08b57" strokeWidth="1.5" />
      <circle cx="14" cy="19" r="2" fill="#c99a52" />
      <circle cx="24" cy="25" r="2.5" fill="#c99a52" />
      <circle cx="25" cy="17" r="1.5" fill="#c99a52" />
    </g>
  ),
  moneda: (
    <g>
      <circle cx="20" cy="20" r="15" fill="#e6b93a" stroke="#9a7516" strokeWidth="2" />
      <text x="20" y="26" fontSize="16" textAnchor="middle" fill="#7a5a0c" fontWeight="bold">$</text>
    </g>
  ),
  cafe: (
    <g>
      <path d="M8 12 Q20 2 32 12 Q20 10 8 12Z" fill="#3f8a2e" />
      <circle cx="14" cy="22" r="7" fill="#b71c1c" stroke="#6d0f0f" strokeWidth="1.3" />
      <circle cx="26" cy="24" r="7" fill="#c62828" stroke="#6d0f0f" strokeWidth="1.3" />
      <circle cx="20" cy="32" r="6" fill="#a31515" stroke="#6d0f0f" strokeWidth="1.3" />
    </g>
  ),
  canasta: (
    <g>
      <path d="M8 16 Q20 0 32 16" fill="none" stroke="#8a5a26" strokeWidth="2.5" />
      <path d="M4 16 L36 16 L31 37 L9 37Z" fill="#c8954f" stroke="#7a4f1e" strokeWidth="1.5" />
      <path d="M7 23 L33 23 M8 30 L32 30 M14 16 L15 37 M20 16 L20 37 M26 16 L25 37" stroke="#9a6a30" strokeWidth="1.2" />
    </g>
  ),
};

export function DibujoObjeto({ objeto, tamano = 40, etiqueta }: { objeto: Objeto; tamano?: number; etiqueta?: string }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" role="img" aria-label={etiqueta ?? nombresObjeto[objeto]} focusable="false">
      {formas[objeto]}
    </svg>
  );
}

export function nombreObjeto(o: Objeto): string {
  return nombresObjeto[o];
}

// --- Avatares (64 × 64) ---

export type AvatarId = 'gallina' | 'mula' | 'perro' | 'loro' | 'mariposa' | 'ardilla' | 'nina-cacaotera' | 'nino-caficultor' | 'abuela' | 'campesino' | 'campesina' | 'abuelo';

export const avataresEstudiante: { id: AvatarId; nombre: string }[] = [
  { id: 'gallina', nombre: 'Gallina' },
  { id: 'mula', nombre: 'Mula' },
  { id: 'perro', nombre: 'Perro' },
  { id: 'loro', nombre: 'Loro' },
  { id: 'mariposa', nombre: 'Mariposa' },
  { id: 'ardilla', nombre: 'Ardilla' },
  { id: 'nina-cacaotera', nombre: 'Niña cacaotera' },
  { id: 'nino-caficultor', nombre: 'Niño caficultor' },
];

export const avataresFamilia: { id: AvatarId; nombre: string }[] = [
  { id: 'campesina', nombre: 'Campesina' },
  { id: 'campesino', nombre: 'Campesino' },
  { id: 'abuela', nombre: 'Abuela' },
  { id: 'abuelo', nombre: 'Abuelo' },
];

function cara(piel: string, extra: ReactElement, pelo: ReactElement) {
  return (
    <g>
      {pelo}
      <circle cx="32" cy="34" r="16" fill={piel} />
      <circle cx="26" cy="32" r="2" fill="#222" />
      <circle cx="38" cy="32" r="2" fill="#222" />
      <path d="M26 40 Q32 45 38 40" stroke="#6b2b16" strokeWidth="2" fill="none" strokeLinecap="round" />
      {extra}
    </g>
  );
}

const avatares: Record<AvatarId, ReactElement> = {
  gallina: (
    <g>
      <circle cx="32" cy="36" r="18" fill="#f5f0e6" stroke="#b9a98a" strokeWidth="2" />
      <path d="M24 18 Q26 8 30 16 Q32 6 35 16 Q39 8 40 19Z" fill="#d32f2f" />
      <path d="M30 36 L36 36 L33 43Z" fill="#f4b400" />
      <circle cx="26" cy="31" r="2.5" fill="#222" />
      <circle cx="38" cy="31" r="2.5" fill="#222" />
      <path d="M31 44 Q33 50 35 44" fill="#d32f2f" />
    </g>
  ),
  mula: (
    <g>
      <path d="M18 8 L22 24 L26 20Z M46 8 L42 24 L38 20Z" fill="#6d4c3d" />
      <ellipse cx="32" cy="34" rx="15" ry="19" fill="#8d6e63" />
      <ellipse cx="32" cy="45" rx="10" ry="7" fill="#bcaaa4" />
      <circle cx="26" cy="29" r="2.5" fill="#222" />
      <circle cx="38" cy="29" r="2.5" fill="#222" />
      <circle cx="29" cy="45" r="1.3" fill="#5d4037" />
      <circle cx="35" cy="45" r="1.3" fill="#5d4037" />
    </g>
  ),
  perro: (
    <g>
      <ellipse cx="17" cy="30" rx="7" ry="13" fill="#7b5233" />
      <ellipse cx="47" cy="30" rx="7" ry="13" fill="#7b5233" />
      <circle cx="32" cy="33" r="16" fill="#d7a86e" />
      <ellipse cx="32" cy="41" rx="8" ry="6" fill="#f3dcb8" />
      <circle cx="26" cy="30" r="2.5" fill="#222" />
      <circle cx="38" cy="30" r="2.5" fill="#222" />
      <ellipse cx="32" cy="38" rx="3" ry="2" fill="#222" />
    </g>
  ),
  loro: (
    <g>
      <circle cx="32" cy="32" r="18" fill="#2e9d4a" />
      <path d="M32 14 Q44 16 46 30 L32 30Z" fill="#f4c20d" />
      <circle cx="38" cy="28" r="5" fill="#fff" />
      <circle cx="39" cy="28" r="2.5" fill="#222" />
      <path d="M44 32 Q54 34 48 44 Q44 40 42 36Z" fill="#424242" />
      <path d="M20 44 Q26 52 34 48" fill="#d32f2f" />
    </g>
  ),
  mariposa: (
    <g>
      <ellipse cx="20" cy="24" rx="12" ry="13" fill="#f57c00" stroke="#4e2a00" strokeWidth="1.5" />
      <ellipse cx="44" cy="24" rx="12" ry="13" fill="#f57c00" stroke="#4e2a00" strokeWidth="1.5" />
      <ellipse cx="22" cy="44" rx="9" ry="9" fill="#1e88e5" stroke="#0d2c55" strokeWidth="1.5" />
      <ellipse cx="42" cy="44" rx="9" ry="9" fill="#1e88e5" stroke="#0d2c55" strokeWidth="1.5" />
      <rect x="30" y="16" width="4" height="36" rx="2" fill="#3e2723" />
      <path d="M31 16 Q26 6 22 8 M33 16 Q38 6 42 8" stroke="#3e2723" strokeWidth="1.5" fill="none" />
    </g>
  ),
  ardilla: (
    <g>
      <path d="M46 52 Q62 40 54 20 Q48 12 44 22 Q52 34 42 46Z" fill="#a0522d" />
      <circle cx="30" cy="34" r="15" fill="#c26a35" />
      <path d="M18 22 L20 12 L26 20Z M42 22 L40 12 L34 20Z" fill="#c26a35" />
      <ellipse cx="30" cy="40" rx="8" ry="6" fill="#f3d2b0" />
      <circle cx="25" cy="31" r="2.3" fill="#222" />
      <circle cx="35" cy="31" r="2.3" fill="#222" />
      <circle cx="30" cy="37" r="1.6" fill="#222" />
    </g>
  ),
  'nina-cacaotera': cara(
    '#c68b59',
    <g>
      <ellipse cx="50" cy="48" rx="6" ry="9" fill="#d9822b" stroke="#7a4211" strokeWidth="1.2" />
      <circle cx="22" cy="38" r="2.5" fill="#e57373" opacity=".6" />
      <circle cx="42" cy="38" r="2.5" fill="#e57373" opacity=".6" />
    </g>,
    <g>
      <path d="M14 34 Q14 14 32 14 Q50 14 50 34 L50 44 L44 44 L44 30 L20 30 L20 44 L14 44Z" fill="#2b1a10" />
      <circle cx="14" cy="44" r="4" fill="#2b1a10" />
      <circle cx="50" cy="44" r="4" fill="#2b1a10" />
    </g>,
  ),
  'nino-caficultor': cara(
    '#b07a4f',
    <g>
      <circle cx="51" cy="50" r="4" fill="#b71c1c" />
      <circle cx="56" cy="46" r="4" fill="#c62828" />
    </g>,
    <g>
      <ellipse cx="32" cy="20" rx="22" ry="5" fill="#e8d9a8" stroke="#8a7a45" strokeWidth="1.5" />
      <path d="M20 20 Q20 8 32 8 Q44 8 44 20Z" fill="#e8d9a8" stroke="#8a7a45" strokeWidth="1.5" />
      <rect x="20" y="16" width="24" height="3" fill="#222" />
    </g>,
  ),
  campesina: cara(
    '#c68b59',
    <g />,
    <g>
      <path d="M14 36 Q12 14 32 14 Q52 14 50 36 L46 30 L18 30Z" fill="#3b2314" />
    </g>,
  ),
  campesino: cara(
    '#b07a4f',
    <path d="M24 44 Q32 48 40 44" stroke="#3b2314" strokeWidth="3" fill="none" />,
    <g>
      <ellipse cx="32" cy="20" rx="22" ry="5" fill="#e8d9a8" stroke="#8a7a45" strokeWidth="1.5" />
      <path d="M20 20 Q20 8 32 8 Q44 8 44 20Z" fill="#e8d9a8" stroke="#8a7a45" strokeWidth="1.5" />
    </g>,
  ),
  abuela: cara(
    '#d9a77a',
    <g>
      <circle cx="26" cy="32" r="4.5" fill="none" stroke="#555" strokeWidth="1.5" />
      <circle cx="38" cy="32" r="4.5" fill="none" stroke="#555" strokeWidth="1.5" />
    </g>,
    <g>
      <circle cx="32" cy="14" r="7" fill="#cfcfcf" />
      <path d="M15 34 Q14 18 32 18 Q50 18 49 34Z" fill="#cfcfcf" />
    </g>,
  ),
  abuelo: cara(
    '#c99a6d',
    <path d="M22 42 Q32 52 42 42 Q32 47 22 42Z" fill="#e0e0e0" />,
    <g>
      <ellipse cx="32" cy="20" rx="22" ry="5" fill="#5d4037" />
      <path d="M20 20 Q20 8 32 8 Q44 8 44 20Z" fill="#5d4037" />
    </g>,
  ),
};

export function Avatar({ id, tamano = 64, etiqueta }: { id: string; tamano?: number; etiqueta?: string }) {
  const forma = avatares[id as AvatarId] ?? avatares.gallina;
  const nombre = etiqueta ?? [...avataresEstudiante, ...avataresFamilia].find((a) => a.id === id)?.nombre ?? 'Avatar';
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" role="img" aria-label={nombre} focusable="false">
      {forma}
    </svg>
  );
}

// --- Planta personal (cacao) por etapas ---

export function Planta({ etapa, tamano = 160 }: { etapa: EtapaPlanta; tamano?: number }) {
  const nombres: Record<EtapaPlanta, string> = {
    semilla: 'Semilla de cacao',
    brote: 'Brote de cacao',
    planta: 'Planta de cacao',
    flor: 'Cacao con flores',
    fruto: 'Cacao con mazorcas',
    cosecha: 'Cacao listo para la cosecha',
  };
  const i = ['semilla', 'brote', 'planta', 'flor', 'fruto', 'cosecha'].indexOf(etapa);
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 120 120" role="img" aria-label={nombres[etapa]}>
      <ellipse cx="60" cy="108" rx="44" ry="9" fill="#7a5230" />
      <path d="M30 104 Q40 98 60 98 Q80 98 90 104" fill="#5e3d22" />
      {i === 0 && <ellipse cx="60" cy="98" rx="7" ry="5" fill="#8d5a2b" stroke="#4e2f13" strokeWidth="1.5" />}
      {i >= 1 && <path d={`M60 100 L60 ${i === 1 ? 82 : i === 2 ? 52 : 34}`} stroke="#6b4423" strokeWidth={i >= 3 ? 7 : 4} strokeLinecap="round" />}
      {i === 1 && (
        <g fill="#5cae3e">
          <path d="M60 84 Q48 76 46 84 Q52 90 60 86Z" />
          <path d="M60 84 Q72 76 74 84 Q68 90 60 86Z" />
        </g>
      )}
      {i >= 2 && (
        <g fill="#3f8a2e">
          <ellipse cx="60" cy={i === 2 ? 46 : 32} rx={i === 2 ? 26 : 40} ry={i === 2 ? 18 : 26} />
          <ellipse cx="44" cy={i === 2 ? 54 : 42} rx="14" ry="9" fill="#4f9d3a" />
          <ellipse cx="76" cy={i === 2 ? 54 : 42} rx="14" ry="9" fill="#4f9d3a" />
        </g>
      )}
      {i === 3 && (
        <g fill="#fff3f6" stroke="#d48aa0">
          <circle cx="60" cy="58" r="3" />
          <circle cx="66" cy="70" r="3" />
          <circle cx="55" cy="76" r="3" />
          <circle cx="45" cy="40" r="3" />
          <circle cx="75" cy="36" r="3" />
        </g>
      )}
      {i >= 4 && (
        <g stroke="#7a4211" strokeWidth="1.2">
          <ellipse cx="54" cy="66" rx="6" ry="10" fill={i === 5 ? '#e0a020' : '#9cbf3a'} />
          <ellipse cx="67" cy="74" rx="6" ry="10" fill={i === 5 ? '#d9822b' : '#a9c84a'} />
          <ellipse cx="60" cy="86" rx="5" ry="8" fill={i === 5 ? '#c96f1d' : '#9cbf3a'} />
        </g>
      )}
      {i === 5 && <text x="96" y="22" fontSize="18" aria-hidden="true">✨</text>}
    </svg>
  );
}

// --- Escena de la finca (bienvenida) ---

export function EscenaFinca({ alto = 180 }: { alto?: number }) {
  return (
    <svg width="100%" height={alto} viewBox="0 0 360 180" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Una finca de cacao en la vereda, con montañas al fondo">
      <rect width="360" height="180" fill="#cdeaf5" />
      <circle cx="300" cy="38" r="20" fill="#ffd54f" />
      <path d="M0 95 L50 55 L95 80 L150 40 L210 78 L260 50 L320 82 L360 62 L360 120 L0 120Z" fill="#6f8f6a" />
      <path d="M0 110 Q90 80 180 104 Q270 128 360 98 L360 180 L0 180Z" fill="#7fb24a" />
      <path d="M0 140 Q120 118 220 140 Q300 156 360 140 L360 180 L0 180Z" fill="#5c9a35" />
      <g transform="translate(205 78)">
        <rect x="0" y="18" width="56" height="34" fill="#f4e3c1" stroke="#8a6d33" />
        <path d="M-6 20 L28 0 L62 20Z" fill="#b5532a" />
        <rect x="22" y="30" width="12" height="22" fill="#7a4a21" />
        <rect x="6" y="26" width="10" height="9" fill="#9fd3e6" stroke="#7a4a21" />
        <rect x="40" y="26" width="10" height="9" fill="#9fd3e6" stroke="#7a4a21" />
      </g>
      {[30, 80, 130].map((x, k) => (
        <g key={x} transform={`translate(${x} ${108 + (k % 2) * 8})`}>
          <rect x="-3" y="10" width="6" height="22" fill="#6b4423" />
          <ellipse cx="0" cy="6" rx="18" ry="14" fill="#3f8a2e" />
          <ellipse cx="-6" cy="22" rx="3" ry="5" fill="#d9822b" />
          <ellipse cx="6" cy="20" rx="3" ry="5" fill="#e0a020" />
        </g>
      ))}
      <g transform="translate(290 128)">
        <ellipse cx="0" cy="14" rx="10" ry="8" fill="#c96f2d" />
        <circle cx="8" cy="6" r="5" fill="#c96f2d" />
        <path d="M6 1 Q8 -3 10 1" fill="#d32f2f" />
        <path d="M13 6 L17 7 L13 8Z" fill="#f4b400" />
      </g>
    </svg>
  );
}

// --- Logo ---

export function Logo({ tamano = 72 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" role="img" aria-label="La Finca Matemática">
      <circle cx="32" cy="32" r="30" fill="#4a6b2f" />
      <circle cx="32" cy="32" r="25" fill="#fbf5e6" />
      <path d="M32 9 L32 14" stroke="#5b3a1c" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="32" cy="33" rx="13" ry="19" fill="#d9822b" stroke="#7a4211" strokeWidth="2" />
      <path d="M25 19 Q22 33 25 47 M32 14 L32 52 M39 19 Q42 33 39 47" stroke="#a65a17" strokeWidth="1.6" fill="none" />
      <text x="32" y="38" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#fff" stroke="#5b3a1c" strokeWidth=".6">+</text>
    </svg>
  );
}

export function Tienda({ tamano = 80 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" role="img" aria-label="Tienda de la vereda">
      <rect x="8" y="24" width="48" height="34" fill="#f4e3c1" stroke="#8a6d33" strokeWidth="1.5" />
      <path d="M4 26 L10 12 L54 12 L60 26Z" fill="#c62828" />
      <path d="M10 12 L16 26 M22 12 L24 26 M34 12 L34 26 M46 12 L44 26 M54 12 L48 26" stroke="#fff" strokeWidth="3" />
      <rect x="14" y="34" width="16" height="24" fill="#7a4a21" />
      <rect x="36" y="34" width="14" height="12" fill="#9fd3e6" stroke="#7a4a21" />
    </svg>
  );
}
