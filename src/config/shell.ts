import { AppShellProps } from '../components/AppShell';
import { AppSessionUser } from '../types/app';

type ShellOverrides = Partial<Omit<AppShellProps, 'children'>>;

export function getShellProps(user: AppSessionUser | null, overrides?: ShellOverrides): Omit<AppShellProps, 'children'> {
  const base: Omit<AppShellProps, 'children'> = {
    title: 'SBI OCR',
    userName: user?.fullName || 'John Doe',
    userRole: user?.role || 'KYC Manager',
    footerLeft: '',
    footerRight: ''
  };

  return {
    ...base,
    ...overrides
  };
}
