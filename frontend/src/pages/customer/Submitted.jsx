import { Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, STATUS_LABEL, fmtTime, locationLine } from '../../lib/format.js';
import { KeyRow } from '../../components/Bits.jsx';
import { Async } from '../../components/States.jsx';

export default function Submitted() {
  const { id } = useParams();
  const state = useApi(`/faults/${id}`);

  return (
    <Async state={state} label="Loading your report">
      {({ fault }) => (
        <>
          <div className="border-b border-ink pb-4">
            <div className="flex h-12 w-12 items-center justify-center bg-ok">
              <Check size={26} strokeWidth={3} color="#FFFFFF" aria-hidden="true" />
            </div>
            <div className="eyebrow mt-4 text-muted">Report sent</div>
            <h1 className="display mt-2 text-3xl">Report {fault.reference} sent</h1>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
            <div className="flex flex-col gap-5">
              <section className="panel px-4 py-1">
                <KeyRow label="Report ID" mono>
                  {fault.reference}
                </KeyRow>
                <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
                <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
                <KeyRow label="Reported">{fmtTime(fault.reportedAt)}</KeyRow>
                <KeyRow label="Status" last>
                  {STATUS_LABEL[fault.status]}
                </KeyRow>
              </section>

              <p className="m-0 border border-ink bg-paper p-4 text-sm">
                A service coordinator will now assign a technician. The technician is sent to your
                registered service location, so you do not need to call to give directions.
              </p>
            </div>

            <section className="panel">
              <div className="panel-head">What happens next</div>
              <ol className="m-0 list-none p-0 text-sm">
                {[
                  'A coordinator assigns a technician to your report.',
                  'You get an alert when the technician is on the way.',
                  'Follow the technician on the map until the fault is fixed.',
                ].map((step, index) => (
                  <li
                    key={step}
                    className={`flex gap-3 p-3 ${index > 0 ? 'border-t border-line' : ''}`}
                  >
                    <span className="font-mono text-xs leading-5 text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={`/customer/faults/${fault.id}`} className="btn btn-volt btn-lg sm:px-10">
              View Fault
            </Link>
            <Link to="/customer" className="btn btn-outline sm:h-14 sm:px-8">
              Back to dashboard
            </Link>
          </div>
        </>
      )}
    </Async>
  );
}
