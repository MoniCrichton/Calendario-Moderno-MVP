import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const createPwaConfig = (name, shortName, startUrl, icons) => ({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico'],
  manifest: {
    name,
    short_name: shortName,
    start_url: startUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f4c81',
    orientation: 'portrait',
    icons,
  },
});

export default defineConfig({
  plugins: [
    react(),
    VitePWA(
      createPwaConfig(
        'Calendario Rotary Socios',
        'Calendario Socios',
        '/', // 👈 ahora inicia en /
        [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ]
      )
    ),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html', // 👈 el de socios renombrado
        'calendario-junta': 'calendario-junta.html',
        'calendario-tesoreria': 'calendario-tesoreria.html',
        'estado-cuenta-socio': 'estado-cuenta-socio.html',

      },
    },
  },
});
