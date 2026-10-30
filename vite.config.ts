/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// Cada build tiene su versión: la del paquete (SemVer, ver CHANGELOG.md) y la hora de compilación
// (hora de Colombia). La combinación distingue dos builds de la misma versión.
const paquete = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
const hora = new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 16).replace('T', ' ');
const VERSION_APP = `${paquete.version} (${hora})`;

export default defineConfig({
  // Rutas relativas: permite servir dist/ desde cualquier carpeta o empaquetarlo con Capacitor.
  base: './',
  define: { __VERSION_APP__: JSON.stringify(VERSION_APP), __VERSION__: JSON.stringify(paquete.version), __COMPILACION__: JSON.stringify(hora) },
  plugins: [
    react(),
    VitePWA({
      // «prompt»: la versión nueva queda esperando y la app decide cuándo activarla (src/pwa/registro.ts):
      // enseguida, salvo en medio de un nivel o una prueba, para no cortarle el trabajo a un niño.
      registerType: 'prompt',
      injectRegister: false,
      includeManifestIcons: false,
      includeAssets: ['favicon.svg', 'iconos/icono-192.png', 'iconos/icono-maskable-192.png', 'iconos/icono-apple-180.png', 'iconos/favicon-32.png'],
      manifest: {
        name: 'La Finca Matemática',
        short_name: 'Finca Mate',
        description: 'Juego por niveles para practicar suma, resta, multiplicación y división en la vida del campo.',
        lang: 'es-CO',
        dir: 'ltr',
        // Identidad estable de la app instalada (no cambia aunque cambie start_url).
        id: './',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        start_url: './',
        scope: './',
        theme_color: '#4a6b2f',
        background_color: '#fbf5e6',
        categories: ['education', 'kids', 'games'],
        prefer_related_applications: false,
        // Si ya está abierta, el ícono vuelve a la misma ventana en lugar de abrir otra.
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        icons: [
          { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'iconos/icono-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'iconos/icono-apple-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          // Android 13+: ícono temático (toma los colores del fondo de pantalla).
          { src: 'iconos/icono-monocromo-512.png', sizes: '512x512', type: 'image/png', purpose: 'monochrome' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // Los íconos de 512 solo los usa el sistema al instalar: no hace falta guardarlos sin conexión.
        globIgnores: ['**/iconos/*-512.png'],
        navigateFallback: 'index.html',
        // Al activarse una versión nueva se borran los archivos de la versión anterior.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // La versión nueva espera la orden de la app (SKIP_WAITING) para no recargar a mitad de un nivel.
        skipWaiting: false,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60000,
  },
});
