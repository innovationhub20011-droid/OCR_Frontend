import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES, TOP_NAV_ITEMS } from '../constants';
import { getTopNavActiveLabel } from '../config/ui';
import { authSessionService } from '../services/auth';
import sbiLogo from '../assets/sbi_logo_launch.jpg';

export type AppShellProps = {
  title: string;
  userName: string;
  userRole: string;
  footerLeft: string;
  footerRight: string;
  children: ReactNode;
};

export function AppShell({
  title,
  userName,
  userRole,
  footerLeft,
  footerRight,
  children
}: AppShellProps): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const activeLabel = getTopNavActiveLabel(location.pathname);

  const onTopNavClick = (_label: string, route: string) => navigate(route);

  const onLogout = () => {
    authSessionService.clearSession();
    navigate(APP_ROUTES.login);
  };

  return (
    <>
      <header className="top-header">
        <div className="brand-area">
          <div className="brand-icon"><img src={sbiLogo} alt="SBI logo" /></div>
          <h1>{title}</h1>
        </div>
        <div className="user-area">
          <div className="user-meta">
            <strong>{userName}</strong>
            <span>{userRole}</span>
          </div>
          <button className="logout-header-btn" type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <nav className="top-nav" aria-label="Primary Navigation">
        {TOP_NAV_ITEMS.map((item) => (
          <button key={item.label} type="button" className={activeLabel === item.label ? 'active' : ''} onClick={() => onTopNavClick(item.label, item.route)}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <section className="shell-content">{children}</section>
      <footer className="page-footer">
        {footerLeft ? <span>{footerLeft}</span> : null}
        {footerLeft && footerRight ? <span>|</span> : null}
        {footerRight ? <span>{footerRight}</span> : null}
      </footer>
    </>
  );
}
