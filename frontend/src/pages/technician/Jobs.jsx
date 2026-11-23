import { useT } from '../../context/LanguageContext.jsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, fmtDateTime, isOpen, locationLine } from '../../lib/format.js';
import { FaultIcon, PageHeading } from '../../components/Bits.jsx';
import { PriorityPill, StatusPill } from '../../components/Pills.jsx';
import { Async, EmptyState } from '../../components/States.jsx';

const FILTERS = [
  { key: 'ALL', label: 'All', test: () => true },
  { key: 'OPEN', label: 'Open', test: isOpen },
  { key: 'DONE', label: 'Done', test: (fault) => !isOpen(fault) },
];

export default function Jobs() {
  const t = useT();

  const state = useApi('/faults', { interval: 5000 });
  const [tab, setTab] = useState('OPEN');

  const faults = state.data?.faults ?? [];
  const visible = faults.filter(FILTERS.find((item) => item.key === tab).test);

  return (
    <>
      <PageHeading
        eyebrow={state.data ? t('{count} jobs in total', { count: faults.length }) : t('Jobs')}
        title={t('My jobs')}
      />

      <Async state={state} label="Loading your jobs">
        {() => (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('Filter jobs')}>
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={tab === item.key}
                  onClick={() => setTab(item.key)}
                  className="chip"
                >
                  {t(item.label)} {faults.filter(item.test).length}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <EmptyState title={tab === 'DONE' ? t('No completed jobs yet') : t('No jobs here')}>
                {tab === 'DONE'
                  ? t('Jobs you resolve are kept here.')
                  : t('New jobs assigned by the service coordinator appear here automatically.')}
              </EmptyState>
            ) : (
              <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 2xl:grid-cols-3">
                {visible.map((fault) => (
                  <li key={fault.id}>
                    <Link
                      to={`/technician/jobs/${fault.id}`}
                      className="panel flex flex-col gap-3 px-4 py-3.5 no-underline hover:bg-paper"
                    >
                      <div className="flex items-center gap-3">
                        <FaultIcon category={fault.category} />
                        <div className="min-w-0 flex-1">
                          <div className="heading-weight text-[15px]">
                            {t(CATEGORY_LABEL[fault.category])}
                          </div>
                          <div className="truncate text-xs text-grey">
                            #{fault.reference} · {locationLine(fault.serviceLocation)}
                          </div>
                        </div>
                        <StatusPill status={fault.status} />
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5">
                        <PriorityPill priority={fault.priority} withLabel />
                        <span className="text-xs text-grey">
                          {isOpen(fault)
                            ? t('Reported {when}', { when: fmtDateTime(fault.reportedAt, t) })
                            : t('Closed {when}', {
                                when: fmtDateTime(fault.resolvedAt ?? fault.cancelledAt, t),
                              })}
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
