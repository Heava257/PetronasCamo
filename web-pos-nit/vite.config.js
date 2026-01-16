import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

export default defineConfig({
  base: '/', // Add this line explicitly
  
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Add this to handle navigation routes
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/api\//]
      },

      includeAssets: [
        "apple-touch-icon.png",
        "favicon.ico",
        "pwa-192x192.png",
        "pwa-512x512.png"
      ],

      manifest: {
        name: "Web POS",
        short_name: "PTN",
        description: "Web POS Application",
        display: "standalone",
        start_url: "/",
        scope: "/", // Add this
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
        ],
      },
    }),
  ],

  // Add build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});