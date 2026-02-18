import { resolve } from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Popup build (default) - standard HTML entry with React
export default defineConfig({
  plugins: [tailwindcss()],
  root: resolve(__dirname, 'src/popup'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/popup'),
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
