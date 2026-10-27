// Videos de refuerzo en YouTube (español), uno por lección y una guía para las familias.
// Son contenido externo: necesitan internet y se cargan solo cuando alguien toca «Ver video».
// Cada video se comprobó (existe, permite verse dentro de la app, título y canal) el 2026-10-26.
// Antes del pilotaje conviene que el equipo docente los revise: ver docs/VIDEOS.md.
import type { Pista } from '../juego/tipos';

export type Video = {
  /** Identificador del video en YouTube. */
  id: string;
  /** Título corto en español para mostrar en la app. */
  titulo: string;
  canal: string;
  /** Duración aproximada (mm:ss). */
  duracion: string;
};

const v = (id: string, titulo: string, canal: string, duracion: string): Video => ({ id, titulo, canal, duracion });

/** Un video por lección: el índice es el tramo (unidad) de la lección. */
export const videosLecciones: Record<Pista, Video[]> = {
  g1: [
    v('O-37lugLe9s', 'La canción de los números del 1 al 20', 'Smile and Learn', '2:41'),
    v('Rxj_0DsQzk8', 'Mayor que, menor que e igual', 'Minders', '3:01'),
    v('oexd_Dfic_Q', 'Aprendiendo a sumar', 'Happy Learning', '4:47'),
    v('42vjqtleG9E', 'Aprendiendo a restar', 'Happy Learning', '4:33'),
    v('Gg1j4W3xJuM', 'Unidades, decenas y centenas', 'Happy Learning', '4:59'),
    v('iA0fP4tL67s', 'Aprendiendo a repartir: la división', 'Happy Learning', '2:05'),
    v('Sa_3MIlJwPs', 'Problemas de suma y resta', 'Smile and Learn', '3:35'),
  ],
  g2: [
    v('k46QCr1GofU', 'Sumas con llevadas', 'Mundo Primaria', '2:13'),
    v('eC6-OOfx1tQ', 'Unidades, decenas y centenas: el valor posicional', 'Smile and Learn', '5:24'),
    v('1tkEZVZq8Fg', 'Sumas con reagrupación', 'Miss Montse', '2:51'),
    v('i61jHbR-m8E', 'Resta prestando', 'Profe Richard', '3:40'),
    v('YI0sTmsLLnA', 'Sumar y restar con dinero', 'Aula365', '2:53'),
    v('3QPpyuNycQI', 'Multiplicación y división para niños', 'Smile and Learn', '6:43'),
    v('CgSwPMyEasQ', 'Cálculo mental: sumar y restar 9', 'Smile and Learn', '4:41'),
  ],
  g3: [
    v('xvyn-FfcQp4', 'Problemas de sumas y restas', 'Smile and Learn', '4:24'),
    v('5HfS-uRkAKk', 'Restar prestando con ceros', 'Profe Richard', '5:28'),
    v('Xv_zwlem5ek', '6 trucos para las tablas de multiplicar', 'Matemóvil', '8:31'),
    v('_qaPe8preOg', 'Multiplicar por una cifra, sin llevar y llevando', 'Matemóvil', '7:41'),
    v('zF4GYIbSMzg', 'La división: aprende a dividir', 'Smile and Learn', '3:22'),
    v('3cKEq2tEYoI', '¿Qué operación hago en un problema?', 'Clases Particulares en Ávila', '5:49'),
    v('gkRdcLfELxg', 'Problemas de multiplicación y división', 'Smile and Learn', '3:50'),
  ],
  g4: [
    v('AE4B0hgnz0E', 'Cómo hacer una multiplicación', 'Daniel Carreón', '4:10'),
    v('OwcbKpwJnyA', 'Cómo leer números muy grandes', 'Daniel Carreón', '4:25'),
    v('CGXHrIp7Dpw', 'Multiplicación por dos cifras', 'Daniel Carreón', '3:43'),
    v('mQ4wKV9_pZs', 'Divisiones paso a paso', 'Daniel Carreón', '9:36'),
    v('Ghc-ghLhnm8', 'Interpretar el residuo de una división', 'Classrom en @cción', '2:42'),
    v('RZzyWljhMEw', 'Operaciones combinadas', 'Smile and Learn', '3:13'),
    v('UloZaAFC-sM', 'Problemas de multiplicación', 'Daniel Carreón', '4:53'),
  ],
  g5: [
    v('0D1wxxlBN-0', 'Dividir por una cifra', 'academia JAF', '8:19'),
    v('5virG7l7FII', 'Propiedad distributiva de la multiplicación', 'Smartick', '5:11'),
    v('wVJRhd2xypY', 'Multiplicación con tres cifras', 'Daniel Carreón', '3:25'),
    v('g1zna75Ph-c', 'Dividir entre dos cifras', 'Smile and Learn', '6:42'),
    v('hFDI2oQCktU', 'La prueba de la división', 'Smartick', '4:33'),
    v('c9cTIjBqFTw', 'Fracciones con pizza', 'Smile and Learn', '4:14'),
    v('CvVZpYZcZls', 'Tablas y diagramas de barras', 'Aula chachi', '9:22'),
  ],
  familia: [
    v('mDpDqe7IDVs', 'Cómo sumar mentalmente al instante', 'Matemóvil', '3:59'),
    v('cN1c8J3sXyA', '¿Cómo elaborar un presupuesto familiar?', 'Superintendencia de Banca del Perú', '1:22'),
    v('nFNzvWjCft8', 'Presupuesto familiar en 3 pasos', 'Mami Emprende', '9:27'),
    v('uQO_oBKqypQ', 'Regla de tres simple directa', 'Matemáticas profe Alex', '6:55'),
    v('y98aiAErP68', 'Porcentajes al instante y sin calculadora', 'Matemóvil', '7:04'),
    v('LlX0QT4nivQ', 'Conversión de unidades de peso', 'Daniel Carreón', '8:00'),
    v('nP9SwAqhVTI', 'Proporcionalidad directa', 'Daniel Carreón', '4:03'),
  ],
};

/** Guía para mamás, papás y cuidadores: cómo acompañar las matemáticas en casa. */
export const guiaFamilias: { tema: string; video: Video }[] = [
  { tema: 'Por qué cuesta y cómo enseñar', video: v('qPIy2jtW0DE', 'El secreto de enseñar matemáticas', 'AprendemosJuntos (BBVA)', '6:20') },
  { tema: 'Explicar sin frustrarse', video: v('2Ofz1N2kHnc', 'Cómo explicar matemáticas a un niño de primaria', 'Francisco Lorenzo', '4:55') },
  { tema: 'Cálculo mental en casa', video: v('kFy-pmNwHI4', 'Cómo ayudo a mi hijo con el cálculo', 'profkris', '5:31') },
  { tema: 'Sumar y restar (1.º y 2.º)', video: v('qa8tzkQczRw', 'Cómo enseñar a sumar y restar a un niño', 'El Mundo del Aprendizaje', '10:18') },
  { tema: 'Las tablas de multiplicar (3.º)', video: v('N3K5i6gJ2vs', 'Cómo enseñar las tablas de multiplicar', 'Seño Lis', '5:47') },
  { tema: 'La división (3.º a 5.º)', video: v('mQ4wKV9_pZs', 'Divisiones paso a paso', 'Daniel Carreón', '9:36') },
];

export function videoDeLeccion(pista: Pista, tramo: number): Video | null {
  return videosLecciones[pista][tramo] ?? null;
}

/** Todos los videos sin repetir (para pruebas y el catálogo docente). */
export function todosLosVideos(): Video[] {
  const vistos = new Map<string, Video>();
  for (const lista of Object.values(videosLecciones)) for (const x of lista) vistos.set(x.id, x);
  for (const g of guiaFamilias) vistos.set(g.video.id, g.video);
  return [...vistos.values()];
}
