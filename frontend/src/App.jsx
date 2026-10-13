import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from './context/AuthContext.jsx';
import MobileShell from './components/MobileShell.jsx';
import CoordinatorShell from './components/CoordinatorShell.jsx';
import { Loading } from './components/States.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';

// Day 5, Step 2: customer pages
import ReportFault from './pages/customer/ReportFault.jsx';
import Submitted from './pages/customer/Submitted.jsx';
import Reports from './pages/customer/Reports.jsx';

// Temporary. Replaced by the real pages on Days 5 and 6.
function Placeholder({ title }) {
  return <h1 className="display text-3xl">{title}</h1>;
}

const CUSTOMER_TABS = [
  { to: '/customer', label: 'Home', isActive: (path) => path === '/customer' },
  { to: '/customer/report', label: 'Report', isActive: (path) => path.startsWith('/customer/report') || path.startsWith('/customer/submitted') },
  { to: '/customer/reports', label: 'Reports', isActive: (path) => path.startsWith('/customer/reports') || path.startsWith('/customer/faults') },
  { to: '/customer/notifications', label: 'Alerts', isActive: (path) => path.startsWith('/customer/notifications') },
];
const TECHNICIAN_TABS = [
  { to: '/technician', label: 'Home', isActive: (path) => path === '/technician' },
  { to: '/technician/jobs', label: 'Jobs', isActive: (path) => path.startsWith('/technician/jobs') },
  { to: '/technician/notifications', label: 'Alerts', isActive: (path) => path.startsWith('/technician/notifications') },
];

/** Sends signed-out visitors to /login and keeps each role inside its own area. */
function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Loading label="Restoring your session" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* ---------- CUSTOMER ---------- */}
      <Route
        path="/customer"
        element={
          <RequireRole role="CUSTOMER">
            <MobileShell base="/customer" tabs={CUSTOMER_TABS} />
          </RequireRole>
        }
      >
        <Route index element={<Placeholder title="Customer dashboard" />} />
        <Route path="report" element={<ReportFault />} />
        <Route path="submitted/:id" element={<Submitted />} />
        <Route path="reports" element={<Reports />} />
        <Route path="faults/:id" element={<Placeholder title="Fault tracking (Day 6)" />} />
        <Route path="notifications" element={<Placeholder title="Notifications" />} />
      </Route>

      {/* ---------- TECHNICIAN ---------- */}
      <Route
        path="/technician"
        element={
          <RequireRole role="TECHNICIAN">
            <MobileShell base="/technician" tabs={TECHNICIAN_TABS} />
          </RequireRole>
        }
      >
        <Route index element={<Placeholder title="Your jobs" />} />
        <Route path="jobs" element={<Placeholder title="My jobs" />} />
        <Route path="notifications" element={<Placeholder title="Notifications" />} />
      </Route>

      {/* ---------- COORDINATOR ---------- */}
      <Route
        path="/coordinator"
        element={
          <RequireRole role="COORDINATOR">
            <CoordinatorShell />
          </RequireRole>
        }
      >
        <Route index element={<Placeholder title="Response overview" />} />
        <Route path="faults" element={<Placeholder title="Fault management" />} />
        <Route path="monitoring" element={<Placeholder title="Live monitoring" />} />
        <Route path="analytics" element={<Placeholder title="Analytics" />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}