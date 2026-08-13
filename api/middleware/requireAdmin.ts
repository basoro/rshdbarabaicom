import type { NextFunction, Request, Response } from 'express';
import { cleanupExpiredSessions, get } from '../lib/database.js';
import { hasAdminAccess, nowUnix, type AdminModuleKey } from '../lib/auth.js';

type SessionRow = {
  user_id: number;
  token: string;
  expires_at: number;
  username: string;
  fullname: string | null;
  email: string;
  role: string;
  access: string;
};

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Akses admin memerlukan login.',
    });
    return;
  }

  cleanupExpiredSessions(nowUnix());

  const session = get<SessionRow>(
    `
      SELECT s.user_id, s.token, s.expires_at, u.username, u.fullname, u.email, u.role, u.access
      FROM admin_sessions s
      INNER JOIN mlite_users u ON u.id = s.user_id
      WHERE s.token = ?
      LIMIT 1
    `,
    [token],
  );

  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Sesi admin tidak valid atau sudah berakhir.',
    });
    return;
  }

  req.authToken = token;
  req.adminUser = {
    id: session.user_id,
    username: session.username,
    fullname: session.fullname,
    email: session.email,
    role: session.role,
    access: session.access,
  };

  next();
}

export function requireAdminModule(module: AdminModuleKey) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser || !hasAdminAccess(req.adminUser.access, module)) {
      res.status(403).json({
        success: false,
        error: `Akun ini tidak memiliki akses ke modul ${module}.`,
      });
      return;
    }

    next();
  };
}
