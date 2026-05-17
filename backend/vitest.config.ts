import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts'],
    exclude: [
      'dist/**',
      'node_modules/**',
      'src/__generated__/**',
      'src/defs/**',
    ],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    isolate: true,
    hookTimeout: 10_000,
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/**/dto/**',
        'src/**/validators/**',
        'src/__generated__/**',
        'src/defs/**',
        'src/tests/**',
        'src/index.ts',
        'src/server.ts',
        'src/server.fastify.ts',
      ],
    },
  },
});
