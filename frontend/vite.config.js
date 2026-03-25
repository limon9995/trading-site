import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('lightweight-charts')) {
            return 'charts';
          }

          if (id.includes('react-hot-toast')) {
            return 'toast';
          }

          if (id.includes('axios')) {
            return 'network';
          }

          if (id.includes('react-router-dom') || id.includes('react-router')) {
            return 'router';
          }

          if (id.includes('/react/') || id.includes('scheduler')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
