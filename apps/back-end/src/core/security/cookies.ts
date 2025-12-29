import type { Request } from "express";

type RequestWithCookies = Request & {
  cookies?: Record<string, string>;
};

export function readCookie(req: Request, cookieName: string): string | null {
  const requestWithCookies = req as RequestWithCookies;
  const cookieFromParser = requestWithCookies.cookies?.[cookieName];
  if (cookieFromParser) {
    return cookieFromParser;
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${cookieName}=`)) {
      const value = cookie.slice(cookieName.length + 1);
      return decodeURIComponent(value);
    }
  }

  return null;
}
