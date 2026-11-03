import { Phone } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import {
  CATEGORY_LABEL,
  CUSTOMER_HEADLINE,
  OUTCOME_LABEL,
  firstNames,
  fmtDateTime,
  fmtKm,
  locationLine,
  timeAgo,
} from '../../lib/format.js';
import { VerticalTimeline } from '../../components/Bits.jsx';
import { Card } from '../../components/Card.jsx';
import MapView, { faultMapParts } from '../../components/MapView.jsx';
import { Async } from '../../components/States.jsx';
import { checkedLabel, nextStepFor } from '../../lib/progress.js';

const BANNER_STYLE = {
  RESOLVED: 'bg-green text-white',
  CANCELLED: 'border border-red bg-white text-red',
};

export default function Tracking() {
  const { id } = useParams();
  // Polling keeps the status, the technician position and the timeline current.
  const state = useApi(`/faults/${id}`, { interval: 4000 });

  return (
    <Async state={state} label="Loading fault">
      {({ fault }) => {
        const { markers, lines } = faultMapParts(fault);
        const technician = fault.technician;
        const enRoute = fault.status === 'ON_THE_WAY';
        const canCall =
          technician?.phone && fault.status !== 'RESOLVED' && fault.status !== 'CANCELLED';
        return (
          <>
            <div className="eyebrow">
              Fault #{fault.reference} · {CATEGORY_LABEL[fault.category]}
            </div>
            <div
              className={`flex flex-col gap-1.5 rounded-card px-5 py-[18px] ${BANNER_STYLE[fault.status] ?? 'bg-yellow text-ink'}`}
            >
              <h1 className="display text-[26px] leading-none">
                {CUSTOMER_HEADLINE[fault.status]}
              </h1>
              <div className="text-xs">Last updated {timeAgo(fault.updatedAt)}</div>
            </div>
            <div>
              <p className="m-0 text-xs">{nextStepFor(fault.status)}</p>
              <p className="mb-0 mt-1 text-[11px] text-grey">{checkedLabel(state.fetchedAt)}</p>
            </div>

            <div className="grid gap-3.5 lg:grid-cols-5 lg:items-start lg:gap-6">
              <div className="flex min-w-0 flex-col gap-3.5 lg:col-span-3">
                <Card className="flex items-center justify-between gap-3 px-[18px] py-3.5">
                  <div>
                    <div className="eyebrow">Technician</div>
                    <div className="heading-weight mt-0.5 text-base uppercase">
                      {technician?.name ?? 'Not assigned yet'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="eyebrow">Distance</div>
                    <div className="heading-weight mt-0.5 text-base uppercase">
                      {enRoute || fault.status === 'ASSIGNED'
                        ? fmtKm(technician?.distanceKm)
                        : fault.status === 'ARRIVED' || fault.status === 'WORKING'
                          ? 'On site'
                          : '—'}
                    </div>
                  </div>
                </Card>

                <div className="overflow-hidden rounded-card">
                  <MapView
                    markers={markers}
                    lines={lines}
                    className="h-[170px] md:h-96 lg:h-[30rem]"
                    ariaLabel="Map showing your service location, the technician and the link between them"
                  />
                </div>
                <div className="eyebrow flex justify-between">
                  <span>{technician?.name ?? ''}</span>
                  <span>Your location</span>
                </div>

                {canCall && (
                  <a
                    href={`tel:${technician.phone.replace(/\s/g, '')}`}
                    className="btn btn-ink w-full"
                  >
                    <Phone size={18} aria-hidden="true" />
                    Call {firstNames(technician.name)}
                  </a>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-3.5 lg:col-span-2">
                <div className="eyebrow">Response timeline</div>
                <Card className="p-[18px]">
                  <VerticalTimeline fault={fault} audience="customer" />
                </Card>

                {fault.status === 'RESOLVED' && (
                  <Card>
                    <div className="panel-head bg-green text-white">Resolution</div>
                    <div className="flex flex-col gap-2 p-[18px]">
                      <div className="heading-weight text-base uppercase">
                        {OUTCOME_LABEL[fault.outcome] ?? 'Resolved'}
                      </div>
                      <p className="m-0 text-sm">{fault.resolutionNote}</p>
                      <div className="text-xs text-grey">
                        Completed {fmtDateTime(fault.resolvedAt)}
                      </div>
                    </div>
                  </Card>
                )}

                <Card>
                  <div className="panel-head">Your report</div>
                  <div className="flex flex-col gap-3 p-[18px] text-sm">
                    <div>
                      <div className="eyebrow">Service location</div>
                      <div className="mt-1 font-semibold">
                        {locationLine(fault.serviceLocation)} · Meter{' '}
                        {fault.serviceLocation.meterNumber}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow">Reported</div>
                      <div className="mt-1 font-semibold">{fmtDateTime(fault.reportedAt)}</div>
                    </div>
                    <div>
                      <div className="eyebrow">Description</div>
                      <div className="mt-1">{fault.description || 'No description given.'}</div>
                    </div>
                    {fault.photo && (
                      <img
                        src={fault.photo}
                        alt="Photo attached to the report"
                        className="max-h-64 w-full rounded-control border border-line object-cover"
                      />
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        );
      }}
    </Async>
  );
}
