import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

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
    strictPort: false,
    host: '127.0.0.1',
    open: true,
  },

  preview: {
    port,
    host: '127.0.0.1',
  },
});
