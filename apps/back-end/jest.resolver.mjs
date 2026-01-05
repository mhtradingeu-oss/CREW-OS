/**
 * Jest ESM Resolver Contract
 *
 * - Only resolves .js imports to .ts/.tsx/.mts for ESM compatibility
 * - Fallback to default resolver ONLY if no ESM candidate exists
 * - All mocks must use jest.unstable_mockModule with valid ESM paths
 * - No reassignment of imported bindings allowed
 * - No CommonJS jest.mock usage (CJS is forbidden)
 * - If a requested mock path does not exist, throws a validation error
 */

import fs from 'fs';
import path from 'path';

const RELATIVE_JS_PATTERN = /^(?:\.\.\/)+(.*)\.js$/;

function resolve(moduleName, options) {
  const resolver = options.defaultResolver;

  const relativeCandidate = resolveRelativeTs(moduleName, options);
  if (relativeCandidate) {
    return resolver(relativeCandidate, options);
  }

  const mapped = mapToRootTsModule(moduleName, options);
  if (mapped) {
    return mapped;
  }

  return resolver(moduleName, options);
}

/**
 * Jest resolver MUST expose sync / async
 */
export const sync = resolve;
export const async = resolve;

/**
 * --- helpers ---
 */

function resolveRelativeTs(moduleName, options) {
  if (!moduleName.startsWith('.') || !moduleName.endsWith('.js')) {
    return null;
  }

  const baseDir = options.basedir || options.rootDir || process.cwd();
  const baseName = path.resolve(baseDir, moduleName.slice(0, -3));

  for (const ext of ['.ts', '.tsx', '.mts']) {
    const candidate = `${baseName}${ext}`;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (options?.isMockModule) {
    throw new Error(
      `❌ [Jest ESM Resolver] Mocked module path does not exist: ${baseName}(.ts|.tsx|.mts)`
    );
  }

  return null;
}

function mapToRootTsModule(moduleName, options) {
  if (!moduleName.endsWith('.js')) {
    return null;
  }

  const match = moduleName.match(RELATIVE_JS_PATTERN);
  if (!match) {
    return null;
  }

  const relativePath = match[1];
  const rootDir = options.rootDir || process.cwd();

  const baseDir = relativePath.startsWith('packages/')
    ? path.join(rootDir, relativePath)
    : path.join(rootDir, 'src', relativePath);

  for (const ext of ['.ts', '.tsx', '.mts']) {
    const candidate = `${baseDir}${ext}`;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (options?.isMockModule) {
    throw new Error(
      `❌ [Jest ESM Resolver] Mocked module path does not exist: ${baseDir}(.ts|.tsx|.mts)`
    );
  }

  return null;
}
