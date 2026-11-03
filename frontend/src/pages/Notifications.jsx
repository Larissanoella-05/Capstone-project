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
              className="relative mb-1 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-accent after:absolute after:-inset-y-3 after:-inset-x-2 after:content-[''] disabled:cursor-not-allowed disabled:text-mute"
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
                      className="panel relative flex w-full cursor-pointer flex-col gap-1.5 px-[18px] py-3.5 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          {!notification.read && (
                            <span
                              aria-hidden="true"
                              className="h-2 w-2 shrink-0 rounded-full bg-accent"
                            />
                          )}
                          <span className="heading-weight text-[14px]">{notification.title}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-grey">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="m-0 text-xs text-grey">{notification.message}</p>
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
