import { resolve } from 'path'
import { defineConfig } from 'vite'

// Content script build - IIFE, self-contained, no chunks
export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist/content'),
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/content/bridge.ts'),
      formats: ['iife'],
      name: 'LiquidWalletCompanionBridge',
      fileName: () => 'bridge.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
