# Marca: La Finca Matemática

## Isotipo «Brote»

Un signo + del que nace un brote: la suma, la finca y el aprendizaje que crece.

### Archivos

Están en `public/iconos` (el favicon `.ico`, en `public/`).

**Isotipo (para documentos, la tesis, presentaciones e impresos)**

| Archivo | Uso |
| --- | --- |
| `isotipo.svg` / `isotipo-1024.png` | A color, sobre fondos claros |
| `isotipo-una-tinta.svg` / `isotipo-una-tinta-1024.png` | Una sola tinta (impresión en blanco y negro, sellos, fotocopias) |
| `isotipo-blanco.svg` / `isotipo-blanco-1024.png` | En blanco, sobre fondos oscuros o fotografías |

**Íconos de la PWA**

| Archivo | Uso |
| --- | --- |
| `icon.svg` | Favicon vectorial y logo dentro de la app (`Logo` en `src/componentes/Ilustraciones.tsx`) |
| `public/favicon.ico` | Favicon para navegadores antiguos (16, 32 y 48 px) |
| `icon-192.png`, `icon-512.png` | Ícono de la app (`purpose: any`) |
| `icon-maskable-192.png`, `icon-maskable-512.png` | Android con máscara (`purpose: maskable`) |
| `apple-touch-icon.png` | Pantalla de inicio en iPhone/iPad (180 px) |
| `maskable.svg` | Fuente vectorial de la versión maskable |

El manifest y `includeAssets` están en `vite.config.ts`; el favicon y el ícono de iPhone, en `index.html`. `theme_color` y `background_color` son Monte (`#17804A`). Los PNG de 1024 del isotipo no se guardan para usar sin conexión (`globIgnores`).

### Colores

| Nombre | Hex | Uso |
| --- | --- | --- |
| Monte | `#17804A` | Signo +, color principal, fondo del ícono |
| Brote | `#8CD13C` | Hojas sobre fondos claros |
| Brote claro | `#B8E85A` | Hojas sobre fondo Monte |
| Tinta | `#10231A` | Versión a una tinta y fondos oscuros |

### Reglas de uso

- **Área de protección:** deja alrededor del isotipo un espacio libre igual al grosor del brazo del + (1/4 del ancho del signo).
- **Tamaño mínimo:** 16 px en pantalla y 8 mm en impresión.
- **No hagas esto:** girarlo, deformarlo, cambiarle los colores fuera de esta paleta, agregarle sombras o degradados, ni poner las hojas verdes sobre un fondo verde parecido (usa la versión en blanco).

### Construcción

Retícula de 512 × 512. Los brazos del + miden 80 de grosor y 320 de largo, con extremos redondeados. Cada hoja es una lente formada por dos arcos de radio 150 que van de la base (256, 178) a la punta (100, 62) o (412, 62).

## Iconos de la interfaz

Los iconos internos (`src/componentes/Icono.tsx`) y los objetos de la finca (`src/componentes/Ilustraciones.tsx`) comparten la paleta de `src/componentes/paleta.tsx`: tres tonos por color, luz desde arriba a la izquierda, sombra suave abajo y brillo de vidrio. `tests/iconos.test.ts` comprueba que todos se dibujan y que sus degradados existen.

## Diseño anterior: la mazorca

Hasta la versión 1.4.0 el ícono era una mazorca de cacao con su hoja, sobre un fondo verde con sol y lomas, con una insignia «+». Ya no se usa en la app; sus archivos quedan en esta carpeta como registro:

| Archivo | Uso |
| --- | --- |
| `icono.svg` | Original vectorial con esquinas redondeadas |
| `icono-adaptable.svg` | Original a sangre con margen de seguridad |
| `icono-1024.png` | Alta resolución |
| `icono-play-512.png` | Ícono de Google Play (512 × 512) |
| `grafico-destacado-1024x500.png` | Gráfico destacado de Google Play |
