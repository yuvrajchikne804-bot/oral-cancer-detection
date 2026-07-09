import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "./",   // ⭐ YE LINE ADD KAR
  server: { port: 3000 },
})