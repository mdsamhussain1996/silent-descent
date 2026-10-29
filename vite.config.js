import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: 0,
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: false,
  }
});
