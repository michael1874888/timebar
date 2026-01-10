import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/layers/1-data'),
      '@domain': path.resolve(__dirname, './src/layers/2-domain'),
      '@business': path.resolve(__dirname, './src/layers/3-business'),
      '@ui': path.resolve(__dirname, './src/layers/4-ui'),
      '@tokens': path.resolve(__dirname, './src/layers/4-ui/design-system/tokens'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'node_modules/',
      'dist/',
      '*.cjs',
      '**/*.cjs',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '*.config.ts',
        '*.config.js',
        'dist/',
      ],
    },
  },
})
