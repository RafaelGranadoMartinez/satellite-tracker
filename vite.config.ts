import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: { format: 'es' },
    },
  },
  // satellite.js 7 uses top-level await in its WASM worker. Vite's default
  // IIFE worker format cannot represent that, so workers must remain ESM.
  worker: {
    format: 'es',
  },
});
