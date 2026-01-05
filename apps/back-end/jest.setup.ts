
// Jest ESM/Node options guard
const isESM = typeof import.meta !== 'undefined';
const hasExperimentalVmModules = process.execArgv.some(arg => arg.includes('--experimental-vm-modules'))
	|| process.env.NODE_OPTIONS?.includes('--experimental-vm-modules');
if (!isESM || !hasExperimentalVmModules) {
	throw new Error(
		'\n\n❌ Jest must be run with ESM and --experimental-vm-modules.\n' +
		'Use ONLY: NODE_OPTIONS=--experimental-vm-modules jest --runInBand\n' +
		'Do NOT use npx jest, --testPathPatterns, --testMatch, or any direct jest invocation.\n' +
		'See repo docs for correct usage.\n\n'
	);
}

process.env.DATABASE_URL ||= process.env.DATABASE_URL_TEST;

import { jest } from "@jest/globals";
(globalThis as any).jest = jest;

// Ensure CommonJS consumers receive a mocked @paralleldrive/cuid2 before any dependency loads it
await jest.unstable_mockModule("@paralleldrive/cuid2", () => import("./__mocks__/@paralleldrive/cuid2.ts"));
