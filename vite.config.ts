import { defineConfig } from 'vite';

// Capacitor でネイティブアプリに載せるため base は相対パスにする
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000
  },
  server: {
    host: true
  }
});
