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
      'bug-free-adventure-p7jpg64r649pfrj7x-5173.app.github.dev',
      '.app.github.dev',
      'localhost'
    ],
    cors: true,
    fs: {
      strict: false,
      allow: ['..']
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