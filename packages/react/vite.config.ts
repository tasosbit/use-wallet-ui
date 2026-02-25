import { promises as fs } from 'fs'
import { resolve } from 'path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        rainbowkit: resolve(__dirname, 'src/rainbowkit.ts'),
      },
      name: 'use-wallet-ui-react',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@txnlab/use-wallet-react',
        // External so consumers share a single copy (avoids duplicate React
        // contexts when wagmi/RainbowKit also depend on react-query)
        '@tanstack/react-query',
        // RainbowKit bridge externals (optional peer deps)
        'wagmi',
        '@wagmi/core',
        '@rainbow-me/rainbowkit',
      ],
      output: [
        {
          format: 'es',
          dir: 'dist/esm',
          entryFileNames: '[name].js',
          preserveModules: false,
          exports: 'named',
          assetFileNames: 'assets/[name][extname]',
          globals: {
            'react-dom': 'ReactDom',
            react: 'React',
            'react/jsx-runtime': 'ReactJsxRuntime',
            'react/jsx-dev-runtime': 'ReactJsxDevRuntime',
          },
        },
        {
          format: 'cjs',
          dir: 'dist/cjs',
          entryFileNames: '[name].cjs',
          preserveModules: false,
          exports: 'named',
          assetFileNames: 'assets/[name][extname]',
          globals: {
            'react-dom': 'ReactDom',
            react: 'React',
            'react/jsx-runtime': 'ReactJsxRuntime',
            'react/jsx-dev-runtime': 'ReactJsxDevRuntime',
          },
        },
      ],
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      onwarn(warning, warn) {
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          warning.message.includes('use client')
        ) {
          return
        }
        warn(warning)
      },
    },
    sourcemap: true,
    minify: true,
  },
  plugins: [
    dts({
      outDir: 'dist/types',
      rollupTypes: true,
      include: ['src'],
      compilerOptions: {
        declarationMap: true,
      },
      // Use afterBuild hook to copy .d.ts to .d.cts for each entry
      afterBuild: async () => {
        try {
          for (const name of ['index', 'rainbowkit']) {
            const dtsPath = resolve(__dirname, `dist/types/${name}.d.ts`)
            const dctsPath = resolve(__dirname, `dist/types/${name}.d.cts`)
            const content = await fs.readFile(dtsPath, 'utf-8')
            await fs.writeFile(dctsPath, content)
          }
          console.log('Successfully created .d.cts files')
        } catch (error) {
          console.error('Error creating .d.cts files:', error)
        }
      },
    }),
  ],
  // Ensure proper asset handling
  assetsInclude: ['**/*.woff2'],
})
