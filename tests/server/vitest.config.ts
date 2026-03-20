import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/shared/contracts/**',
        'src/shared/api/**',
        'server/services/**',
        'server/validation/**',
        'server/repository/**',
        'server/http/**',
      ],
    },
  },
});
