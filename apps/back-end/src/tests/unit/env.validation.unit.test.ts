
import { loadEnv, resetEnvCache } from "../../core/config/env.runtime.js";

const OLD_ENV = process.env;

describe("env validation", () => {
  beforeEach(() => {
    jest.resetModules();
    resetEnvCache();
    process.env = { ...OLD_ENV };
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });



  it("throws if NODE_ENV is missing", () => {
    delete process.env.NODE_ENV;
    expect(() => loadEnv()).toThrow();
  });



  it("throws if DATABASE_URL is missing", () => {
    process.env.NODE_ENV = "production";
    delete process.env.DATABASE_URL;
    expect(() => loadEnv()).toThrow();
  });



  it("throws if JWT_SECRET is default in prod", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://test";
    process.env.JWT_SECRET = "a200ac2cf9b4454f49a6216bb0a5ad69ae6ac47697edb576bb8919dee72821e";
    process.env.ALLOWED_ORIGINS = "https://foo";
    expect(() => loadEnv()).toThrow();
  });



  it("throws if ALLOWED_ORIGINS missing in prod", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://test";
    process.env.JWT_SECRET = "supersecret";
    delete process.env.ALLOWED_ORIGINS;
    expect(() => loadEnv()).toThrow();
  });



  it("loads valid env", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://test";
    process.env.JWT_SECRET = "supersecret";
    process.env.ALLOWED_ORIGINS = "https://foo";
    expect(() => loadEnv()).not.toThrow();
  });
});
