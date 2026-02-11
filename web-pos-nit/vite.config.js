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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,bin}'],
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
        name: "Petronas POS System",
        short_name: "Petronas",
        description: "Petronas Cambodia POS System",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        theme_color: "#00A99D",
        background_color: "#F5F5F5",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
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