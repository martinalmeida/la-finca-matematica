# Videos de ayuda (YouTube)

Cada nivel de cada ruta tiene un video corto en español que sirve de introducción (113 niveles con video, 93 videos distintos contando la guía de familias). Están en `src/contenido/videos.ts`.

- **Dónde aparecen:** al empezar cada nivel, en la tarjeta «Antes de empezar» (después de la prueba diagnóstica, en la ruta); al final de cada lección (historia), en la lección del día del Inicio, en los ejercicios cuando se piden dos o más pistas o se ve la solución, y en *Cuaderno de la finca → Videos para acompañar en casa*.
- **Sin internet:** el video muestra un aviso y el resto de la aplicación sigue funcionando igual.
- **Privacidad:** se usa el reproductor de privacidad mejorada (`youtube-nocookie.com`) y solo se carga cuando alguien toca «Ver video». Los niños lo ven dentro de la app; a los adultos también se les ofrece abrirlo en YouTube.
- **Apagar:** *Ajustes → Videos de ayuda de YouTube*.
- **Verificación:** el 28 de octubre de 2026 se revisaron todos los videos nivel por nivel contra lo que preguntan las plantillas de ese nivel: cada video trata exactamente el tema (mismo rango de números y misma operación), está en español (voz detectada por YouTube en español; los tres sin voz detectable son canciones o tienen voz en off en español, según su descripción), existe y permite verse dentro de la app. Se prefirieron canales latinoamericanos. Dentro de una ruta no se repite un video, salvo la excepción anotada (`repetidosPermitidos` en `videos.ts`, comprobado en `tests/videos.test.ts`). Donde no existe un video exacto se dejó el más cercano y la columna «Nota» dice por qué. Son de terceros: pueden cambiar o desaparecer. Antes del pilotaje conviene que el equipo docente los vea completos y marque la columna «Revisado».


## Inclusión

23 niveles en 7 bloques (el nivel 1.2 es el segundo del bloque 1); una lección por bloque.

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1. Clasificar por color, forma y tamaño | Mirar, comparar y agrupar | Clasificar por color, forma y tamaño | ElShowDelNerd | 1:51 | [ver](https://www.youtube.com/watch?v=N8PCwLkkepM) |  | ☐ |
| 1.2. Alto y bajo, grande y pequeño, largo y corto | Mirar, comparar y agrupar | Grande y pequeño, alto y bajo, largo y corto | KidsLumiLand | 3:00 | [ver](https://www.youtube.com/watch?v=bZTA86DHMFM) | Canal pequeño: es el único video en español que trata las tres comparaciones; verlo completo antes del pilotaje. | ☐ |
| 1.3. Uno, muchos y ninguno | Mirar, comparar y agrupar | Muchos, pocos, uno, ninguno | Moreh Higa | 3:51 | [ver](https://www.youtube.com/watch?v=8NR0QQF32EU) |  | ☐ |
| 1.4. Más, menos e igual | Mirar, comparar y agrupar | Más, menos e igual | Plaza Sésamo | 1:40 | [ver](https://www.youtube.com/watch?v=XARHIfXjk-o) |  | ☐ |
| 2.1. Reconocer y contar 1, 2 y 3 | El 1, el 2 y el 3 | Los números 1, 2 y 3 con la canción de los elefantes | Cantatoo | 2:57 | [ver](https://www.youtube.com/watch?v=GfvAKWv8qCc) |  | ☐ |
| 2.2. Cantidad y número | El 1, el 2 y el 3 | Los números del 1 al 5 | Babyradio | 4:32 | [ver](https://www.youtube.com/watch?v=FkBEPfM4PcQ) |  | ☐ |
| 2.3. Ordenar 3 objetos por su altura | El 1, el 2 y el 3 | Seriación por altura | Cata Lina | 3:15 | [ver](https://www.youtube.com/watch?v=6zulsMkKFJU) | Canal pequeño: video exacto de ordenar por altura; verlo completo antes del pilotaje. | ☐ |
| 3.1. Contar de uno en uno hasta 10 | Los números hasta el 10 | Contar del 1 al 10 con los dedos | Patico De Hule | 3:26 | [ver](https://www.youtube.com/watch?v=WhXZaxeZ5sg) |  | ☐ |
| 3.2. Conocer los números de dos en dos | Los números hasta el 10 | Aprender a escribir los números hasta el 10 | Peques Aprenden Jugando | 5:18 | [ver](https://www.youtube.com/watch?v=wd8h8fAUsJA) |  | ☐ |
| 3.3. Completar la fila: 1, 2, __ | Los números hasta el 10 | Secuencias numéricas para niños pequeños | DUCASIDAD - Educación Especial Primaria | 3:52 | [ver](https://www.youtube.com/watch?v=Mk6ZR3h8Q-I) |  | ☐ |
| 3.4. Mayor y menor | Los números hasta el 10 | Mayor que, menor que e igual | Minders | 3:01 | [ver](https://www.youtube.com/watch?v=Rxj_0DsQzk8) |  | ☐ |
| 4.1. Contar y escribir hasta 20 | Los números hasta el 20 | Números del 10 al 20: contar y escribir | Profesora Norma Urbina | 12:58 | [ver](https://www.youtube.com/watch?v=6vRfrP6PfrY) |  | ☐ |
| 4.2. Antes, después y entre | Los números hasta el 20 | Número anterior y posterior | Peques Aprenden Jugando | 6:04 | [ver](https://www.youtube.com/watch?v=__zZXFW0bBc) |  | ☐ |
| 4.3. Partir un número: el 5 es 3 y 2 | Los números hasta el 20 | Componer números hasta el 10 | Profesora Constanza Olave | 3:28 | [ver](https://www.youtube.com/watch?v=MCv52Le4bGc) |  | ☐ |
| 5.1. Juntar dos grupos y contar todo | Unir y quitar | Sumar juntando objetos | Peques Aprenden Jugando | 2:54 | [ver](https://www.youtube.com/watch?v=FY5oSo9bFwM) |  | ☐ |
| 5.2. Quitar y contar lo que queda | Unir y quitar | Restar quitando hasta 10 | ElShowDelNerd | 1:52 | [ver](https://www.youtube.com/watch?v=_-qI2BK-18U) |  | ☐ |
| 5.3. Cuentos cortos con dibujos | Unir y quitar | Cuento de la suma | Cecilia Silva Sandoval | 2:38 | [ver](https://www.youtube.com/watch?v=Jthm7qPtGiU) |  | ☐ |
| 6.1. Sumas hasta 5 y luego hasta 10 | Sumar y restar | Aprendiendo a sumar | Happy Learning | 4:47 | [ver](https://www.youtube.com/watch?v=oexd_Dfic_Q) |  | ☐ |
| 6.2. Restas hasta 5 y luego hasta 10 | Sumar y restar | Aprendiendo a restar | Happy Learning | 4:33 | [ver](https://www.youtube.com/watch?v=42vjqtleG9E) |  | ☐ |
| 6.3. Sumar y restar sin dibujos | Sumar y restar | Cómo sumar con ayuda de mis dedos | Lore Hernández | 1:27 | [ver](https://www.youtube.com/watch?v=POEJVNbBegQ) | Aproximado: no hay un video corto que muestre sumar y restar con los dedos a la vez; este muestra la suma. | ☐ |
| 6.4. Problemas sencillos | Sumar y restar | Problemas de suma y resta | Smile and Learn | 3:35 | [ver](https://www.youtube.com/watch?v=Sa_3MIlJwPs) |  | ☐ |
| 7.1. Decena y unidad | Decenas y números hasta 100 | Las decenas y las unidades | Peques Aprenden Jugando | 8:10 | [ver](https://www.youtube.com/watch?v=FKIs7Bp51Bw) |  | ☐ |
| 7.2. Sumas y restas hasta 20 y hasta 100 | Decenas y números hasta 100 | Suma y resta con dos cifras sin llevar | Milton Education | 2:05 | [ver](https://www.youtube.com/watch?v=b8EVbkvN5SM) |  | ☐ |

## 1.º grado

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Contar hasta 10 | ¡Vamos a contar hasta 10! | Contar del 1 al 10 con los dedos | Patico De Hule | 3:26 | [ver](https://www.youtube.com/watch?v=WhXZaxeZ5sg) |  | ☐ |
| 2. Contar y comparar hasta 20 | ¿Quién tiene más? | Comparar números hasta el 20 | ElShowDelNerd | 1:54 | [ver](https://www.youtube.com/watch?v=RG9UC-EIWGE) |  | ☐ |
| 3. Anterior, siguiente y la recta | Antes, después y la recta | Número anterior y posterior | Peques Aprenden Jugando | 6:04 | [ver](https://www.youtube.com/watch?v=__zZXFW0bBc) |  | ☐ |
| 4. Sumar hasta 10 | Sumar hasta 10 | Sumar números del 1 al 10 | Kids Academy Español | 2:20 | [ver](https://www.youtube.com/watch?v=maB-2jyzi3o) |  | ☐ |
| 5. Sumar hasta 20 | Sumar hasta 20 | Suma hasta 20 | Kids Academy Español | 2:16 | [ver](https://www.youtube.com/watch?v=6m7BLiblhQI) |  | ☐ |
| 6. Restar hasta 20 | Restar hasta 20 | Restas hasta 20 | PractiMates | 4:39 | [ver](https://www.youtube.com/watch?v=nAw2aR4Quuk) |  | ☐ |
| 7. Completar a 10: ¿cuántos faltan? | Completar a 10 | ¿Cuántos faltan para llegar a 10? | Escuela de Aprendices | 3:45 | [ver](https://www.youtube.com/watch?v=PPK1XQRpud4) |  | ☐ |
| 8. Decenas y unidades hasta 99 | Decenas y unidades | Unidades y decenas (primer grado) | Tutoriales Aprende en un Click | 4:30 | [ver](https://www.youtube.com/watch?v=0j-80cSRVOk) |  | ☐ |
| 9. Sumar y restar hasta 99 sin llevar | Sumar y restar hasta 99 | Suma y resta con dos cifras sin llevar | Milton Education | 2:05 | [ver](https://www.youtube.com/watch?v=b8EVbkvN5SM) |  | ☐ |
| 10. Problemas de juntar, quitar y comparar | ¿Sumo o resto? | Problemas de suma y resta | Smile and Learn | 3:35 | [ver](https://www.youtube.com/watch?v=Sa_3MIlJwPs) |  | ☐ |

## 2.º grado

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Repaso: sumar y restar hasta 999 | Repaso: sumar y restar | Suma y resta con tres dígitos (hasta centenas) | Profa. Kempis | 15:22 | [ver](https://www.youtube.com/watch?v=DPnoGr-aFqE) |  | ☐ |
| 2. Grupos iguales y suma repetida | Grupos iguales | La multiplicación como suma repetida | Daniel Carreón | 3:51 | [ver](https://www.youtube.com/watch?v=W88npFSL6hI) |  | ☐ |
| 3. Arreglos de surcos | Arreglos de surcos | ¿Qué son los arreglos rectangulares? | Aula365 | 5:08 | [ver](https://www.youtube.com/watch?v=Upk4uPmG35U) |  | ☐ |
| 4. Tablas del 2, del 5 y del 10 | Tablas del 2, del 5 y del 10 | Contar de 2 en 2, de 5 en 5 y de 10 en 10 | ESMATE | 6:34 | [ver](https://www.youtube.com/watch?v=3KiDA0rxw9U) |  | ☐ |
| 5. Tablas del 3 y del 4 | Tablas del 3 y del 4 | Canción de las tablas del 3 y del 4 | Canti Rondas | 3:18 | [ver](https://www.youtube.com/watch?v=xYfqctQbwf4) |  | ☐ |
| 6. Tablas del 6 al 9 | Tablas del 6 al 9 | Multiplicar con los dedos del 6 al 10 | Profe Richard | 5:27 | [ver](https://www.youtube.com/watch?v=7-GqSQX_AyE) |  | ☐ |
| 7. Problemas de grupos iguales | Problemas de grupos iguales | Problemas de multiplicación y división | Smile and Learn | 3:50 | [ver](https://www.youtube.com/watch?v=gkRdcLfELxg) |  | ☐ |
| 8. Multiplicar 2 cifras por 1 cifra | Multiplicar 2 cifras por 1 | Multiplicar por una cifra, sin llevar y llevando | Matemóvil | 7:41 | [ver](https://www.youtube.com/watch?v=_qaPe8preOg) |  | ☐ |
| 9. Multiplicar 3 cifras por 1 cifra | Multiplicar 3 cifras por 1 | Problemas de multiplicación: tres cifras por una | Daniel Carreón | 4:53 | [ver](https://www.youtube.com/watch?v=UloZaAFC-sM) |  | ☐ |
| 10. Multiplicar en la tienda y la finca | Multiplicar en la tienda | ¿Cuánto dinero hay? Problemas de multiplicación | Aula365 | 5:17 | [ver](https://www.youtube.com/watch?v=Ma7qMYzwmJc) |  | ☐ |

## 3.º grado

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Repaso: tablas, sumas y restas | Repaso: tablas y sumas | 6 trucos para las tablas de multiplicar | Matemóvil | 8:31 | [ver](https://www.youtube.com/watch?v=Xv_zwlem5ek) | Aproximado: el repaso mezcla tablas, sumas y restas; el video cubre las tablas, que son la mayoría de las preguntas. | ☐ |
| 2. Repartir en partes iguales | Repartir en partes iguales | Aprendiendo a repartir: la división | Happy Learning | 2:05 | [ver](https://www.youtube.com/watch?v=iA0fP4tL67s) |  | ☐ |
| 3. Agrupar: ¿cuántos grupos salen? | Agrupar: ¿cuántos grupos? | División por agrupación | Math2me Kids | 5:59 | [ver](https://www.youtube.com/watch?v=ha0J5pCQu3Q) |  | ☐ |
| 4. Multiplicar y dividir son parientes | Multiplicar y dividir | Relación entre multiplicación y división | Proyecto Investic | 3:47 | [ver](https://www.youtube.com/watch?v=wEuGJUrI_VI) |  | ☐ |
| 5. Dividir con la tabla | Dividir con la tabla | Dividir usando las tablas de multiplicar | Escuela Eliecer Pérez Vargas | 4:53 | [ver](https://www.youtube.com/watch?v=DMsLbNdo6x8) |  | ☐ |
| 6. División con residuo | División con residuo | División con y sin residuo | ESMATE | 3:39 | [ver](https://www.youtube.com/watch?v=bKk3NgaQYqw) |  | ☐ |
| 7. Dividir 2 y 3 cifras entre 1 cifra | Dividir 2 y 3 cifras entre 1 | Divisiones paso a paso | Daniel Carreón | 9:36 | [ver](https://www.youtube.com/watch?v=mQ4wKV9_pZs) |  | ☐ |
| 8. ¿Qué hago con el residuo? | ¿Qué hago con el residuo? | Interpretar el residuo de una división | Classrom en @cción | 2:42 | [ver](https://www.youtube.com/watch?v=Ghc-ghLhnm8) |  | ☐ |
| 9. Problemas de dos pasos | Problemas de dos pasos | Problemas con dos operaciones | Daniel Carreón | 3:42 | [ver](https://www.youtube.com/watch?v=DIhNk_4rGfQ) |  | ☐ |
| 10. Problemas de la tienda y la cosecha | La tienda y la cosecha | Problemas de multiplicación y división | Smile and Learn | 3:50 | [ver](https://www.youtube.com/watch?v=gkRdcLfELxg) |  | ☐ |

## 4.º grado

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Repaso: sumar y restar números grandes | Repaso: números grandes | Adición y sustracción hasta la unidad de millón | Jorge Armando Quiroz Cabada | 5:37 | [ver](https://www.youtube.com/watch?v=77jKOTRFLEA) |  | ☐ |
| 2. Repaso: multiplicar por 1 y 2 cifras | Repaso: multiplicar | Multiplicación por dos cifras | Daniel Carreón | 3:43 | [ver](https://www.youtube.com/watch?v=CGXHrIp7Dpw) |  | ☐ |
| 3. Repaso: división con residuo | Repaso: división con residuo | División con y sin residuo | ESMATE | 3:39 | [ver](https://www.youtube.com/watch?v=bKk3NgaQYqw) |  | ☐ |
| 4. Dividir números grandes entre 1 cifra | Dividir grandes entre 1 cifra | Divisiones paso a paso | Daniel Carreón | 9:36 | [ver](https://www.youtube.com/watch?v=mQ4wKV9_pZs) |  | ☐ |
| 5. Dividir entre 2 cifras | Dividir entre 2 cifras | Dividir entre dos cifras | Smile and Learn | 6:42 | [ver](https://www.youtube.com/watch?v=g1zna75Ph-c) |  | ☐ |
| 6. Comprobar la división | Comprobar la división | La prueba de la división | Smartick | 4:33 | [ver](https://www.youtube.com/watch?v=hFDI2oQCktU) |  | ☐ |
| 7. El residuo: viajes y empaques | El residuo: viajes y empaques | Interpretar el residuo de una división | Classrom en @cción | 2:42 | [ver](https://www.youtube.com/watch?v=Ghc-ghLhnm8) |  | ☐ |
| 8. Doble, triple y mitad | Doble, triple y mitad | Mitades, dobles y triples | Isela López | 6:31 | [ver](https://www.youtube.com/watch?v=5RFDuFPQUAw) |  | ☐ |
| 9. Problemas con varias operaciones | Varias operaciones y plata | Operaciones combinadas | Smile and Learn | 3:13 | [ver](https://www.youtube.com/watch?v=RZzyWljhMEw) |  | ☐ |
| 10. Problemas con tablas y dinero | Problemas con tablas y plata | Interpretar tablas de datos | La BiBlioTHeKa | 1:58 | [ver](https://www.youtube.com/watch?v=qK6BhzWoXUw) |  | ☐ |

## 5.º grado

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Números grandes y redondeo | Números grandes y redondeo | Redondear números (5.º) | Profesora Sindy: Matematiclases | 9:48 | [ver](https://www.youtube.com/watch?v=zSZETm0OGOs) |  | ☐ |
| 2. Multiplicar varias cifras | Multiplicar varias cifras | Multiplicación con tres cifras | Daniel Carreón | 3:25 | [ver](https://www.youtube.com/watch?v=wVJRhd2xypY) |  | ☐ |
| 3. Dividir entre 2 cifras | Dividir entre 2 cifras | Dividir entre dos cifras | Smile and Learn | 6:42 | [ver](https://www.youtube.com/watch?v=g1zna75Ph-c) |  | ☐ |
| 4. Problemas con las cuatro operaciones | Las cuatro operaciones | Resolver problemas con las cuatro operaciones | CANALEDUCA Chile | 7:40 | [ver](https://www.youtube.com/watch?v=3_scwDY4N1M) |  | ☐ |
| 5. Décimas y centésimas | Décimas y centésimas | Unidad, décima y centésima | Peques Aprenden Jugando | 2:24 | [ver](https://www.youtube.com/watch?v=RsXOs4vETlY) |  | ☐ |
| 6. Comparar y ordenar decimales | Comparar decimales | Comparación de números decimales | Aula chachi | 5:25 | [ver](https://www.youtube.com/watch?v=c4Oe4XY5sdM) |  | ☐ |
| 7. Sumar y restar decimales | Sumar y restar decimales | Suma y resta con números decimales | Smile and Learn | 4:31 | [ver](https://www.youtube.com/watch?v=zRyZ_XPo_SE) |  | ☐ |
| 8. Multiplicar decimales | Multiplicar decimales | Multiplicación con decimales | Daniel Carreón | 3:39 | [ver](https://www.youtube.com/watch?v=shXj-YCWWeM) |  | ☐ |
| 9. Dividir con resultado decimal | Dividir con resultado decimal | Dividir con cociente decimal | Chris ValanMi | 2:29 | [ver](https://www.youtube.com/watch?v=ZRP6sGnbqxw) |  | ☐ |
| 10. Problemas con números decimales | Problemas con decimales | Problema con números decimales | Profesor CocoLoco | 9:37 | [ver](https://www.youtube.com/watch?v=DcIOkncWpFw) |  | ☐ |

## Familias: prueba de entrada

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Sumar y restar plata | Sumar y restar plata | Suma y resta con dinero | Daniel Carreón | 12:00 | [ver](https://www.youtube.com/watch?v=35Ho7YOdQUs) |  | ☐ |
| 2. Vueltos | Vueltos | Cómo calcular el vuelto | Learn with Socrates | 3:51 | [ver](https://www.youtube.com/watch?v=gKVGyH1lXuk) |  | ☐ |
| 3. Multiplicar precios | Multiplicar precios | Cálculo mental: multiplicar decenas y centenas acabadas en 0 | Smile and Learn | 5:32 | [ver](https://www.youtube.com/watch?v=3ereGB0d53Y) |  | ☐ |
| 4. Cuántas unidades alcanzan | Cuántas unidades alcanzan | Problemas con multiplicaciones de una cifra | Daniel Carreón | 3:15 | [ver](https://www.youtube.com/watch?v=M8LekjX2usM) |  | ☐ |
| 5. Bultos y viajes | Bultos y viajes | Interpretar el residuo de una división | Classrom en @cción | 2:42 | [ver](https://www.youtube.com/watch?v=Ghc-ghLhnm8) |  | ☐ |
| 6. Presupuesto semanal | Presupuesto semanal | ¿Cómo elaborar un presupuesto familiar? | Superintendencia de Banca del Perú | 1:22 | [ver](https://www.youtube.com/watch?v=cN1c8J3sXyA) |  | ☐ |
| 7. Porcentajes | Porcentajes | Porcentajes al instante y sin calculadora | Matemóvil | 7:04 | [ver](https://www.youtube.com/watch?v=y98aiAErP68) |  | ☐ |
| 8. Proporciones | Proporciones | Regla de tres simple directa | Matemáticas profe Alex | 6:55 | [ver](https://www.youtube.com/watch?v=uQO_oBKqypQ) |  | ☐ |
| 9. Unidades: arrobas y kilos | Arrobas y kilos | Conversión de unidades de peso | Daniel Carreón | 8:00 | [ver](https://www.youtube.com/watch?v=LlX0QT4nivQ) | Aproximado: no hay video en español con la arroba colombiana (12,5 kilos); explica cómo convertir unidades de peso. | ☐ |
| 10. Ganancia de una venta | Ganancia de una venta | Cómo sacar la ganancia de un producto | Sistema Empresarial Aguilar | 5:34 | [ver](https://www.youtube.com/watch?v=dGEc1qMFttQ) |  | ☐ |

## Familias: cuaderno básico

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Sumar y restar plata | Sumar y restar plata | Suma y resta con dinero | Daniel Carreón | 12:00 | [ver](https://www.youtube.com/watch?v=35Ho7YOdQUs) |  | ☐ |
| 2. Vueltos | Vueltos | Cómo calcular el vuelto | Learn with Socrates | 3:51 | [ver](https://www.youtube.com/watch?v=gKVGyH1lXuk) |  | ☐ |
| 3. Multiplicar precios | Multiplicar precios | Cálculo mental: multiplicar decenas y centenas acabadas en 0 | Smile and Learn | 5:32 | [ver](https://www.youtube.com/watch?v=3ereGB0d53Y) |  | ☐ |
| 4. Cuántas unidades alcanzan | Cuántas unidades alcanzan | Problemas con multiplicaciones de una cifra | Daniel Carreón | 3:15 | [ver](https://www.youtube.com/watch?v=M8LekjX2usM) |  | ☐ |
| 5. Repartir en bultos iguales | Repartir en bultos iguales | La división como agrupamiento | Daniel Carreón | 5:25 | [ver](https://www.youtube.com/watch?v=fAC4lyYKa9w) |  | ☐ |
| 6. Bultos y viajes de la mula | Bultos y viajes de la mula | Interpretar el residuo de una división | Classrom en @cción | 2:42 | [ver](https://www.youtube.com/watch?v=Ghc-ghLhnm8) |  | ☐ |
| 7. Pago de jornales | Pago de jornales | Problemas de multiplicación de tres factores | STVE Telebásica | 5:28 | [ver](https://www.youtube.com/watch?v=w7c2uWA6kYg) |  | ☐ |
| 8. Presupuesto semanal | Presupuesto semanal | ¿Cómo elaborar un presupuesto familiar? | Superintendencia de Banca del Perú | 1:22 | [ver](https://www.youtube.com/watch?v=cN1c8J3sXyA) |  | ☐ |
| 9. ¿Es razonable el cobro? | ¿Es razonable el cobro? | Estimar sumas y restas redondeando | ElShowDelNerd | 1:50 | [ver](https://www.youtube.com/watch?v=yk5b6A6i5gQ) |  | ☐ |
| 10. Cuentas de la casa | Cuentas de la casa | Presupuesto familiar en 3 pasos | Mami Emprende | 9:27 | [ver](https://www.youtube.com/watch?v=nFNzvWjCft8) |  | ☐ |

## Familias: cuaderno intermedio

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Cálculo mental con plata | Cálculo mental con plata | Cómo sumar mentalmente al instante | Matemóvil | 3:59 | [ver](https://www.youtube.com/watch?v=mDpDqe7IDVs) |  | ☐ |
| 2. Compras de varios productos | Compras de varios productos | Problemas con multiplicaciones de una cifra | Daniel Carreón | 3:15 | [ver](https://www.youtube.com/watch?v=M8LekjX2usM) |  | ☐ |
| 3. Ventas en el mercado | Ventas en el mercado | Problemas de multiplicación: tres cifras por una | Daniel Carreón | 4:53 | [ver](https://www.youtube.com/watch?v=UloZaAFC-sM) |  | ☐ |
| 4. Producción por árbol | Producción por árbol | Problemas de división | Wendy Carranza | 3:40 | [ver](https://www.youtube.com/watch?v=RUMy7uHTqcU) |  | ☐ |
| 5. Bultos y viajes | Bultos y viajes | Interpretar el residuo de una división | Classrom en @cción | 2:42 | [ver](https://www.youtube.com/watch?v=Ghc-ghLhnm8) |  | ☐ |
| 6. Pago de jornales | Pago de jornales | Problemas de multiplicación de tres factores | STVE Telebásica | 5:28 | [ver](https://www.youtube.com/watch?v=w7c2uWA6kYg) |  | ☐ |
| 7. Presupuesto con saldo | Presupuesto con saldo | Presupuesto familiar en 3 pasos | Mami Emprende | 9:27 | [ver](https://www.youtube.com/watch?v=nFNzvWjCft8) |  | ☐ |
| 8. Qué es el 10, el 25 y el 50 % | El 10, el 25 y el 50 % | Cómo se calculan el 10 %, 20 %, 25 % y 50 % | El profesor Prade | 15:09 | [ver](https://www.youtube.com/watch?v=_OSlHbmDD9g) |  | ☐ |
| 9. Calcular porcentajes | Calcular porcentajes | Cómo calcular un porcentaje | Daniel Carreón | 4:20 | [ver](https://www.youtube.com/watch?v=RE3XoDORMys) |  | ☐ |
| 10. Ganancia de una venta | Ganancia de una venta | Cómo sacar la ganancia de un producto | Sistema Empresarial Aguilar | 5:34 | [ver](https://www.youtube.com/watch?v=dGEc1qMFttQ) |  | ☐ |

## Familias: cuaderno avanzado

| Nivel | Lección | Video | Canal | Duración | Enlace | Nota | Revisado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Porcentajes | Porcentajes | Porcentajes al instante y sin calculadora | Matemóvil | 7:04 | [ver](https://www.youtube.com/watch?v=y98aiAErP68) |  | ☐ |
| 2. Descuentos | Descuentos | Cómo calcular descuentos | Daniel Carreón | 5:02 | [ver](https://www.youtube.com/watch?v=jjyJ4p3E4KM) |  | ☐ |
| 3. Pérdida de peso al secar | Pérdida de peso al secar | Cálculo de porcentajes de disminución | MatemátiKatz | 2:12 | [ver](https://www.youtube.com/watch?v=ANYcYWnA8iA) | Aproximado: explica cómo calcular una disminución en porcentaje, que es la cuenta del secado. | ☐ |
| 4. Arrobas y kilos | Arrobas y kilos | Conversión de unidades de peso | Daniel Carreón | 8:00 | [ver](https://www.youtube.com/watch?v=LlX0QT4nivQ) | Aproximado: no hay video en español con la arroba colombiana (12,5 kilos); explica cómo convertir unidades de peso. | ☐ |
| 5. Kilos, gramos y libras | Kilos, gramos y libras | Cómo pasar de kilos a gramos | Respuestasenvideo | 2:10 | [ver](https://www.youtube.com/watch?v=4TIX8Y8gN0Q) | Aproximado: explica kilos a gramos; la libra de la app es de 500 gramos (los videos usan la libra inglesa). | ☐ |
| 6. Hectáreas y siembra | Hectáreas y siembra | Hectárea, área y centiárea | La BiBlioTHeKa | 2:43 | [ver](https://www.youtube.com/watch?v=ezsJqCZfQAg) |  | ☐ |
| 7. Proporciones | Proporciones | Proporcionalidad directa | Daniel Carreón | 4:03 | [ver](https://www.youtube.com/watch?v=nP9SwAqhVTI) |  | ☐ |
| 8. Comparar unidades de peso | Comparar unidades de peso | Conversión de unidades de peso | Daniel Carreón | 8:00 | [ver](https://www.youtube.com/watch?v=LlX0QT4nivQ) | Aproximado: mismo caso de la arroba; se repite a propósito el video de conversión de peso. | ☐ |
| 9. Ingresos, gastos y ganancia | Ingresos, gastos y ganancia | Ingresos, costos y gastos | AulaDeEconomia | 5:14 | [ver](https://www.youtube.com/watch?v=0PCwt2L4RdU) |  | ☐ |
| 10. Planear la cosecha | Planear la cosecha | Cómo sacar la ganancia de un producto | Sistema Empresarial Aguilar | 5:34 | [ver](https://www.youtube.com/watch?v=dGEc1qMFttQ) |  | ☐ |

## Guía para familias

| Tema | Video | Canal | Duración | Enlace | Revisado |
| --- | --- | --- | --- | --- | --- |
| Por qué cuesta y cómo enseñar | El secreto de enseñar matemáticas | AprendemosJuntos (BBVA) | 6:20 | [ver](https://www.youtube.com/watch?v=qPIy2jtW0DE) | ☐ |
| Explicar sin frustrarse | Cómo explicar matemáticas a un niño de primaria | Francisco Lorenzo | 4:55 | [ver](https://www.youtube.com/watch?v=2Ofz1N2kHnc) | ☐ |
| Cálculo mental en casa | Cómo ayudo a mi hijo con el cálculo | profkris | 5:31 | [ver](https://www.youtube.com/watch?v=kFy-pmNwHI4) | ☐ |
| Sumar y restar (1.º y 2.º) | Cómo enseñar a sumar y restar a un niño | El Mundo del Aprendizaje | 10:18 | [ver](https://www.youtube.com/watch?v=qa8tzkQczRw) | ☐ |
| Las tablas de multiplicar (3.º) | Cómo enseñar las tablas de multiplicar | Seño Lis | 5:47 | [ver](https://www.youtube.com/watch?v=N3K5i6gJ2vs) | ☐ |
| La división (3.º a 5.º) | 7 ideas para aprender a dividir fácil | Power Kids | 9:26 | [ver](https://www.youtube.com/watch?v=pBsMIDVJlMM) | ☐ |
## Cómo cambiar un video

1. Busque el video en YouTube y copie el código de 11 caracteres que va después de `watch?v=`.
2. Reemplácelo en `src/contenido/videos.ts` junto con el título, el canal y la duración.
3. Compruebe que permite verse dentro de otras páginas: abra `https://www.youtube-nocookie.com/embed/CÓDIGO`; si dice que no está disponible, elija otro.
4. Corra `npm test`.
