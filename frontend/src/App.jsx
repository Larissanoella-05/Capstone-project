import { Bell, House, ListTodo, TriangleAlert } from 'lucide-react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from './context/AuthContext.jsx';
import MobileShell from './components/MobileShell.jsx';
import CoordinatorShell from './components/CoordinatorShell.jsx';
import { Loading } from './components/States.jsx';

import { homeDecision } from './lib/landingLinks.js';

import Landing from './pages/landing/Landing.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Notifications from './pages/Notifications.jsx';

import CustomerDashboard from './pages/customer/Dashboard.jsx';
import ReportFault from './pages/customer/ReportFault.jsx';
import Submitted from './pages/customer/Submitted.jsx';
import Reports from './pages/customer/Reports.jsx';
import Tracking from './pages/customer/Tracking.jsx';

import TechnicianDashboard from './pages/technician/Dashboard.jsx';
import Jobs from './pages/technician/Jobs.jsx';
import JobDetails from './pages/technician/JobDetails.jsx';
import ResolveJob from './pages/technician/ResolveJob.jsx';

import CoordinatorDashboard from './pages/coordinator/Dashboard.jsx';
import Analytics from './pages/coordinator/Analytics.jsx';
import Faults from './pages/coordinator/Faults.jsx';
import FaultDetails from './pages/coordinator/FaultDetails.jsx';
import Assign from './pages/coordinator/Assign.jsx';
import Monitoring from './pages/coordinator/Monitoring.jsx';

const CUSTOMER_TABS = [
  { to: '/customer', label: 'Home', icon: House, isActive: (path) => path === '/customer' },
  {
    to: '/customer/report',
    label: 'Report',
    icon: TriangleAlert,
    isActive: (path) => path === '/customer/report' || path.startsWith('/customer/submitted'),
  },
  {
    to: '/customer/reports',
    label: 'Reports',
    icon: ListTodo,
    isActive: (path) => path.startsWith('/customer/reports') || path.startsWith('/customer/faults'),
  },
  {
    to: '/customer/notifications',
    label: 'Alerts',
    icon: Bell,
    isActive: (path) => path.startsWith('/customer/notifications'),
  },
];
const TECHNICIAN_TABS = [
  { to: '/technician', label: 'Home', icon: House, isActive: (path) => path === '/technician' },
  {
    to: '/technician/jobs',
    label: 'Jobs',
    icon: ListTodo,
    isActive: (path) => path.startsWith('/technician/jobs'),
  },
  {
    to: '/technician/notifications',
    label: 'Alerts',
    icon: Bell,
    isActive: (path) => path.startsWith('/technician/notifications'),
  },
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

/** Signed-in users go to their role home; signed-out visitors see the public landing page. */
function Home() {
  const { user, loading } = useAuth();
  const decision = homeDecision(user, loading, HOME_BY_ROLE);
  if (decision === 'wait') return null;
  if (decision === 'landing') return <Landing />;
  return <Navigate to={decision} replace />;
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
            <MobileShell base="/customer" tabs={CUSTOMER_TABS} roleLabel="Customer" />
          </RequireRole>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="report" element={<ReportFault />} />
        <Route path="submitted/:id" element={<Submitted />} />
        <Route path="reports" element={<Reports />} />
        <Route path="faults/:id" element={<Tracking />} />
        <Route
          path="notifications"
          element={
            <Notifications
              faultPath={(id) => `/customer/faults/${id}`}
              intro="Updates about your fault reports as they move through each stage."
            />
          }
        />
      </Route>

      {/* ---------- TECHNICIAN ---------- */}
      <Route
        path="/technician"
        element={
          <RequireRole role="TECHNICIAN">
            <MobileShell base="/technician" tabs={TECHNICIAN_TABS} roleLabel="Technician" />
          </RequireRole>
        }
      >
        <Route index element={<TechnicianDashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="jobs/:id/resolve" element={<ResolveJob />} />
        <Route
          path="notifications"
          element={
            <Notifications
              faultPath={(id) => `/technician/jobs/${id}`}
              intro="New jobs assigned to you by the service coordinator."
            />
          }
        />
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
        <Route index element={<CoordinatorDashboard />} />
        <Route path="faults" element={<Faults />} />
        <Route path="faults/:id" element={<FaultDetails />} />
        <Route path="faults/:id/assign" element={<Assign />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
