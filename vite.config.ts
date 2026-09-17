import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/dist-ssr/**', '**/e2e/**'],

    hookTimeout: 30_000,
    testTimeout: 30_000,
    pool: 'forks',
    maxWorkers: 4,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/stockora_test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/e2e/**',
        '**/scripts/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, _res) => {
            // Suppress noisy transient proxy ECONNREFUSED logs during restarts
          });
        },
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8080',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, _res) => {
            // Suppress noisy transient socket proxy ECONNREFUSED logs during restarts
          });
        },
      },
    },
  },
});
