import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 5173,
      clientPort: 443,
      timeout: 120000
    },
    allowedHosts: [
      'restpoint.co.ke',
      'app.restpoint.co.ke',
      'localhost'
    ],
    cors: true,
    fs: {
      strict: false,
      allow: ['..']
    },
    proxy: {
      '/api/v2': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/public': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  optimizeDeps: {
    disabled: true,  // This bypasses the MIME type issue
    exclude: [
      '@fullcalendar/react',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/interaction',
      'moment'
    ]
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      external: []
    }
  }
})