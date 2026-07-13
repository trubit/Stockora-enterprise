import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { Role } from '../models/Role.js';
import { AuthorizationError } from '../errors/AppError.js';

export function rbacMiddleware(requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AuthorizationError());
    }

    const { roleName } = req.user;

    try {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        return next(new AuthorizationError());
      }

      const hasPermission = requiredPermissions.every((perm) => role.permissions.includes(perm));
      if (!hasPermission) {
        return next(new AuthorizationError());
      }

      next();
    } catch (err: unknown) {
      next(err);
    }
  };
}
