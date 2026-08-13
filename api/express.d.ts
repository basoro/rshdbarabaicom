import type { AdminSessionUser } from './lib/auth.js';

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminSessionUser;
      authToken?: string;
    }
  }
}

export {};
