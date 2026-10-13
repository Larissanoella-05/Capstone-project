import { Zap } from 'lucide-react';
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
import { KeyRow, StageBar } from '../../components/Bits.jsx';
import MapView, { faultMapParts } from '../../components/MapView.jsx';
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
      <div className="flex flex-col gap-3 border-b border-ink pb-4">
        <div className="eyebrow text-muted">
          {greeting()}, {firstNames(user.name)}
        </div>
        <h1 className="display text-3xl">
          {current ? 'Your fault is being handled' : 'Is your electricity not working?'}
        </h1>
        <Link to="/customer/report" className="btn btn-volt btn-lg self-start">
          <Zap size={16} aria-hidden="true" />
          Report a Fault
        </Link>
      </div>

      <Async state={state} label="Loading your faults">
        {() => (
          <>
            {current ? (
              <CurrentFault fault={current} />
            ) : (
              <EmptyState title="No open fault">
                You have no fault in progress. If your power, voltage, connection or meter has a problem, report it
                and a technician will be sent to your registered service location.
              </EmptyState>
            )}

            <section className="panel">
              <div className="panel-head">
                <span>Recent reports</span>
                <Link to="/customer/reports">View all</Link>
              </div>
              {recent.length === 0 ? (
                <p className="m-0 p-4 text-sm text-muted">Your earlier reports will be listed here.</p>
              ) : (
                recent.map((fault, index) => (
                  <Link
                    key={fault.id}
                    to={`/customer/faults/${fault.id}`}
                    className={`flex items-center justify-between gap-3 px-4 py-3.5 no-underline hover:bg-paper ${
                      index > 0 ? 'border-t border-line' : ''
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs">#{fault.reference}</div>
                      <div className="mt-0.5 text-base font-black uppercase">{CATEGORY_LABEL[fault.category]}</div>
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
  const { markers, lines } = faultMapParts(fault);
  return (
    <section className="panel" aria-label={`Current fault ${fault.reference}`}>
      <div className="border-b border-ink bg-volt p-5">
        <div className="eyebrow">Current status · Fault #{fault.reference}</div>
        <div className="display mt-2 text-[34px]">{CUSTOMER_HEADLINE[fault.status]}</div>
        <div className="mt-3 font-mono text-xs">Last updated {timeAgo(fault.updatedAt)}</div>
      </div>
      <div className="flex flex-col px-5 pb-5 pt-2">
        <KeyRow label="Report ID" mono>#{fault.reference}</KeyRow>
        <KeyRow label="Fault category">{CATEGORY_LABEL[fault.category]}</KeyRow>
        <KeyRow label="Technician">{fault.technician?.name ?? 'Not assigned yet'}</KeyRow>
        <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
        <div className="mt-4">
          <StageBar status={fault.status} />
        </div>
        <Link to={`/customer/faults/${fault.id}`} className="btn btn-ink mt-4">
          Track response
        </Link>
      </div>
      <div className="border-t border-ink">
        <MapView
          markers={markers}
          lines={lines}
          interactive={false}
          className="h-48"
          ariaLabel="Map preview of your service location and the technician"
        />
      </div>
    </section>
  );
}
