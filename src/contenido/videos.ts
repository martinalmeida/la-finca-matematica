// Videos de refuerzo en YouTube (español), uno por lección y una guía para las familias.
// Son contenido externo: necesitan internet y se cargan solo cuando alguien toca «Ver video».
// Revisión completa el 2026-10-28: cada video trata exactamente el tema de su nivel, se habla en español
// y permite verse dentro de la app (ver docs/VIDEOS.md; los «aproximados» están marcados allí).
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

// Videos ya comprobados, por nombre. Cada uno trata exactamente el tema del nivel donde va
// (revisión completa del 2026-10-28: título, canal, descripción, voz en español e inserción).
const V = {
  // 1.º grado
  contarHasta10: v('WhXZaxeZ5sg', 'Contar del 1 al 10 con los dedos', 'Patico De Hule', '3:26'),
  compararHasta20: v('RG9UC-EIWGE', 'Comparar números hasta el 20', 'ElShowDelNerd', '1:54'),
  anteriorPosterior: v('__zZXFW0bBc', 'Número anterior y posterior', 'Peques Aprenden Jugando', '6:04'),
  sumarHasta10: v('maB-2jyzi3o', 'Sumar números del 1 al 10', 'Kids Academy Español', '2:20'),
  sumarHasta20: v('6m7BLiblhQI', 'Suma hasta 20', 'Kids Academy Español', '2:16'),
  restarHasta20: v('nAw2aR4Quuk', 'Restas hasta 20', 'PractiMates', '4:39'),
  faltanPara10: v('PPK1XQRpud4', '¿Cuántos faltan para llegar a 10?', 'Escuela de Aprendices', '3:45'),
  decenasUnidades: v('0j-80cSRVOk', 'Unidades y decenas (primer grado)', 'Tutoriales Aprende en un Click', '4:30'),
  sumaRestaSinLlevar: v('b8EVbkvN5SM', 'Suma y resta con dos cifras sin llevar', 'Milton Education', '2:05'),
  problemasSumaResta: v('Sa_3MIlJwPs', 'Problemas de suma y resta', 'Smile and Learn', '3:35'),
  // 2.º grado
  sumaRestaTresCifras: v('DPnoGr-aFqE', 'Suma y resta con tres dígitos (hasta centenas)', 'Profa. Kempis', '15:22'),
  sumaRepetida: v('W88npFSL6hI', 'La multiplicación como suma repetida', 'Daniel Carreón', '3:51'),
  arreglos: v('Upk4uPmG35U', '¿Qué son los arreglos rectangulares?', 'Aula365', '5:08'),
  contar2510: v('3KiDA0rxw9U', 'Contar de 2 en 2, de 5 en 5 y de 10 en 10', 'ESMATE', '6:34'),
  tablas3y4: v('xYfqctQbwf4', 'Canción de las tablas del 3 y del 4', 'Canti Rondas', '3:18'),
  tablas6a9: v('7-GqSQX_AyE', 'Multiplicar con los dedos del 6 al 10', 'Profe Richard', '5:27'),
  problemasMultDiv: v('gkRdcLfELxg', 'Problemas de multiplicación y división', 'Smile and Learn', '3:50'),
  multUnaCifra: v('_qaPe8preOg', 'Multiplicar por una cifra, sin llevar y llevando', 'Matemóvil', '7:41'),
  problemasMult3x1: v('UloZaAFC-sM', 'Problemas de multiplicación: tres cifras por una', 'Daniel Carreón', '4:53'),
  dineroMult: v('Ma7qMYzwmJc', '¿Cuánto dinero hay? Problemas de multiplicación', 'Aula365', '5:17'),
  // 3.º grado
  trucosTablas: v('Xv_zwlem5ek', '6 trucos para las tablas de multiplicar', 'Matemóvil', '8:31'),
  repartir: v('iA0fP4tL67s', 'Aprendiendo a repartir: la división', 'Happy Learning', '2:05'),
  divisionAgrupar: v('ha0J5pCQu3Q', 'División por agrupación', 'Math2me Kids', '5:59'),
  multDivParientes: v('wEuGJUrI_VI', 'Relación entre multiplicación y división', 'Proyecto Investic', '3:47'),
  dividirConTablas: v('DMsLbNdo6x8', 'Dividir usando las tablas de multiplicar', 'Escuela Eliecer Pérez Vargas', '4:53'),
  divisionResiduo: v('bKk3NgaQYqw', 'División con y sin residuo', 'ESMATE', '3:39'),
  divisionesPaso: v('mQ4wKV9_pZs', 'Divisiones paso a paso', 'Daniel Carreón', '9:36'),
  residuo: v('Ghc-ghLhnm8', 'Interpretar el residuo de una división', 'Classrom en @cción', '2:42'),
  dosOperaciones: v('DIhNk_4rGfQ', 'Problemas con dos operaciones', 'Daniel Carreón', '3:42'),
  // 4.º grado
  sumaRestaGrandes: v('77jKOTRFLEA', 'Adición y sustracción hasta la unidad de millón', 'Jorge Armando Quiroz Cabada', '5:37'),
  multDosCifras: v('CGXHrIp7Dpw', 'Multiplicación por dos cifras', 'Daniel Carreón', '3:43'),
  dividirDosCifras: v('g1zna75Ph-c', 'Dividir entre dos cifras', 'Smile and Learn', '6:42'),
  pruebaDivision: v('hFDI2oQCktU', 'La prueba de la división', 'Smartick', '4:33'),
  dobleTripleMitad: v('5RFDuFPQUAw', 'Mitades, dobles y triples', 'Isela López', '6:31'),
  combinadas: v('RZzyWljhMEw', 'Operaciones combinadas', 'Smile and Learn', '3:13'),
  interpretarTablas: v('qK6BhzWoXUw', 'Interpretar tablas de datos', 'La BiBlioTHeKa', '1:58'),
  // 5.º grado
  redondear: v('zSZETm0OGOs', 'Redondear números (5.º)', 'Profesora Sindy: Matematiclases', '9:48'),
  multTresCifras: v('wVJRhd2xypY', 'Multiplicación con tres cifras', 'Daniel Carreón', '3:25'),
  cuatroOperaciones: v('3_scwDY4N1M', 'Resolver problemas con las cuatro operaciones', 'CANALEDUCA Chile', '7:40'),
  decimas: v('RsXOs4vETlY', 'Unidad, décima y centésima', 'Peques Aprenden Jugando', '2:24'),
  compararDecimales: v('c4Oe4XY5sdM', 'Comparación de números decimales', 'Aula chachi', '5:25'),
  sumarDecimales: v('zRyZ_XPo_SE', 'Suma y resta con números decimales', 'Smile and Learn', '4:31'),
  multDecimales: v('shXj-YCWWeM', 'Multiplicación con decimales', 'Daniel Carreón', '3:39'),
  dividirDecimal: v('ZRP6sGnbqxw', 'Dividir con cociente decimal', 'Chris ValanMi', '2:29'),
  problemasDecimales: v('DcIOkncWpFw', 'Problema con números decimales', 'Profesor CocoLoco', '9:37'),
  // Inclusión
  clasificar: v('N8PCwLkkepM', 'Clasificar por color, forma y tamaño', 'ElShowDelNerd', '1:51'),
  tamanosComparar: v('bZTA86DHMFM', 'Grande y pequeño, alto y bajo, largo y corto', 'KidsLumiLand', '3:00'),
  unoMuchosNinguno: v('8NR0QQF32EU', 'Muchos, pocos, uno, ninguno', 'Moreh Higa', '3:51'),
  masMenosIgual: v('XARHIfXjk-o', 'Más, menos e igual', 'Plaza Sésamo', '1:40'),
  numeros1a3: v('GfvAKWv8qCc', 'Los números 1, 2 y 3 con la canción de los elefantes', 'Cantatoo', '2:57'),
  numeros1a5: v('FkBEPfM4PcQ', 'Los números del 1 al 5', 'Babyradio', '4:32'),
  seriacionAltura: v('6zulsMkKFJU', 'Seriación por altura', 'Cata Lina', '3:15'),
  escribirHasta10: v('wd8h8fAUsJA', 'Aprender a escribir los números hasta el 10', 'Peques Aprenden Jugando', '5:18'),
  secuencias: v('Mk6ZR3h8Q-I', 'Secuencias numéricas para niños pequeños', 'DUCASIDAD - Educación Especial Primaria', '3:52'),
  mayorMenor: v('Rxj_0DsQzk8', 'Mayor que, menor que e igual', 'Minders', '3:01'),
  contarEscribir20: v('6vRfrP6PfrY', 'Números del 10 al 20: contar y escribir', 'Profesora Norma Urbina', '12:58'),
  componer10: v('MCv52Le4bGc', 'Componer números hasta el 10', 'Profesora Constanza Olave', '3:28'),
  sumarObjetos: v('FY5oSo9bFwM', 'Sumar juntando objetos', 'Peques Aprenden Jugando', '2:54'),
  restarQuitando: v('_-qI2BK-18U', 'Restar quitando hasta 10', 'ElShowDelNerd', '1:52'),
  cuentoSuma: v('Jthm7qPtGiU', 'Cuento de la suma', 'Cecilia Silva Sandoval', '2:38'),
  sumar: v('oexd_Dfic_Q', 'Aprendiendo a sumar', 'Happy Learning', '4:47'),
  restar: v('42vjqtleG9E', 'Aprendiendo a restar', 'Happy Learning', '4:33'),
  sumarDedos: v('POEJVNbBegQ', 'Cómo sumar con ayuda de mis dedos', 'Lore Hernández', '1:27'),
  decenasUnidadesPeques: v('FKIs7Bp51Bw', 'Las decenas y las unidades', 'Peques Aprenden Jugando', '8:10'),
  // Familias
  plata: v('35Ho7YOdQUs', 'Suma y resta con dinero', 'Daniel Carreón', '12:00'),
  sumarMental: v('mDpDqe7IDVs', 'Cómo sumar mentalmente al instante', 'Matemóvil', '3:59'),
  vuelto: v('gKVGyH1lXuk', 'Cómo calcular el vuelto', 'Learn with Socrates', '3:51'),
  multiplicarCeros: v('3ereGB0d53Y', 'Cálculo mental: multiplicar decenas y centenas acabadas en 0', 'Smile and Learn', '5:32'),
  problemasMultUna: v('M8LekjX2usM', 'Problemas con multiplicaciones de una cifra', 'Daniel Carreón', '3:15'),
  divisionAgrupamiento: v('fAC4lyYKa9w', 'La división como agrupamiento', 'Daniel Carreón', '5:25'),
  problemasDivision: v('RUMy7uHTqcU', 'Problemas de división', 'Wendy Carranza', '3:40'),
  tresFactores: v('w7c2uWA6kYg', 'Problemas de multiplicación de tres factores', 'STVE Telebásica', '5:28'),
  presupuesto: v('cN1c8J3sXyA', '¿Cómo elaborar un presupuesto familiar?', 'Superintendencia de Banca del Perú', '1:22'),
  presupuesto3: v('nFNzvWjCft8', 'Presupuesto familiar en 3 pasos', 'Mami Emprende', '9:27'),
  estimarRedondeando: v('yk5b6A6i5gQ', 'Estimar sumas y restas redondeando', 'ElShowDelNerd', '1:50'),
  porcentajes: v('y98aiAErP68', 'Porcentajes al instante y sin calculadora', 'Matemóvil', '7:04'),
  porcentajes102550: v('_OSlHbmDD9g', 'Cómo se calculan el 10 %, 20 %, 25 % y 50 %', 'El profesor Prade', '15:09'),
  porcentaje: v('RE3XoDORMys', 'Cómo calcular un porcentaje', 'Daniel Carreón', '4:20'),
  descuentos: v('jjyJ4p3E4KM', 'Cómo calcular descuentos', 'Daniel Carreón', '5:02'),
  disminucion: v('ANYcYWnA8iA', 'Cálculo de porcentajes de disminución', 'MatemátiKatz', '2:12'),
  reglaDeTres: v('uQO_oBKqypQ', 'Regla de tres simple directa', 'Matemáticas profe Alex', '6:55'),
  proporcionalidad: v('nP9SwAqhVTI', 'Proporcionalidad directa', 'Daniel Carreón', '4:03'),
  unidadesPeso: v('LlX0QT4nivQ', 'Conversión de unidades de peso', 'Daniel Carreón', '8:00'),
  kilosGramos: v('4TIX8Y8gN0Q', 'Cómo pasar de kilos a gramos', 'Respuestasenvideo', '2:10'),
  hectarea: v('ezsJqCZfQAg', 'Hectárea, área y centiárea', 'La BiBlioTHeKa', '2:43'),
  ganancia: v('dGEc1qMFttQ', 'Cómo sacar la ganancia de un producto', 'Sistema Empresarial Aguilar', '5:34'),
  ingresosGastos: v('0PCwt2L4RdU', 'Ingresos, costos y gastos', 'AulaDeEconomia', '5:14'),
};

/** Un video por nivel (el índice es el nivel − 1). Es el video de introducción de cada nivel. */
export const videosLecciones: Record<Pista, Video[]> = {
  g1: [V.contarHasta10, V.compararHasta20, V.anteriorPosterior, V.sumarHasta10, V.sumarHasta20, V.restarHasta20, V.faltanPara10, V.decenasUnidades, V.sumaRestaSinLlevar, V.problemasSumaResta],
  g2: [V.sumaRestaTresCifras, V.sumaRepetida, V.arreglos, V.contar2510, V.tablas3y4, V.tablas6a9, V.problemasMultDiv, V.multUnaCifra, V.problemasMult3x1, V.dineroMult],
  g3: [V.trucosTablas, V.repartir, V.divisionAgrupar, V.multDivParientes, V.dividirConTablas, V.divisionResiduo, V.divisionesPaso, V.residuo, V.dosOperaciones, V.problemasMultDiv],
  g4: [V.sumaRestaGrandes, V.multDosCifras, V.divisionResiduo, V.divisionesPaso, V.dividirDosCifras, V.pruebaDivision, V.residuo, V.dobleTripleMitad, V.combinadas, V.interpretarTablas],
  g5: [V.redondear, V.multTresCifras, V.dividirDosCifras, V.cuatroOperaciones, V.decimas, V.compararDecimales, V.sumarDecimales, V.multDecimales, V.dividirDecimal, V.problemasDecimales],
  // Inclusión: un video por nivel (23), de los 7 bloques en orden.
  inclusion: [
    V.clasificar, V.tamanosComparar, V.unoMuchosNinguno, V.masMenosIgual,
    V.numeros1a3, V.numeros1a5, V.seriacionAltura,
    V.contarHasta10, V.escribirHasta10, V.secuencias, V.mayorMenor,
    V.contarEscribir20, V.anteriorPosterior, V.componer10,
    V.sumarObjetos, V.restarQuitando, V.cuentoSuma,
    V.sumar, V.restar, V.sumarDedos, V.problemasSumaResta,
    V.decenasUnidadesPeques, V.sumaRestaSinLlevar,
  ],
  familia: [V.plata, V.vuelto, V.multiplicarCeros, V.problemasMultUna, V.residuo, V.presupuesto, V.porcentajes, V.reglaDeTres, V.unidadesPeso, V.ganancia],
  'fam-basica': [V.plata, V.vuelto, V.multiplicarCeros, V.problemasMultUna, V.divisionAgrupamiento, V.residuo, V.tresFactores, V.presupuesto, V.estimarRedondeando, V.presupuesto3],
  'fam-intermedia': [V.sumarMental, V.problemasMultUna, V.problemasMult3x1, V.problemasDivision, V.residuo, V.tresFactores, V.presupuesto3, V.porcentajes102550, V.porcentaje, V.ganancia],
  'fam-avanzada': [V.porcentajes, V.descuentos, V.disminucion, V.unidadesPeso, V.kilosGramos, V.hectarea, V.proporcionalidad, V.unidadesPeso, V.ingresosGastos, V.ganancia],
};

/** Videos que se repiten a propósito dentro de una misma ruta (el tema es el mismo). */
export const repetidosPermitidos: Partial<Record<Pista, string[]>> = {
  // «Arrobas y kilos» y «Comparar unidades de peso»: no hay un video en español sobre arrobas
  // con la equivalencia colombiana (1 arroba = 12,5 kilos); se usa el de conversión de peso.
  'fam-avanzada': [V.unidadesPeso.id],
};

/** Guía para mamás, papás y cuidadores: cómo acompañar las matemáticas en casa. */
export const guiaFamilias: { tema: string; video: Video }[] = [
  { tema: 'Por qué cuesta y cómo enseñar', video: v('qPIy2jtW0DE', 'El secreto de enseñar matemáticas', 'AprendemosJuntos (BBVA)', '6:20') },
  { tema: 'Explicar sin frustrarse', video: v('2Ofz1N2kHnc', 'Cómo explicar matemáticas a un niño de primaria', 'Francisco Lorenzo', '4:55') },
  { tema: 'Cálculo mental en casa', video: v('kFy-pmNwHI4', 'Cómo ayudo a mi hijo con el cálculo', 'profkris', '5:31') },
  { tema: 'Sumar y restar (1.º y 2.º)', video: v('qa8tzkQczRw', 'Cómo enseñar a sumar y restar a un niño', 'El Mundo del Aprendizaje', '10:18') },
  { tema: 'Las tablas de multiplicar (3.º)', video: v('N3K5i6gJ2vs', 'Cómo enseñar las tablas de multiplicar', 'Seño Lis', '5:47') },
  { tema: 'La división (3.º a 5.º)', video: v('pBsMIDVJlMM', '7 ideas para aprender a dividir fácil', 'Power Kids', '9:26') },
];

/** Video del nivel `indice + 1` (para una lección, el de su primer nivel). */
export function videoDeLeccion(pista: Pista, indice: number): Video | null {
  return videosLecciones[pista][indice] ?? null;
}

/** Todos los videos sin repetir (para pruebas y el catálogo docente). */
export function todosLosVideos(): Video[] {
  const vistos = new Map<string, Video>();
  for (const lista of Object.values(videosLecciones)) for (const x of lista) if (x) vistos.set(x.id, x);
  for (const g of guiaFamilias) vistos.set(g.video.id, g.video);
  return [...vistos.values()];
}
