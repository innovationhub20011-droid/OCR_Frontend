import { AppSessionUser, AppUserRole, LoginRequest, LoginResponse } from '../types/app';

const DEMO_CREDENTIALS = [
  {
    email: 'user.sbi@bank.com',
    password: 'User@123',
    id: 'SBI-USR-1024',
    fullName: 'SBI User',
    role: 'User' as const
  }
];

const STORAGE_KEY = 'sbi-doc-extractor-session';
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class MockAuthApiService {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const matched = DEMO_CREDENTIALS.find(
      (account) =>
        account.email.toLowerCase() === payload.email.trim().toLowerCase() &&
        account.password === payload.password
    );

    if (!matched) {
      throw new Error('Invalid credentials. Use hardcoded demo credentials.');
    }

    await wait(900);
    return {
      status: 'success',
      message: 'Login successful',
      token: 'dummy-jwt-token-for-ui-flow-only',
      user: {
        id: matched.id,
        fullName: matched.fullName,
        role: matched.role,
        branchCode: 'SBI-00452'
      }
    };
  }
}

export class AuthSessionService {
  private listeners = new Set<() => void>();

  getCurrentUser(): AppSessionUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AppSessionUser;
    } catch (error) {
      console.error('Failed to parse stored session', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  setSession(response: LoginResponse): void {
    const user: AppSessionUser = {
      id: response.user.id,
      fullName: response.user.fullName,
      role: response.user.role,
      branchCode: response.user.branchCode
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.emit();
  }

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.emit();
  }

  hasAnyRole(roles: AppUserRole[]): boolean {
    const user = this.getCurrentUser();
    return !!user && roles.includes(user.role);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const authSessionService = new AuthSessionService();
export const mockAuthApiService = new MockAuthApiService();
