import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Configuraciones por vista
const views = {
  socios: {
    html: "index.html",
    start_url: "/",
    name: "Calendario Rotary Socios",
    short_name: "Socios",
  },
  junta: {
    html: "calendario-junta.html", // el archivo fuente
    start_url: "/",
    name: "Calendario Junta",
    short_name: "Junta",
  },
  tesoreria: {
    html: "index.html",
    start_url: "/",
    name: "Calendario Tesorería",
    short_name: "Tesorería",
  },
  "estado-cuenta": {
    html: "estado-cuenta.html",
    start_url: "/estado-cuenta.html",
    name: "Estado de Cuenta",
    short_name: "Cuenta",
  },
};

// Detectar la vista actual desde variable de entorno
const vista = process.env.VISTA_ACTUAL || "socios";
const configVista = views[vista];

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: configVista.name,
        short_name: configVista.short_name,
        start_url: configVista.start_url,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f4c81",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  build: {
    outDir: `dist/${vista}`,
    rollupOptions: {
      input: {
        index: configVista.html, // 🔁 siempre genera dist/vista/index.html
      },
    },
  },
  define: {
    "import.meta.env.VITE_NIVEL": JSON.stringify(vista),
  },
});
