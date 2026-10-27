/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Rutas relativas: permite servir dist/ desde cualquier carpeta o empaquetarlo con Capacitor.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60000,
  },
});
