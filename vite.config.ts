import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/MOMsters-game/' : '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'index.html')
      },
      output: {
        // ULTRA-AGGRESSIVE cache busting for GitHub Pages CDN
        entryFileNames: `assets/[name]-[hash]-${Date.now()}-ULTRA-CACHE-BREAK.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}-ULTRA-CACHE-BREAK.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}-ULTRA-CACHE-BREAK.[ext]`
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true
  }
}) 