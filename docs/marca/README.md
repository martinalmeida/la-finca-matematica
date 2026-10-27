# Marca: La Finca Matemática

Todo se genera con `npm run iconos` a partir de `scripts/generar-iconos.mjs`. Si cambia el diseño, cámbielo allí y vuelva a correr el comando; no edite los PNG a mano.

## Ícono de la aplicación

Mazorca de cacao con su hoja, sobre un fondo verde con sol y lomas, más una insignia «+» que la identifica como app de matemáticas.

| Archivo | Uso |
| --- | --- |
| `icono.svg` | Original vectorial con esquinas redondeadas (impresos, presentaciones, web). |
| `icono-adaptable.svg` | Original a sangre con margen de seguridad (Android recorta la forma). |
| `icono-1024.png` | App Store y material de difusión en alta resolución. |
| `icono-play-512.png` | Ícono de Google Play (512 × 512, cuadrado; Play redondea las esquinas). |
| `grafico-destacado-1024x500.png` | Gráfico destacado de Google Play. |

En `public/iconos` quedan los íconos de la PWA: 192 y 512 (normal y adaptable), monocromo para los íconos temáticos de Android 13+, 180 para iPhone/iPad y favicon de 32. El logo dentro de la app es `public/favicon.svg`, el mismo diseño.

## Colores

| Uso | Color |
| --- | --- |
| Verde finca (fondo) | `#5fd16d` → `#22943f` → `#0c5a2b` |
| Mazorca | `#ffd65c` → `#f9a126` → `#e8621c` → `#9a2c10` |
| Hoja | `#b4ec6a` → `#45b649` → `#1f7a37` |
| Insignia | `#ffffff` con «+» `#1d8a3c` |

## Reglas de uso

- Deje alrededor del ícono un margen libre de al menos 1/8 de su ancho.
- No lo gire, no lo estire, no cambie sus colores ni le agregue contornos o sombras distintas.
- Tamaño mínimo: 32 px en pantalla y 10 mm impreso.

## Iconos de la interfaz

Los iconos internos (`src/componentes/Icono.tsx`) y los objetos de la finca (`src/componentes/Ilustraciones.tsx`) comparten la paleta de `src/componentes/paleta.tsx`: tres tonos por color, luz desde arriba a la izquierda, sombra suave abajo y brillo de vidrio. `tests/iconos.test.ts` comprueba que todos se dibujan y que sus degradados existen.
