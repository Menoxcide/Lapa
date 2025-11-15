import { defineConfig } from 'vitest/config';
import { cpus } from 'os';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    reporters: ['verbose'],
    
    // Optimized timeouts based on actual test execution times
    // Most tests complete in <5s, E2E tests may take up to 30s
    testTimeout: 30000, // 30 seconds (was 1,000,000ms)
    hookTimeout: 10000, // 10 seconds (was 1,000,000ms)
    teardownTimeout: 5000, // 5 seconds
    
    // Enable parallel execution for maximum performance
    pool: 'threads',
    poolOptions: {
      threads: {
        // Use CPU count - 1 to leave one core for system
        maxThreads: Math.max(1, (cpus().length || 4) - 1),
        minThreads: 1,
        // Use isolated fork to prevent test pollution
        isolate: true,
        // Single thread for debugging (can be overridden with --no-threads)
        singleThread: false,
      },
    },
    
    // Enable test result caching for faster subsequent runs
    cache: {
      dir: './node_modules/.vitest',
      enabled: true, // Explicitly enable caching
    },
    
    // Optimize file watching
    watch: false, // Disable watch mode by default (use --watch flag when needed)
    
    // Optimize test execution order
    sequence: {
      // Shuffle tests to detect order-dependent bugs
      shuffle: false, // Disable shuffle for deterministic results in CI
      // Run tests in parallel where possible
      concurrent: true,
      // Hook execution order
      hooks: 'stack',
    },
    
    // Performance optimizations
    maxConcurrency: 5, // Maximum concurrent test suites
    bail: 0, // Don't bail on first failure (set to 1 for CI if needed)
    
    // Coverage configuration
    // Only collect coverage when explicitly requested (performance optimization)
    coverage: {
      enabled: process.env.COVERAGE === 'true', // Only enable when COVERAGE=true
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/*.d.ts',
        '**/*.config.*',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/test/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/index.ts', // Exclude barrel exports for initial phase
        '**/types/**',
        '**/declarations.d.ts',
        'src/__tests__/**',
      ],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
      all: true,
      // Performance optimizations for coverage
      clean: true, // Clean coverage before running
      cleanOnRerun: true, // Clean on rerun
    },
  },
});
