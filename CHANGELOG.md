# Novedades de La Finca Matemática

Todos los cambios importantes de la aplicación, de la versión más nueva a la más vieja.
Las versiones siguen [SemVer](https://semver.org/lang/es/): MAYOR.MENOR.PARCHE.

- **MAYOR** (2.0.0): cambios que obligan a empezar de nuevo o rompen lo anterior (p. ej., borrar el avance guardado).
- **MENOR** (1.2.0): funciones nuevas que no rompen nada.
- **PARCHE** (1.1.1): arreglos de errores y ajustes de contenido.

La aplicación muestra estas notas en *Ajustes → Aplicación* (estudiantes y familias) y en el panel del profesor.

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
