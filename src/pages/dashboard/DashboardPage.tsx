import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES, DOC_ASSET_MAP, TOP_NAV_ITEMS } from '../../constants';
import { getTopNavActiveLabel } from '../../config/ui';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { authSessionService } from '../../services/auth';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardTopNav } from './components/DashboardTopNav';
import { DashboardUploadBanner } from './components/DashboardUploadBanner';

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'OVDs' | 'Text Documents' | 'Forms' | 'Miscellaneous'>('OVDs');

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);

  const cards = useMemo(() => {
    if (selectedCategory === 'Text Documents') {
      return [
        { subtitle: 'Handwritten Text', artClass: 'handwritten' as const },
        { subtitle: 'Digital Text', artClass: 'digital' as const },
        { subtitle: 'Miscellaneous Text', artClass: 'misc-text' as const }
      ];
    }
    if (selectedCategory === 'Forms') {
      return [
        { subtitle: 'Account Opening Form', artClass: 'aof' as const },
        { subtitle: 'Housing Loan Form', artClass: 'hlf' as const },
        { subtitle: 'Personal Loan Form', artClass: 'plf' as const }
      ];
    }
    if (selectedCategory === 'Miscellaneous') {
      return [
        { subtitle: 'Cheque', artClass: 'cheque' as const },
        { subtitle: 'Application', artClass: 'application' as const },
        { subtitle: 'Supporting Doc', artClass: 'supporting' as const }
      ];
    }
    return [
      { subtitle: 'Aadhaar Card', artClass: 'aadhaar' as const },
      { subtitle: 'PAN Card', artClass: 'pan' as const },
      { subtitle: 'Voter Card', artClass: 'voter' as const },
      { subtitle: 'Passport', artClass: 'passport' as const },
      { subtitle: 'Driving License', artClass: 'driving-license' as const }
    ];
  }, [selectedCategory]);

  const selectedCategoryHeading = selectedCategory === 'OVDs'
    ? 'OVD Extraction'
    : selectedCategory === 'Text Documents'
      ? 'Text Documents Extraction'
      : selectedCategory === 'Forms'
        ? 'Forms Extraction'
        : 'Miscellaneous Extraction';

  const supportedLabel = selectedCategory === 'OVDs'
    ? 'Supported OVDs:'
    : selectedCategory === 'Text Documents'
      ? 'Supported Text Documents:'
      : selectedCategory === 'Forms'
        ? 'Supported Forms:'
        : 'Supported Miscellaneous:';

  const selectedCategoryTypes = selectedCategory === 'OVDs'
    ? ['Aadhaar Card', 'PAN Card', 'Voter Card', 'Passport', 'Driving License']
    : selectedCategory === 'Text Documents'
      ? ['Handwritten Text', 'Digital Text', 'Miscellaneous Text Documents']
      : selectedCategory === 'Forms'
        ? ['Account Opening Form', 'Housing Loan Form', 'Personal Loan Form']
        : ['Cheques', 'Applications', 'Other Supporting Documents'];

  const sideNav = [
    { label: 'Upload Document', icon: 'U' },
    { label: 'Start New Verification', icon: 'N' },
    { label: 'Pending Queue', icon: 'P' }
  ] as const;

  const activities = [
    { title: 'Aadhaar Card', id: '1824-5608-9123', age: 'Just now', status: 'Just time' },
    { title: 'Personal Loan Form', id: '2078-8004-29122', age: '5 mins ago', status: 'Processing' },
    { title: 'Aadhaar Card', id: '5978-9223-4667', age: '15 mins ago', status: 'Verified' },
    { title: 'PAN Card', id: '#11B0ED10234F', age: '30 mins ago', status: 'Verified' }
  ] as const;

  const stats = [
    { value: '18', label: 'Documents Processed Today' },
    { value: '32s', label: 'Average Verification Time' },
    { value: '4', label: 'Pending Verifications' }
  ];

  const onLogout = () => {
    authSessionService.clearSession();
    navigate(APP_ROUTES.login);
  };

  const onTopNavNavigate = (_label: string, route: string) => navigate(route);

  if (isLoading) {
    return <main className="loading-screen">Loading dashboard...</main>;
  }

  return (
    <main className="dashboard-page">
      <DashboardHeader
        userName={user?.fullName || 'John Doe'}
        userRole={user?.role || 'KYC Manager'}
        onLogout={onLogout}
      />

      <DashboardTopNav
        items={TOP_NAV_ITEMS}
        activeLabel={getTopNavActiveLabel(location.pathname)}
        onNavigate={onTopNavNavigate}
      />

      <DashboardUploadBanner onUpload={() => navigate(APP_ROUTES.uploadDocuments)} />

      <section className="workspace-grid">
        <aside className="left-sidenav" aria-label="Side Navigation">
          {sideNav.map((item) => (
            <button
              key={item.label}
              type="button"
              className={item.label === 'Upload Document' ? 'active' : ''}
              onClick={() => {
                if (item.label === 'Upload Document' || item.label === 'Start New Verification') {
                  navigate(APP_ROUTES.uploadDocuments);
                  return;
                }
                if (item.label === 'Pending Queue') {
                  navigate(APP_ROUTES.verificationQueue);
                }
              }}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </aside>

        <div className="main-content">
          <div className="supported-docs-divider" role="presentation">
            <span>Supported Documents</span>
          </div>

          <section className="ovd-panel">
            <div className="ovd-head">
              <h3>{selectedCategoryHeading}</h3>
              <div className="category-chips">
                {(['OVDs', 'Text Documents', 'Forms', 'Miscellaneous'] as const).map((category) => (
                  <button key={category} type="button" className={selectedCategory === category ? 'active' : ''} onClick={() => setSelectedCategory(category)}>{category}</button>
                ))}
              </div>
            </div>

            <div className="supported-types" aria-label="Supported document types">
              <strong>{supportedLabel}</strong>
              <div className="type-tags">
                {selectedCategoryTypes.map((type) => (
                  <span key={type}>{type}</span>
                ))}
              </div>
            </div>

            <div className="ovd-grid">
              {cards.map((card) => (
                <article className="ovd-card" key={`${card.artClass}-${card.subtitle}`}>
                  <div className={`doc-art ${card.artClass}`}>
                    <img className="doc-svg" src={DOC_ASSET_MAP[card.artClass]} alt={`${card.subtitle} document preview`} />
                  </div>
                  <p>{card.subtitle}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="stats-panel">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <h4>{stat.value}</h4>
                <p>{stat.label}</p>
              </article>
            ))}
          </section>
        </div>

        <aside className="right-rail">
          <section className="activity-panel">
            <div className="panel-head">
              <h3>Recent Activity</h3>
              <button type="button" onClick={() => navigate(APP_ROUTES.verificationQueue)}>View All</button>
            </div>
            {activities.map((activity) => (
              <article className="activity-item" key={activity.id}>
                <h4>{activity.title}</h4>
                <p>{activity.id}</p>
                <div className="activity-meta">
                  <span>{activity.age}</span>
                  <strong className={activity.status === 'Processing' ? 'processing' : activity.status === 'Verified' ? 'verified' : ''}>{activity.status}</strong>
                </div>
              </article>
            ))}
            <button className="btn btn-blue" type="button" onClick={() => navigate(APP_ROUTES.uploadDocuments)}>Resume Verification</button>
          </section>
        </aside>
      </section>

    </main>
  );
}
