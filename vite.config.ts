import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    // football-data.org echoes a fixed Access-Control-Allow-Origin
    // ("http://localhost") that does not match Vite's :5173 origin, so
    // direct browser calls fail CORS. Proxying keeps requests same-origin;
    // the client still sends its own X-Auth-Token through the proxy.
    proxy: {
      '/football-data': {
        target: 'https://api.football-data.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/football-data/, ''),
      },
      // API-Football seam, kept for future public-deployment symmetry
      // (direct calls verified working; unused today).
      // '/football-api': {
      //   target: 'https://v3.football.api-sports.io',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/football-api/, ''),
      // },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
