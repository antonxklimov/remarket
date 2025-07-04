import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
