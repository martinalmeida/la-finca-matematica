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
      includeAssets: ['favicon.svg', 'iconos/*.png'],
      manifest: {
        name: 'La Finca Matemática',
        short_name: 'Finca Mate',
        description: 'Juego por niveles para practicar suma, resta, multiplicación y división en la vida del campo.',
        lang: 'es-CO',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        theme_color: '#4a6b2f',
        background_color: '#fbf5e6',
        icons: [
          { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'iconos/icono-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60000,
  },
});
