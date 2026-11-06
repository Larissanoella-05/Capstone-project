import { ChartColumn, ClipboardList, LayoutDashboard, Radio } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Backdrop from './Backdrop.jsx';
import NewReportAlert from './NewReportAlert.jsx';
import { PilotBanner } from './Brand.jsx';
import Sidebar from './Sidebar.jsx';

const LINKS = [
  { to: '/coordinator', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/coordinator/faults', label: 'Fault management', icon: ClipboardList },
  { to: '/coordinator/monitoring', label: 'Live monitoring', icon: Radio },
  { to: '/coordinator/analytics', label: 'Analytics', icon: ChartColumn },
];

/** The sidebar stacks on top on a narrow screen. */
export default function CoordinatorShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-dvh flex-col bg-paper">
      <Backdrop />
      <div className="relative z-[1]">
        <PilotBanner />
      </div>
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar
          homeTo="/coordinator"
          roleLabel="Service coordinator"
          items={LINKS}
          userName={user?.name}
          onSignOut={() => {
            logout();
            navigate('/login');
          }}
        />
        <main className="relative z-[1] flex w-full min-w-0 max-w-[1400px] flex-col gap-5 px-4 pb-12 pt-6 md:px-8 md:py-7">
          <NewReportAlert />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function CoordinatorHeading({ eyebrow, title, children, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="display mt-1 text-[clamp(1.5rem,3.5vw,1.75rem)]">{title}</h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
