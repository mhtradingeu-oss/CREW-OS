const IGNORED_ARTIFACT_PATHS = ['dist', '.turbo', 'build', 'builds'];

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  transform: {
    '^.+\.(ts|tsx|mts)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.jest.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(?:\\.{1,2}/)+(?:core/)?prisma(?:\\.js)?$': '<rootDir>/src/core/prisma.ts',
    // Map .js imports to .ts for ESM/TypeScript
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@mh-os/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@mh-os/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
  modulePathIgnorePatterns: [
    ...IGNORED_ARTIFACT_PATHS.map((dir) => `<rootDir>/${dir}(/.*)?`),
    '<rootDir>/.*/__mocks__',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/src/tests/integration/',
    '<rootDir>/src/tests/contract/',
    '\\.(?:int|integration|contract)\\.test\\.(ts|mts)$',
    ...IGNORED_ARTIFACT_PATHS.map((dir) => `<rootDir>/${dir}(/.*)?`),
  ],
  // Exclude integration/contract artifacts from the default run
  testMatch: [
    '**/tests/unit/**/*.unit.test.ts',
    '**/tests/unit/**/*.unit.test.mts',
    '**/test/**/*.test.ts',
    '**/src/**/*.test.ts',
    '**/src/**/*.test.mts',
  ],
  cache: false,
  transformIgnorePatterns: ['/node_modules/(?!@paralleldrive/cuid2)/'],
};
