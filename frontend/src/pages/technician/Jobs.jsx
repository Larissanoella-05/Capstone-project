import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, fmtDateTime, isOpen, locationLine } from '../../lib/format.js';
import { PageHeading } from '../../components/Bits.jsx';
import { PriorityPill, StatusPill } from '../../components/Pills.jsx';
import { Async, EmptyState } from '../../components/States.jsx';

export default function Jobs() {
  const state = useApi('/faults', { interval: 5000 });
  const [tab, setTab] = useState('OPEN');

  const faults = state.data?.faults ?? [];
  const open = faults.filter(isOpen);
  const completed = faults.filter((fault) => !isOpen(fault));
  const visible = tab === 'OPEN' ? open : completed;

  return (
    <>
      <PageHeading eyebrow={state.data ? `${faults.length} jobs in total` : 'Jobs'} title="My jobs" />

      <Async state={state} label="Loading your jobs">
        {() => (
          <>
            <div className="grid grid-cols-2 border border-ink" role="group" aria-label="Filter jobs">
              {[
                ['OPEN', `Assigned ${open.length}`],
                ['DONE', `Completed ${completed.length}`],
              ].map(([key, label], index) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={tab === key}
                  onClick={() => setTab(key)}
                  className={`eyebrow h-11 cursor-pointer ${index > 0 ? 'border-l border-ink' : ''} ${
                    tab === key ? 'bg-ink text-white' : 'bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <EmptyState title={tab === 'OPEN' ? 'No assigned jobs' : 'No completed jobs yet'}>
                {tab === 'OPEN'
                  ? 'New jobs assigned by the service coordinator appear here automatically.'
                  : 'Jobs you resolve are kept here.'}
              </EmptyState>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {visible.map((fault) => (
                  <li key={fault.id}>
                    <Link to={`/technician/jobs/${fault.id}`} className="panel block no-underline hover:bg-paper">
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div>
                          <div className="font-mono text-xs">#{fault.reference}</div>
                          <div className="mt-1 text-lg font-black uppercase">{CATEGORY_LABEL[fault.category]}</div>
                          <div className="mt-1 text-sm">{locationLine(fault.serviceLocation)}</div>
                        </div>
                        <StatusPill status={fault.status} />
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-ink px-4 py-2.5">
                        <PriorityPill priority={fault.priority} withLabel />
                        <span className="font-mono text-xs">
                          {tab === 'OPEN' ? `Reported ${fmtDateTime(fault.reportedAt)}` : `Resolved ${fmtDateTime(fault.resolvedAt ?? fault.cancelledAt)}`}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {tab === 'OPEN' && visible.length > 0 && (
              <p className="m-0 text-sm text-muted">New jobs assigned by the service coordinator appear here automatically.</p>
            )}
          </>
        )}
      </Async>
    </>
  );
}
