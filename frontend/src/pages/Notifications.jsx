import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../lib/api.js';
import { timeAgo } from '../lib/format.js';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeading } from '../components/Bits.jsx';
import { Async, EmptyState } from '../components/States.jsx';

/** Shared by the customer and the technician. `faultPath` builds the link to a fault for that role. */
export default function Notifications({ faultPath, intro }) {
  const state = useApi('/notifications', { interval: 6000 });
  const { reloadNotifications } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function refreshAll() {
    await state.reload();
    reloadNotifications?.();
  }

  async function markAllRead() {
    setBusy(true);
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      await refreshAll();
      toast('All notifications marked as read.');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function open(notification) {
    try {
      if (!notification.read) {
        await api(`/notifications/${notification.id}/read`, { method: 'PATCH' });
        reloadNotifications?.();
      }
    } catch {
      // Opening the fault matters more than the read flag.
    }
    if (notification.faultId) navigate(faultPath(notification.faultId));
    else state.reload();
  }

  const unread = state.data?.unread ?? 0;

  return (
    <>
      <PageHeading eyebrow={state.data ? `${unread} unread` : 'Alerts'} title="Notifications">
        {intro && <p className="mb-0 mt-3 text-sm text-muted">{intro}</p>}
      </PageHeading>

      <Async state={state} label="Loading notifications">
        {(data) =>
          data.notifications.length === 0 ? (
            <EmptyState title="No notifications yet">Updates about your faults will appear here.</EmptyState>
          ) : (
            <>
              <button type="button" className="btn btn-outline self-start" disabled={busy || unread === 0} onClick={markAllRead}>
                Mark all as read
              </button>
              <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 2xl:grid-cols-3">
                {data.notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => open(notification)}
                      className={`block w-full cursor-pointer border p-4 text-left ${
                        notification.read ? 'border-line bg-white' : 'border-ink bg-volt-soft'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-base font-black uppercase">{notification.title}</span>
                        <span className="eyebrow shrink-0 text-muted">{timeAgo(notification.createdAt)}</span>
                      </div>
                      <p className="mb-0 mt-2 text-sm">{notification.message}</p>
                      {!notification.read && <span className="pill mt-3 border-ink bg-volt">New</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )
        }
      </Async>
    </>
  );
}
