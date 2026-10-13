import path from 'node:path'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    react(),
    mode === 'development' &&
      codeInspectorPlugin({
        bundler: 'vite',
        // Windows：按住 Alt + Shift，再点击页面元素，在 Cursor / VS Code 中打开对应源码
        hotKeys: ['altKey', 'shiftKey'],
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/backend-api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/backend-api/, '/api'),
      },
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        smartCity: path.resolve(__dirname, 'smart-city.html'),
        gisCommand: path.resolve(__dirname, 'gis-command.html'),
        meetingPortal: path.resolve(__dirname, 'meeting-portal.html'),
        dispatch: path.resolve(__dirname, 'dispatch.html'),
      },
    },
  },
  css: {
    devSourcemap: true,
  },
}))
