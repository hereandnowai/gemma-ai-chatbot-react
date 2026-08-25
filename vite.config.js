import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project at /<repo-name>/, so assets must be
  // requested from that subpath. Locally BASE_PATH is unset and '/' is correct.
  base: process.env.BASE_PATH || '/',
})
