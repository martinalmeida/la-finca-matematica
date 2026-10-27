# La Finca Matemática

Aplicación web progresiva (PWA) para practicar **suma, resta, multiplicación y división** con problemas de la vida rural de San Vicente de Chucurí (Santander, Colombia). Es la herramienta de intervención de la tesis de Maestría en Educación *Fortalecimiento del aprendizaje de las operaciones matemáticas básicas mediante una plataforma web contextualizada en la vida rural con estudiantes de primaria del modelo Escuela Nueva del Colegio Miradores de Llana Caliente*.

- Estudiantes de 1.º a 5.º (aulas multigrado), grado **Inclusión** y sección propia para familias.
- **Prueba de entrada → 10 niveles → prueba final.** Cada ruta tiene 10 niveles, uno por tema, con 10 preguntas cada uno. La prueba de entrada (diagnóstica, que también hace de tutorial) asigna la exigencia —Refuerzo, Básico o Avanzado— y, en familias, uno de tres cuadernos. La prueba final repite los temas con otros números y se compara tema por tema con la de entrada (`src/juego/pruebas.ts`, `src/pantallas/Prueba.tsx`).
- Rutas: 1.º a 5.º, Inclusión y tres cuadernos de familias, generadas por código con **120 plantillas** (ver [docs/PLANTILLAS.md](docs/PLANTILLAS.md)); 5.º incluye números decimales (`src/contenido/plantillas/decimales.ts`).
- **100 % sin conexión** después de la primera carga: sin APIs, CDN, fuentes externas, analítica ni anuncios. Todo va empaquetado.
- **Videos de ayuda opcionales** (YouTube, en español): solo se cargan si alguien toca «Ver video» y hay internet; sin señal se avisa y lo demás sigue igual. Se apagan en Ajustes. Catálogo y revisión docente: [docs/VIDEOS.md](docs/VIDEOS.md).
- Varios perfiles por celular, datos solo en `localStorage` del dispositivo; nada sale del celular.
- **Grado Inclusión** (autismo y otras formas de aprender): sin pruebas y sin perder; agenda «Primero… Después…», pausa para respirar, pantalla calmada, trazar cifras, contar tocando, número y cantidad, juntar y quitar arrastrando (`src/contenido/plantillas/inclusion.ts`).
- **Banda Refuerzo** (0–4 aciertos en la prueba de entrada): números más pequeños, dos opciones, dibujo de ayuda visible, enunciado frase por frase con voz lenta, paso a paso. A cualquier estudiante se le ofrece el paso a paso tras dos errores (`src/juego/apoyo.ts`, `src/componentes/PasoAPaso.tsx`).
- **Escribir números con el dedo (Inclusión):** Taller de números (mira, repasa, escribe solo) y actividades de trazar en la ruta. Reconocedor de cifras propio, sin librerías ni internet (nubes de puntos $P, `src/juego/trazos.ts`; trazos de las cifras en `src/contenido/cifras.ts`).
- **Realidad aumentada opcional** (apagada por defecto, la activa un adulto) con [LocAR.js](https://github.com/AR-js-org/locar.js) y three.js: la cámara (Webcam de LocAR), la orientación del celular (DeviceOrientationControls) y los objetos de la finca anclados alrededor del niño con `LocAR.add`, que se quedan en su sitio al girar el celular. Sin GPS: el origen es fijo (`fakeGps`). Se carga aparte, solo al abrir la cámara (`src/servicios/ra.ts`, `src/componentes/EscenaRA.tsx`). La imagen no se graba ni se envía.
- **Vibración corta solo en los errores** (35 ms, `retroError` en `src/servicios/sonido.ts`).
- Interfaz de vidrio tipo red social: muro de inicio con historias (una mini-lección por tema y ruta, en `src/contenido/lecciones.ts`), reto del día y logros locales; pestañas Inicio, Ruta, Aprender y Perfil. La complejidad de los temas sube de dos en dos (Inicio → Básico → Intermedio → Avanzado → Reto; ver `src/juego/complejidad.ts`). En Ajustes, «Ligeros» quita transparencias y animaciones para celulares lentos.

> Antes de usarla con estudiantes, la plataforma debe pasar por la validación de expertos y el pilotaje previstos en la tesis (apartado 5.8).

## Requisitos

- Node.js 20 o superior (probado con Node 24) y npm.
- Para el APK (opcional): Android Studio con el SDK de Android y Java 17 o superior.

## Comandos

```bash
npm install        # instala las dependencias (solo la primera vez, con internet)
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # build de producción en dist/ (incluye el service worker)
npm run preview    # sirve dist/ en http://localhost:4173 para probar la PWA
npm test           # pruebas (Vitest): generadores, pruebas diagnóstica y final, detector de errores, progresión, almacenamiento, refuerzo, cifras, vibración
npm run iconos     # vuelve a generar los íconos PNG (public/iconos)
npm run catalogo   # vuelve a generar docs/PLANTILLAS.md
```

`npm test` genera **1.000 ejercicios por plantilla y nivel de muestra** (unas 800 pruebas, unos 15 s). Para una pasada rápida: `MUESTRAS=50 npm test`. Para una sola pista: `PISTAS=g3 npm test`.

> El service worker solo funciona con el build (`npm run build` + `npm run preview`), no con `npm run dev`.

## Cómo verificar el modo sin conexión

1. `npm run build` y `npm run preview`.
2. Abra `http://localhost:4173` en Chrome. Al terminar el precache aparece el aviso **«Lista para usar sin internet»**.
3. Abra las herramientas de desarrollo (F12) → **Application → Service Workers**: debe aparecer `sw.js` activo. En **Cache Storage** está todo el build (`workbox-precache-…`).
4. En **Network**, marque **Offline** (o active el modo avión del celular) y recargue: la aplicación abre igual.
5. Cree un perfil y complete un nivel sin conexión.
6. Opcional: **Lighthouse** (pestaña Lighthouse → Mobile → Performance, Accessibility, Best practices) sobre `npm run preview`.

## Distribución en zonas sin internet

### Opción A: publicar una vez e instalar cuando haya señal

1. `npm run build`.
2. Suba la carpeta `dist/` a un hosting estático gratuito con HTTPS (por ejemplo, GitHub Pages, Netlify o Cloudflare Pages). El build usa rutas relativas (`base: './'`), así que funciona también en subcarpetas.
3. En cada celular, cuando haya señal (en el casco urbano, por ejemplo), abra la dirección en Chrome, espere el aviso «Lista para usar sin internet» y toque **«Instalar en este celular»** (o menú ⋮ → *Agregar a pantalla de inicio*).
4. Desde ahí funciona sin conexión. Si hay una versión nueva, se actualiza sola la próxima vez que el celular tenga señal y abra la app.

### Opción B: servir desde un computador del colegio en la red local

Sirve para instalar en los celulares sin internet externo, usando el wifi del colegio o un router sin conexión.

```bash
npm run build
npx serve dist -l 3000          # o: npx vite preview --host --port 3000
```

Luego, en cada celular conectado a la misma red, abra `http://IP-DEL-COMPUTADOR:3000` (la IP se ve con `ipconfig` en Windows o `ip addr` en Linux).

**Importante:** Chrome solo registra el service worker (y permite instalar) en `https://` o en `localhost`. En la red local con `http://` la app funciona mientras esté conectada, pero **no queda disponible sin conexión**. Hay dos soluciones:

- Servir con HTTPS local, por ejemplo con un certificado de [mkcert](https://github.com/FiloSottile/mkcert) (`npx serve dist --ssl-cert cert.pem --ssl-key key.pem`) e instalar el certificado raíz en los celulares.
- Usar la **opción C** (APK), que no tiene esta restricción.

Para que `npx serve` funcione sin internet, ejecútelo una vez con conexión (queda en la caché de npm) o instálelo antes: `npm i -g serve`.

### Opción C: APK de Android con Capacitor

El proyecto incluye `capacitor.config.json` (la app web se empaqueta desde `dist/`). Con internet, una sola vez:

```bash
npm i -D @capacitor/cli @capacitor/core @capacitor/android
npm run build
npx cap add android            # crea la carpeta android/
npx cap sync android           # copia dist/ dentro del proyecto Android
npx cap open android           # abre Android Studio
```

En Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`. También se puede compilar por consola con `cd android && ./gradlew assembleDebug`.

Para instalarlo:

- **Por cable:** active *Opciones de desarrollador → Depuración USB* en el celular y ejecute `adb install app-debug.apk`.
- **Por memoria o Bluetooth:** copie el APK al celular y ábralo. Hay que permitir *Instalar apps de fuentes desconocidas*.

Después de cada cambio en el código: `npm run build && npx cap sync android` y vuelva a compilar el APK. En el APK, los datos se guardan en el `localStorage` del WebView de la app.

## Estructura

```
src/
  juego/            motor de niveles, RNG con semilla, tipos, errores, progresión, perfiles, silo, reto en pareja, informes
  contenido/        contexto.ts (banco de contexto local), pistas.ts (registro), plantillas/ (g1–g5, familia, util)
  almacenamiento/   localStorage seguro (respaldo en memoria), datos, migraciones, copia de seguridad
  componentes/      teclado propio, ejercicio, pistas visuales, ilustraciones SVG, interacciones táctiles
  pantallas/        bienvenida, ¿quién juega?, crear perfil, mapa, nivel, resultado, mi finca, ajustes, familias, panel docente, reto en pareja, taller de números
  pwa/              registro del service worker e instalación
  servicios/        sonidos (Web Audio), vibración, voz (speechSynthesis), realidad aumentada (LocAR.js)
tests/              pruebas Vitest
scripts/            generador de íconos y del catálogo de plantillas
docs/               guía docente y catálogo de plantillas
```

### Cómo funciona la generación

- Cada ruta define **10 temas** (niveles 1 a 10) con una lista de *usos*: una plantilla con parámetros (rangos, operación, tablas, si hay incógnita, datos que sobran…). Un tema puede marcar con `prueba` el uso de su pregunta en las pruebas; si no, se usa el primero. Las plantillas se comparten entre grados (por ejemplo, 2.º usa las de tablas de 3.º).
- En un nivel, la pregunta *i* (0 a 9) tiene dificultad `d = desde + (hasta − desde) · i / 9`, con el rango de la banda: Refuerzo 0–0,5; Básico 0,2–0,8; Avanzado 0,5–1. Cada plantilla usa `d` para subir el tamaño de los números, las reagrupaciones, los pasos, la posición de la incógnita, los datos que sobran, la cercanía de los distractores y la proporción de respuestas con teclado frente a opción múltiple.
- Para pasar se necesitan 7, 8 o 9 aciertos de 10 según la banda; en Inclusión siempre se pasa.
- Las pruebas diagnóstica y final generan una pregunta por tema con `d = 0,5`; la final usa otra semilla (forma paralela).
- La semilla del generador es `hash(códigoPerfil + pista + nivel + intento)` (mulberry32): cada intento trae ejercicios nuevos, reproducibles para depurar.
- El motor alterna las cuatro dimensiones (comprensión, procedimiento, problemas, aplicación) que haya en el tema y evita enunciados repetidos en un nivel.

## Cómo agregar una plantilla nueva

1. Abra el archivo de la pista (`src/contenido/plantillas/g3.ts`, por ejemplo) y cree un objeto `Plantilla`:

```ts
const cajonesFermentacion: Plantilla = {
  id: 'g3-cajones',                    // único, con el prefijo de la pista
  dimension: 'problemas',              // comprension | procedimiento | problemas | aplicacion
  operacion: 'multiplicacion',
  descripcion: 'Kilos de cacao en baba en varios cajones',
  generar(ctx): EjercicioBase {
    const { rng } = ctx;
    const cajones = rng.entero(2, lerp(4, 9, dif(ctx)));   // crece con la dificultad d
    const kilos = rng.entero(2, 9) * 10;
    const respuesta = cajones * kilos;
    const calc = { op: 'multiplicacion' as const, a: cajones, b: kilos };
    return {
      enunciado: `En la finca hay ${cajones} cajones de fermentación con ${kilos} kilos de cacao en baba cada uno. ¿Cuántos kilos hay?`,
      instruccion: 'Multiplica',
      ilustracion: 'mazorca',
      datos: { cajones, kilos },
      respuesta,
      unidad: 'kilos',
      ...modoRespuesta(ctx, respuesta, calc),            // opciones con errores típicos o teclado
      calculo: calc,                                      // lo usa el detector de errores
      pistas: [
        '¿Se repite la misma cantidad varias veces?',
        { tipo: 'texto', texto: `${cajones} veces ${kilos}` },
        `${cajones} × ${kilos}`,
      ],
      explicacion: `${cajones} × ${kilos} = ${respuesta} kilos.`,
    };
  },
};
```

2. Agréguela a la lista `plantillas` de la ruta y úsela en uno o más temas: `u(cajonesFermentacion, { maxCajones: 9 })`.
3. Use nombres, lugares y productos de `src/contenido/contexto.ts` y respete las reglas de contenido: sin violencia, alcohol, armas ni marcas; números plausibles; ningún resultado negativo; divisiones exactas salvo que la plantilla trabaje el residuo (`permiteResiduo: true` o `calculo.redondearArriba`); precios marcados como de ejemplo.
4. Ejecute `PISTAS=g3 npm test`: la prueba comprueba 1.000 ejercicios por uso y dificultad de muestra (d = 0; 0,5; 1) (respuesta correcta, rango del grado, sin negativos, divisiones exactas y distractores distintos).
5. `npm run catalogo` para actualizar docs/PLANTILLAS.md.

## Privacidad y ética

- Ningún dato sale del dispositivo: no hay servidores, cookies de terceros ni analítica.
- Solo apodos y códigos anónimos (`FM-3-K7Q2`); no se piden nombres reales.
- El registro detallado por ejercicio solo se guarda si el docente activa el **modo investigación** (desactivado por defecto), que debe usarse solo con el consentimiento informado de las familias. Sin él, la app guarda solo los resúmenes agregados (aciertos por operación y tipos de error) que usan el panel docente y la vista de familias.
- Las exportaciones (CSV/JSON) llevan códigos, nunca apodos ni nombres.
- Los resultados no se presentan como notas escolares.

## Guía para el docente

Ver [docs/GUIA-DOCENTE.md](docs/GUIA-DOCENTE.md).
