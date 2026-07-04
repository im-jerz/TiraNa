import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    proxy: {
      '/admin': {
        target: 'http://tira_backend:5002',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/api': {
        target: 'http://tira_backend:5002',
        changeOrigin: true,
      },
    },
  },
})
