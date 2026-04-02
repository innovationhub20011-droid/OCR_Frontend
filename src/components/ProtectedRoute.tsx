import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function ProtectedRoute({ children }: { children: ReactNode }): JSX.Element {
  const user = useCurrentUser();
  if (!user) {
    return <Navigate to={APP_ROUTES.login} replace />;
  }
  return <>{children}</>;
}
