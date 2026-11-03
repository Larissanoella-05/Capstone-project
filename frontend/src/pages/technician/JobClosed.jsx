import { Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, OUTCOME_LABEL, fmtTime, locationLine } from '../../lib/format.js';
import { KeyRow } from '../../components/Bits.jsx';
import { Card } from '../../components/Card.jsx';
import { Async } from '../../components/States.jsx';

/** Shown after a technician resolves a job. */
export default function JobClosed() {
  const { id } = useParams();
  const state = useApi(`/faults/${id}`);

  return (
    <Async state={state} label="Loading job">
      {({ fault }) => (
        <>
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-card bg-accent text-on-accent">
              <Check size={34} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div>
              <h1 className="display text-[26px]">Job closed</h1>
              <p className="mb-0 mt-1.5 text-sm text-grey">
                Fault marked as resolved. The customer has been notified.
              </p>
            </div>
          </div>

          <Card className="px-[18px] pb-2.5 pt-1.5">
            <KeyRow label="Fault ID" mono>
              {fault.reference}
            </KeyRow>
            <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
            <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
            <KeyRow label="Outcome">{OUTCOME_LABEL[fault.outcome] ?? 'Resolved'}</KeyRow>
            <KeyRow label="Completed" last>
              {fmtTime(fault.resolvedAt)}
            </KeyRow>
          </Card>

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Link to="/technician" className="btn btn-accent sm:px-10">
              Back to home
            </Link>
            <Link to="/technician/jobs" className="btn btn-outline sm:px-10">
              My jobs
            </Link>
          </div>
        </>
      )}
    </Async>
  );
}
