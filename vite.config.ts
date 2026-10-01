import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/braintrust-app': {
        target: 'https://www.braintrust.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/braintrust-app/, '')
      },
      '/api/braintrust-eu': {
        target: 'https://api-eu.braintrust.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/braintrust-eu/, '')
      },
      '/api/braintrust-api': {
        target: 'https://api.braintrust.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/braintrust-api/, '')
      }
    }
  }
})


