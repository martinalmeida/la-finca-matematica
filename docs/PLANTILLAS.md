# Catálogo de plantillas

Total: **139 plantillas distintas** en 10 rutas (algunas se comparten entre grados).

Generado automáticamente desde `src/contenido/plantillas` (`npm run catalogo`).

Cada ruta tiene 10 temas (niveles 1 a 10) de 10 preguntas; Inclusión tiene 23 niveles en 7 bloques y no hace pruebas. La columna «Prueba» es la plantilla de la pregunta de ese tema en la prueba diagnóstica y en la final.

## 1.º grado (14 plantillas, números hasta 100)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `g1-contar` | comprension | suma | Contar tocando objetos de la finca |
| `g1-comparar` | comprension | resta | Comparar dos cantidades: ¿quién tiene más o menos? |
| `g1-siguiente` | comprension | suma | Número anterior y siguiente en la recta (postes del camino) |
| `g1-recta` | procedimiento | suma | Sumar o restar dando saltos en la recta numérica |
| `g1-suma-cambio` | problemas | suma | Cambio-aumentar: tenía, recibió más, ¿cuántos tiene? |
| `g1-juntar` | problemas | suma | Juntar arrastrando frutas a una canasta |
| `g1-calculo` | procedimiento | suma | Cálculo de suma o resta con apoyo de objetos |
| `g1-quitar` | problemas | resta | Quitar arrastrando: la mula se lleva mazorcas |
| `g1-completar` | comprension | resta | Completar a 10 (o a 20): ¿cuántos faltan? |
| `g1-decenas` | comprension | suma | Decenas y unidades con cajas de 10 |
| `g1-diferencia` | problemas | resta | Comparación: ¿cuántos más tiene uno que otro? |
| `g1-reparto` | aplicacion | division | Repartir en 2 o 3 partes iguales arrastrando |
| `g1-tabla` | aplicacion | suma | Leer una tabla sencilla de la cosecha |
| `g1-razonable` | comprension | suma | ¿Es razonable? Estimar sumas hasta 99 |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Contar hasta 10 | g1-contar, g1-comparar, g1-tabla | g1-contar |
| 2 | Contar y comparar hasta 20 | g1-contar, g1-comparar, g1-diferencia, g1-tabla | g1-comparar |
| 3 | Anterior, siguiente y la recta | g1-siguiente, g1-recta | g1-siguiente |
| 4 | Sumar hasta 10 | g1-calculo, g1-juntar, g1-suma-cambio, g1-recta | g1-juntar |
| 5 | Sumar hasta 20 | g1-calculo, g1-suma-cambio, g1-juntar, g1-recta, g1-tabla | g1-suma-cambio |
| 6 | Restar hasta 20 | g1-calculo, g1-quitar, g1-recta, g1-diferencia, g1-tabla | g1-quitar |
| 7 | Completar a 10: ¿cuántos faltan? | g1-completar, g1-diferencia | g1-completar |
| 8 | Decenas y unidades hasta 99 | g1-decenas, g1-razonable | g1-decenas |
| 9 | Sumar y restar hasta 99 sin llevar | g1-calculo, g1-suma-cambio, g1-tabla, g1-razonable | g1-calculo |
| 10 | Problemas de juntar, quitar y comparar | g1-suma-cambio, g1-diferencia, g1-quitar, g1-reparto, g1-tabla | g1-suma-cambio |

## 2.º grado (29 plantillas, números hasta 10.000)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `g2-bloques` | comprension | suma | Valor posicional con canastas de 100, cajas de 10 y unidades |
| `g2-cifra` | comprension | suma | Valor de una cifra según su posición |
| `g2-comparar` | comprension | resta | Comparar números de hasta tres cifras |
| `g2-recta` | procedimiento | suma | Saltos de 10 en 10 o de 100 en 100 en la recta |
| `g2-algoritmo-suma` | procedimiento | suma | Suma en columnas cifra por cifra, con y sin llevar |
| `g2-algoritmo-resta` | procedimiento | resta | Resta en columnas cifra por cifra, con y sin prestar |
| `g2-calculo` | procedimiento | suma | Cálculo de suma o resta hasta 999 |
| `g2-suma-problema` | problemas | suma | Problemas de cambio-aumentar y combinación |
| `g2-resta-problema` | problemas | resta | Problemas de cambio-disminuir (incógnita en resultado, cambio o inicio) |
| `g2-comparacion` | problemas | resta | Problemas de comparación: ¿cuántos más o menos? |
| `g2-empaque` | problemas | suma | Problemas de valor posicional con canastas, bolsas y sueltos |
| `g2-dinero` | aplicacion | suma | Contar monedas y pagar compras en la tienda (hasta $1.000) |
| `g2-vueltas` | aplicacion | resta | Calcular las vueltas al pagar con $500 o $1.000 |
| `g2-arreglo` | procedimiento | multiplicacion | Grupos iguales en surcos (×2, ×5, ×10) con arreglo |
| `g2-suma-repetida` | comprension | multiplicacion | Suma repetida y su relación con la multiplicación |
| `g2-grupos` | problemas | multiplicacion | Problemas de grupos iguales y agrupación |
| `g2-reparto` | aplicacion | division | Reparto equitativo arrastrando o con números |
| `g2-razonable` | comprension | suma | ¿Es razonable? Estimar a la centena más cercana |
| `g2-tabla` | aplicacion | suma | Leer una tabla de tres días de cosecha |
| `g3-tablas` | procedimiento | multiplicacion | Tablas de multiplicar del 2 al 10 en contexto |
| `g3-arreglo` | comprension | multiplicacion | Formar arreglos de surcos (filas × columnas) y contar |
| `g3-grupos` | problemas | multiplicacion | Grupos iguales: canastillas, cubetas y bultos |
| `g3-surcos` | problemas | multiplicacion | Problemas de surcos: total, o cuántos por surco (incógnita en un factor) |
| `g3-algoritmo-mult` | procedimiento | multiplicacion | Multiplicación de 2 y 3 cifras por 1 cifra |
| `g3-mult-problema` | problemas | multiplicacion | Problemas de multiplicación con 2 y 3 cifras por 1 cifra |
| `g3-razonable` | comprension | mixta | ¿Es razonable? Estimar sumas y productos |
| `g3-produccion` | aplicacion | mixta | Producción de la finca: árboles, costales y lotes |
| `g3-tienda` | aplicacion | mixta | Compras en la tienda de la vereda: total, precio por unidad y vueltas |
| `g3-tabla` | aplicacion | mixta | Leer una tabla de la cosecha y la cooperativa |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Repaso: sumar y restar hasta 999 | g2-algoritmo-suma, g2-algoritmo-resta, g2-bloques, g2-cifra, g2-comparar, g2-recta, g2-calculo, g2-suma-problema, g2-resta-problema, g2-comparacion, g2-empaque, g2-razonable, g2-tabla | g2-algoritmo-suma |
| 2 | Grupos iguales y suma repetida | g2-suma-repetida, g2-grupos, g2-arreglo | g2-suma-repetida |
| 3 | Arreglos de surcos | g3-arreglo, g2-arreglo | g3-arreglo |
| 4 | Tablas del 2, del 5 y del 10 | g3-tablas, g2-grupos, g3-grupos, g3-arreglo | g3-tablas |
| 5 | Tablas del 3 y del 4 | g3-tablas, g2-grupos, g3-grupos, g3-arreglo | g3-tablas |
| 6 | Tablas del 6 al 9 | g3-tablas, g3-arreglo, g3-grupos, g3-surcos | g3-tablas |
| 7 | Problemas de grupos iguales | g3-grupos, g3-surcos, g2-grupos, g2-reparto, g2-tabla | g3-grupos |
| 8 | Multiplicar 2 cifras por 1 cifra | g3-algoritmo-mult, g3-mult-problema, g3-razonable | g3-algoritmo-mult |
| 9 | Multiplicar 3 cifras por 1 cifra | g3-algoritmo-mult, g3-mult-problema, g3-produccion | g3-algoritmo-mult |
| 10 | Multiplicar en la tienda y la finca | g3-tienda, g2-dinero, g2-vueltas, g3-mult-problema, g3-tabla | g3-tienda |

## 3.º grado (25 plantillas, números hasta 10.000)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `g3-valor` | comprension | suma | Valor posicional hasta 9.999 (bloques y valor de cada cifra) |
| `g3-recta-centena` | comprension | suma | Redondear a la centena más cercana en la recta |
| `g3-algoritmo-suma` | procedimiento | suma | Suma columna por columna con llevadas |
| `g3-algoritmo-resta` | procedimiento | resta | Resta con desagrupación y ceros en el minuendo |
| `g3-problema-kilos` | problemas | mixta | Problemas de combinación, cambio y comparación con kilos y bultos |
| `g3-arreglo` | comprension | multiplicacion | Formar arreglos de surcos (filas × columnas) y contar |
| `g3-tablas` | procedimiento | multiplicacion | Tablas de multiplicar del 2 al 10 en contexto |
| `g3-surcos` | problemas | multiplicacion | Problemas de surcos: total, o cuántos por surco (incógnita en un factor) |
| `g3-grupos` | problemas | multiplicacion | Grupos iguales: canastillas, cubetas y bultos |
| `g3-algoritmo-mult` | procedimiento | multiplicacion | Multiplicación de 2 y 3 cifras por 1 cifra |
| `g3-mult-problema` | problemas | multiplicacion | Problemas de multiplicación con 2 y 3 cifras por 1 cifra |
| `g3-reparto` | problemas | division | División exacta como reparto en partes iguales |
| `g3-agrupacion` | problemas | division | División exacta como agrupación: ¿cuántas bolsas se llenan? |
| `g3-relacion-division` | comprension | division | Relación entre multiplicación y división |
| `g3-division-calculo` | procedimiento | division | Cálculo de divisiones exactas con la tabla |
| `g3-dos-pasos` | problemas | mixta | Problemas de dos pasos (con datos que sobran) |
| `g3-razonable` | comprension | mixta | ¿Es razonable? Estimar sumas y productos |
| `g3-tabla` | aplicacion | mixta | Leer una tabla de la cosecha y la cooperativa |
| `g3-tienda` | aplicacion | mixta | Compras en la tienda de la vereda: total, precio por unidad y vueltas |
| `g3-produccion` | aplicacion | mixta | Producción de la finca: árboles, costales y lotes |
| `g4-division-residuo` | procedimiento | division | División con residuo, divisor de 1 cifra: cociente o residuo |
| `g4-empacar` | problemas | division | Empacar o repartir con residuo: bolsas completas, sobrantes, reparto |
| `g4-comprobar-division` | comprension | mixta | Relación dividendo = divisor × cociente + residuo |
| `g4-viajes` | problemas | division | Interpretar el residuo: viajes o paquetes necesarios (redondear hacia arriba) |
| `g4-interpretar-residuo` | aplicacion | division | ¿Qué hacer con el residuo? Completos, necesarios o sobrantes |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Repaso: tablas, sumas y restas | g3-tablas, g3-arreglo, g3-grupos, g3-algoritmo-mult, g3-mult-problema, g3-valor, g3-recta-centena, g3-algoritmo-suma, g3-algoritmo-resta | g3-tablas |
| 2 | Repartir en partes iguales | g3-reparto, g3-produccion | g3-reparto |
| 3 | Agrupar: ¿cuántos grupos salen? | g3-agrupacion, g3-surcos | g3-agrupacion |
| 4 | Multiplicar y dividir son parientes | g3-relacion-division, g3-surcos | g3-relacion-division |
| 5 | Dividir con la tabla | g3-division-calculo, g3-tienda, g3-produccion | g3-division-calculo |
| 6 | División con residuo | g4-division-residuo, g4-empacar | g4-division-residuo |
| 7 | Dividir 2 y 3 cifras entre 1 cifra | g4-comprobar-division, g4-division-residuo, g3-division-calculo | g4-comprobar-division |
| 8 | ¿Qué hago con el residuo? | g4-interpretar-residuo, g4-viajes | g4-interpretar-residuo |
| 9 | Problemas de dos pasos | g3-dos-pasos, g3-problema-kilos, g3-razonable, g3-tienda | g3-dos-pasos |
| 10 | Problemas de la tienda y la cosecha | g3-tabla, g3-tienda, g3-produccion, g3-mult-problema | g3-tabla |

## 4.º grado (22 plantillas, números hasta 1.000.000)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `g4-valor-posicional` | comprension | suma | Valor de una cifra en números de hasta 6 cifras |
| `g4-comparar` | comprension | resta | Comparar y ordenar números de hasta 6 cifras |
| `g4-redondeo` | comprension | suma | Redondear a la centena o al mil más cercano en la recta |
| `g4-razonable` | comprension | suma | ¿Es razonable? Estimar sumas, restas y productos |
| `g4-suma` | procedimiento | suma | Suma de números de hasta 6 cifras con reagrupación |
| `g4-resta` | procedimiento | resta | Resta de números de hasta 6 cifras, con ceros en el minuendo |
| `g4-problema-cosecha` | problemas | suma | Problemas de suma y resta con números grandes (cambio, combinación, comparación) |
| `g4-multiplicar-1cifra` | procedimiento | multiplicacion | Multiplicación por 1 cifra con el algoritmo guiado |
| `g4-multiplicar-2cifras` | procedimiento | multiplicacion | Multiplicación por 2 cifras |
| `g4-surcos` | problemas | multiplicacion | Arreglos en surcos: multiplicación y división con números de 2 cifras |
| `g4-division-residuo` | procedimiento | division | División con residuo, divisor de 1 cifra: cociente o residuo |
| `g4-empacar` | problemas | division | Empacar o repartir con residuo: bolsas completas, sobrantes, reparto |
| `g4-comprobar-division` | comprension | mixta | Relación dividendo = divisor × cociente + residuo |
| `g4-viajes` | problemas | division | Interpretar el residuo: viajes o paquetes necesarios (redondear hacia arriba) |
| `g4-interpretar-residuo` | aplicacion | division | ¿Qué hacer con el residuo? Completos, necesarios o sobrantes |
| `g4-doble-triple` | problemas | multiplicacion | Comparación multiplicativa: doble, triple, cuádruple |
| `g4-tabla` | aplicacion | mixta | Leer una tabla de producción de la vereda |
| `g4-tienda` | aplicacion | mixta | Compras en la tienda de la vereda: total, vueltos y precio por unidad |
| `g4-varias-operaciones` | problemas | mixta | Problemas de dos pasos con varias operaciones |
| `g5-division` | procedimiento | division | División exacta con divisor de 2 cifras |
| `g5-division-problema` | problemas | division | Problemas de división exacta |
| `g5-residuo` | problemas | division | Interpretar el residuo en contexto |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Repaso: sumar y restar números grandes | g4-suma, g4-resta, g4-valor-posicional, g4-comparar, g4-redondeo, g4-problema-cosecha, g4-razonable | g4-suma |
| 2 | Repaso: multiplicar por 1 y 2 cifras | g4-multiplicar-2cifras, g4-multiplicar-1cifra, g4-surcos, g4-razonable | g4-multiplicar-2cifras |
| 3 | Repaso: división con residuo | g4-division-residuo, g4-empacar | g4-division-residuo |
| 4 | Dividir números grandes entre 1 cifra | g5-division, g5-division-problema, g4-surcos | g5-division |
| 5 | Dividir entre 2 cifras | g5-division, g5-division-problema | g5-division |
| 6 | Comprobar la división | g4-comprobar-division, g4-division-residuo | g4-comprobar-division |
| 7 | El residuo: viajes y empaques | g4-interpretar-residuo, g4-viajes, g5-residuo | g4-interpretar-residuo |
| 8 | Doble, triple y mitad | g4-doble-triple, g4-multiplicar-1cifra | g4-doble-triple |
| 9 | Problemas con varias operaciones | g4-varias-operaciones, g4-problema-cosecha, g4-tienda | g4-varias-operaciones |
| 10 | Problemas con tablas y dinero | g4-tabla, g4-tienda | g4-tabla |

## 5.º grado (24 plantillas, números hasta 10.000.000)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `g5-valor-posicional` | comprension | suma | Valor posicional en números grandes |
| `g5-distributiva` | comprension | multiplicacion | Propiedad distributiva para multiplicar mentalmente |
| `g5-fraccion` | comprension | division | Fracción de una cantidad como reparto |
| `g5-razonable` | comprension | multiplicacion | ¿Es razonable? Estimar productos y cocientes |
| `g5-doble-mitad` | procedimiento | multiplicacion | Doble y mitad de números grandes |
| `g5-algoritmo-mult` | procedimiento | multiplicacion | Algoritmo guiado de la multiplicación por una cifra |
| `g5-mult-varias` | procedimiento | multiplicacion | Multiplicación de varias cifras |
| `g5-division` | procedimiento | division | División exacta con divisor de 2 cifras |
| `g5-comparacion-mult` | problemas | multiplicacion | Doble, triple, cuádruple y mitad en contexto |
| `g5-mult-problema` | problemas | multiplicacion | Problemas de multiplicación de varias cifras |
| `g5-division-problema` | problemas | division | Problemas de división exacta |
| `g5-residuo` | problemas | division | Interpretar el residuo en contexto |
| `g5-proporcion` | problemas | mixta | Proporcionalidad simple: valor por unidad |
| `g5-dos-pasos` | problemas | mixta | Problemas de dos o tres pasos con incógnita en distintos lugares |
| `g5-redondeo` | aplicacion | suma | Redondear números grandes para informes |
| `g5-valor-unitario` | aplicacion | multiplicacion | Precios por kilo: total, precio unitario y regla de tres |
| `g5-tabla-sacos` | aplicacion | mixta | Leer una tabla de recibos de cacao y empacar en sacos |
| `g5-compuesto-tabla` | aplicacion | mixta | Problemas compuestos con tabla de producción y precios |
| `g5-decimal-leer` | comprension | mixta | Décimas y centésimas: leer y armar números decimales |
| `g5-decimal-comparar` | comprension | mixta | Comparar y ordenar números decimales |
| `g5-decimal-suma-resta` | procedimiento | mixta | Sumar y restar números decimales (alinear la coma) |
| `g5-decimal-mult` | procedimiento | multiplicacion | Multiplicar un decimal por un natural, por 10 y por 100 |
| `g5-decimal-division` | procedimiento | division | Dividir con resultado decimal (repartir kilos y litros) y dividir entre 10 |
| `g5-decimal-problema` | problemas | mixta | Problemas con decimales: precio por kilo, compras y sobrantes |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Números grandes y redondeo | g5-redondeo, g5-valor-posicional, g5-doble-mitad, g5-distributiva | g5-redondeo |
| 2 | Multiplicar varias cifras | g5-mult-varias, g5-algoritmo-mult, g5-mult-problema, g5-razonable, g5-comparacion-mult, g5-distributiva | g5-mult-varias |
| 3 | Dividir entre 2 cifras | g5-division, g5-division-problema, g5-razonable, g5-residuo | g5-division |
| 4 | Problemas con las cuatro operaciones | g5-dos-pasos, g5-proporcion, g5-valor-unitario, g5-fraccion, g5-tabla-sacos, g5-compuesto-tabla | g5-dos-pasos |
| 5 | Décimas y centésimas | g5-decimal-leer | g5-decimal-leer |
| 6 | Comparar y ordenar decimales | g5-decimal-comparar, g5-decimal-leer | g5-decimal-comparar |
| 7 | Sumar y restar decimales | g5-decimal-suma-resta | g5-decimal-suma-resta |
| 8 | Multiplicar decimales | g5-decimal-mult | g5-decimal-mult |
| 9 | Dividir con resultado decimal | g5-decimal-division | g5-decimal-division |
| 10 | Problemas con números decimales | g5-decimal-problema, g5-decimal-suma-resta, g5-decimal-mult, g5-decimal-division | g5-decimal-problema |

## Inclusión (24 plantillas, números hasta 100)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `inc-clasificar` | comprension | mixta | Clasificar figuras en dos canastas por color, forma o tamaño |
| `inc-diferente` | procedimiento | mixta | Tocar la figura que no es como las demás (color, forma o tamaño) |
| `inc-tamanos` | comprension | mixta | Alto y bajo, grande y pequeño, largo y corto: tocar el que se pide |
| `inc-cuantos-hay` | comprension | mixta | Uno, muchos o ninguno: tocar la canasta que se pide |
| `inc-mas-menos` | procedimiento | mixta | Más, menos o igual: comparar dos canastas sin contar con números |
| `inc-contar` | comprension | suma | Contar tocando de uno en uno |
| `inc-trazar` | procedimiento | suma | Repasar una cifra con el dedo sobre la guía punteada |
| `inc-emparejar` | comprension | suma | Número y cantidad: tocar el grupo que tiene ese número de dibujos |
| `inc-numeral` | procedimiento | suma | Cantidad y número: mirar el grupo y tocar su número |
| `inc-ordenar` | problemas | mixta | Ordenar 3 objetos por su altura |
| `inc-reconocer` | comprension | suma | Reconocer las cifras de dos en dos (1 y 2, 3 y 4… 9 y 10) |
| `inc-secuencia` | procedimiento | suma | Completar una secuencia de números (1, 2, __) |
| `inc-mayor-menor` | problemas | resta | Comparar dos números hasta 10: ¿cuál es mayor o menor? |
| `g1-siguiente` | comprension | suma | Número anterior y siguiente en la recta (postes del camino) |
| `inc-entre` | procedimiento | suma | ¿Qué número va entre dos números? (hasta 20) |
| `inc-descomponer` | problemas | resta | Descomponer un número: el 5 es 3 y 2 |
| `g1-juntar` | problemas | suma | Juntar arrastrando frutas a una canasta |
| `g1-quitar` | problemas | resta | Quitar arrastrando: la mula se lleva mazorcas |
| `inc-cuento` | problemas | suma | Cuentos cortos con dibujos: «Tenía 2, llegó 1» |
| `inc-operar` | procedimiento | suma | Sumas y restas hasta 5 y luego hasta 10, con o sin dibujos |
| `inc-problema-juntar` | problemas | suma | Problemas de juntar hasta 5 y luego hasta 10 |
| `inc-problema-comparar` | problemas | resta | Problemas de comparar hasta 5 y luego hasta 10 |
| `inc-decenas` | comprension | suma | Decenas y unidades con cajas de 10, hasta 30, 60 y 99 |
| `inc-calculo` | procedimiento | suma | Sumas y restas hasta 20 y luego hasta 99 sin llevar |

| Nivel | Bloque | Tema | Plantillas usadas |
| --- | --- | --- | --- |
| 1.1 | Antes de los números | Clasificar por color, forma y tamaño | inc-clasificar, inc-diferente |
| 1.2 | Antes de los números | Alto y bajo, grande y pequeño, largo y corto | inc-tamanos |
| 1.3 | Antes de los números | Uno, muchos y ninguno | inc-cuantos-hay |
| 1.4 | Antes de los números | Más, menos e igual | inc-mas-menos |
| 2.1 | Números del 1 al 3 | Reconocer y contar 1, 2 y 3 | inc-contar, inc-trazar |
| 2.2 | Números del 1 al 3 | Cantidad y número | inc-emparejar, inc-numeral |
| 2.3 | Números del 1 al 3 | Ordenar 3 objetos por su altura | inc-ordenar |
| 3.1 | Números del 1 al 10 | Contar de uno en uno hasta 10 | inc-contar |
| 3.2 | Números del 1 al 10 | Conocer los números de dos en dos | inc-reconocer, inc-trazar |
| 3.3 | Números del 1 al 10 | Completar la fila: 1, 2, __ | inc-secuencia |
| 3.4 | Números del 1 al 10 | Mayor y menor | inc-mayor-menor |
| 4.1 | Números del 1 al 20 | Contar y escribir hasta 20 | inc-contar |
| 4.2 | Números del 1 al 20 | Antes, después y entre | g1-siguiente, inc-entre |
| 4.3 | Números del 1 al 20 | Partir un número: el 5 es 3 y 2 | inc-descomponer |
| 5.1 | Unir y quitar con objetos | Juntar dos grupos y contar todo | g1-juntar |
| 5.2 | Unir y quitar con objetos | Quitar y contar lo que queda | g1-quitar |
| 5.3 | Unir y quitar con objetos | Cuentos cortos con dibujos | inc-cuento |
| 6.1 | Suma y resta | Sumas hasta 5 y luego hasta 10 | inc-operar |
| 6.2 | Suma y resta | Restas hasta 5 y luego hasta 10 | inc-operar |
| 6.3 | Suma y resta | Sumar y restar sin dibujos | inc-operar |
| 6.4 | Suma y resta | Problemas sencillos | inc-problema-juntar, inc-problema-comparar |
| 7.1 | Decenas y números hasta 100 | Decena y unidad | inc-decenas |
| 7.2 | Decenas y números hasta 100 | Sumas y restas hasta 20 y hasta 100 | inc-calculo |

## Familias: prueba de entrada y final (9 plantillas, números hasta 100.000.000)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `fam-calculo-mental` | procedimiento | mixta | Cálculo mental con dinero: sumar, restar y multiplicar precios redondos |
| `fam-vueltas` | problemas | resta | Vueltos al pagar con un billete |
| `fam-compra-varios` | problemas | multiplicacion | Comprar varias unidades del mismo producto o cuántas alcanzan |
| `fam-bultos` | procedimiento | division | Empacar en bultos de 50 kilos y viajes de la mula |
| `fam-presupuesto` | aplicacion | suma | Presupuesto semanal en una tabla |
| `fam-porcentaje-calculo` | procedimiento | division | Calcular el 10, el 25 o el 50 % de una cantidad |
| `fam-proporcion` | problemas | mixta | Proporcionalidad simple: valor por unidad |
| `fam-arrobas` | procedimiento | multiplicacion | Convertir arrobas (12,5 kg) a kilos y kilos a arrobas |
| `fam-ganancia` | problemas | mixta | Ingresos, gastos y ganancia de una venta de cacao |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Sumar y restar plata | fam-calculo-mental | fam-calculo-mental |
| 2 | Vueltos | fam-vueltas | fam-vueltas |
| 3 | Multiplicar precios | fam-calculo-mental | fam-calculo-mental |
| 4 | Cuántas unidades alcanzan | fam-compra-varios | fam-compra-varios |
| 5 | Bultos y viajes | fam-bultos | fam-bultos |
| 6 | Presupuesto semanal | fam-presupuesto | fam-presupuesto |
| 7 | Porcentajes | fam-porcentaje-calculo | fam-porcentaje-calculo |
| 8 | Proporciones | fam-proporcion | fam-proporcion |
| 9 | Unidades: arrobas y kilos | fam-arrobas | fam-arrobas |
| 10 | Ganancia de una venta | fam-ganancia | fam-ganancia |

## Familias: cuaderno básico (9 plantillas, números hasta 100.000.000)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `fam-calculo-mental` | procedimiento | mixta | Cálculo mental con dinero: sumar, restar y multiplicar precios redondos |
| `fam-recta-dinero` | comprension | suma | Ubicar en la recta numérica una suma de dinero |
| `fam-vueltas` | problemas | resta | Vueltos al pagar con un billete |
| `fam-compra-varios` | problemas | multiplicacion | Comprar varias unidades del mismo producto o cuántas alcanzan |
| `fam-bultos` | procedimiento | division | Empacar en bultos de 50 kilos y viajes de la mula |
| `fam-jornales` | aplicacion | multiplicacion | Pago de jornales por trabajadores y días |
| `fam-presupuesto` | aplicacion | suma | Presupuesto semanal en una tabla |
| `fam-estimar-compra` | comprension | suma | ¿Es razonable el cobro de la tienda? Estimar al millar |
| `fam-venta-mercado` | problemas | multiplicacion | Ventas en el mercado del pueblo (uno o dos productos) |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Sumar y restar plata | fam-calculo-mental, fam-recta-dinero | fam-calculo-mental |
| 2 | Vueltos | fam-vueltas | fam-vueltas |
| 3 | Multiplicar precios | fam-calculo-mental | fam-calculo-mental |
| 4 | Cuántas unidades alcanzan | fam-compra-varios | fam-compra-varios |
| 5 | Repartir en bultos iguales | fam-bultos | fam-bultos |
| 6 | Bultos y viajes de la mula | fam-bultos | fam-bultos |
| 7 | Pago de jornales | fam-jornales | fam-jornales |
| 8 | Presupuesto semanal | fam-presupuesto | fam-presupuesto |
| 9 | ¿Es razonable el cobro? | fam-estimar-compra | fam-estimar-compra |
| 10 | Cuentas de la casa | fam-calculo-mental, fam-vueltas, fam-compra-varios, fam-presupuesto, fam-venta-mercado | fam-calculo-mental |

## Familias: cuaderno intermedio (14 plantillas, números hasta 100.000.000)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `fam-calculo-mental` | procedimiento | mixta | Cálculo mental con dinero: sumar, restar y multiplicar precios redondos |
| `fam-recta-dinero` | comprension | suma | Ubicar en la recta numérica una suma de dinero |
| `fam-compra-varios` | problemas | multiplicacion | Comprar varias unidades del mismo producto o cuántas alcanzan |
| `fam-estimar-compra` | comprension | suma | ¿Es razonable el cobro de la tienda? Estimar al millar |
| `fam-venta-mercado` | problemas | multiplicacion | Ventas en el mercado del pueblo (uno o dos productos) |
| `fam-rendimiento` | problemas | multiplicacion | Producción por árbol: mazorcas, café y aguacate |
| `fam-bultos` | procedimiento | division | Empacar en bultos de 50 kilos y viajes de la mula |
| `fam-jornales` | aplicacion | multiplicacion | Pago de jornales por trabajadores y días |
| `fam-presupuesto` | aplicacion | suma | Presupuesto semanal en una tabla |
| `fam-porcentaje-concepto` | comprension | division | Qué significa el 10, el 25 y el 50 % |
| `fam-porcentaje-calculo` | procedimiento | division | Calcular el 10, el 25 o el 50 % de una cantidad |
| `fam-descuento` | aplicacion | resta | Precio final con descuento del 10, 25 o 50 % |
| `fam-ganancia` | problemas | mixta | Ingresos, gastos y ganancia de una venta de cacao |
| `fam-razonable-cosecha` | comprension | multiplicacion | ¿Es razonable el cálculo de una venta grande? Estimación |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Cálculo mental con plata | fam-calculo-mental, fam-recta-dinero | fam-calculo-mental |
| 2 | Compras de varios productos | fam-compra-varios, fam-estimar-compra | fam-compra-varios |
| 3 | Ventas en el mercado | fam-venta-mercado | fam-venta-mercado |
| 4 | Producción por árbol | fam-rendimiento | fam-rendimiento |
| 5 | Bultos y viajes | fam-bultos | fam-bultos |
| 6 | Pago de jornales | fam-jornales | fam-jornales |
| 7 | Presupuesto con saldo | fam-presupuesto | fam-presupuesto |
| 8 | Qué es el 10, el 25 y el 50 % | fam-porcentaje-concepto | fam-porcentaje-concepto |
| 9 | Calcular porcentajes | fam-porcentaje-calculo, fam-descuento | fam-porcentaje-calculo |
| 10 | Ganancia de una venta | fam-ganancia, fam-razonable-cosecha | fam-ganancia |

## Familias: cuaderno avanzado (13 plantillas, números hasta 100.000.000)

| Plantilla | Dimensión | Operación | Descripción |
| --- | --- | --- | --- |
| `fam-porcentaje-calculo` | procedimiento | division | Calcular el 10, el 25 o el 50 % de una cantidad |
| `fam-porcentaje-concepto` | comprension | division | Qué significa el 10, el 25 y el 50 % |
| `fam-descuento` | aplicacion | resta | Precio final con descuento del 10, 25 o 50 % |
| `fam-secado` | problemas | resta | Pérdida de peso del cacao al secarse (porcentaje del ejercicio) |
| `fam-arrobas` | procedimiento | multiplicacion | Convertir arrobas (12,5 kg) a kilos y kilos a arrobas |
| `fam-gramos` | procedimiento | division | Kilos, gramos y libras: empacar café molido |
| `fam-hectarea` | aplicacion | multiplicacion | Hectáreas, metros cuadrados y árboles sembrados |
| `fam-proporcion` | problemas | mixta | Proporcionalidad simple: valor por unidad |
| `fam-comparar-unidades` | comprension | multiplicacion | Comparar pesos en arrobas, kilos y gramos |
| `fam-ganancia` | problemas | mixta | Ingresos, gastos y ganancia de una venta de cacao |
| `fam-razonable-cosecha` | comprension | multiplicacion | ¿Es razonable el cálculo de una venta grande? Estimación |
| `fam-plan-cosecha` | aplicacion | mixta | Planear la cosecha con una tabla de ingresos y gastos |
| `fam-rendimiento` | problemas | multiplicacion | Producción por árbol: mazorcas, café y aguacate |

| Nivel | Tema | Plantillas usadas | Prueba |
| --- | --- | --- | --- |
| 1 | Porcentajes | fam-porcentaje-calculo, fam-porcentaje-concepto | fam-porcentaje-calculo |
| 2 | Descuentos | fam-descuento | fam-descuento |
| 3 | Pérdida de peso al secar | fam-secado | fam-secado |
| 4 | Arrobas y kilos | fam-arrobas | fam-arrobas |
| 5 | Kilos, gramos y libras | fam-gramos | fam-gramos |
| 6 | Hectáreas y siembra | fam-hectarea | fam-hectarea |
| 7 | Proporciones | fam-proporcion | fam-proporcion |
| 8 | Comparar unidades de peso | fam-comparar-unidades | fam-comparar-unidades |
| 9 | Ingresos, gastos y ganancia | fam-ganancia, fam-razonable-cosecha | fam-ganancia |
| 10 | Planear la cosecha | fam-plan-cosecha, fam-ganancia, fam-rendimiento | fam-plan-cosecha |

