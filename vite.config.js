import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isJunta = mode === 'junta';
  const entrada = isJunta ? 'src/main-junta.jsx' : 'src/main-socios.jsx';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: isJunta ? 'Calendario Rotary Junta' : 'Calendario Rotary Socios',
          short_name: isJunta ? 'Calendario Junta' : 'Calendario Socios',
          start_url: isJunta ? '/calendario-junta' : '/calendario-socios',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0f4c81',
          orientation: 'portrait',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    build: {
      rollupOptions: {
        input: entrada
      }
    }
  };
});
