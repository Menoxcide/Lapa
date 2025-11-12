import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    reporters: ['verbose'],
    testTimeout: 120000, // 60 seconds
    hookTimeout: 120000,
  },
});
