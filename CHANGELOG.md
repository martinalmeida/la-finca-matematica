# Novedades de La Finca Matemática

Todos los cambios importantes de la aplicación, de la versión más nueva a la más vieja.
Las versiones siguen [SemVer](https://semver.org/lang/es/): MAYOR.MENOR.PARCHE.

- **MAYOR** (2.0.0): cambios que obligan a empezar de nuevo o rompen lo anterior (p. ej., borrar el avance guardado).
- **MENOR** (1.2.0): funciones nuevas que no rompen nada.
- **PARCHE** (1.1.1): arreglos de errores y ajustes de contenido.

La aplicación muestra estas notas en *Ajustes → Aplicación* (estudiantes y familias) y en el panel del profesor.

## [1.4.3] - 2026-11-02

### Cambiado
- La pantalla de arranque de la app instalada también es verde «Monte» (#17804A), con el ícono encima.

## [1.4.2] - 2026-11-02

### Cambiado
- Color del tema verde «Monte» (#17804A), el mismo del ícono nuevo: se ve en la barra del navegador y del celular.

## [1.4.1] - 2026-11-02

### Cambiado
- Ícono nuevo de la aplicación, el isotipo «Brote»: un signo + del que nace un brote. Se ve en la pantalla de inicio del celular, en la pestaña del navegador y dentro de la app.
- La pantalla de entrada muestra solo el formulario, sin la ilustración de la finca.

## [1.4.0] - 2026-10-31

### Nuevo
- Encuesta de satisfacción sobre la aplicación al terminar la ruta: después de la prueba final (en Inclusión, al superar el último nivel). Es obligatoria y se responde una sola vez por usuario.
- Siete preguntas con caritas de 1 (nada) a 5 (mucho): fácil de usar, le gustó, aprendió, videos y lecciones, dibujos y voz, la usaría otra vez y la recomendaría; y dos preguntas para escribir que no son obligatorias. Inclusión responde una versión corta de cuatro preguntas, sin escribir. Todo se lee en voz alta.
- Se puede responder sin internet: se guarda en el celular y sube a la nube cuando hay señal.
- Informes del profesor: sección «Encuesta de satisfacción» con las respuestas recibidas, la satisfacción (% de respuestas 4 o 5), el promedio y el reparto de cada pregunta y los comentarios. También va en el PDF, en el informe de cada usuario y en dos hojas nuevas del Excel («Encuesta» y «Encuesta por pregunta»).

### Cambiado
- Quien ya había presentado la prueba final la verá la próxima vez que abra la aplicación.

## [1.3.0] - 2026-10-30

### Nuevo
- Ruta de Inclusión rehecha para niños con síndrome de Down, autismo y otras formas de aprender: 8 bloques y 33 niveles cortos de 5 actividades, que llegan hasta el 10 (antes, 23 niveles de 10 actividades hasta el 100).
- Actividades nuevas, todas tocando: «Igual a este» con un modelo, puntos como en el dado, llenar el marco de 10, «Pon 3 en la canasta» y contar tocando, con la voz diciendo «uno, dos, tres…» en cada toque.
- Aprendizaje sin error en Inclusión: como mucho 2 opciones en los primeros bloques y 3 después; la opción equivocada se desvanece y queda marcada la correcta, sin equis ni vibración.
- Ocho lecciones nuevas de Inclusión (una por bloque) y un video para cada nivel.
- Realidad aumentada encendida en todos los celulares y tabletas, para todos los usuarios, con el botón grande «Ver en mi finca» en cada ejercicio con objetos. Se apaga en Ajustes sin PIN; en el computador viene apagada.

### Cambiado
- Quien ya jugaba la ruta anterior de Inclusión queda en el nivel equivalente de la nueva y conserva sus semillas y su finca. En los informes del profesor, lo jugado antes aparece aparte como «Inclusión (ruta anterior)».

## [1.2.2] - 2026-10-30

### Mejorado
- Filtros de los informes rediseñados: una fila de botones (Periodo, Grupo, Usuarios, Operación, Actividad) con su panel de opciones, conteos para orientarse y los filtros aplicados como chips que se quitan con un toque.
- Periodo con atajos que muestran sus fechas y un rango personalizado; usuarios con buscador, agrupados por grado y con «Elegir todos» o «Ninguno».
- La barra de filtros y los botones PDF y Excel quedan fijos arriba al bajar por el informe; en el celular cada panel sale como una hoja desde abajo.

### Arreglado
- Excel: los valores p se muestran con seis decimales (antes salían en notación científica).
- PDF: las fechas de las gráficas ya no se montan unas sobre otras.

## [1.2.1] - 2026-10-30

### Arreglado
- PDF de los informes: las gráficas de «Evolución» (líneas y columnas) salían vacías al imprimir.
- PDF de los informes: el mapa usuario × tema de Inclusión (23 temas) y la tabla comparativa de usuarios quedaban cortados a la derecha; ahora caben en la hoja.
- Excel de los informes: el valor p de la prueba t y el de Wilcoxon se guardan exactos (antes, al redondear, un valor muy pequeño aparecía como 0).

## [1.2.0] - 2026-10-30

### Nuevo
- Informes del profesor rehechos: una barra de filtros (periodo, grupo, usuarios, operación y tipo de actividad) que controla todo el informe.
- Secciones: Resumen con indicadores y «Lo más importante», Entrada vs. final, Seguimiento, Evolución en el tiempo, Temas y operaciones, Errores y Comparación de usuarios.
- Prueba de entrada vs. final con estadística para la tesis: diferencia media con intervalo de confianza del 95 %, prueba t pareada, valor p, d de Cohen, ganancia normalizada de Hake y prueba de Wilcoxon.
- Alertas de seguimiento: días sin jugar, acierto bajo reciente, atascado en un nivel, muchas pistas, sin prueba de entrada o bajó en la final.
- Gráficas nuevas: líneas, columnas y barras con meta, pre/post por tema y por usuario, mapas de calor usuario × tema y error × operación; cada una con «Ver tabla».
- Exportar lo que se ve, con los mismos filtros, a PDF (con portada y definiciones) o a Excel (.xlsx, una hoja por tabla).
- Cada ficha de usuario trae su informe completo con su ruta nivel por nivel y sus últimas partidas.

## [1.1.0] - 2026-10-30

### Nuevo
- Se puede usar el teclado del computador: cifras, Retroceso, coma y Enter en el teclado numérico; letras A, B, C y D para elegir opciones; S/N en «¿Es razonable?»; flechas en la recta, el algoritmo y los arreglos; P para pedir una pista y Enter para seguir.
- Ninguna pregunta se repite: cada usuario lleva un historial de las preguntas que ya vio (también en otro celular) y la app nunca se las vuelve a mostrar.
- Banco de preguntas mucho más grande en todas las rutas: cada tema tiene al menos 1.000 preguntas y 40 situaciones distintas de la vida de la vereda.
- Inclusión: nuevos colores, formas y objetos para clasificar, ordenar y contar.

### Arreglado
- «Cuántas unidades alcanzan» (familias) ahora pregunta cuántas unidades alcanzan con la plata, como dice el tema.
- Concordancias («una semilla», «1 caja») y listas de decimales («4,2 y 4,51 metros»).

## [1.0.0] - 2026-10-28

Primera versión publicada. Reúne todo lo construido del 26 al 28 de octubre de 2026:

- Juego por niveles para 1.º a 5.º, familias e Inclusión, sin conexión, con prueba diagnóstica y final.
- Cuentas con usuario y contraseña sobre Supabase: el profesor crea y administra a los usuarios, y el avance se sincroniza.
- Lecciones por grado, videos de ayuda verificados, voz en español de Colombia y realidad aumentada opcional.
- Instalación guiada en Android e iOS y actualización automática.
