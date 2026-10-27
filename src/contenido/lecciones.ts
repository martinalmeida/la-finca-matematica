// Mini-lecciones por grado y unidad (tramo): se muestran como historias en Inicio y Aprender.
// A los niños (g1–g5) se les tutea; a las familias se les trata de usted.
// Los precios y porcentajes son de ejemplo: no son precios ni datos técnicos reales.
import type { Pista } from '../juego/tipos';

export type Leccion = {
  /** Índice del tramo (0–6) en la pista. */
  tramo: number;
  /** Título corto (máx. ~32 caracteres). */
  titulo: string;
  /** Un emoji que represente la lección. */
  emoji: string;
  /** Quién "publica" la lección (de contexto.ts), p. ej. 'el profe Julián'. */
  autor: string;
  /** La idea clave en 1–2 frases sencillas. */
  idea: string;
  /** Ejemplo resuelto en contexto rural. */
  ejemplo: { enunciado: string; pasos: string[]; resultado: string };
  /** Un truco o consejo para recordar. */
  truco: string;
  /** Mini-reto de comprobación: 3 opciones, una correcta. */
  reto: { pregunta: string; opciones: string[]; correcta: number; porque: string };
};

const g1: Leccion[] = [
  {
    tramo: 0,
    titulo: '¡Vamos a contar!',
    emoji: '🥚',
    autor: 'el profe Julián',
    idea: 'Contar es decir un número por cada cosa. El último número dice cuántas hay.',
    ejemplo: {
      enunciado: 'Valentina recoge 3 huevos. Luego recoge 2 más.',
      pasos: ['Contamos los primeros: 1, 2, 3.', 'Seguimos con los nuevos: 4, 5.', 'El último número fue 5.'],
      resultado: 'Valentina tiene 5 huevos.',
    },
    truco: 'Toca cada huevo una sola vez al contar.',
    reto: {
      pregunta: '¿Cuántos huevos hay? 🥚🥚🥚🥚🥚🥚🥚',
      opciones: ['6 huevos', '7 huevos', '8 huevos'],
      correcta: 1,
      porque: 'Contamos uno por uno: 1, 2, 3, 4, 5, 6, 7.',
    },
  },
  {
    tramo: 1,
    titulo: '¿Quién tiene más?',
    emoji: '🍫',
    autor: 'doña Rosa',
    idea: 'Para comparar, mira primero las decenas. Si son iguales, mira las unidades.',
    ejemplo: {
      enunciado: 'Santiago tiene 14 mazorcas de cacao. Valentina tiene 11.',
      pasos: ['Los dos tienen 1 decena.', 'Miramos las unidades: 4 es más que 1.', 'De 11 a 14 contamos: 12, 13, 14. Son 3 más.'],
      resultado: 'Santiago tiene 3 mazorcas más: 14 > 11.',
    },
    truco: 'En la recta numérica, el número mayor está más a la derecha.',
    reto: {
      pregunta: '¿Qué número es mayor: 17 o 19?',
      opciones: ['17', 'Son iguales', '19'],
      correcta: 2,
      porque: 'Los dos tienen 1 decena, y 9 unidades son más que 7.',
    },
  },
  {
    tramo: 2,
    titulo: 'Sumar es juntar',
    emoji: '🐔',
    autor: 'la abuela Carmen',
    idea: 'Sumar es juntar dos grupos. Puedes completar 10 para sumar más fácil.',
    ejemplo: {
      enunciado: 'Hay 8 huevos. Las gallinas ponen 5 más.',
      pasos: ['Partimos el 5 en 2 y 3.', 'Completamos 10: 8 + 2 = 10.', 'Sumamos lo que queda: 10 + 3 = 13.'],
      resultado: 'Ahora hay 13 huevos.',
    },
    truco: 'Empieza por el número mayor y cuenta hacia adelante.',
    reto: {
      pregunta: 'Hay 9 naranjas y llegan 4 más. ¿Cuántas hay?',
      opciones: ['13 naranjas', '12 naranjas', '5 naranjas'],
      correcta: 0,
      porque: '9 + 1 = 10 y 10 + 3 = 13. Si da 5, restaste.',
    },
  },
  {
    tramo: 3,
    titulo: 'Restar es quitar',
    emoji: '🍊',
    autor: 'don Ramiro',
    idea: 'Restar es quitar. Para llegar a 10, piensa cuánto falta.',
    ejemplo: {
      enunciado: 'Valentina tiene 15 naranjas. Regala 6.',
      pasos: ['Partimos el 6 en 5 y 1.', 'Quitamos 5: 15 − 5 = 10.', 'Quitamos 1 más: 10 − 1 = 9.'],
      resultado: 'Le quedan 9 naranjas.',
    },
    truco: 'Para comprobar, suma lo que queda y lo que quitaste: 9 + 6 = 15.',
    reto: {
      pregunta: 'En la cubeta caben 10 huevos. Hay 7. ¿Cuántos faltan?',
      opciones: ['17 huevos', '3 huevos', '4 huevos'],
      correcta: 1,
      porque: '7 + 3 = 10. Faltan 3 para llenar la cubeta.',
    },
  },
  {
    tramo: 4,
    titulo: 'Decenas y unidades',
    emoji: '🧺',
    autor: 'el profe Julián',
    idea: 'Una decena son 10 unidades. Suma unidades con unidades y decenas con decenas.',
    ejemplo: {
      enunciado: 'Doña Rosa tiene 23 huevos. Recoge 14 más.',
      pasos: ['Primero sumamos las unidades: 3 + 4 = 7.', 'Luego sumamos las decenas: 2 + 1 = 3.', '3 decenas y 7 unidades son 37.'],
      resultado: 'Doña Rosa tiene 37 huevos.',
    },
    truco: 'Escribe los números uno debajo del otro: unidades bajo unidades.',
    reto: {
      pregunta: 'Había 45 huevos. Se vendieron 23. ¿Cuántos quedan?',
      opciones: ['68 huevos', '21 huevos', '22 huevos'],
      correcta: 2,
      porque: 'Unidades: 5 − 3 = 2. Decenas: 4 − 2 = 2. Quedan 22. Si da 68, sumaste.',
    },
  },
  {
    tramo: 5,
    titulo: 'Juntar, quitar y repartir',
    emoji: '🤝',
    autor: 'la tía Gloria',
    idea: 'Para saber cuántos más, resta. Repartir es dar lo mismo a cada uno.',
    ejemplo: {
      enunciado: 'Santiago cortó 58 mazorcas. Valentina cortó 35. ¿Cuántas más cortó Santiago?',
      pasos: ['Restamos las unidades: 8 − 5 = 3.', 'Restamos las decenas: 5 − 3 = 2.', '2 decenas y 3 unidades son 23.'],
      resultado: 'Santiago cortó 23 mazorcas más.',
    },
    truco: 'Para repartir, da de a uno a cada persona hasta que se acaben.',
    reto: {
      pregunta: 'Reparte 12 naranjas entre 3 niños por igual. ¿Cuántas recibe cada uno?',
      opciones: ['4 naranjas', '15 naranjas', '9 naranjas'],
      correcta: 0,
      porque: '4 + 4 + 4 = 12. Cada niño recibe 4.',
    },
  },
  {
    tramo: 6,
    titulo: '¿Sumo o resto?',
    emoji: '🏆',
    autor: 'Valentina',
    idea: 'Lee el problema dos veces. Piensa si juntas, quitas o comparas.',
    ejemplo: {
      enunciado: 'Doña Rosa tenía 34 huevos. Recogió más y ahora tiene 57. ¿Cuántos recogió?',
      pasos: ['Buscamos lo que falta de 34 a 57.', 'Unidades: 7 − 4 = 3.', 'Decenas: 5 − 3 = 2. Son 23.'],
      resultado: 'Recogió 23 huevos. Comprobamos: 34 + 23 = 57.',
    },
    truco: 'Si sabes el total y una parte, resta para hallar la otra parte.',
    reto: {
      pregunta: 'Había 26 mazorcas. Cortaron 12 más. ¿Cuántas hay?',
      opciones: ['14 mazorcas', '38 mazorcas', '37 mazorcas'],
      correcta: 1,
      porque: 'Cortar más es juntar: 26 + 12 = 38. Si da 14, restaste.',
    },
  },
];

const g2: Leccion[] = [
  {
    tramo: 0,
    titulo: 'Repaso: sumar llevando',
    emoji: '👋',
    autor: 'el profe Julián',
    idea: 'Si las unidades pasan de 9, formas una decena y la llevas.',
    ejemplo: {
      enunciado: 'Santiago cogió 36 naranjas y Valentina 47. ¿Cuántas cogieron?',
      pasos: ['Unidades: 6 + 7 = 13. Escribo 3 y llevo 1.', 'Decenas: 3 + 4 + 1 = 8.', 'El resultado es 83.'],
      resultado: 'Cogieron 83 naranjas.',
    },
    truco: 'Escribe chiquito el 1 que llevas encima de las decenas.',
    reto: {
      pregunta: '¿Cuánto es 58 + 25?',
      opciones: ['73', '83', '33'],
      correcta: 1,
      porque: '8 + 5 = 13, llevo 1. 5 + 2 + 1 = 8. Da 83. Si da 73, olvidaste llevar.',
    },
  },
  {
    tramo: 1,
    titulo: 'Centenas, decenas y unidades',
    emoji: '📦',
    autor: 'don Ramiro',
    idea: 'Cada cifra vale según su lugar. 1 centena son 10 decenas, o sea 100.',
    ejemplo: {
      enunciado: 'Don Ramiro empacó 365 huevos: cajas de 100, bolsas de 10 y sueltos.',
      pasos: ['3 cajas de 100 son 300.', '6 bolsas de 10 son 60.', '5 huevos sueltos son 5.', '300 + 60 + 5 = 365.'],
      resultado: '365 tiene 3 centenas, 6 decenas y 5 unidades.',
    },
    truco: 'Lee de izquierda a derecha: centenas, decenas, unidades.',
    reto: {
      pregunta: '¿Cuánto vale el 4 en el número 742?',
      opciones: ['4', '40', '400'],
      correcta: 1,
      porque: 'El 4 está en el lugar de las decenas: vale 40.',
    },
  },
  {
    tramo: 2,
    titulo: 'Sumar con reagrupación',
    emoji: '➕',
    autor: 'doña Rosa',
    idea: 'Suma desde las unidades. Si pasas de 9, llevas 1 al siguiente lugar.',
    ejemplo: {
      enunciado: 'La cooperativa recibió 258 mazorcas el lunes y 167 el martes.',
      pasos: ['Unidades: 8 + 7 = 15. Escribo 5 y llevo 1.', 'Decenas: 5 + 6 + 1 = 12. Escribo 2 y llevo 1.', 'Centenas: 2 + 1 + 1 = 4.'],
      resultado: 'En total recibió 425 mazorcas.',
    },
    truco: 'Siempre empieza por la derecha, por las unidades.',
    reto: {
      pregunta: '¿Cuánto es 346 + 238?',
      opciones: ['574', '108', '584'],
      correcta: 2,
      porque: '6 + 8 = 14, llevo 1. 4 + 3 + 1 = 8. 3 + 2 = 5. Da 584.',
    },
  },
  {
    tramo: 3,
    titulo: 'Restar desagrupando',
    emoji: '➖',
    autor: 'la abuela Carmen',
    idea: 'Si arriba hay menos, pide prestada una decena o una centena.',
    ejemplo: {
      enunciado: 'Había 432 naranjas. Se vendieron 175. ¿Cuántas quedan?',
      pasos: ['Unidades: 2 no alcanza. Pido 1 decena: 12 − 5 = 7.', 'Decenas: quedan 2, no alcanza. Pido 1 centena: 12 − 7 = 5.', 'Centenas: quedan 3. 3 − 1 = 2.'],
      resultado: 'Quedan 257 naranjas.',
    },
    truco: 'Comprueba sumando: 257 + 175 = 432.',
    reto: {
      pregunta: '¿Cuánto es 503 − 128?',
      opciones: ['375', '425', '631'],
      correcta: 0,
      porque: 'Desagrupamos: 13 − 8 = 5, 9 − 2 = 7, 4 − 1 = 3. Da 375.',
    },
  },
  {
    tramo: 4,
    titulo: 'Problemas y plata',
    emoji: '🪙',
    autor: 'doña Marleny',
    idea: 'Piensa qué pasa en el problema. "Más que" no siempre es sumar.',
    ejemplo: {
      enunciado: 'Santiago tiene 245 naranjas. Tiene 130 más que Valentina. ¿Cuántas tiene ella?',
      pasos: ['Valentina tiene menos que Santiago.', 'Entonces restamos: 245 − 130 = 115.', 'Comprobamos: 115 + 130 = 245.'],
      resultado: 'Valentina tiene 115 naranjas.',
    },
    truco: 'Las vueltas son lo que pagaste menos lo que costó.',
    reto: {
      pregunta: 'Compras un pan de $300 y un banano de $500 (precios de ejemplo). Pagas con $1.000. ¿Vueltas?',
      opciones: ['$800', '$1.800', '$200'],
      correcta: 2,
      porque: 'Todo cuesta 300 + 500 = 800. Vueltas: 1.000 − 800 = 200.',
    },
  },
  {
    tramo: 5,
    titulo: 'Grupos iguales',
    emoji: '🧺',
    autor: 'el profe Julián',
    idea: 'Varios grupos iguales se suman rápido multiplicando.',
    ejemplo: {
      enunciado: 'Hay 4 canastas. Cada una tiene 5 naranjas.',
      pasos: ['Sumamos los grupos: 5 + 5 + 5 + 5 = 20.', 'Es lo mismo que 4 veces 5.', 'Lo escribimos así: 4 × 5 = 20.'],
      resultado: 'Hay 20 naranjas.',
    },
    truco: 'Por 10, agrega un cero: 6 × 10 = 60.',
    reto: {
      pregunta: 'Reparte 20 mazorcas en 5 canastos iguales. ¿Cuántas en cada uno?',
      opciones: ['25 mazorcas', '4 mazorcas', '15 mazorcas'],
      correcta: 1,
      porque: '5 × 4 = 20. Van 4 mazorcas en cada canasto.',
    },
  },
  {
    tramo: 6,
    titulo: 'Retos de 2.º',
    emoji: '🏆',
    autor: 'Santiago',
    idea: 'Algunos problemas tienen dos pasos. Resuelve uno y luego el otro.',
    ejemplo: {
      enunciado: 'La tienda tenía 600 huevos. Vendió 250 y luego llegaron 120.',
      pasos: ['Primero lo que vendió: 600 − 250 = 350.', 'Luego lo que llegó: 350 + 120 = 470.'],
      resultado: 'Ahora la tienda tiene 470 huevos.',
    },
    truco: 'Redondea para saber si tu respuesta tiene sentido.',
    reto: {
      pregunta: 'Doña Rosa tenía 498 naranjas y vendió 203. ¿Qué resultado es razonable?',
      opciones: ['695 naranjas', '95 naranjas', '295 naranjas'],
      correcta: 2,
      porque: '500 − 200 = 300, cerca de 295. Exacto: 498 − 203 = 295.',
    },
  },
];

const g3: Leccion[] = [
  {
    tramo: 0,
    titulo: 'Repaso de 2.º',
    emoji: '👋',
    autor: 'el profe Julián',
    idea: 'Recuerda: sumamos de derecha a izquierda y llevamos cuando pasamos de 9.',
    ejemplo: {
      enunciado: 'La cooperativa recibió 478 mazorcas en la mañana y 356 en la tarde.',
      pasos: ['Unidades: 8 + 6 = 14. Escribo 4 y llevo 1.', 'Decenas: 7 + 5 + 1 = 13. Escribo 3 y llevo 1.', 'Centenas: 4 + 3 + 1 = 8.'],
      resultado: 'Recibió 834 mazorcas.',
    },
    truco: 'Grupos iguales: 5 canastos de 4 es 4 + 4 + 4 + 4 + 4, o sea 5 × 4.',
    reto: {
      pregunta: 'Hay 5 canastos con 4 naranjas cada uno. ¿Cuántas naranjas hay?',
      opciones: ['9 naranjas', '20 naranjas', '24 naranjas'],
      correcta: 1,
      porque: '5 × 4 = 20. Si da 9, sumaste 5 + 4.',
    },
  },
  {
    tramo: 1,
    titulo: 'Restar con ceros',
    emoji: '0️⃣',
    autor: 'don Ramiro',
    idea: 'Si hay ceros arriba, desagrupa desde el lugar que sí tiene cifras.',
    ejemplo: {
      enunciado: 'La cooperativa tenía 3.000 kilos de cacao. Vendió 1.245. ¿Cuántos quedan?',
      pasos: ['3.000 es lo mismo que 2 mil, 9 centenas, 9 decenas y 10 unidades.', 'Unidades: 10 − 5 = 5. Decenas: 9 − 4 = 5.', 'Centenas: 9 − 2 = 7. Miles: 2 − 1 = 1.'],
      resultado: 'Quedan 1.755 kilos.',
    },
    truco: 'Comprueba sumando: 1.755 + 1.245 = 3.000.',
    reto: {
      pregunta: '¿Cuánto es 4.005 − 1.230?',
      opciones: ['3.225', '5.235', '2.775'],
      correcta: 2,
      porque: '2.775 + 1.230 = 4.005. Si da 3.225, restaste al revés.',
    },
  },
  {
    tramo: 2,
    titulo: 'Tablas con surcos',
    emoji: '🌱',
    autor: 'la abuela Carmen',
    idea: 'Un arreglo de surcos muestra una multiplicación: surcos por matas.',
    ejemplo: {
      enunciado: 'En la huerta escolar hay 6 surcos con 7 matas cada uno.',
      pasos: ['Son 6 grupos de 7 matas.', '5 × 7 = 35.', 'Sumamos un surco más: 35 + 7 = 42.'],
      resultado: '6 × 7 = 42 matas.',
    },
    truco: 'El orden no cambia el resultado: 6 × 7 = 7 × 6.',
    reto: {
      pregunta: 'Hay 8 surcos con 9 matas cada uno. ¿Cuántas matas hay?',
      opciones: ['72 matas', '17 matas', '63 matas'],
      correcta: 0,
      porque: '8 × 9 = 72. Si da 17, sumaste 8 + 9.',
    },
  },
  {
    tramo: 3,
    titulo: 'Multiplicar por 1 cifra',
    emoji: '✖️',
    autor: 'doña Rosa',
    idea: 'Multiplica cada cifra empezando por las unidades y suma lo que llevas.',
    ejemplo: {
      enunciado: 'Don Ramiro llena 4 canastos con 136 naranjas cada uno.',
      pasos: ['Unidades: 6 × 4 = 24. Escribo 4 y llevo 2.', 'Decenas: 3 × 4 = 12, más 2 es 14. Escribo 4 y llevo 1.', 'Centenas: 1 × 4 = 4, más 1 es 5.'],
      resultado: '136 × 4 = 544 naranjas.',
    },
    truco: 'Estima antes: 136 es casi 140, y 140 × 4 = 560.',
    reto: {
      pregunta: '¿Cuánto es 215 × 3?',
      opciones: ['635', '218', '645'],
      correcta: 2,
      porque: '5 × 3 = 15, llevo 1. 1 × 3 + 1 = 4. 2 × 3 = 6. Da 645.',
    },
  },
  {
    tramo: 4,
    titulo: 'Dividir: repartir y agrupar',
    emoji: '➗',
    autor: 'la tía Gloria',
    idea: 'Dividir es repartir en partes iguales o formar grupos iguales.',
    ejemplo: {
      enunciado: 'Doña Rosa tiene 48 huevos y los pone en cubetas de 6.',
      pasos: ['Buscamos qué número por 6 da 48.', '6 × 8 = 48.', 'Entonces 48 ÷ 6 = 8.'],
      resultado: 'Llena 8 cubetas.',
    },
    truco: 'La división es la multiplicación al revés.',
    reto: {
      pregunta: 'Reparte 63 mazorcas en 7 canastos iguales. ¿Cuántas en cada uno?',
      opciones: ['9 mazorcas', '56 mazorcas', '8 mazorcas'],
      correcta: 0,
      porque: '7 × 9 = 63. Van 9 en cada canasto.',
    },
  },
  {
    tramo: 5,
    titulo: 'Dos pasos y estimar',
    emoji: '🪜',
    autor: 'don Efraín',
    idea: 'Algunos problemas piden dos operaciones. Redondea para revisar el resultado.',
    ejemplo: {
      enunciado: 'Doña Marleny compra 3 panelas de $3.000 (precio de ejemplo). Paga con $10.000.',
      pasos: ['Primero el costo: 3 × 3.000 = 9.000.', 'Luego las vueltas: 10.000 − 9.000 = 1.000.'],
      resultado: 'Le dan $1.000 de vueltas.',
    },
    truco: 'Redondea a los miles: así sabes más o menos cuánto debe dar.',
    reto: {
      pregunta: '¿Qué resultado es razonable para 2.980 + 4.030?',
      opciones: ['6.010', '7.010', '1.050'],
      correcta: 1,
      porque: '3.000 + 4.000 = 7.000. Exacto: 7.010. Si da 1.050, restaste.',
    },
  },
  {
    tramo: 6,
    titulo: 'Retos de 3.º',
    emoji: '🏆',
    autor: 'Valentina',
    idea: 'Antes de calcular, decide la operación: sumar, restar, multiplicar o dividir.',
    ejemplo: {
      enunciado: 'Valentina vende 6 cubetas de 30 huevos. Ya vendió 95 huevos. ¿Cuántos le faltan?',
      pasos: ['Total de huevos: 6 × 30 = 180.', 'Le faltan: 180 − 95 = 85.'],
      resultado: 'Le faltan 85 huevos por vender.',
    },
    truco: '"Grupos de" suele ser dividir o multiplicar. "Quedan" suele ser restar.',
    reto: {
      pregunta: 'Hay 72 naranjas para empacar en bolsas de 8. ¿Qué operación usas?',
      opciones: ['72 × 8', '72 ÷ 8', '72 − 8'],
      correcta: 1,
      porque: 'Formamos grupos de 8: 72 ÷ 8 = 9 bolsas.',
    },
  },
];

const g4: Leccion[] = [
  {
    tramo: 0,
    titulo: 'Repaso de 3.º',
    emoji: '👋',
    autor: 'el profe Julián',
    idea: 'Sumamos y multiplicamos de derecha a izquierda, llevando cuando hace falta.',
    ejemplo: {
      enunciado: 'La finca El Mirador cosechó 2.475 naranjas y La Esperanza 3.658.',
      pasos: ['Unidades: 5 + 8 = 13. Escribo 3 y llevo 1.', 'Decenas: 7 + 5 + 1 = 13. Escribo 3 y llevo 1.', 'Centenas: 4 + 6 + 1 = 11. Escribo 1 y llevo 1.', 'Miles: 2 + 3 + 1 = 6.'],
      resultado: 'Entre las dos: 6.133 naranjas.',
    },
    truco: 'Lo que llevas se suma después de multiplicar, no antes.',
    reto: {
      pregunta: '¿Cuánto es 27 × 4?',
      opciones: ['88', '31', '108'],
      correcta: 2,
      porque: '7 × 4 = 28, llevo 2. 2 × 4 = 8, más 2 es 10. Da 108.',
    },
  },
  {
    tramo: 1,
    titulo: 'Números de 6 cifras',
    emoji: '🔢',
    autor: 'don Ramiro',
    idea: 'Agrupa las cifras de a tres con puntos. Redondea para estimar sumas y restas.',
    ejemplo: {
      enunciado: 'La cooperativa vendió 148.600 kilos de cacao un año y 251.300 el siguiente.',
      pasos: ['Estimamos: 150.000 + 250.000 = 400.000.', 'Calculamos exacto: 148.600 + 251.300 = 399.900.', '399.900 está muy cerca de 400.000.'],
      resultado: 'En los dos años vendió 399.900 kilos.',
    },
    truco: 'Si la cifra de la derecha es 5 o más, redondea hacia arriba.',
    reto: {
      pregunta: '¿Cuánto vale el 7 en 375.120?',
      opciones: ['7.000', '70.000', '700.000'],
      correcta: 1,
      porque: 'El 7 está en las decenas de mil: vale 70.000.',
    },
  },
  {
    tramo: 2,
    titulo: 'Multiplicar por 2 cifras',
    emoji: '✖️',
    autor: 'el abuelo Pedro',
    idea: 'Multiplica por las unidades, luego por las decenas, y suma las dos partes.',
    ejemplo: {
      enunciado: 'Un lote tiene 24 surcos con 36 árboles de cacao cada uno.',
      pasos: ['Por las unidades: 36 × 4 = 144.', 'Por las decenas: 36 × 20 = 720.', 'Sumamos: 144 + 720 = 864.'],
      resultado: '36 × 24 = 864 árboles.',
    },
    truco: 'Al multiplicar por las decenas, deja un cero a la derecha.',
    reto: {
      pregunta: '¿Cuánto es 23 × 15?',
      opciones: ['345', '138', '38'],
      correcta: 0,
      porque: '23 × 5 = 115 y 23 × 10 = 230. 115 + 230 = 345. Si da 138, olvidaste el cero.',
    },
  },
  {
    tramo: 3,
    titulo: 'División con residuo',
    emoji: '➗',
    autor: 'doña Rosa',
    idea: 'A veces sobra algo al repartir. Eso que sobra se llama residuo.',
    ejemplo: {
      enunciado: 'Doña Rosa reparte 158 mandarinas en 6 canastas iguales.',
      pasos: ['15 ÷ 6 = 2 y sobran 3.', 'Bajamos el 8: 38 ÷ 6 = 6 y sobran 2.', 'Comprobamos: 6 × 26 + 2 = 158.'],
      resultado: 'Van 26 en cada canasta y sobran 2 mandarinas.',
    },
    truco: 'El residuo siempre es menor que el divisor.',
    reto: {
      pregunta: '¿Cuánto es 47 ÷ 5?',
      opciones: ['8 y sobran 7', '10 y sobran 3', '9 y sobran 2'],
      correcta: 2,
      porque: '5 × 9 = 45 y 47 − 45 = 2. Sobrar 7 no puede: es más que 5.',
    },
  },
  {
    tramo: 4,
    titulo: '¿Qué hago con el residuo?',
    emoji: '🚌',
    autor: 'don Efraín',
    idea: 'Lee la pregunta: a veces el residuo pide uno más, a veces se deja por fuera.',
    ejemplo: {
      enunciado: 'La chiva lleva 8 bultos por viaje. Hay 50 bultos de cacao. ¿Cuántos viajes hace?',
      pasos: ['50 ÷ 8 = 6 y sobran 2.', 'Con 6 viajes quedan 2 bultos en la finca.', 'Para llevarlos todos hace falta 1 viaje más: 6 + 1 = 7.'],
      resultado: 'La chiva hace 7 viajes.',
    },
    truco: 'Doble es × 2, triple es × 3 y cuádruple es × 4.',
    reto: {
      pregunta: 'Santiago cogió 125 naranjas. Valentina cogió el triple. ¿Cuántas cogió ella?',
      opciones: ['128 naranjas', '375 naranjas', '250 naranjas'],
      correcta: 1,
      porque: 'El triple es × 3: 125 × 3 = 375. 250 sería el doble.',
    },
  },
  {
    tramo: 5,
    titulo: 'Varias operaciones y plata',
    emoji: '💵',
    autor: 'doña Marleny',
    idea: 'Divide el problema en pasos pequeños y escribe cada resultado.',
    ejemplo: {
      enunciado: 'Doña Marleny compra 4 libras de fríjol a $4.500 y 2 panelas a $3.000 (precios de ejemplo). Paga con $50.000.',
      pasos: ['Fríjol: 4 × 4.500 = 18.000.', 'Panela: 2 × 3.000 = 6.000.', 'Total: 18.000 + 6.000 = 24.000.', 'Vueltas: 50.000 − 24.000 = 26.000.'],
      resultado: 'Le devuelven $26.000.',
    },
    truco: 'Al final, pregúntate: ¿la respuesta tiene sentido?',
    reto: {
      pregunta: 'Don Ramiro vende 12 kilos de cacao a $9.000 (precio de ejemplo) y gasta $35.000 en abono. ¿Cuánto le queda?',
      opciones: ['$73.000', '$143.000', '$108.000'],
      correcta: 0,
      porque: '12 × 9.000 = 108.000. Luego 108.000 − 35.000 = 73.000.',
    },
  },
  {
    tramo: 6,
    titulo: 'Retos de 4.º',
    emoji: '🏆',
    autor: 'Santiago',
    idea: 'Lee, saca los datos, elige la operación y comprueba. Así resuelves cualquier reto.',
    ejemplo: {
      enunciado: 'La escuela recibió 9 cajas con 48 cuadernos. Se reparten entre 4 grupos por igual.',
      pasos: ['Total de cuadernos: 9 × 48 = 432.', 'Repartimos: 432 ÷ 4 = 108.', 'Comprobamos: 108 × 4 = 432.'],
      resultado: 'Cada grupo recibe 108 cuadernos.',
    },
    truco: 'Para comparar números grandes, mira primero la cifra de más a la izquierda.',
    reto: {
      pregunta: '¿Cuál es el número mayor?',
      opciones: ['405.120', '99.999', '450.012'],
      correcta: 2,
      porque: '405.120 y 450.012 tienen 4 centenas de mil, pero 5 decenas de mil gana a 0.',
    },
  },
];

const g5: Leccion[] = [
  {
    tramo: 0,
    titulo: 'Repaso de 4.º',
    emoji: '👋',
    autor: 'el profe Julián',
    idea: 'Para multiplicar por 2 cifras, partimos en unidades y decenas, y sumamos.',
    ejemplo: {
      enunciado: 'La cooperativa recibe 125 kilos de cacao cada día durante 12 días.',
      pasos: ['Por las unidades: 125 × 2 = 250.', 'Por las decenas: 125 × 10 = 1.250.', 'Sumamos: 250 + 1.250 = 1.500.'],
      resultado: 'En 12 días recibe 1.500 kilos.',
    },
    truco: 'Para redondear, mira la cifra que está justo a la derecha del lugar pedido.',
    reto: {
      pregunta: 'Redondea 47.680 a la decena de mil más cercana.',
      opciones: ['40.000', '50.000', '48.000'],
      correcta: 1,
      porque: 'La cifra de los miles es 7, que es 5 o más: sube a 50.000.',
    },
  },
  {
    tramo: 1,
    titulo: 'Doble, mitad y distributiva',
    emoji: '🧠',
    autor: 'la abuela Carmen',
    idea: 'Puedes partir un número para multiplicar más fácil: 6 × 48 = 6 × 40 + 6 × 8.',
    ejemplo: {
      enunciado: 'En la finca hay 6 lotes con 48 árboles de cacao cada uno.',
      pasos: ['Partimos 48 en 40 y 8.', '6 × 40 = 240 y 6 × 8 = 48.', 'Sumamos: 240 + 48 = 288.'],
      resultado: 'Hay 288 árboles.',
    },
    truco: 'Doble y mitad: 25 × 16 = 50 × 8 = 100 × 4 = 400.',
    reto: {
      pregunta: '¿Cuánto es 7 × 53?',
      opciones: ['353', '371', '60'],
      correcta: 1,
      porque: '7 × 50 = 350 y 7 × 3 = 21. 350 + 21 = 371. Si da 353, faltó multiplicar el 3.',
    },
  },
  {
    tramo: 2,
    titulo: 'Multiplicar varias cifras',
    emoji: '✖️',
    autor: 'don Ramiro',
    idea: 'Multiplica por cada cifra de abajo y corre un lugar a la izquierda cada vez.',
    ejemplo: {
      enunciado: 'Don Ramiro tiene 32 lotes con 245 árboles de cacao cada uno.',
      pasos: ['Por las unidades: 245 × 2 = 490.', 'Por las decenas: 245 × 30 = 7.350.', 'Sumamos: 490 + 7.350 = 7.840.'],
      resultado: '245 × 32 = 7.840 árboles.',
    },
    truco: 'Estima antes: 250 × 30 = 7.500, así que el resultado debe estar cerca.',
    reto: {
      pregunta: '¿Cuánto es 316 × 24?',
      opciones: ['1.896', '340', '7.584'],
      correcta: 2,
      porque: '316 × 4 = 1.264 y 316 × 20 = 6.320. Suman 7.584. Si da 1.896, faltó correr el lugar.',
    },
  },
  {
    tramo: 3,
    titulo: 'Dividir entre 2 cifras',
    emoji: '➗',
    autor: 'doña Rosa',
    idea: 'Estima cuántas veces cabe el divisor, multiplica, resta y baja la siguiente cifra.',
    ejemplo: {
      enunciado: 'Hay 864 plántulas de cacao para sembrar en 24 lotes por igual.',
      pasos: ['86 ÷ 24: cabe 3 veces. 24 × 3 = 72 y 86 − 72 = 14.', 'Bajamos el 4: 144 ÷ 24 = 6, porque 24 × 6 = 144.', 'El cociente es 36.'],
      resultado: 'Van 36 plántulas en cada lote.',
    },
    truco: 'Piensa el divisor redondeado: 24 es casi 25, y 4 veces 25 es 100.',
    reto: {
      pregunta: '¿Cuánto es 750 ÷ 25?',
      opciones: ['30', '3', '725'],
      correcta: 0,
      porque: '25 × 30 = 750. Si da 3, olvidaste el cero del final.',
    },
  },
  {
    tramo: 4,
    titulo: 'El residuo y las tablas',
    emoji: '📊',
    autor: 'don Efraín',
    idea: 'Saca los datos de la tabla. Después decide qué significa el residuo.',
    ejemplo: {
      enunciado: 'Tabla de la cooperativa: lunes 560 kilos, martes 570 kilos. Se empaca en bultos de 50 kilos.',
      pasos: ['Total de la tabla: 560 + 570 = 1.130.', '1.130 ÷ 50 = 22 y sobran 30.', 'Comprobamos: 50 × 22 + 30 = 1.130.'],
      resultado: 'Se llenan 22 bultos y sobran 30 kilos.',
    },
    truco: 'Si nada puede quedar por fuera, suma 1 al cociente.',
    reto: {
      pregunta: 'Hay 380 plántulas y en cada bandeja caben 36. ¿Cuántas bandejas se necesitan para todas?',
      opciones: ['10 bandejas', '11 bandejas', '20 bandejas'],
      correcta: 1,
      porque: '380 ÷ 36 = 10 y sobran 20. Esas 20 necesitan otra bandeja: 11.',
    },
  },
  {
    tramo: 5,
    titulo: 'Proporciones y fracciones',
    emoji: '🍫',
    autor: 'la tía Gloria',
    idea: 'Halla cuánto vale uno y multiplica. Una fracción es repartir y tomar partes.',
    ejemplo: {
      enunciado: '3 kilos de cacao valen $27.000 (precio de ejemplo). ¿Cuánto valen 5 kilos?',
      pasos: ['Un kilo: 27.000 ÷ 3 = 9.000.', 'Cinco kilos: 9.000 × 5 = 45.000.'],
      resultado: '5 kilos valen $45.000.',
    },
    truco: 'Para 3/4 de algo: divide entre 4 y multiplica por 3.',
    reto: {
      pregunta: 'Doña Rosa cosechó 48 mazorcas y regala 3/4 a su vecina. ¿Cuántas regala?',
      opciones: ['12 mazorcas', '16 mazorcas', '36 mazorcas'],
      correcta: 2,
      porque: '48 ÷ 4 = 12 y 12 × 3 = 36. Si da 12, solo tomaste una parte.',
    },
  },
  {
    tramo: 6,
    titulo: 'Problemas con tablas',
    emoji: '🏆',
    autor: 'Valentina',
    idea: 'Lee bien la tabla, elige los datos que sirven y resuelve por pasos.',
    ejemplo: {
      enunciado: 'Tabla de sacos de cacao: lunes 12, martes 15, miércoles 9. Cada saco pesa 25 kilos.',
      pasos: ['Total de sacos: 12 + 15 + 9 = 36.', 'Total de kilos: 36 × 25 = 900.'],
      resultado: 'En los tres días hubo 900 kilos.',
    },
    truco: 'Subraya en la tabla solo los datos que pide la pregunta.',
    reto: {
      pregunta: 'Martes: 15 sacos. Miércoles: 9 sacos. Cada saco pesa 25 kilos. ¿Cuántos kilos más hubo el martes?',
      opciones: ['150 kilos', '6 kilos', '600 kilos'],
      correcta: 0,
      porque: '15 − 9 = 6 sacos más, y 6 × 25 = 150 kilos.',
    },
  },
];

const familia: Leccion[] = [
  {
    tramo: 0,
    titulo: 'Bienvenida: cuentas rápidas',
    emoji: '👋',
    autor: 'el profe Julián',
    idea: 'Para sumar plata de memoria, sume primero los miles y luego los cientos.',
    ejemplo: {
      enunciado: 'En la tienda de la vereda, usted compra arroz de $2.500 y leche de $3.500 (precios de ejemplo).',
      pasos: ['Miles: 2.000 + 3.000 = 5.000.', 'Cientos: 500 + 500 = 1.000.', 'Total: 5.000 + 1.000 = 6.000.'],
      resultado: 'La compra cuesta $6.000.',
    },
    truco: 'Para las vueltas, cuente desde lo que costó hasta lo que pagó.',
    reto: {
      pregunta: 'Usted compra panela de $3.000 y jabón de $2.500 (ejemplo). Paga con $10.000. ¿Vueltas?',
      opciones: ['$5.500', '$4.500', '$15.500'],
      correcta: 1,
      porque: 'Costó 3.000 + 2.500 = 5.500. Vueltas: 10.000 − 5.500 = 4.500.',
    },
  },
  {
    tramo: 1,
    titulo: '¿Me alcanza la plata?',
    emoji: '🛒',
    autor: 'doña Marleny',
    idea: 'Redondee los precios hacia arriba. Si así le alcanza, le alcanza seguro.',
    ejemplo: {
      enunciado: 'Usted lleva $15.000. Quiere fríjol de $4.500, arroz de $2.500, sal de $1.500 y leche de $3.500 (ejemplo).',
      pasos: ['Redondee: 5.000 + 3.000 + 2.000 + 4.000.', 'La estimación da 14.000, menos de 15.000.', 'El total exacto es 12.000.'],
      resultado: 'Sí le alcanza, y le sobran $3.000.',
    },
    truco: 'Redondear hacia arriba le da un margen de seguridad.',
    reto: {
      pregunta: '¿Cuánto es, más o menos, $4.900 + $3.100 + $1.950?',
      opciones: ['Unos $8.000', 'Unos $100.000', 'Unos $10.000'],
      correcta: 2,
      porque: '5.000 + 3.000 + 2.000 = 10.000. El exacto es 9.950.',
    },
  },
  {
    tramo: 2,
    titulo: 'El presupuesto de la semana',
    emoji: '📒',
    autor: 'doña Rosa',
    idea: 'Presupuesto: lo que tiene menos lo que gasta. El saldo es lo que queda.',
    ejemplo: {
      enunciado: 'Usted tiene $80.000 para la semana. Gasta $45.000 en mercado y $12.000 en la chiva (ejemplo).',
      pasos: ['Sume los gastos: 45.000 + 12.000 = 57.000.', 'Reste del total: 80.000 − 57.000 = 23.000.'],
      resultado: 'Le quedan $23.000 de saldo.',
    },
    truco: 'Anote cada gasto apenas lo haga; así el saldo no lo sorprende.',
    reto: {
      pregunta: 'Usted vende 30 huevos a $600 cada uno (precio de ejemplo). ¿Cuánto recibe?',
      opciones: ['$1.800', '$18.000', '$630'],
      correcta: 1,
      porque: 'Haga 3 × 6 = 18 y agregue los tres ceros: 30 × 600 = 18.000.',
    },
  },
  {
    tramo: 3,
    titulo: 'Kilos, bultos y jornales',
    emoji: '🌳',
    autor: 'don Ramiro',
    idea: 'Un jornal es un día de trabajo de una persona. Trabajadores por días da los jornales.',
    ejemplo: {
      enunciado: 'Usted contrata a 3 trabajadores durante 4 días. El jornal es de $60.000 (valor de ejemplo).',
      pasos: ['Jornales: 3 × 4 = 12.', 'Pago: 12 × 60.000 = 720.000.'],
      resultado: 'Debe pagar $720.000 en total.',
    },
    truco: 'Un bulto de 50 kilos: 2 bultos son 100 kilos.',
    reto: {
      pregunta: 'Usted tiene 1.200 kilos de cacao seco. ¿Cuántos bultos de 50 kilos llena?',
      opciones: ['240 bultos', '24 bultos', '1.150 bultos'],
      correcta: 1,
      porque: '1.200 ÷ 50 = 24, porque 50 × 24 = 1.200.',
    },
  },
  {
    tramo: 4,
    titulo: 'Porcentajes: 10, 25 y 50 %',
    emoji: '🏷️',
    autor: 'la tía Gloria',
    idea: 'El 50 % es la mitad, el 25 % es la cuarta parte y el 10 % es dividir entre 10.',
    ejemplo: {
      enunciado: 'El bulto de abono cuesta $120.000 con 25 % de descuento (precio de ejemplo).',
      pasos: ['El 25 % es la cuarta parte: 120.000 ÷ 4 = 30.000.', 'Reste el descuento: 120.000 − 30.000 = 90.000.'],
      resultado: 'Usted paga $90.000.',
    },
    truco: 'El 10 % se saca quitando un cero: 10 % de 80.000 es 8.000.',
    reto: {
      pregunta: 'De 300 kilos de cacao en baba se pierde el 50 % al secar (dato del ejercicio). ¿Cuánto queda?',
      opciones: ['250 kilos', '350 kilos', '150 kilos'],
      correcta: 2,
      porque: 'El 50 % de 300 es la mitad: 150. Quedan 300 − 150 = 150 kilos.',
    },
  },
  {
    tramo: 5,
    titulo: 'Arrobas, kilos y gramos',
    emoji: '⚖️',
    autor: 'el abuelo Pedro',
    idea: '1 arroba = 12,5 kilos. 1 kilo = 1.000 gramos = 2 libras.',
    ejemplo: {
      enunciado: 'Usted vende 8 arrobas de cacao. ¿Cuántos kilos son?',
      pasos: ['2 arrobas son 25 kilos.', 'En 8 arrobas hay 4 pares de arrobas.', '4 × 25 = 100.'],
      resultado: '8 arrobas son 100 kilos.',
    },
    truco: 'Una hectárea son 10.000 metros cuadrados, por ejemplo 100 m por 100 m.',
    reto: {
      pregunta: '¿Cuántas libras de 500 gramos salen de un bulto de 25 kilos?',
      opciones: ['25 libras', '50 libras', '12,5 libras'],
      correcta: 1,
      porque: 'Cada kilo son 2 libras: 25 × 2 = 50 libras.',
    },
  },
  {
    tramo: 6,
    titulo: 'Planear la cosecha',
    emoji: '🏆',
    autor: 'la abuela Carmen',
    idea: 'Ganancia = lo que entra por la venta menos lo que se gastó.',
    ejemplo: {
      enunciado: 'Usted vende 300 kilos de cacao a $10.000 el kilo y gastó $1.200.000 (valores de ejemplo).',
      pasos: ['Ingreso: 300 × 10.000 = 3.000.000.', 'Ganancia: 3.000.000 − 1.200.000 = 1.800.000.'],
      resultado: 'La ganancia es de $1.800.000.',
    },
    truco: 'Anote todos los gastos: abono, jornales y transporte. Si falta uno, la ganancia sale inflada.',
    reto: {
      pregunta: 'Vendió 150 kilos a $12.000 el kilo y gastó $700.000 (ejemplo). ¿Cuánto ganó?',
      opciones: ['$1.800.000', '$1.100.000', '$2.500.000'],
      correcta: 1,
      porque: '150 × 12.000 = 1.800.000. Menos gastos: 1.800.000 − 700.000 = 1.100.000.',
    },
  },
];

export const lecciones: Record<Pista, Leccion[]> = { g1, g2, g3, g4, g5, familia };

export function leccionDe(pista: Pista, tramo: number): Leccion {
  return lecciones[pista][tramo];
}
