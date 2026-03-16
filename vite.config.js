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
          cookieDomainRewrite: "localhost",
          xfwd: true
        },
        '^/checkout': {
          target: target,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: "localhost",
          xfwd: true,
          autoRewrite: true,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes, req, res) => {
              const location = proxyRes.headers['location'];
              if (location && location.includes(target)) {
                console.log(`[Proxy] Rewriting absolute redirect from ${location} to relative`);
                proxyRes.headers['location'] = location.replace(target, '');
              }
              const cookies = proxyRes.headers['set-cookie'];
              if (cookies) {
                console.log(`[Proxy] Set-Cookie from ${req.url}:`, cookies);
              }
            });
          }
        },
        '/static': {
          target: target,
          changeOrigin: true,
          secure: false,
          xfwd: true
        },
        '/media': {
          target: target,
          changeOrigin: true,
          secure: false,
          xfwd: true
        },
        '/customer': {
          target: target,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: "localhost",
          xfwd: true
        },
        '/customer/section/load': {
          target: target,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: "localhost",
          xfwd: true
        },
        '/catalog': {
          target: target,
          changeOrigin: true,
          secure: false,
          xfwd: true
        },
        '/rest': {
          target: target,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: "localhost",
          xfwd: true
        },
        // Proxy for Magento REST API so frontend can call REST endpoints without CORS issues.
        '/magento-api': {
          target: target,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/magento-api/, ''),
          cookieDomainRewrite: "localhost",
          xfwd: true,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes, req, res) => {
              const cookies = proxyRes.headers['set-cookie'];
              if (cookies) {
                console.log(`[Proxy] Set-Cookie from ${req.url}:`, cookies);
              }
            });
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
