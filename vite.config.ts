import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    vue()
  ],
})
