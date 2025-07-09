import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    proxy: {
      // Keep only your backend API proxy
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      // Removed complex moodle-images proxy - using tokens now
    },
    fs: {
      strict: false,
    },
  },
  build: {
    rollupOptions: {
      input: './index.html',
    },
  },
  base: '/',
});