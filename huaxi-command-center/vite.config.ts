import path from 'node:path'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { defineConfig } from 'vite'
import { injectBackendEnvPlugin } from './src/vite-plugin-inject-backend-env.js'

export default defineConfig(({ mode }) => ({
  plugins: [
    injectBackendEnvPlugin(),
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
        target: process.env.HX_API_PROXY_TARGET || 'http://62.234.128.72:7824',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/backend-api/, '/api'),
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/backend-api': {
        target: process.env.HX_API_PROXY_TARGET || 'http://62.234.128.72:7824',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/backend-api/, '/api'),
      },
    },
  },
  build: {
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        srcShell: path.resolve(__dirname, 'src-shell.html'),
        devtools: path.resolve(__dirname, 'index.devtools.html'),
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
