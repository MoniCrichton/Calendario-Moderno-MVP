import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isJunta = mode === 'junta';
  const isTesoreria = mode === 'tesoreria';

  let entrada = 'src/main-socios.jsx'; // default
  if (isJunta) entrada = 'src/main-junta.jsx';
  if (isTesoreria) entrada = 'src/main-tesoreria.jsx';

  const manifest = {
    name: isJunta
      ? 'Calendario Rotary Junta'
      : isTesoreria
      ? 'Calendario Rotary Tesorería'
      : 'Calendario Rotary Socios',
    short_name: isJunta
      ? 'Calendario Junta'
      : isTesoreria
      ? 'Calendario Tesorería'
      : 'Calendario Socios',
    start_url: isJunta
      ? '/calendario-junta'
      : isTesoreria
      ? '/calendario-tesoreria'
      : '/calendario-socios',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f4c81',
    orientation: 'portrait',
    icons: [
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
    ],
  };

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest,
      }),
    ],
    build: {
      rollupOptions: {
        input: entrada,
      },
    },
  };
});
