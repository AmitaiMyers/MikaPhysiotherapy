/**
 * Names of the runtime caches shared by the service worker (vite.config.ts) and the app's
 * "save for offline" feature. Kept free of imports so the Vite config can load it.
 */
export const OFFLINE_CACHES = {
  images: 'muscle-images',
  models: 'anatomy-models',
} as const;
