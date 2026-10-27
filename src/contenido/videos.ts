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

// Videos ya comprobados, por nombre, para repartirlos entre los temas.
const V = {
  numeros: v('O-37lugLe9s', 'La canción de los números del 1 al 20', 'Smile and Learn', '2:41'),
  mayorMenor: v('Rxj_0DsQzk8', 'Mayor que, menor que e igual', 'Minders', '3:01'),
  sumar: v('oexd_Dfic_Q', 'Aprendiendo a sumar', 'Happy Learning', '4:47'),
  restar: v('42vjqtleG9E', 'Aprendiendo a restar', 'Happy Learning', '4:33'),
  decenas: v('Gg1j4W3xJuM', 'Unidades, decenas y centenas', 'Happy Learning', '4:59'),
  repartir: v('iA0fP4tL67s', 'Aprendiendo a repartir: la división', 'Happy Learning', '2:05'),
  problemasSumaResta: v('Sa_3MIlJwPs', 'Problemas de suma y resta', 'Smile and Learn', '3:35'),
  llevadas: v('k46QCr1GofU', 'Sumas con llevadas', 'Mundo Primaria', '2:13'),
  multDiv: v('3QPpyuNycQI', 'Multiplicación y división para niños', 'Smile and Learn', '6:43'),
  calculoMental9: v('CgSwPMyEasQ', 'Cálculo mental: sumar y restar 9', 'Smile and Learn', '4:41'),
  trucosTablas: v('Xv_zwlem5ek', '6 trucos para las tablas de multiplicar', 'Matemóvil', '8:31'),
  multUnaCifra: v('_qaPe8preOg', 'Multiplicar por una cifra, sin llevar y llevando', 'Matemóvil', '7:41'),
  division: v('zF4GYIbSMzg', 'La división: aprende a dividir', 'Smile and Learn', '3:22'),
  queOperacion: v('3cKEq2tEYoI', '¿Qué operación hago en un problema?', 'Clases Particulares en Ávila', '5:49'),
  problemasMultDiv: v('gkRdcLfELxg', 'Problemas de multiplicación y división', 'Smile and Learn', '3:50'),
  comoMultiplicar: v('AE4B0hgnz0E', 'Cómo hacer una multiplicación', 'Daniel Carreón', '4:10'),
  numerosGrandes: v('OwcbKpwJnyA', 'Cómo leer números muy grandes', 'Daniel Carreón', '4:25'),
  multDosCifras: v('CGXHrIp7Dpw', 'Multiplicación por dos cifras', 'Daniel Carreón', '3:43'),
  divisionesPaso: v('mQ4wKV9_pZs', 'Divisiones paso a paso', 'Daniel Carreón', '9:36'),
  residuo: v('Ghc-ghLhnm8', 'Interpretar el residuo de una división', 'Classrom en @cción', '2:42'),
  combinadas: v('RZzyWljhMEw', 'Operaciones combinadas', 'Smile and Learn', '3:13'),
  problemasMult: v('UloZaAFC-sM', 'Problemas de multiplicación', 'Daniel Carreón', '4:53'),
  dividirUnaCifra: v('0D1wxxlBN-0', 'Dividir por una cifra', 'academia JAF', '8:19'),
  multTresCifras: v('wVJRhd2xypY', 'Multiplicación con tres cifras', 'Daniel Carreón', '3:25'),
  dividirDosCifras: v('g1zna75Ph-c', 'Dividir entre dos cifras', 'Smile and Learn', '6:42'),
  pruebaDivision: v('hFDI2oQCktU', 'La prueba de la división', 'Smartick', '4:33'),
  tablasBarras: v('CvVZpYZcZls', 'Tablas y diagramas de barras', 'Aula chachi', '9:22'),
  sumarMental: v('mDpDqe7IDVs', 'Cómo sumar mentalmente al instante', 'Matemóvil', '3:59'),
  presupuesto: v('cN1c8J3sXyA', '¿Cómo elaborar un presupuesto familiar?', 'Superintendencia de Banca del Perú', '1:22'),
  presupuesto3: v('nFNzvWjCft8', 'Presupuesto familiar en 3 pasos', 'Mami Emprende', '9:27'),
  reglaDeTres: v('uQO_oBKqypQ', 'Regla de tres simple directa', 'Matemáticas profe Alex', '6:55'),
  porcentajes: v('y98aiAErP68', 'Porcentajes al instante y sin calculadora', 'Matemóvil', '7:04'),
  unidadesPeso: v('LlX0QT4nivQ', 'Conversión de unidades de peso', 'Daniel Carreón', '8:00'),
  proporcionalidad: v('nP9SwAqhVTI', 'Proporcionalidad directa', 'Daniel Carreón', '4:03'),
  // Decimales (5.º), comprobados el 2026-10-27.
  decimas: v('RsXOs4vETlY', 'Unidad, décima y centésima', 'Peques Aprenden Jugando', '2:24'),
  compararDecimales: v('c4Oe4XY5sdM', 'Comparación de números decimales', 'Aula chachi', '5:25'),
  sumarDecimales: v('zRyZ_XPo_SE', 'Suma y resta con números decimales', 'Smile and Learn', '4:31'),
  operarDecimales: v('-Q8LHMgeYgU', 'Operaciones con números decimales', 'Aula chachi', '9:08'),
  dividirDecimal: v('ZRP6sGnbqxw', 'Dividir con cociente decimal', 'Chris ValanMi', '2:29'),
  problemasDecimales: v('DcIOkncWpFw', 'Problema con números decimales', 'Profesor CocoLoco', '9:37'),
  // Videos de introducción para completar los 10 niveles de cada ruta, comprobados el 2026-10-27.
  anteriorPosterior: v('__zZXFW0bBc', 'Número anterior y posterior', 'Peques Aprenden Jugando', '6:04'),
  faltanPara10: v('PPK1XQRpud4', '¿Cuántos faltan para llegar a 10?', 'Escuela de Aprendices', '3:45'),
  sumasSinLlevar: v('-UTpOFdGPkc', 'Sumas de 2 cifras sin llevar', 'La BiBlioTHeKa', '2:48'),
  arreglos: v('Upk4uPmG35U', '¿Qué son los arreglos rectangulares?', 'Aula365', '5:08'),
  tablas3y4: v('xYfqctQbwf4', 'Canción de las tablas del 3 y del 4', 'Canti Rondas', '3:18'),
  tablas6a9: v('CS_OwinLvyg', 'Truco con las manos para las tablas del 6 al 9', 'guiainfantil', '4:25'),
  dividirConCaja: v('Kb8hz4BPi5M', 'Dividir con caja', 'Smile and Learn', '4:44'),
  dobleTripleMitad: v('5RFDuFPQUAw', 'Mitades, dobles y triples', 'Isela López', '6:31'),
  escribirHasta5: v('-bgsBMUyzwA', 'Aprender a escribir los números hasta el 5', 'Peques Aprenden Jugando', '2:29'),
  escribirHasta10: v('wd8h8fAUsJA', 'Aprender a escribir los números hasta el 10', 'Peques Aprenden Jugando', '5:18'),
  numeros1a5: v('FkBEPfM4PcQ', 'Los números del 1 al 5', 'Babyradio', '4:32'),
  masMenosIgual: v('XARHIfXjk-o', 'Más, menos e igual', 'Plaza Sésamo', '1:40'),
  sumarObjetos: v('FY5oSo9bFwM', 'Sumar juntando objetos', 'Peques Aprenden Jugando', '2:54'),
  restarQuitando: v('_-qI2BK-18U', 'Restar quitando hasta 10', 'ElShowDelNerd', '1:52'),
  contarEscribir10: v('qHkEDhTaPnk', 'Escribir y contar los números del 1 al 10', 'Smile and Learn', '5:22'),
  vuelto: v('gKVGyH1lXuk', 'Cómo calcular el vuelto', 'Learn with Socrates', '3:51'),
  problemasMultUna: v('M8LekjX2usM', 'Problemas con multiplicaciones de una cifra', 'Daniel Carreón', '3:15'),
  divisionAgrupar: v('fAC4lyYKa9w', 'La división como agrupamiento', 'Daniel Carreón', '5:25'),
  problemasMultDos: v('WoJ6b8_KBRc', 'Problemas de multiplicar con 2 cifras', 'Daniel Carreón', '3:44'),
  aproximar: v('g1zUhnc9Pn0', 'Aproximaciones: calcular más o menos', 'Clases Particulares en Ávila', '6:17'),
  costoVenta: v('9WQUHX8G-I0', 'Precio de costo, precio de venta y pérdida', 'Academia Internet', '3:22'),
  porcentaje: v('RE3XoDORMys', 'Cómo calcular un porcentaje', 'Daniel Carreón', '4:20'),
  hectarea: v('ezsJqCZfQAg', 'Hectárea, área y centiárea', 'La BiBlioTHeKa', '2:43'),
  ingresosGastos: v('0PCwt2L4RdU', 'Ingresos, costos y gastos', 'AulaDeEconomia', '5:14'),
};

/** Un video por tema (el índice es el tema, 0 a 9). Es el video de introducción de cada nivel. */
export const videosLecciones: Record<Pista, Video[]> = {
  g1: [V.numeros, V.mayorMenor, V.anteriorPosterior, V.sumar, V.calculoMental9, V.restar, V.faltanPara10, V.decenas, V.sumasSinLlevar, V.problemasSumaResta],
  g2: [V.llevadas, V.multDiv, V.arreglos, V.trucosTablas, V.tablas3y4, V.tablas6a9, V.problemasMultDiv, V.multUnaCifra, V.comoMultiplicar, V.problemasMult],
  g3: [V.trucosTablas, V.repartir, V.division, V.multDiv, V.dividirConCaja, V.dividirUnaCifra, V.divisionesPaso, V.residuo, V.queOperacion, V.problemasMultDiv],
  g4: [V.numerosGrandes, V.multDosCifras, V.dividirUnaCifra, V.divisionesPaso, V.dividirDosCifras, V.pruebaDivision, V.residuo, V.dobleTripleMitad, V.combinadas, V.tablasBarras],
  g5: [V.numerosGrandes, V.multTresCifras, V.dividirDosCifras, V.combinadas, V.decimas, V.compararDecimales, V.sumarDecimales, V.operarDecimales, V.dividirDecimal, V.problemasDecimales],
  inclusion: [V.numeros, V.numeros, V.escribirHasta5, V.escribirHasta10, V.numeros, V.numeros1a5, V.masMenosIgual, V.sumarObjetos, V.restarQuitando, V.contarEscribir10],
  familia: [V.sumarMental, V.vuelto, V.problemasMultUna, V.divisionAgrupar, V.residuo, V.presupuesto, V.porcentajes, V.reglaDeTres, V.unidadesPeso, V.costoVenta],
  'fam-basica': [V.sumarMental, V.vuelto, V.problemasMultUna, V.divisionAgrupar, V.divisionesPaso, V.residuo, V.problemasMultDos, V.presupuesto, V.aproximar, V.presupuesto3],
  'fam-intermedia': [V.sumarMental, V.problemasMultUna, V.problemasMult, V.multDosCifras, V.residuo, V.problemasMultDos, V.presupuesto3, V.porcentajes, V.porcentajes, V.costoVenta],
  'fam-avanzada': [V.porcentajes, V.porcentajes, V.porcentaje, V.unidadesPeso, V.unidadesPeso, V.hectarea, V.proporcionalidad, V.unidadesPeso, V.ingresosGastos, V.reglaDeTres],
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

export function videoDeLeccion(pista: Pista, tema: number): Video | null {
  return videosLecciones[pista][tema] ?? null;
}

/** Todos los videos sin repetir (para pruebas y el catálogo docente). */
export function todosLosVideos(): Video[] {
  const vistos = new Map<string, Video>();
  for (const lista of Object.values(videosLecciones)) for (const x of lista) if (x) vistos.set(x.id, x);
  for (const g of guiaFamilias) vistos.set(g.video.id, g.video);
  return [...vistos.values()];
}
