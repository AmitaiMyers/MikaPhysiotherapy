/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app from https://<user>.github.io/MikaPhysiotherapy/
const BASE_PATH = '/MikaPhysiotherapy/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mika Physio — Muscles',
        short_name: 'Mika Physio',
        description: 'Physiotherapy knowledge base: muscles, bones and joints, nerves and special tests. Works offline.',
        theme_color: '#0e1116',
        background_color: '#0e1116',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Still images are small and precached so every muscle works offline.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // The 3D model is large, so it is cached the first time it is opened instead of on install.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/models/'),
            handler: 'CacheFirst',
            options: { cacheName: 'anatomy-models', expiration: { maxEntries: 8 } },
          },
        ],
      },
    }),
  ],
  build: {
    // three.js alone is ~550 kB; it is split into the lazily loaded 3D viewer chunk.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
