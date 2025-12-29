
describe('Env Safety Guard', () => {
  const OLD_ENV = process.env;
  let checkEnvSafety: any, getNormalizedDatabaseUrl: any;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    // Use dynamic import for ESM compatibility
    const mod = await import('../../core/config/env-guard.js');
    checkEnvSafety = mod.checkEnvSafety;
    getNormalizedDatabaseUrl = mod.getNormalizedDatabaseUrl;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws if NODE_ENV=production and DATABASE_URL is localhost', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/prod';
    expect(() => checkEnvSafety()).toThrow(/Refusing to start in production/);
  });

  it('throws if NODE_ENV=development and DATABASE_URL is prod-like', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://user:pass@prod-db.example.com:5432/prod';
    delete process.env.ALLOW_REMOTE_DB_IN_DEV;
    expect(() => checkEnvSafety()).toThrow(/Refusing to use a production database/);
  });

  it('allows dev with prod-like DB if ALLOW_REMOTE_DB_IN_DEV=true', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://user:pass@prod-db.example.com:5432/prod';
    process.env.ALLOW_REMOTE_DB_IN_DEV = 'true';
    expect(() => checkEnvSafety()).not.toThrow();
  });

  it('prefers DATABASE_URL_TEST in test env', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dev';
    process.env.DATABASE_URL_TEST = 'postgresql://user:pass@localhost:5432/test';
    expect(getNormalizedDatabaseUrl()).toBe(process.env.DATABASE_URL_TEST);
  });

  it('falls back to DATABASE_URL in test if DATABASE_URL_TEST missing', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dev';
    delete process.env.DATABASE_URL_TEST;
    expect(getNormalizedDatabaseUrl()).toBe(process.env.DATABASE_URL);
  });

  it('throws in test if DATABASE_URL is prod-like', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://user:pass@prod-db.example.com:5432/prod';
    delete process.env.DATABASE_URL_TEST;
    expect(() => checkEnvSafety()).toThrow(/Refusing to use a production database/);
  });
});
