# Isotipo «Brote» — La Finca Matemática

Un signo + del que nace un brote: la suma, la finca y el aprendizaje que crece.

## Archivos

**Isotipo (para documentos, la tesis, presentaciones e impresos)**

| Archivo | Uso |
|---|---|
| `isotipo.svg` / `isotipo-1024.png` | A color, sobre fondos claros |
| `isotipo-una-tinta.svg` / `isotipo-una-tinta-1024.png` | Una sola tinta (impresión en blanco y negro, sellos, fotocopias) |
| `isotipo-blanco.svg` / `isotipo-blanco-1024.png` | En blanco, sobre fondos oscuros o fotografías |

**Íconos de la PWA (van en `public/`)**

| Archivo | Uso |
|---|---|
| `icon.svg` | Favicon vectorial |
| `favicon.ico` | Favicon para navegadores antiguos (16, 32 y 48 px) |
| `icon-192.png`, `icon-512.png` | Ícono de la app (`purpose: any`) |
| `icon-maskable-192.png`, `icon-maskable-512.png` | Android con máscara (`purpose: maskable`) |
| `apple-touch-icon.png` | Pantalla de inicio en iPhone/iPad (180 px) |
| `maskable.svg` | Fuente vectorial de la versión maskable |

## `manifest.webmanifest`

```json
"icons": [
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
],
"theme_color": "#17804A",
"background_color": "#17804A"
```

## `index.html`

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#17804A">
```

Si usas `vite-plugin-pwa`, agrega estos archivos a `includeAssets` para que queden en caché y funcionen sin conexión.

## Colores

| Nombre | Hex | Uso |
|---|---|---|
| Monte | `#17804A` | Signo +, color principal, fondo del ícono |
| Brote | `#8CD13C` | Hojas sobre fondos claros |
| Brote claro | `#B8E85A` | Hojas sobre fondo Monte |
| Tinta | `#10231A` | Versión a una tinta y fondos oscuros |

## Reglas de uso

- **Área de protección:** deja alrededor del isotipo un espacio libre igual al grosor del brazo del + (1/4 del ancho del signo).
- **Tamaño mínimo:** 16 px en pantalla y 8 mm en impresión.
- **No hagas esto:** girarlo, deformarlo, cambiarle los colores fuera de esta paleta, agregarle sombras o degradados, ni poner las hojas verdes sobre un fondo verde parecido (usa la versión en blanco).

## Construcción

Retícula de 512 × 512. Los brazos del + miden 80 de grosor y 320 de largo, con extremos redondeados. Cada hoja es una lente formada por dos arcos de radio 150 que van de la base (256, 178) a la punta (100, 62) o (412, 62).
