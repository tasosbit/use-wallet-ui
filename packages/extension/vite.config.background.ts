import { resolve } from 'path'
import { defineConfig } from 'vite'

// Background service worker build - IIFE, self-contained, no chunks
export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist/background'),
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/background/service-worker.ts'),
      formats: ['iife'],
      name: 'LiquidWalletCompanionBackground',
      fileName: () => 'service-worker.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
