import { Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, STAGES, STATUS_LABEL, fmtTime, locationLine } from '../../lib/format.js';
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
            <div className="eyebrow mt-4 text-muted">Confirmation</div>
            <h1 className="display mt-2 text-3xl">Fault report submitted</h1>
          </div>

          <section className="panel px-4 py-1">
            <KeyRow label="Report ID" mono>{fault.reference}</KeyRow>
            <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
            <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
            <KeyRow label="Reported">{fmtTime(fault.reportedAt)}</KeyRow>
            <KeyRow label="Status" last>{STATUS_LABEL[fault.status]}</KeyRow>
          </section>

          <p className="m-0 border border-ink bg-paper p-4 text-sm">
            A service coordinator will now assign a technician. The technician is sent to your registered service
            location, so you do not need to call to give directions.
          </p>

          <section className="panel">
            <div className="panel-head">What happens next</div>
            <ol className="m-0 grid list-none grid-cols-2 gap-px bg-line p-0 sm:grid-cols-3">
              {STAGES.map((stage, index) => (
                <li key={stage} className={`p-3 ${stage === fault.status ? 'bg-volt' : 'bg-white'}`}>
                  <div className="font-mono text-[11px] text-muted">{String(index + 1).padStart(2, '0')}</div>
                  <div className="mt-1 text-sm font-bold">{STATUS_LABEL[stage]}</div>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-3">
            <Link to={`/customer/faults/${fault.id}`} className="btn btn-volt btn-lg">
              View Fault
            </Link>
            <Link to="/customer" className="btn btn-outline">
              Back to dashboard
            </Link>
          </div>
        </>
      )}
    </Async>
  );
}
