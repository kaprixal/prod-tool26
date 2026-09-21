import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    allowedHosts: [
      'proddr-production.up.railway.app',
      'cie-production.up.railway.app',
      'deadlock-api-proddr.up.railway.app',
      'localhost',
    ],
    proxy: {
      '/api': 'http://localhost:8000',
      '/assets': 'http://localhost:8000',
    },
  },
});
