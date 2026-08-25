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
    // CORS fallback seam (SPEC §7): if direct browser calls to the API fail
    // preflight, proxy through the dev server so the key stays server-side.
    // proxy: {
    //   '/football-api': {
    //     target: 'https://v3.football.api-sports.io',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/football-api/, ''),
    //   },
    // },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
