import path from 'node:path'
import { defineConfig } from 'vite'

/** 产出 app.html 可用的 ES 模块：public/assets/map-hospital-glb-enhance.js */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    emptyOutDir: false,
    outDir: path.resolve(__dirname, 'public/assets'),
    lib: {
      entry: path.resolve(__dirname, 'src/legacy/appHomeMapUpgrade.ts'),
      formats: ['es'],
      fileName: () => 'map-hospital-glb-enhance.js',
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
