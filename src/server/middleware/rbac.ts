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

/**
 * abacMiddleware
 * Attribute-Based Access Control middleware for branch scoping.
 *
 * Rules:
 *  - 'admin' role bypasses all branch checks.
 *  - Other users must belong to the branchId of the resource they are accessing/modifying.
 *  - Inspects req.body.branchId, req.query.branchId, or req.params.branchId/id.
 */
export function abacMiddleware() {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required.'));
    }

    const { roleName, branchId, allowedBranches } = req.user as {
      roleName: string;
      branchId?: string;
      allowedBranches?: string[];
    };

    // 1. Admin role has global bypass permission
    if (roleName === 'admin') {
      return next();
    }

    // 2. Determine targeted branch ID from request body, query parameters or route params
    const targetBranchId =
      (req.body.branchId as string) ||
      (req.query.branchId as string) ||
      (req.params.branchId as string);

    if (!targetBranchId) {
      // If no branchId is specified, let the request proceed unless the route is explicitly branch-scoped
      return next();
    }

    // 3. Evaluate attributes: check if user is allowed to access targetBranchId
    const permitted =
      (branchId && branchId === targetBranchId) ||
      (allowedBranches && allowedBranches.includes(targetBranchId));

    if (!permitted) {
      return next(
        new AuthorizationError(
          `Access Denied: You do not have permissions to access branch resource [${targetBranchId}].`
        )
      );
    }

    next();
  };
}
