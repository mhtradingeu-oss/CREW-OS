// Explicitly ignore non-canonical test locations to prevent ESM import errors
const TEST_PATH_IGNORE_PATTERNS = [
  '<rootDir>/src/core/.*\\.test\\.ts$',
  '<rootDir>/src/core/.*\\.test\\.mts$',
  '<rootDir>/src/core/.*\\.spec\\.ts$',
  '<rootDir>/src/core/.*\\.spec\\.mts$',
  '<rootDir>/src/__tests__/',
  '<rootDir>/test/logger.format.test.ts',
  '<rootDir>/src/modules/activity-log/activity-log.repository.unit.test.ts',
  '<rootDir>/src/modules/.*\\.test\\.ts$',
  '<rootDir>/src/modules/.*\\.spec\\.ts$',
  '<rootDir>/src/modules/.*\\.test\\.mts$',
  '<rootDir>/src/modules/.*\\.spec\\.mts$',
];

// Jest config for ESM + TypeScript + ts-jest
// All options below are locked for ESM-only, no Babel, no CJS fallback
const IGNORED_ARTIFACT_PATHS = [
  'dist',
  '.turbo',
  'build',
  'builds',
  '../../packages/shared/dist',
];

/** @type {import('jest').Config} */
export default {
  // Node test environment (not jsdom)
  testEnvironment: 'node',

  // Setup file runs before all tests (includes ESM/Node guard)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Treat .ts/.mts as ESM for Jest (critical for ESM-only)
  extensionsToTreatAsEsm: ['.ts', '.mts'],

  // Only run tests in src/ and test/ folders
  roots: ['<rootDir>/src/tests', '<rootDir>/test'],

  // Use ts-jest for TypeScript transformation, ESM mode only
  transform: {
    '^.+\\.(ts|mts)$': [
      'ts-jest',
      {
        useESM: true, // Enforce ESM for all test files
        tsconfig: '<rootDir>/tsconfig.test.json', // Test-only tsconfig (noEmit, isolatedModules)
        babelConfig: false, // 🚫 No Babel allowed (prevents CJS fallback)
      },
    ],
  },

  // Custom moduleNameMapper for .js → .ts mapping and monorepo paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(?:\\.{1,2}/)+(?:core/)?prisma(?:\\.js)?$': '<rootDir>/src/core/prisma.ts',
    '^@mh-os/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@mh-os/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@paralleldrive/cuid2$': '<rootDir>/__mocks__/@paralleldrive/cuid2.ts',
  },

  // Ignore build artifacts and mocks
  modulePathIgnorePatterns: [
    ...IGNORED_ARTIFACT_PATHS.map((dir) => `<rootDir>/${dir}(/.*)?`),
    '<rootDir>/.*/__mocks__',
  ],

  // Explicitly ignore non-canonical test locations to prevent ESM import errors
  testPathIgnorePatterns: TEST_PATH_IGNORE_PATTERNS,

  // Only match .test.ts, .unit.test.ts, .int.test.ts files
  testMatch: [
    '<rootDir>/src/tests/**/*.test.ts',
    '<rootDir>/src/tests/**/*.unit.test.ts',
    '<rootDir>/src/tests/**/*.int.test.ts',
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/test/**/*.unit.test.ts',
    '<rootDir>/test/**/*.int.test.ts',
  ],

  // Only transform node_modules if explicitly allowed (no Babel)
  transformIgnorePatterns: [
    '/node_modules/(?!@paralleldrive/cuid2)',
  ],

  cache: false, // Always run fresh (no cache)

  // Custom resolver for .js → .ts mapping (critical for ESM)
  resolver: '<rootDir>/jest.resolver.mjs',
};
