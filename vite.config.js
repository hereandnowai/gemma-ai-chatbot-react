/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function normalizeBase(base) {
  if (!base || base === '/') return '/'
  return base.endsWith('/') ? base : `${base}/`
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project at /<repo-name>/, so assets must be
  // requested from that subpath. Locally BASE_PATH is unset and '/' is correct.
  //
  // The trailing slash matters: actions/configure-pages emits a base_path with
  // no trailing slash, and runtime code that does `${BASE_URL}branding.json`
  // would otherwise request '/repo-namebranding.json'.
  base: normalizeBase(process.env.BASE_PATH),
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
