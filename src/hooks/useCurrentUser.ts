import { useEffect, useState } from 'react';
import { authSessionService } from '../services/auth';
import { AppSessionUser } from '../types/app';

export function useCurrentUser(): AppSessionUser | null {
  const [user, setUser] = useState<AppSessionUser | null>(authSessionService.getCurrentUser());
  useEffect(() => authSessionService.subscribe(() => setUser(authSessionService.getCurrentUser())), []);
  return user;
}
