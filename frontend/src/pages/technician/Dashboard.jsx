import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, firstNames, greeting, isOpen, locationLine, timeAgo } from '../../lib/format.js';
import { PageHeading } from '../../components/Bits.jsx';
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
  const completedToday = faults.filter((fault) => fault.status === 'RESOLVED' && isToday(fault.resolvedAt));
  const assignedToday = faults.filter((fault) => isToday(fault.assignedAt));

  return (
    <>
      <PageHeading eyebrow={`${greeting()}, ${firstNames(user.name)}`} title="Your jobs" />

      <Async state={state} label="Loading your jobs">
        {() => (
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
            {active ? (
              <section className="panel" aria-label="Active job">
                <div className="flex items-center justify-between gap-3 border-b border-ink bg-volt px-4 py-3">
                  <span className="eyebrow">Active job</span>
                  <span className="font-mono text-xs">Assigned {timeAgo(active.assignedAt)}</span>
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <div className="font-mono text-xs">Fault #{active.reference}</div>
                  <div className="display text-[28px]">{CATEGORY_LABEL[active.category]}</div>
                  <div className="mt-2 text-base font-bold">{locationLine(active.serviceLocation)}</div>
                  {active.serviceLocation.landmark && <div className="text-sm">{active.serviceLocation.landmark}</div>}
                </div>
                <div className="grid grid-cols-2 border-t border-ink">
                  <div className="p-3">
                    <div className="eyebrow text-muted">Priority</div>
                    <div className="mt-1.5"><PriorityPill priority={active.priority} /></div>
                  </div>
                  <div className="border-l border-ink p-3">
                    <div className="eyebrow text-muted">Status</div>
                    <div className="mt-1.5"><StatusPill status={active.status} /></div>
                  </div>
                </div>
                <div className="border-t border-ink p-3">
                  <Link to={`/technician/jobs/${active.id}`} className="btn btn-ink btn-lg w-full">
                    View Job
                  </Link>
                </div>
              </section>
            ) : (
              <EmptyState title="No active job">
                New jobs assigned by the service coordinator appear here automatically.
              </EmptyState>
            )}

            <div className="flex min-w-0 flex-col gap-5">
            <div className="grid grid-cols-3 gap-px border border-ink bg-ink">
              {[
                ["Today's assignments", assignedToday.length],
                ['Pending jobs', faults.filter(isOpen).length],
                ['Completed today', completedToday.length],
              ].map(([label, value]) => (
                <div key={label} className="flex min-h-24 flex-col justify-between bg-white p-3">
                  <div className="eyebrow text-muted">{label}</div>
                  <div className="text-3xl font-black leading-none">{value}</div>
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <section className="panel">
                <div className="panel-head">Pending jobs</div>
                {pending.map((fault, index) => (
                  <JobRow key={fault.id} fault={fault} bordered={index > 0} />
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

function JobRow({ fault, bordered }) {
  return (
    <Link
      to={`/technician/jobs/${fault.id}`}
      className={`flex items-start justify-between gap-3 p-4 no-underline hover:bg-paper ${bordered ? 'border-t border-ink' : ''}`}
    >
      <div className="min-w-0">
        <div className="font-mono text-xs">#{fault.reference}</div>
        <div className="mt-1 text-lg font-black uppercase">{CATEGORY_LABEL[fault.category]}</div>
        <div className="mt-1 text-sm">{locationLine(fault.serviceLocation)}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <StatusPill status={fault.status} />
        <span className="font-mono text-xs">Priority: {fault.priority[0] + fault.priority.slice(1).toLowerCase()}</span>
      </div>
    </Link>
  );
}
