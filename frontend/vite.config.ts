import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  root: '.',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Don't precache multi-MB marketing videos — they thrash the SW cache.
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'The Source Engine',
        short_name: 'Source',
        description: 'The source engine for sovereign artists — master, scout, negotiate, protect.',
        theme_color: '#060607',
        background_color: '#060607',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/site/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/site/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Keep heavy optional deps out of the first-paint bundle.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'three';
            if (id.includes('wavesurfer')) return 'wavesurfer';
            if (id.includes('gsap') || id.includes('lenis')) return 'motion-scroll';
            if (id.includes('framer-motion')) return 'framer';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) return 'react-vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      }
    }
  }
})
