import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './frontend',
  base: './',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html')
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  define: {
    __DEV__: true
  }
})