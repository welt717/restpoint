import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-styled-components', { displayName: false, pure: true }]
        ]
      }
    }),
    // Brotli compression for even smaller files
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024, // Compress files larger than 1KB
      deleteOriginFile: false
    }),
    // Gzip fallback
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    }),
    // Visualize bundle size (optional)
    visualizer({ open: true, filename: 'dist/stats.html' })
  ],
  
  build: {
    // Target modern browsers
    target: 'es2020',
    
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging (optional, remove for production)
    sourcemap: false,
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // Minification with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Remove console.logs
        drop_debugger: true,     // Remove debuggers
        pure_funcs: ['console.log'], // Remove console.log entirely
        passes: 2                // Multiple passes for better compression
      },
      format: {
        comments: false,         // Remove comments
        beautify: false
      },
      mangle: {
        toplevel: true          // Mangle top-level variables
      }
    },
    
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'ui-vendor': ['styled-components', 'lucide-react', 'framer-motion'],
          'data-vendor': ['@tanstack/react-query', 'zustand', 'axios', 'recharts'],
          'utils-vendor': ['react-toastify', 'sweetalert2', 'socket.io-client']
        },
        
        // File naming convention
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        
        // Optimize chunk size
        compact: true,
        generatedCode: {
          constBindings: true,
          objectShorthand: true
        }
      }
    },
    
    // Optimize asset size
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Empty output directory before build
    emptyOutDir: true,
    
    // Generate manifest for better caching
    manifest: true
  },
  
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  
  preview: {
    port: 4173,
    strictPort: false,
    open: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'styled-components',
      '@mui/material',
      '@emotion/react',
      'axios',
      'zustand'
    ],
    exclude: ['@fortawesome/fontawesome-svg-core']
  },
  
  // CSS options
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`
      }
    }
  },
  
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@services': '/src/services',
      '@styles': '/src/styles',
      '@assets': '/src/assets'
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})