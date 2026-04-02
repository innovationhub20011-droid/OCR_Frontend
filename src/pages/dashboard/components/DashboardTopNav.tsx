type DashboardNavItem = {
  label: string;
  icon: string;
  route: string;
};

type DashboardTopNavProps = {
  items: DashboardNavItem[];
  activeLabel: string;
  onNavigate: (label: string, route: string) => void;
};

export function DashboardTopNav({ items, activeLabel, onNavigate }: DashboardTopNavProps): JSX.Element {
  return (
    <nav className="top-nav" aria-label="Primary Navigation">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={activeLabel === item.label ? 'active' : ''}
          onClick={() => onNavigate(item.label, item.route)}
        >
          <span>{item.icon}</span>{item.label}
        </button>
      ))}
    </nav>
  );
}
