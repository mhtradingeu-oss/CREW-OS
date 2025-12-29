import { logger } from "../src/core/logger";

describe("logger structured output", () => {
  beforeAll(() => {
    process.env.LOG_LEVEL = "debug";
  });
  let output: string[] = [];
  const origLog = console.log;
  const origError = console.error;

  beforeAll(() => {
    console.log = (msg: string) => output.push(msg);
    console.error = (msg: string) => output.push(msg);
  });
  afterAll(() => {
    console.log = origLog;
    console.error = origError;
  });
  beforeEach(() => {
    output = [];
  });

  it("should log JSON with required fields", () => {
    logger.info("Test message", { module: "test", correlationId: "abc123" });
    expect(output[0]).toBeDefined();
    const entry = JSON.parse(output[0] ?? '{}');
    expect(entry).toMatchObject({
      level: "info",
      message: "Test message",
      environment: expect.any(String),
      module: "test",
      correlationId: "abc123",
      timestamp: expect.any(String),
    });
  });

  it("should include error details for error logs", () => {
    const err = new Error("fail");
    logger.error("Something failed", { module: "test", error: err });
    expect(output[0]).toBeDefined();
    const entry = JSON.parse(output[0] ?? '{}');
    expect(entry.level).toBe("error");
    expect(entry.error).toMatchObject({
      name: "Error",
      message: "fail",
    });
    // stack is optional
  });
});
