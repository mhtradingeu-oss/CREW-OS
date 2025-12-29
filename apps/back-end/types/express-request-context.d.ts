// types/express-request-context.d.ts
import 'express';

declare module 'express' {
  interface Request {
    context?: {
      correlationId?: string;
      // Add other context fields here as needed
    };
  }
}
