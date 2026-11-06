/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_API_BASE_URL: 'http://api.test' },
    // Each test starts from clean mocks and a real fetch, so tests can't leak into each other.
    mockReset: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // "Logic" per DEVELOPMENT_GUIDELINES: everything with behaviour. Leaves out main.tsx (bootstrap)
      // and types/ (no runtime code).
      include: [
        'src/lib/**',
        'src/hooks/**',
        'src/components/**',
        'src/pages/**',
        'src/game/**',
        'src/App.tsx',
      ],
      exclude: ['src/**/*.test.*'],
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
    },
  },
})
