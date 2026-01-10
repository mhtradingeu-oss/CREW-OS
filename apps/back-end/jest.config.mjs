// Explicitly ignore non-canonical test locations to prevent ESM import errors
// Only ignore build artifacts and mocks, not canonical test locations
const TEST_PATH_IGNORE_PATTERNS = [
  '/integration/',
  '\\.(integration)\\.'
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
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  injectGlobals: true,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@mh-os/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@mh-os/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^(.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
     '<rootDir>/src/**/__tests__/**/*.(spec|test).ts',
     '<rootDir>/src/tests/**/*.(spec|test).ts'
  ],
  transformIgnorePatterns: [],
  // setupFilesAfterEnv now only references jest.setup.js
};
