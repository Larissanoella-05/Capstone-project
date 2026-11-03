import { Phone, Zap } from 'lucide-react';
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
import { FaultIcon, KeyRow, Stepper } from '../../components/Bits.jsx';
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
      <div className="flex flex-col gap-1.5">
        <div className="text-sm text-grey">
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

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/customer/report"
                className="flex min-h-28 flex-col justify-between rounded-card bg-accent p-4 text-on-accent no-underline shadow-sm"
              >
                <Zap size={26} strokeWidth={1.75} aria-hidden="true" />
                <span className="heading-weight text-base">Report a fault</span>
              </Link>
              <a
                href="tel:2727"
                className="flex min-h-28 flex-col justify-between rounded-card border border-line bg-white p-4 text-ink no-underline shadow-sm"
              >
                <Phone size={26} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
                <span>
                  <span className="heading-weight block text-base">Real emergency?</span>
                  <span className="block text-xs text-grey">Call 2727</span>
                </span>
              </a>
            </div>

            <section className="flex flex-col gap-3" aria-label="Recent reports">
              <div className="flex items-center justify-between pt-1.5">
                <h2 className="heading-weight m-0 text-base">Recent reports</h2>
                <Link
                  to="/customer/reports"
                  className="relative text-sm font-semibold text-accent after:absolute after:-inset-y-3 after:inset-x-0 after:content-['']"
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
                    className="panel flex items-center gap-3 px-4 py-3 no-underline hover:bg-paper"
                  >
                    <FaultIcon category={fault.category} />
                    <div className="min-w-0 flex-1">
                      <div className="heading-weight text-[15px]">
                        {CATEGORY_LABEL[fault.category]}
                      </div>
                      <div className="text-[11px] text-grey">
                        #{fault.reference} · {timeAgo(fault.reportedAt)}
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
        Track live
      </Link>
    </StatusCard>
  );
}
