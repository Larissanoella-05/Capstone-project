import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, fmtTime, locationLine } from '../../lib/format.js';
import { KeyRow, PageHeading, VerticalTimeline } from '../../components/Bits.jsx';
import { Card } from '../../components/Card.jsx';
import { StatusPill } from '../../components/Pills.jsx';
import { Async } from '../../components/States.jsx';

export default function Submitted() {
  const { id } = useParams();
  const state = useApi(`/faults/${id}`);

  return (
    <Async state={state} label="Loading your report">
      {({ fault }) => (
        <>
          <PageHeading eyebrow="Confirmation" title="Fault report submitted" />

          <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-6">
            <div className="flex flex-col gap-3.5">
              <Card className="px-[18px] pb-2.5 pt-1.5">
                <KeyRow label="Report ID" mono>
                  {fault.reference}
                </KeyRow>
                <KeyRow label="Category" mono>
                  {CATEGORY_LABEL[fault.category]}
                </KeyRow>
                <KeyRow label="Location" mono>
                  {locationLine(fault.serviceLocation)}
                </KeyRow>
                <KeyRow label="Reported" mono>
                  {fmtTime(fault.reportedAt)}
                </KeyRow>
                <KeyRow label="Status" last>
                  <StatusPill status={fault.status} />
                </KeyRow>
              </Card>

              <p className="m-0 rounded-card bg-yellow px-[18px] py-4 text-xs font-medium">
                A service coordinator will now assign a technician. The technician is sent to your
                registered service location, so you do not need to call to give directions.
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="eyebrow">What happens next</div>
              <Card className="p-[18px]">
                <VerticalTimeline fault={fault} plain />
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Link to="/customer" className="btn btn-ink sm:px-10">
              Back to dashboard
            </Link>
            <Link to="/customer/reports" className="btn btn-outline sm:px-10">
              View fault reports
            </Link>
          </div>
        </>
      )}
    </Async>
  );
}
