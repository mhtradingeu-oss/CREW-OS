export class ApiError extends Error {
  status: number;
  details?: unknown;
  code?: string;

  constructor(status: number, message: string, details?: unknown, code?: string) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function badRequest(message: string, details?: unknown, code?: string) {
  return new ApiError(400, message, details, code);
}

export function conflict(message: string, details?: unknown, code?: string) {
  return new ApiError(409, message, details, code);
}

export function unauthorized(message = "Unauthorized") {
  return new ApiError(401, message, undefined, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden", details?: unknown, code?: string) {
  return new ApiError(403, message, details, code ?? "FORBIDDEN");
}

export function notFound(message = "Not Found") {
  return new ApiError(404, message);
}

export function csrfInvalid(message = "CSRF token invalid") {
  return new ApiError(403, message, undefined, "CSRF_INVALID");
}
