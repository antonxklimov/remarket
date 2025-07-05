import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'Logo.svg'],
      manifest: {
        name: 'RE→MARKET 2025',
        short_name: 'REMARKET',
        description: 'Фестиваль локальных брендов в Москве',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/85\.192\.30\.220\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 дней
              },
            },
          },
        ],
      },
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Выносим React в отдельный чанк
          'react-vendor': ['react', 'react-dom'],
          // Выносим админку в отдельный чанк (загружается только при необходимости)
          'admin-vendor': ['draft-js', 'react-draft-wysiwyg', 'draftjs-to-html', 'html-to-draftjs'],
          // Выносим UI библиотеки в отдельный чанк
          'ui-vendor': ['framer-motion'],
          // Роутер отдельно
          'router-vendor': ['react-router-dom']
        }
      }
    },
    // Увеличиваем лимит предупреждения
    chunkSizeWarningLimit: 1000
  }
})
