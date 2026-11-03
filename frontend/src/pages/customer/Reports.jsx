import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, fmtDateTime, isOpen, locationLine } from '../../lib/format.js';
import { FaultIcon, PageHeading } from '../../components/Bits.jsx';
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
                  className="chip"
                >
                  {item.label} {faults.filter(item.test).length}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <EmptyState
                title={faults.length ? 'Nothing in this list' : 'No reports yet'}
                action={
                  <Link to="/customer/report" className="btn btn-accent">
                    Report a fault
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
                      className="panel flex flex-col gap-2.5 px-4 py-3.5 no-underline hover:bg-paper"
                    >
                      <div className="flex items-center gap-3">
                        <FaultIcon category={fault.category} />
                        <div className="min-w-0 flex-1">
                          <div className="heading-weight text-[15px]">
                            {CATEGORY_LABEL[fault.category]}
                          </div>
                          <div className="text-[11px] text-grey">
                            #{fault.reference} · {locationLine(fault.serviceLocation)}
                          </div>
                        </div>
                        <StatusPill status={fault.status} />
                      </div>
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
