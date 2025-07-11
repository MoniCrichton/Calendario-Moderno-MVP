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
        '/calendario-socios',
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
        'calendario-socios': 'src/main-socios.html',
        'calendario-junta': 'src/main-junta.html',
        'calendario-tesoreria': 'src/main-tesoreria.html',
      },
    },
  },
});
