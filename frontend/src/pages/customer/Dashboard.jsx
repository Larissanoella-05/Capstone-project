import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import {
  CATEGORY_LABEL,
  CUSTOMER_HEADLINE,
  firstNames,
  greeting,
  isOpen,
  locationLine,
  timeAgo,
} from '../../lib/format.js';
import { KeyRow, Stepper } from '../../components/Bits.jsx';
import { StatusCard } from '../../components/Card.jsx';
import { StatusPill } from '../../components/Pills.jsx';
import { Async, EmptyState } from '../../components/States.jsx';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const state = useApi('/faults', { interval: 5000 });

  const faults = state.data?.faults ?? [];
  const current = faults.find(isOpen);
  const recent = faults.filter((fault) => fault.id !== current?.id).slice(0, 3);

  return (
    <>
      <div className="flex flex-col gap-3.5">
        <div className="eyebrow">
          {greeting()}, {firstNames(user.name)}
        </div>
        <h1 className="display text-[26px]">
          {current ? 'Your fault is being handled' : 'Is your electricity not working?'}
        </h1>
      </div>

      <Async state={state} label="Loading your faults">
        {() => (
          <>
            {current ? (
              <CurrentFault fault={current} />
            ) : (
              <EmptyState title="No open fault">
                Nothing in progress. If your power is out or something is wrong at the meter, report
                it and we will send a technician.
              </EmptyState>
            )}

            <Link
              to="/customer/report"
              className="flex min-h-14 items-center justify-between rounded-card bg-ink px-5 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-yellow no-underline"
            >
              <span className="flex items-center gap-2.5">
                <Zap size={22} strokeWidth={1.75} aria-hidden="true" />
                Report a fault
              </span>
              <ArrowRight size={22} strokeWidth={1.75} aria-hidden="true" />
            </Link>

            <section className="flex flex-col gap-3.5" aria-label="Recent reports">
              <div className="eyebrow flex items-center justify-between pt-1.5">
                <span>Recent reports</span>
                <Link
                  to="/customer/reports"
                  className="relative text-ink underline after:absolute after:-inset-y-3 after:inset-x-0 after:content-['']"
                >
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="m-0 text-sm text-grey">No reports yet.</p>
              ) : (
                recent.map((fault) => (
                  <Link
                    key={fault.id}
                    to={`/customer/faults/${fault.id}`}
                    className="panel flex items-center justify-between gap-3 px-[18px] py-3.5 no-underline hover:bg-paper"
                  >
                    <div>
                      <div className="text-[11px] text-grey">#{fault.reference}</div>
                      <div className="heading-weight mt-0.5 text-[15px] uppercase">
                        {CATEGORY_LABEL[fault.category]}
                      </div>
                    </div>
                    <StatusPill status={fault.status} />
                  </Link>
                ))
              )}
            </section>
          </>
        )}
      </Async>
    </>
  );
}

function CurrentFault({ fault }) {
  return (
    <StatusCard
      eyebrow={`Current status · Fault #${fault.reference}`}
      title={CUSTOMER_HEADLINE[fault.status]}
      updated={`Last updated ${timeAgo(fault.updatedAt)}`}
    >
      <KeyRow label="Technician">{fault.technician?.name ?? 'Not assigned yet'}</KeyRow>
      <KeyRow label="Location" last>
        {locationLine(fault.serviceLocation)}
      </KeyRow>
      <div className="mt-4">
        <Stepper status={fault.status} />
      </div>
      <Link to={`/customer/faults/${fault.id}`} className="btn btn-ink mt-4 w-full">
        Track response
      </Link>
    </StatusCard>
  );
}
