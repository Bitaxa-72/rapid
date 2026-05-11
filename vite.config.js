import { defineConfig } from 'vite'
import injectHTML from 'vite-plugin-html-inject'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/rapid/' : '/',
  server: {
    port: 3030
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: '/index.html'
      }
    }
  },
  plugins: [injectHTML()]
}))
