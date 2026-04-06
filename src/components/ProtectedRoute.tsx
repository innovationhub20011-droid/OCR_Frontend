import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { AppUserRole } from '../types/app';

export function ProtectedRoute({ allowedRoles, children }: { allowedRoles?: AppUserRole[]; children: ReactNode }): JSX.Element {
  const user = useCurrentUser();
  if (!user) {
    return <Navigate to={APP_ROUTES.login} replace />;
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'Checker' ? APP_ROUTES.checkerQueue : APP_ROUTES.dashboard} replace />;
  }
  return <>{children}</>;
}
