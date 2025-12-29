## Testing Strategy

### Unit Tests
- No database access
- Prisma is always mocked (see src/core/__mocks__/prisma.ts)
- Import Prisma via '@/core/prisma' so Jest automatically resolves the manual mock
- Run with Jest (npm run -w apps/back-end test)
- Integration and e2e tests are excluded by default

### Integration Tests
- Require DATABASE_URL_TEST
- Disabled by default (see jest.config.mjs)
- Run manually or in CI only (npm run -w apps/back-end test:integration)

### Production Safety
- Unit tests never connect to a real or test database
- All Prisma usage in unit tests is intercepted by Jest mocks
- dist/, .turbo/, and build artifacts are ignored by Jest

### How to Run
- Unit: `unset DATABASE_URL DATABASE_URL_TEST && npm run -w apps/back-end test`
- Integration: `npm run -w apps/back-end test:integration` (requires DB)

---

This strategy ensures deterministic, DB-safe, and CI-ready test runs for all unit tests. Integration tests are preserved but isolated.
