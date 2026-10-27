// Ilustraciones en SVG en línea (sin archivos de imagen): objetos, avatares, planta y finca.

import type { ReactElement } from 'react';
import type { Objeto } from '../juego/tipos';
import type { EtapaPlanta } from '../almacenamiento/datos';
import { Degradados, claro, medio, oscuro, useDegradados, type U } from './paleta';

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
  semilla: 'semilla de maíz',
  pan: 'pan',
  mata: 'mata',
  bolsa: 'bolsa',
  caja: 'caja',
  cubeta: 'cubeta de huevos',
  billete: 'billete',
  mesa: 'mesa',
  'arbol-cacao': 'árbol de cacao',
  'arbol-cafe': 'mata de café',
  'arbol-aguacate': 'árbol de aguacate',
  'arbol-naranja': 'árbol de naranja',
  'arbol-mandarina': 'árbol de mandarina',
  'arbol-limon': 'árbol de limón',
  platanera: 'mata de plátano',
};

/** Sombra de contacto bajo un objeto: lo asienta sobre el suelo. */
const piso = (cx = 20, rx = 11) => <ellipse cx={cx} cy="38.2" rx={rx} ry="1.6" fill="#0b1a12" opacity=".14" />;

/** Surcos de la mazorca: curvas que siguen su contorno. */
const surcoMazorca = (a: number) => `M20 7C${20 + a * 7.5} 7 ${20 + a * 11} 13 ${20 + a * 11} 21.5C${20 + a * 11} 29.5 ${20 + a * 6} 34.5 20 37`;
const MAZORCA = 'M20 6C27.5 6 31 13 31 21.5C31 29.5 26 35 20 38C14 35 9 29.5 9 21.5C9 13 12.5 6 20 6Z';
const AGUACATE = 'M20 3.5C24.5 3.5 26.5 7.5 27 12C31.5 17 33.5 22 32.5 28C31.5 34 26.5 37.5 20 37.5C13.5 37.5 8.5 34 7.5 28C6.5 22 8.5 17 13 12C13.5 7.5 15.5 3.5 20 3.5Z';
const HUEVO = 'M20 4C28 4 33 15 33 24C33 32 27 37 20 37C13 37 7 32 7 24C7 15 12 4 20 4Z';
const LIMON = 'M4.5 21.5C7 12 13 9 20 9C27 9 33 12 35.5 21.5C33 30.5 27 33.5 20 33.5C13 33.5 7 30.5 4.5 21.5Z';
const BULTO = 'M10 13C7 22 8 33 12 36.5H28C32 33 33 22 30 13Z';
const PLATANO = 'M7 9C8 25 17 33 32 31C35 30.5 35 28 33 27.5C20 28 13 21 11 8.5C10.5 6.5 7.5 6.8 7 9Z';
const CESTA = 'M4.5 18H35.5L31.8 35.6A2 2 0 0 1 29.8 37.2H10.2A2 2 0 0 1 8.2 35.6Z';

/** Copa redonda de árbol con su tronco; los frutos se dibujan encima. */
function arbolCopa(u: U, frutos: ReactElement | null = null, copa: 'v' | 'w' = 'v') {
  return (
    <g>
      {piso(20, 9)}
      <path d="M17.4 38L18.6 23H21.4L22.6 38Z" fill={u('k')} />
      <path d="M20 29L24.5 25.5" stroke={medio('k')} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12.5" cy="21" r="7.5" fill={u(copa === 'w' ? 'v' : copa)} />
      <circle cx="27.5" cy="21" r="7.5" fill={u(copa === 'w' ? 'v' : copa)} />
      <circle cx="20" cy="14.5" r="10.5" fill={u(copa === 'w' ? 'v' : copa)} />
      <circle cx="12.5" cy="21" r="7.5" fill={u('s')} />
      <circle cx="27.5" cy="21" r="7.5" fill={u('s')} />
      <circle cx="20" cy="14.5" r="10.5" fill={u('e')} />
      {frutos}
    </g>
  );
}

/** Frutos redondos repartidos en la copa (naranja, mandarina, limón). */
function frutosCopa(u: U, tono: 'n' | 'l', r: number, muchos = false) {
  const puntos = muchos
    ? [
        [13.5, 20],
        [25.5, 12.5],
        [27.5, 23],
        [17, 11],
        [21.5, 19.5],
        [10, 24.5],
      ]
    : [
        [13.5, 20],
        [25.5, 12.5],
        [27.5, 23],
        [18.5, 15],
      ];
  return (
    <g>
      {puntos.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill={u(tono)} />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="#fff" opacity=".6" />
        </g>
      ))}
    </g>
  );
}

/** Dibujos de 40 × 40, con la paleta y la luz de los iconos. */
const formas: Record<Objeto, (u: U) => ReactElement> = {
  huevo: (u) => (
    <g>
      {piso(20, 10)}
      <path d={HUEVO} fill={u('c')} stroke="#e3cfa6" strokeWidth=".8" />
      <path d={HUEVO} fill={u('s')} />
      <path d={HUEVO} fill={u('e')} />
      <circle cx="25" cy="27" r=".9" fill="#d6b27c" opacity=".55" />
      <circle cx="14" cy="29.5" r=".7" fill="#d6b27c" opacity=".55" />
      <circle cx="26.5" cy="18" r=".6" fill="#d6b27c" opacity=".5" />
    </g>
  ),
  mazorca: (u) => (
    <g>
      {piso(20, 9)}
      <g transform="rotate(-14 20 22)">
        <path d="M20 6.5C19.4 4.5 19.8 2.8 21 1.6" stroke={oscuro('k')} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d={MAZORCA} fill={u('o')} />
        {[-0.62, -0.24, 0.24, 0.62].map((a) => (
          <g key={a}>
            <path d={surcoMazorca(a)} stroke="#b4400f" strokeOpacity=".5" strokeWidth="1.1" fill="none" />
            <path d={surcoMazorca(a)} transform="translate(-.9 0)" stroke="#ffe7ad" strokeOpacity=".55" strokeWidth=".6" fill="none" />
          </g>
        ))}
        <path d={MAZORCA} fill={u('s')} />
        <ellipse cx="15.2" cy="15.5" rx="1.7" ry="5" fill="#fff" opacity=".55" />
      </g>
    </g>
  ),
  naranja: (u) => (
    <g>
      {piso(20, 11)}
      <circle cx="20" cy="23" r="14" fill={u('n')} />
      <circle cx="20" cy="23" r="14" fill={u('s')} />
      <circle cx="20" cy="23" r="14" fill={u('e')} />
      {[
        [26, 18],
        [27.5, 25],
        [22, 30],
        [14, 27],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r=".55" fill="#fff" opacity=".35" />
      ))}
      <path d="M20 9.5V7" stroke={oscuro('k')} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20.5 8.5C22.5 4 27 3 30.5 5C27.5 9 23.5 9.8 20.5 8.5Z" fill={u('v')} />
      <path d="M21.5 8C24 6.6 26.5 5.6 29 5.2" stroke={oscuro('v')} strokeOpacity=".5" strokeWidth=".6" fill="none" />
    </g>
  ),
  mandarina: (u) => (
    <g>
      {piso(20, 12)}
      <ellipse cx="20" cy="24" rx="15" ry="12" fill={u('n')} />
      <path d="M11 22C14 26 26 26 29 22M13 28C16 31 24 31 27 28" stroke={oscuro('n')} strokeOpacity=".25" strokeWidth="1" fill="none" />
      <ellipse cx="20" cy="24" rx="15" ry="12" fill={u('s')} />
      <ellipse cx="20" cy="24" rx="15" ry="12" fill={u('e')} />
      <path d="M20.5 12.5C22.5 8 27 7 30.5 9C27.5 13 23.5 13.8 20.5 12.5Z" fill={u('v')} />
      <circle cx="20" cy="12.6" r="1.1" fill={oscuro('k')} />
    </g>
  ),
  limon: (u) => (
    <g>
      {piso(20, 12)}
      <path d={LIMON} fill={u('l')} />
      <path d={LIMON} fill={u('s')} />
      <path d={LIMON} fill={u('e')} />
      <circle cx="4.8" cy="21.5" r="1" fill={oscuro('l')} />
      <ellipse cx="14.5" cy="16.5" rx="4" ry="1.6" fill="#fff" opacity=".55" transform="rotate(-12 14.5 16.5)" />
    </g>
  ),
  aguacate: (u) => (
    <g>
      {piso(20, 10)}
      <path d={AGUACATE} fill={u('w')} />
      {[
        [15, 24],
        [24, 28],
        [19, 32],
        [26, 20],
        [12, 30],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r=".7" fill="#c5e08f" opacity=".4" />
      ))}
      <path d={AGUACATE} fill={u('s')} />
      <path d={AGUACATE} fill={u('e')} />
      <rect x="18.8" y="1.6" width="2.4" height="3.4" rx="1.1" fill={oscuro('k')} />
    </g>
  ),
  gallina: (u) => (
    <g>
      {piso(19, 11)}
      <path d="M16 34.5V38.5M22 34.5V38.5M14.5 38.5H17.5M20.5 38.5H23.5" stroke={oscuro('y')} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 25C3.5 20 3.5 12.5 6.5 9.5C8 14.5 10.5 18 13.5 20Z" fill={u('q')} />
      <path d="M8.6 15.5C9.6 18 11 19.6 12.8 20.6" stroke={oscuro('q')} strokeOpacity=".45" strokeWidth=".8" fill="none" />
      <ellipse cx="19.5" cy="25" rx="12.5" ry="10" fill={u('q')} />
      <circle cx="28.5" cy="13.5" r="6.5" fill={u('q')} />
      <path d="M24 17C25 20 26 22 27.5 23" stroke={medio('q')} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="19.5" cy="25" rx="12.5" ry="10" fill={u('s')} />
      <path d="M12.5 23.5C16.5 19.5 23.5 20.5 25.5 25C22.5 30 16 30.5 12.5 23.5Z" fill={oscuro('q')} opacity=".55" />
      <path d="M15 24.5C17.5 23.5 20.5 23.8 22.5 25.2M15.8 27C18 26.5 20.5 26.8 22 27.6" stroke="#fde3c4" strokeOpacity=".5" strokeWidth=".7" fill="none" />
      <path d="M25 8.2C25 5 27.2 4.4 28.2 6.6C28.7 4 31.2 4 31.7 6.6C33.2 5.6 34.8 7.2 33.2 9.4Z" fill={u('r')} />
      <ellipse cx="33.6" cy="18" rx="1.4" ry="2.2" fill={u('r')} />
      <path d="M34 12.4L38.6 14.4L34 16.2Z" fill={u('y')} />
      <circle cx="30.4" cy="12.6" r="1.5" fill="#1f2937" />
      <circle cx="30.9" cy="12.1" r=".5" fill="#fff" />
      <ellipse cx="25" cy="10.5" rx="1.5" ry="2.6" fill="#fff" opacity=".35" transform="rotate(-30 25 10.5)" />
    </g>
  ),
  bulto: (u) => (
    <g>
      {piso(20, 11)}
      <path d={BULTO} fill={u('x')} />
      <path d="M12 15.5L28 15.5M11 33.5H29" stroke={oscuro('x')} strokeOpacity=".5" strokeWidth=".8" strokeDasharray="1.6 1.2" />
      <path d={BULTO} fill={u('s')} />
      <path d="M12 13C13.5 8 26.5 8 28 13C24 14.5 16 14.5 12 13Z" fill={u('x')} />
      <rect x="14" y="10.4" width="12" height="3" rx="1.5" fill={u('k')} />
      <text x="20" y="27.5" fontSize="7.5" textAnchor="middle" fill="#7a5a22" fontWeight="900" fontFamily="system-ui, sans-serif">
        kg
      </text>
      <path d="M11.5 16C10.5 20 10.5 26 11.5 30" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </g>
  ),
  arbol: (u) => arbolCopa(u),
  'arbol-naranja': (u) => arbolCopa(u, frutosCopa(u, 'n', 1.9)),
  'arbol-mandarina': (u) => arbolCopa(u, frutosCopa(u, 'n', 1.6, true)),
  'arbol-limon': (u) => arbolCopa(u, frutosCopa(u, 'l', 1.7, true)),
  'arbol-aguacate': (u) => (
    <g>
      {arbolCopa(u, null, 'w')}
      {[
        [13, 22, -12],
        [25.5, 13.5, 8],
        [28, 23.5, -6],
        [18.5, 17, 4],
      ].map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x} ${y - 3.4}C${x + 1.3} ${y - 3.4} ${x + 1.6} ${y - 1.6} ${x + 1.7} ${y - 0.6}C${x + 2.6} ${y + 0.6} ${x + 2.6} ${y + 3.2} ${x} ${y + 3.4}C${x - 2.6} ${y + 3.2} ${x - 2.6} ${y + 0.6} ${x - 1.7} ${y - 0.6}C${x - 1.6} ${y - 1.6} ${x - 1.3} ${y - 3.4} ${x} ${y - 3.4}Z`} fill={oscuro('w')} stroke="#1c2e07" strokeWidth=".5" />
          <ellipse cx={x - 0.7} cy={y + 0.6} rx=".6" ry="1.2" fill="#fff" opacity=".35" />
        </g>
      ))}
    </g>
  ),
  'arbol-cacao': (u) => (
    <g>
      {piso(20, 10)}
      <path d="M17 38L18 21H22L23 38Z" fill={u('k')} />
      <path d="M20 26L25 21.5M20 24L15 20" stroke={medio('k')} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="11.5" cy="15" rx="8" ry="6.5" fill={u('v')} />
      <ellipse cx="28.5" cy="15" rx="8" ry="6.5" fill={u('v')} />
      <ellipse cx="20" cy="10" rx="10" ry="7.5" fill={u('v')} />
      <ellipse cx="11.5" cy="15" rx="8" ry="6.5" fill={u('s')} />
      <ellipse cx="28.5" cy="15" rx="8" ry="6.5" fill={u('s')} />
      <ellipse cx="20" cy="10" rx="10" ry="7.5" fill={u('e')} />
      {/* Las mazorcas del cacao nacen pegadas al tronco. */}
      {[
        [15.2, 29, 20],
        [24.6, 27, -20],
        [16, 35, 12],
      ].map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x} ${y - 4.4}C${x + 2.6} ${y - 4.4} ${x + 3} ${y - 1} ${x + 3} ${y}C${x + 3} ${y + 2.4} ${x + 1.6} ${y + 4} ${x} ${y + 4.6}C${x - 1.6} ${y + 4} ${x - 3} ${y + 2.4} ${x - 3} ${y}C${x - 3} ${y - 1} ${x - 2.6} ${y - 4.4} ${x} ${y - 4.4}Z`} fill={u('o')} />
          <path d={`M${x - 1} ${y - 3.8}V${y + 3.8}M${x + 1} ${y - 3.8}V${y + 3.8}`} stroke="#b4400f" strokeOpacity=".45" strokeWidth=".6" />
          <ellipse cx={x - 1.6} cy={y - 1} rx=".6" ry="1.6" fill="#fff" opacity=".5" />
        </g>
      ))}
    </g>
  ),
  'arbol-cafe': (u) => (
    <g>
      {piso(20, 10)}
      <path d="M19.2 38L19.6 4.5H20.4L20.8 38Z" fill={u('k')} />
      {/* Mata de café: ramas horizontales con hojas alargadas y racimos de cerezas sobre la rama. */}
      {[
        [30, 15],
        [22.5, 12.5],
        [15, 10],
        [8.5, 7],
      ].map(([y, largo]) => (
        <g key={y}>
          {[-1, 1].map((lado) => (
            <g key={lado}>
              <path d={`M20 ${y}Q${20 + lado * largo * 0.6} ${y - 1.2} ${20 + lado * largo} ${y + 0.8}`} stroke={oscuro('k')} strokeWidth="1" fill="none" />
              {[0.45, 0.8, 1].map((t) => (
                <g key={t}>
                  <ellipse cx={20 + lado * largo * t} cy={y + 2} rx="3.4" ry="1.3" transform={`rotate(${lado * 32} ${20 + lado * largo * t} ${y + 2})`} fill={u('v')} />
                  <ellipse cx={20 + lado * largo * t} cy={y - 1.6} rx="3" ry="1.15" transform={`rotate(${lado * -28} ${20 + lado * largo * t} ${y - 1.6})`} fill={u('w')} />
                </g>
              ))}
              {[0.3, 0.62].map((t) => {
                const x = 20 + lado * largo * t;
                return (
                  <g key={t}>
                    {[
                      [-1.1, 0.4],
                      [1.1, 0.4],
                      [0, 1.6],
                    ].map(([dx, dy]) => (
                      <circle key={`${dx}-${dy}`} cx={x + dx} cy={y + dy} r="1.25" fill={u('r')} />
                    ))}
                    <circle cx={x - 1.4} cy={y} r=".35" fill="#fff" opacity=".7" />
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      ))}
      <ellipse cx="20" cy="4" rx="1.3" ry="3" fill={u('l')} />
    </g>
  ),
  platanera: (u) => (
    <g>
      {piso(20, 9)}
      <path d="M17.4 38C17.8 30 18 24 18.6 17H21.4C22 24 22.2 30 22.6 38Z" fill={u('w')} />
      <path d="M19 20C19.2 26 19.2 32 19 37" stroke="#fff" strokeOpacity=".35" strokeWidth=".8" />
      <path d="M20 17C14 12 7 12 2.5 16C7 18.5 14 19 20 17Z" fill={u('v')} />
      <path d="M20 17C26 12 33 12 37.5 16C33 18.5 26 19 20 17Z" fill={u('v')} />
      <path d="M20 17C17 10 13 5 7 3.5C9 9 13.5 14 20 17Z" fill={u('l')} />
      <path d="M20 17C23 10 27 5 33 3.5C31 9 26.5 14 20 17Z" fill={u('l')} />
      <path d="M20 17C19 11 19.5 6 21 1.5C22.5 6 22 11 20 17Z" fill={u('v')} />
      <path d="M3.5 16C9 15.5 15 16 20 17M36.5 16C31 15.5 25 16 20 17M8 4.5C12 9 16 13 20 17M32 4.5C28 9 24 13 20 17" stroke={oscuro('v')} strokeOpacity=".45" strokeWidth=".6" fill="none" />
      {/* Racimo de plátanos verdes */}
      <path d="M22 19.5C24 21 25 23 25 25" stroke={oscuro('k')} strokeWidth="1.2" fill="none" />
      {[
        [23, 25],
        [26, 24.6],
        [24.5, 28],
        [27.5, 27.6],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y}C${x - 0.4} ${y + 2.5} ${x + 1} ${y + 4} ${x + 2.4} ${y + 3.6}C${x + 1.2} ${y + 2.6} ${x + 0.6} ${y + 1.2} ${x + 0.8} ${y - 0.4}Z`} fill={u('l')} stroke={oscuro('l')} strokeWidth=".4" />
      ))}
      <path d="M25.6 31.6C26.4 33.6 25.6 35 24.6 35.4C24 34 24.4 32.6 25.6 31.6Z" fill={u('m')} />
    </g>
  ),
  platano: (u) => (
    <g>
      {piso(21, 12)}
      <path d={PLATANO} fill={u('y')} />
      <path d="M9 10.5C10.5 22 18 29.5 31 29.6" stroke={oscuro('y')} strokeOpacity=".45" strokeWidth=".9" fill="none" />
      <path d={PLATANO} fill={u('s')} />
      <path d="M8.6 11C9.6 19 13 24.5 18 27.5" stroke="#fff" strokeOpacity=".6" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M7.3 8.6L6 5.4" stroke="#6b4b12" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="33.6" cy="29.2" r="1.1" fill="#5b4a12" />
    </g>
  ),
  arepa: (u) => (
    <g>
      {piso(20, 13)}
      <ellipse cx="20" cy="25" rx="15.5" ry="10.5" fill={oscuro('z')} />
      <ellipse cx="20" cy="23" rx="15.5" ry="10.5" fill={u('z')} />
      {[
        [13, 20, 2.2, 1.4],
        [24.5, 26.5, 2.6, 1.6],
        [26, 18.5, 1.7, 1.1],
        [16, 28, 1.5, 1],
        [30, 23, 1.2, 0.9],
      ].map(([x, y, rx, ry]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill="#b5732a" opacity=".55" />
      ))}
      <ellipse cx="14" cy="17.5" rx="6" ry="2.2" fill="#fff" opacity=".45" transform="rotate(-10 14 17.5)" />
    </g>
  ),
  moneda: (u) => (
    <g>
      {piso(20, 11)}
      <circle cx="20" cy="21.6" r="15" fill={oscuro('y')} />
      <circle cx="20" cy="20" r="15" fill={u('y')} />
      <circle cx="20" cy="20" r="11.5" fill="none" stroke="#fff7d6" strokeOpacity=".75" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="11.5" fill="none" stroke={oscuro('y')} strokeOpacity=".35" strokeWidth="1.2" transform="translate(.6 .8)" />
      <text x="20.6" y="26.3" fontSize="16" textAnchor="middle" fill={oscuro('y')} opacity=".5" fontWeight="900" fontFamily="system-ui, sans-serif">
        $
      </text>
      <text x="20" y="25.5" fontSize="16" textAnchor="middle" fill="#9a5a06" fontWeight="900" fontFamily="system-ui, sans-serif">
        $
      </text>
      <circle cx="20" cy="20" r="15" fill={u('e')} />
    </g>
  ),
  cafe: (u) => (
    <g>
      {piso(20, 11)}
      <path d="M4.5 14C9 5 19 3.5 24.5 8.5C18 13 11 15 4.5 14Z" fill={u('v')} />
      <path d="M6.5 13C12 11 17.5 9.5 23 8.6" stroke={oscuro('v')} strokeOpacity=".5" strokeWidth=".7" fill="none" />
      <path d="M36 12C33 5 25.5 4.5 22 8.5C27 11.5 31.5 13 36 12Z" fill={u('l')} />
      <path d="M18 10.5L15 17M22 10L26 18M20 11V25" stroke={oscuro('w')} strokeWidth="1.1" strokeLinecap="round" />
      {[
        [14, 23, 6.5],
        [26, 24.5, 6.5],
        [20, 32, 6],
      ].map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill={u('r')} />
          <circle cx={x} cy={y} r={r} fill={u('s')} />
          <circle cx={x} cy={y} r={r} fill={u('e')} />
          <circle cx={x + r * 0.45} cy={y + r * 0.45} r=".8" fill="#7f1d1d" />
        </g>
      ))}
    </g>
  ),
  canasta: (u) => (
    <g>
      {piso(20, 13)}
      <path d="M9 18C9.5 5 30.5 5 31 18" stroke={medio('k')} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M9.6 16C10.5 8 18 6 22 7" stroke={claro('k')} strokeWidth=".9" strokeLinecap="round" fill="none" />
      <circle cx="15" cy="16" r="5" fill={u('n')} />
      <circle cx="15" cy="16" r="5" fill={u('e')} />
      <circle cx="24.5" cy="15.5" r="4.8" fill={u('l')} />
      <circle cx="24.5" cy="15.5" r="4.8" fill={u('e')} />
      <path d={CESTA} fill={u('k')} />
      <path d="M6.5 25H33.5M7.8 31H32.2M13 19L14 37M20 19V37M27 19L26 37" stroke={oscuro('k')} strokeOpacity=".45" strokeWidth="1" />
      <path d={CESTA} fill={u('s')} />
      <rect x="3" y="16.4" width="34" height="4.2" rx="2.1" fill={u('k')} />
      <rect x="4" y="16.8" width="32" height="1.4" rx=".7" fill="#fff" opacity=".35" />
    </g>
  ),
  semilla: (u) => (
    <g>
      {piso(20, 12)}
      {[
        [12, 25, -24],
        [28, 25, 22],
        [20, 21, 0],
      ].map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x - 5.5} ${y - 7}C${x - 5.5} ${y - 10} ${x + 5.5} ${y - 10} ${x + 5.5} ${y - 7}L${x + 4} ${y + 6}C${x + 3} ${y + 10.5} ${x - 3} ${y + 10.5} ${x - 4} ${y + 6}Z`} fill={u('y')} />
          <path d={`M${x - 5.5} ${y - 7}C${x - 5.5} ${y - 10} ${x + 5.5} ${y - 10} ${x + 5.5} ${y - 7}L${x + 4} ${y + 6}C${x + 3} ${y + 10.5} ${x - 3} ${y + 10.5} ${x - 4} ${y + 6}Z`} fill={u('s')} />
          {/* Germen claro del grano */}
          <path d={`M${x} ${y - 3}C${x + 2.4} ${y - 3} ${x + 2} ${y + 4} ${x} ${y + 6}C${x - 2} ${y + 4} ${x - 2.4} ${y - 3} ${x} ${y - 3}Z`} fill="#fffbeb" opacity=".85" />
          <ellipse cx={x - 3} cy={y - 6} rx="1.6" ry=".8" fill="#fff" opacity=".6" />
        </g>
      ))}
    </g>
  ),
  pan: (u) => (
    <g>
      {piso(20, 14)}
      <path d="M4.5 29C4 19 11 12 20 12C29 12 36 19 35.5 29C35.4 32.5 31 34 20 34C9 34 4.6 32.5 4.5 29Z" fill={u('z')} />
      <path d="M6.5 27C6.5 19 12.5 14 20 14C27.5 14 33.5 19 33.5 27C27 25 13 25 6.5 27Z" fill={u('o')} opacity=".55" />
      <path d="M4.5 29C4 19 11 12 20 12C29 12 36 19 35.5 29C35.4 32.5 31 34 20 34C9 34 4.6 32.5 4.5 29Z" fill={u('s')} />
      {[12.5, 20, 27.5].map((x) => (
        <path key={x} d={`M${x - 2.6} ${x === 20 ? 17 : 19}C${x - 1} ${x === 20 ? 21 : 22.5} ${x + 1} ${x === 20 ? 21 : 22.5} ${x + 2.6} ${x === 20 ? 17 : 19}`} stroke="#fff3d6" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      ))}
      <ellipse cx="13" cy="16.5" rx="4" ry="1.4" fill="#fff" opacity=".5" transform="rotate(-20 13 16.5)" />
    </g>
  ),
  mata: (u) => (
    <g>
      <ellipse cx="20" cy="35.5" rx="13" ry="3.5" fill={u('k')} />
      <ellipse cx="20" cy="34.6" rx="11" ry="2.2" fill={oscuro('k')} opacity=".35" />
      <path d="M19.4 35V15H20.6V35Z" fill={oscuro('v')} />
      {[
        [-58, 24],
        [58, 24],
        [-30, 17],
        [30, 17],
        [0, 12],
      ].map(([r, y]) => (
        <g key={`${r}-${y}`} transform={`rotate(${r} 20 ${y})`}>
          <path d={`M20 ${y}C16.6 ${y - 4} 17.2 ${y - 10} 20 ${y - 13}C22.8 ${y - 10} 23.4 ${y - 4} 20 ${y}Z`} fill={u(y === 12 ? 'l' : 'v')} />
          <path d={`M20 ${y}V${y - 11}`} stroke={oscuro('v')} strokeOpacity=".45" strokeWidth=".6" />
        </g>
      ))}
    </g>
  ),
  bolsa: (u) => (
    <g>
      {piso(20, 11)}
      <path d="M9 14H31L33 33.5C33.2 35.6 31.8 37 29.8 37H10.2C8.2 37 6.8 35.6 7 33.5Z" fill={u('c')} stroke="#c9b48a" strokeWidth=".8" />
      <path d="M9 14H31L33 33.5C33.2 35.6 31.8 37 29.8 37H10.2C8.2 37 6.8 35.6 7 33.5Z" fill={u('s')} />
      <path d="M14 14C14 7 18 5 20 5C22 5 26 7 26 14" stroke={u('c')} strokeWidth="2.6" fill="none" />
      <path d="M14 14C14 7 18 5 20 5C22 5 26 7 26 14" stroke="#c9b48a" strokeWidth=".7" fill="none" />
      <path d="M12 18L11 33M28 18L29 33" stroke="#c9b48a" strokeOpacity=".7" strokeWidth=".7" />
      <path d="M10.5 16.5C10 22 9.8 28 10 32" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
    </g>
  ),
  caja: (u) => (
    <g>
      {piso(20, 15)}
      <path d="M4 14H36V35.5C36 36.3 35.3 37 34.5 37H5.5C4.7 37 4 36.3 4 35.5Z" fill={oscuro('k')} />
      {[15.5, 23, 30].map((y) => (
        <g key={y}>
          <rect x="5" y={y} width="30" height="5" rx="1" fill={u('k')} />
          <rect x="5" y={y} width="30" height="1.3" rx=".6" fill="#fff" opacity=".35" />
        </g>
      ))}
      <rect x="4" y="13.5" width="4.5" height="23.5" rx="1" fill={u('k')} />
      <rect x="31.5" y="13.5" width="4.5" height="23.5" rx="1" fill={u('k')} />
      <circle cx="6.2" cy="18" r=".7" fill={oscuro('k')} />
      <circle cx="33.8" cy="18" r=".7" fill={oscuro('k')} />
      <circle cx="6.2" cy="32.5" r=".7" fill={oscuro('k')} />
      <circle cx="33.8" cy="32.5" r=".7" fill={oscuro('k')} />
    </g>
  ),
  cubeta: (u) => (
    <g>
      {piso(20, 16)}
      {[9, 16.3, 23.6, 31].map((x, k) => (
        <g key={x}>
          <ellipse cx={x} cy="17.5" rx="3.5" ry="4.8" fill={u('c')} stroke="#e3cfa6" strokeWidth=".6" />
          {k % 2 === 0 && <ellipse cx={x - 1.3} cy="15.6" rx=".8" ry="1.6" fill="#fff" opacity=".85" />}
        </g>
      ))}
      <path d="M2.5 20.5H37.5L32 34.5H8Z" fill={u('x')} />
      {[9, 16.3, 23.6, 31].map((x) => (
        <path key={x} d={`M${x - 3.4} 20.5C${x - 2.4} 23.5 ${x + 2.4} 23.5 ${x + 3.4} 20.5`} fill={oscuro('x')} opacity=".35" />
      ))}
      <path d="M2.5 20.5L8 34.5H32L37.5 20.5Z" fill={u('s')} />
      <path d="M2.5 20.5H37.5" stroke="#fff" strokeOpacity=".6" strokeWidth="1" />
      <path d="M5.5 28H34.5" stroke={oscuro('x')} strokeOpacity=".35" strokeWidth=".8" />
    </g>
  ),
  billete: (u) => (
    <g>
      {piso(20, 16)}
      <g transform="rotate(-8 20 22)">
        <rect x="3" y="12" width="34" height="20" rx="2.2" fill={u('t')} />
        <rect x="5.4" y="14.4" width="29.2" height="15.2" rx="1.4" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".9" />
        <circle cx="13" cy="22" r="5.2" fill="#fff" opacity=".85" />
        <circle cx="13" cy="20.6" r="2" fill={oscuro('t')} opacity=".6" />
        <path d="M9.6 25.8C10.4 23.6 15.6 23.6 16.4 25.8" fill={oscuro('t')} opacity=".6" />
        <text x="27" y="26.4" fontSize="11" textAnchor="middle" fill="#fff" fontWeight="900" fontFamily="system-ui, sans-serif">
          $
        </text>
        <rect x="3" y="12" width="34" height="5" rx="2" fill="#fff" opacity=".2" />
      </g>
    </g>
  ),
  mesa: (u) => (
    <g>
      {piso(20, 16)}
      <path d="M8 21L6.5 37.5M32 21L33.5 37.5M12.5 21L13 34M27.5 21L27 34" stroke={oscuro('k')} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M3 16.5H37L35 22.5H5Z" fill={u('k')} />
      <path d="M3 16.5H37" stroke="#fff" strokeOpacity=".55" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 22.5H35" stroke={oscuro('k')} strokeWidth="1" />
    </g>
  ),
};

export function DibujoObjeto({ objeto, tamano = 40, etiqueta }: { objeto: Objeto; tamano?: number; etiqueta?: string }) {
  const { id, u, usados } = useDegradados();
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" role="img" aria-label={etiqueta ?? nombresObjeto[objeto]} focusable="false">
      {formas[objeto](u)}
      <Degradados id={id} usados={usados} />
    </svg>
  );
}

export function nombreObjeto(o: Objeto): string {
  return nombresObjeto[o];
}

const pluralesObjeto: Record<Objeto, string> = {
  huevo: 'huevos',
  mazorca: 'mazorcas de cacao',
  naranja: 'naranjas',
  aguacate: 'aguacates',
  gallina: 'gallinas',
  bulto: 'bultos',
  arbol: 'árboles',
  platano: 'plátanos',
  mandarina: 'mandarinas',
  limon: 'limones',
  arepa: 'arepas',
  moneda: 'monedas',
  cafe: 'granos de café',
  canasta: 'canastas',
  semilla: 'semillas de maíz',
  pan: 'panes',
  mata: 'matas',
  bolsa: 'bolsas',
  caja: 'cajas',
  cubeta: 'cubetas de huevos',
  billete: 'billetes',
  mesa: 'mesas',
  'arbol-cacao': 'árboles de cacao',
  'arbol-cafe': 'matas de café',
  'arbol-aguacate': 'árboles de aguacate',
  'arbol-naranja': 'árboles de naranja',
  'arbol-mandarina': 'árboles de mandarina',
  'arbol-limon': 'árboles de limón',
  platanera: 'matas de plátano',
};

const FEMENINOS = new Set<Objeto>(['mazorca', 'naranja', 'gallina', 'mandarina', 'arepa', 'moneda', 'canasta', 'semilla', 'mata', 'bolsa', 'caja', 'cubeta', 'mesa', 'arbol-cafe', 'platanera']);

/** ¿El nombre del objeto es femenino? (para «tócalas» o «tócalos»). */
export function esFemenino(o: Objeto): boolean {
  return FEMENINOS.has(o);
}

/** Nombre con la cantidad: «1 huevo», «3 huevos». */
export function cantidadObjeto(o: Objeto, n: number): string {
  return `${n} ${n === 1 ? nombresObjeto[o] : pluralesObjeto[o]}`;
}

// --- Avatares (64 × 64) ---

export type AvatarId = 'gallina' | 'mula' | 'perro' | 'loro' | 'mariposa' | 'ardilla' | 'nina-cacaotera' | 'nino-caficultor' | 'abuela' | 'adulto' | 'adulta' | 'abuelo';

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
  { id: 'adulta', nombre: 'Mamá' },
  { id: 'adulto', nombre: 'Papá' },
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
  adulta: cara(
    '#c68b59',
    <g />,
    <g>
      <path d="M14 36 Q12 14 32 14 Q52 14 50 36 L46 30 L18 30Z" fill="#3b2314" />
    </g>,
  ),
  adulto: cara(
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

/** Identificadores de versiones anteriores (perfiles y copias de seguridad ya guardados). */
const alias: Record<string, AvatarId> = { campesina: 'adulta', campesino: 'adulto' };

export function Avatar({ id, tamano = 64, etiqueta }: { id: string; tamano?: number; etiqueta?: string }) {
  const forma = avatares[(alias[id] ?? id) as AvatarId] ?? avatares.gallina;
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
      {i === 5 && <path d="M104 6c1.5 6 3.5 8 9.5 9.5-6 1.5-8 3.5-9.5 9.5-1.5-6-3.5-8-9.5-9.5 6-1.5 8-3.5 9.5-9.5Z" fill="#fbbf24" aria-hidden="true" />}
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

/** El mismo ícono de la app (public/favicon.svg, generado por scripts/generar-iconos.mjs). */
export function Logo({ tamano = 72 }: { tamano?: number }) {
  return <img src="./favicon.svg" width={tamano} height={tamano} alt="La Finca Matemática" className="logo-marca" draggable={false} />;
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

/** Dibujo de un recipiente o de quien recibe (Recipiente.dibujo). Las personas se alternan para distinguirlas. */
export function DibujoRecipiente({ dibujo, indice = 0, tamano = 28 }: { dibujo?: Objeto | 'nino' | 'adulto' | 'mula'; indice?: number; tamano?: number }) {
  if (!dibujo) return null;
  // Decorativo: el nombre del recipiente ya va escrito al lado.
  const id = dibujo === 'mula' ? 'mula' : dibujo === 'nino' ? (indice % 2 ? 'nino-caficultor' : 'nina-cacaotera') : dibujo === 'adulto' ? ['adulta', 'adulto', 'abuela', 'abuelo'][indice % 4] : null;
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0 }}>
      {id ? <Avatar id={id} tamano={tamano} etiqueta="" /> : <DibujoObjeto objeto={dibujo as Objeto} tamano={tamano} etiqueta="" />}
    </span>
  );
}

/** Nombre en plural: «naranjas», «cajas». */
export function pluralObjeto(o: Objeto): string {
  return pluralesObjeto[o];
}
