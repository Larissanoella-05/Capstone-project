import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../lib/api.js';
import { timeAgo } from '../lib/format.js';
import { NOTIFICATION_STEP, showFirst } from '../lib/paging.js';
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
  const [shown, setShown] = useState(NOTIFICATION_STEP);

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
  const hasAny = (state.data?.notifications.length ?? 0) > 0;

  return (
    <>
      <PageHeading
        eyebrow={state.data ? `${unread} unread` : 'Alerts'}
        title="Alerts"
        action={
          hasAny && (
            <button
              type="button"
              className="relative mb-1 cursor-pointer border-0 bg-transparent p-0 text-[11px] uppercase text-ink underline after:absolute after:-inset-y-3 after:-inset-x-2 after:content-[''] disabled:cursor-not-allowed disabled:text-mute disabled:no-underline"
              disabled={busy || unread === 0}
              onClick={markAllRead}
            >
              Mark all as read
            </button>
          )
        }
      >
        {intro && <p className="mb-0 mt-3.5 text-xs text-grey">{intro}</p>}
      </PageHeading>

      <Async state={state} label="Loading notifications">
        {(data) =>
          data.notifications.length === 0 ? (
            <EmptyState title="No notifications yet">
              Updates about your faults will appear here.
            </EmptyState>
          ) : (
            <>
              <ul className="m-0 grid list-none gap-3.5 p-0 md:grid-cols-2 2xl:grid-cols-3">
                {showFirst(data.notifications, shown).visible.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => open(notification)}
                      className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-card border px-[18px] py-3.5 text-left ${
                        notification.read ? 'border-border bg-white' : 'border-ink bg-yellow'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="heading-weight text-[13px] uppercase">
                          {notification.title}
                        </span>
                        {notification.read ? (
                          <span className="shrink-0 text-[11px] text-grey">
                            {timeAgo(notification.createdAt)}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-tag bg-ink px-[7px] py-[3px] text-[11px] font-medium uppercase tracking-[0.05em] text-yellow">
                            New
                          </span>
                        )}
                      </div>
                      <p className="m-0 text-xs">{notification.message}</p>
                      {!notification.read && (
                        <span className="text-[11px]">{timeAgo(notification.createdAt)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {showFirst(data.notifications, shown).hidden > 0 && (
                <button
                  type="button"
                  className="btn btn-outline self-start"
                  onClick={() => setShown((count) => count + NOTIFICATION_STEP)}
                >
                  Load more ({showFirst(data.notifications, shown).hidden} older)
                </button>
              )}
            </>
          )
        }
      </Async>
    </>
  );
}
