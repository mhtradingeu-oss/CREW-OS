import type { Request, Response, NextFunction } from "express";

type CookieParserRequest = Request & {
  cookies?: Record<string, string>;
};

export function cookieParser() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const request = req as CookieParserRequest;
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      request.cookies = {};
      return next();
    }

    const parsedCookies: Record<string, string> = {};
    const pairs = cookieHeader.split(";").map((entry) => entry.trim());
    for (const pair of pairs) {
      if (!pair) {
        continue;
      }
      const [rawName, ...valueParts] = pair.split("=");
      if (!rawName) {
        continue;
      }
      const name = rawName.trim();
      const rawValue = valueParts.join("=");
      try {
        parsedCookies[name] = decodeURIComponent(rawValue ?? "");
      } catch {
        parsedCookies[name] = rawValue ?? "";
      }
    }

    request.cookies = parsedCookies;
    return next();
  };
}
