import sbiLogo from '../../../assets/sbi_logo_launch.jpg';

type DashboardHeaderProps = {
  userName: string;
  userRole: string;
  onLogout: () => void;
};

export function DashboardHeader({ userName, userRole, onLogout }: DashboardHeaderProps): JSX.Element {
  return (
    <header className="top-header">
      <div className="brand-area">
        <div className="brand-icon"><img src={sbiLogo} alt="SBI logo" /></div>
        <h1>SBI OCR</h1>
      </div>
      <div className="user-area">
        <div className="user-meta">
          <strong>{userName}</strong>
          <span>{userRole}</span>
        </div>
        <button className="header-btn" type="button" aria-label="Logout" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
