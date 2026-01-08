import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/timebar/',  // GitHub Pages 路徑
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/layers/1-data'),
      '@domain': path.resolve(__dirname, './src/layers/2-domain'),
      '@business': path.resolve(__dirname, './src/layers/3-business'),
      '@ui': path.resolve(__dirname, './src/layers/4-ui'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
