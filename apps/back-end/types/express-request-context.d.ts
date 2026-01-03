declare global {
  namespace Express {
    interface Request {
      context?: {
        correlationId?: string;
        [key: string]: unknown;
      };
    }
  }
}

export {};
