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
            <div
              className="grid grid-cols-3 border border-ink md:max-w-md"
              role="group"
              aria-label="Filter reports"
            >
              {FILTERS.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                  className={`eyebrow h-11 cursor-pointer ${index > 0 ? 'border-l border-ink' : ''} ${
                    filter === item.key ? 'bg-ink text-white' : 'bg-white'
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
              <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 2xl:grid-cols-3">
                {visible.map((fault) => (
                  <li key={fault.id}>
                    <Link
                      to={`/customer/faults/${fault.id}`}
                      className="panel block no-underline hover:bg-paper"
                    >
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div>
                          <div className="font-mono text-xs">#{fault.reference}</div>
                          <div className="mt-1 text-lg font-black uppercase">
                            {CATEGORY_LABEL[fault.category]}
                          </div>
                          <div className="mt-1 text-sm">{locationLine(fault.serviceLocation)}</div>
                        </div>
                        <StatusPill status={fault.status} />
                      </div>
                      <div className="flex justify-between gap-3 border-t border-ink px-4 py-2.5 font-mono text-xs">
                        <span>{fmtDateTime(fault.reportedAt)}</span>
                        <span>
                          <span className="text-muted">Technician </span>
                          {fault.technician?.name ?? '—'}
                        </span>
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
