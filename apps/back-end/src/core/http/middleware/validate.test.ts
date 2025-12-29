import { z } from "zod";
import { validateBody } from "./validate.js";

describe("validateBody middleware (pure logic)", () => {
  const schema = z.object({ foo: z.string() });
  const mw = validateBody(schema);

  it("calls next with parsed data on valid input", () => {
    const req: any = { body: { foo: "bar" } };
    const next = jest.fn();

    mw(req, {} as any, next);

    expect(req.body).toEqual({ foo: "bar" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next with error on invalid input", () => {
    const req: any = { body: { foo: 123 } };
    const next = jest.fn();

    mw(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/Validation error/);
  });
});
