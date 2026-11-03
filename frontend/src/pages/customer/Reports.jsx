import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, fmtDateTime, isOpen, locationLine } from '../../lib/format.js';
import { PageHeading } from '../../components/Bits.jsx';
import { StatusPill } from '../../components/Pills.jsx';
import { Async, EmptyState } from '../../components/States.jsx';

const FILTERS = [
  { key: 'ALL', label: 'All', test: () => true },
  { key: 'OPEN', label: 'Open', test: isOpen },
  { key: 'CLOSED', label: 'Resolved', test: (fault) => !isOpen(fault) },
];

export default function Reports() {
  const state = useApi('/faults', { interval: 5000 });
  const [filter, setFilter] = useState('ALL');
  const faults = state.data?.faults ?? [];
  const visible = faults.filter(FILTERS.find((item) => item.key === filter).test);

  return (
    <>
      <PageHeading
        eyebrow={
          state.data ? `${faults.length} ${faults.length === 1 ? 'report' : 'reports'}` : 'History'
        }
        title="My reports"
      />

      <Async state={state} label="Loading your reports">
        {() => (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reports">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                  className={`relative cursor-pointer rounded-chip border px-3.5 py-2 text-[11px] uppercase tracking-[0.05em] after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] ${
                    filter === item.key
                      ? 'border-ink bg-ink font-medium text-white'
                      : 'border-border bg-white text-ink'
                  }`}
                >
                  {item.label} {faults.filter(item.test).length}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <EmptyState
                title={faults.length ? 'Nothing in this list' : 'No reports yet'}
                action={
                  <Link to="/customer/report" className="btn btn-volt">
                    Report a Fault
                  </Link>
                }
              >
                {faults.length
                  ? 'Choose another filter to see your other reports.'
                  : 'When you report a fault it is listed here.'}
              </EmptyState>
            ) : (
              <ul className="m-0 grid list-none gap-3.5 p-0 md:grid-cols-2 2xl:grid-cols-3">
                {visible.map((fault) => (
                  <li key={fault.id}>
                    <Link
                      to={`/customer/faults/${fault.id}`}
                      className="panel flex flex-col gap-2.5 px-[18px] py-4 no-underline hover:bg-paper"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-grey">#{fault.reference}</span>
                        <StatusPill status={fault.status} />
                      </div>
                      <div className="heading-weight text-[17px] uppercase">
                        {CATEGORY_LABEL[fault.category]}
                      </div>
                      <div className="text-xs text-grey">{locationLine(fault.serviceLocation)}</div>
                      <div className="flex flex-col gap-1.5 border-t border-line pt-2.5 text-xs font-medium">
                        <div className="flex justify-between gap-3">
                          <span className="eyebrow">Technician</span>
                          <span>{fault.technician?.name ?? '—'}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="eyebrow">Reported</span>
                          <span>{fmtDateTime(fault.reportedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Async>
    </>
  );
}
