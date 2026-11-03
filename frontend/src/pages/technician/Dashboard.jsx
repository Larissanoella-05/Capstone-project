import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import {
  CATEGORY_LABEL,
  firstNames,
  greeting,
  isOpen,
  locationLine,
  timeAgo,
} from '../../lib/format.js';
import { Avatar, FaultIcon } from '../../components/Bits.jsx';
import { PriorityPill, StatusPill } from '../../components/Pills.jsx';
import { Async, EmptyState } from '../../components/States.jsx';

const IN_PROGRESS = ['ON_THE_WAY', 'ARRIVED', 'WORKING'];
const isToday = (value) => value && new Date(value).toDateString() === new Date().toDateString();

/** The job the technician should be looking at: one already started, otherwise the oldest assignment. */
export function pickActiveJob(faults) {
  const open = faults.filter(isOpen);
  return (
    open.find((fault) => IN_PROGRESS.includes(fault.status)) ??
    [...open].sort((a, b) => new Date(a.assignedAt) - new Date(b.assignedAt))[0] ??
    null
  );
}

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const state = useApi('/faults', { interval: 5000 });

  const faults = state.data?.faults ?? [];
  const active = pickActiveJob(faults);
  const pending = faults.filter((fault) => isOpen(fault) && fault.id !== active?.id);
  const completedToday = faults.filter(
    (fault) => fault.status === 'RESOLVED' && isToday(fault.resolvedAt)
  );
  const assignedToday = faults.filter((fault) => isToday(fault.assignedAt));

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-grey">{greeting()},</div>
          <h1 className="display text-[26px]">{firstNames(user.name)}</h1>
        </div>
        <Avatar name={user.name} />
      </div>

      <Async state={state} label="Loading your jobs">
        {() => (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Today's assignments", assignedToday.length],
                ['Pending', faults.filter(isOpen).length],
                ['Completed today', completedToday.length],
              ].map(([label, value]) => (
                <div key={label} className="panel flex min-h-24 flex-col justify-between p-3">
                  <div className="text-xs font-medium text-grey">{label}</div>
                  <div className="heading-weight text-3xl leading-none">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
              {active ? (
                <section className="panel" aria-label="Next job">
                  <div className="flex items-center justify-between gap-3 bg-ink px-4 py-3 text-white">
                    <span className="heading-weight text-sm">Next job</span>
                    <span className="text-xs text-white/75">
                      Assigned {timeAgo(active.assignedAt)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <div className="text-xs text-grey">Fault #{active.reference}</div>
                    <div className="display text-[24px]">{CATEGORY_LABEL[active.category]}</div>
                    <div className="mt-2 text-base font-bold">
                      {locationLine(active.serviceLocation)}
                    </div>
                    {active.serviceLocation.landmark && (
                      <div className="text-sm text-grey">{active.serviceLocation.landmark}</div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <PriorityPill priority={active.priority} />
                      <StatusPill status={active.status} />
                    </div>
                  </div>
                  <Link
                    to={`/technician/jobs/${active.id}`}
                    className="flex min-h-12 items-center justify-between bg-accent px-4 text-[15px] font-bold text-on-accent no-underline"
                  >
                    Open job
                    <ChevronRight size={20} aria-hidden="true" />
                  </Link>
                </section>
              ) : (
                <EmptyState title="No active job">
                  New jobs assigned by the service coordinator appear here automatically.
                </EmptyState>
              )}

              {pending.length > 0 && (
                <section className="flex min-w-0 flex-col gap-3" aria-label="Waiting">
                  <h2 className="heading-weight m-0 text-base">Waiting</h2>
                  {pending.map((fault) => (
                    <JobRow key={fault.id} fault={fault} />
                  ))}
                </section>
              )}
            </div>
          </div>
        )}
      </Async>
    </>
  );
}

function JobRow({ fault }) {
  return (
    <Link
      to={`/technician/jobs/${fault.id}`}
      className="panel flex items-center gap-3 px-4 py-3 no-underline hover:bg-paper"
    >
      <FaultIcon category={fault.category} />
      <div className="min-w-0 flex-1">
        <div className="heading-weight text-[15px]">{CATEGORY_LABEL[fault.category]}</div>
        <div className="truncate text-xs text-grey">
          #{fault.reference} · {locationLine(fault.serviceLocation)}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusPill status={fault.status} />
        <PriorityPill priority={fault.priority} />
      </div>
    </Link>
  );
}
