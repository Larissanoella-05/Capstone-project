import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import Backdrop from './Backdrop.jsx';
import { AppHeader, PilotBanner } from './Brand.jsx';
import BottomNav from './BottomNav.jsx';
import Sidebar from './Sidebar.jsx';

/** On a phone: header on top with a bottom nav; from `md` up the tabs move to a sidebar. */
export default function MobileShell({ base, tabs, roleLabel }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifications = useApi('/notifications', { interval: 6000 });
  const unread = notifications.data?.unread ?? 0;
  const notificationsPath = `${base}/notifications`;

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const sidebarItems = tabs.map((tab) => ({
    ...tab,
    badge: tab.to === notificationsPath ? unread : 0,
  }));

  return (
    <div className="relative flex min-h-dvh flex-col bg-paper md:flex-row">
      <Backdrop />
      <Sidebar
        homeTo={base}
        roleLabel={roleLabel}
        items={sidebarItems}
        userName={user?.name}
        onSignOut={signOut}
        className="hidden md:flex"
      />

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <PilotBanner />

        <div className="md:hidden">
          <AppHeader
            homeTo={base}
            notificationsTo={notificationsPath}
            unread={unread}
            onSignOut={signOut}
          />
        </div>

        <main className="flex w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-5 pb-8 pt-[22px] md:gap-6 md:px-8 md:pb-12 md:pt-8">
          <Outlet context={{ reloadNotifications: notifications.reload }} />
        </main>

        <BottomNav tabs={tabs} pathname={pathname} unreadPath={notificationsPath} unread={unread} />
      </div>
    </div>
  );
}
