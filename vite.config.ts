import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Local (macOS / VS Code) configuration.
//
// Differences from the original Replit config, and why:
//   * PORT and BASE_PATH no longer throw when unset — Replit always injected
//     them, a local terminal does not. Both now have sensible defaults.
//   * base is '/' instead of '/statskill/', so the app is served from the root
//     of http://localhost:5173 . App.tsx feeds import.meta.env.BASE_URL into
//     wouter, so routing follows this automatically.
//   * The @replit/* Vite plugins are removed. They only add Replit's in-editor
//     dev banner / error overlay / cartographer and have no effect on the UI.
//   * The unused '@assets' alias is dropped (nothing in src/ imports it).
//
// Nothing here changes how the app looks.

const port = Number(process.env.PORT ?? 5173);

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  server: {
    port,
    // Fall forward to the next free port instead of dying if 5173 is taken.
    strictPort: false,
    host: '127.0.0.1',
    open: true,
  },

  preview: {
    port,
    host: '127.0.0.1',
  },
});
