import { AppShell } from '../../components/AppShell';
import { getShellProps } from '../../config/shell';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export function ReportsPage(): JSX.Element {
  const user = useCurrentUser();
  return (
    <main className="reports-page">
      <AppShell
        {...getShellProps(user)}
      >
        <section className="card"><h2>Reports Page Works Fine</h2></section>
      </AppShell>
    </main>
  );
}

export function SettingsPage(): JSX.Element {
  const user = useCurrentUser();
  return (
    <main className="settings-page">
      <AppShell
        {...getShellProps(user)}
      >
        <section className="card"><h2>Settings Page Works Fine</h2></section>
      </AppShell>
    </main>
  );
}
