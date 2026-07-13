import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../errors/AppError.js';
import { config } from '../../config/environment.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    roleName: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      username: string;
      roleName: string;
    };
    req.user = decoded;
    next();
  } catch (err: unknown) {
    throw new AuthenticationError('Session expired or invalid.');
  }
}
