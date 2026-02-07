import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build Optimizations
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Enable minification
    minify: 'terser',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Rollup options for code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
        },
      },
    },

    // Source maps for production debugging
    sourcemap: false,

    // Optimize CSS
    cssCodeSplit: true,
  },

  // Development server configuration
  server: {
    host: 'localhost',
    port: 5176,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'https://stock-tracker-pro.vercel.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: false,
  },
});
