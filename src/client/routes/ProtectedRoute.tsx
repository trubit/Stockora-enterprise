import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.ts';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requiredPermission?: string;
}

export function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (user) {
    const isOwnerOrAdmin =
      user.roleName === 'Company Owner' || user.roleName === 'Super Administrator';

    // 1. Permission-based guard
    if (requiredPermission && !isOwnerOrAdmin) {
      const hasPerm = user.permissions?.includes(requiredPermission);
      if (!hasPerm) {
        return <Navigate to="/access-denied" replace />;
      }
    }

    // 2. Role-based guard (fallback compatibility)
    if (allowedRoles && !allowedRoles.includes(user.role) && !isOwnerOrAdmin) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <Outlet />;
}
