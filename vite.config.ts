/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { OFFLINE_CACHES } from './src/offlineCaches';

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
        // The app shell and the list thumbnails are installed up front (a few MB).
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}', 'images/muscles/*-thumb.webp', 'images/bones/*-thumb.webp', 'images/joints/*-thumb.webp', 'images/body/*.webp'],
        // Full-size images and the 3D models (about 30 MB together) are cached the first time they
        // are opened, or all at once from the About screen ("Save for offline use").
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/images\/(muscles|bones|joints)\//.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: OFFLINE_CACHES.images },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/models/'),
            handler: 'CacheFirst',
            options: { cacheName: OFFLINE_CACHES.models },
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
    include: ['src/**/*.test.{ts,tsx}'],
    // The style tests read stylesheets as raw text (`?raw`), which needs CSS files to load.
    css: true,
  },
});
