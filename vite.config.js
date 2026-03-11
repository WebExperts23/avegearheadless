import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const target = env.VITE_MAGENTO_BASE_URL || 'https://2fc1869dd5.nxcli.io';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/graphql': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/checkout': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/customer': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/rest': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        // Proxy for Magento REST API so frontend can call REST endpoints without CORS issues.
        '/magento-api': {
          target: target,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/magento-api/, ''),
          configure: (proxy, options) => {
            // We no longer forcefully append a static access token because we grab dynamic admin session tokens in client.js
          }
        }
      }
    },
    build: {
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-apollo': ['@apollo/client', 'graphql'],
            'vendor-icons': ['lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})
