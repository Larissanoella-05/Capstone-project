import { Phone } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import {
  CATEGORY_LABEL,
  CUSTOMER_HEADLINE,
  OUTCOME_LABEL,
  STATUS_LABEL,
  firstNames,
  fmtDateTime,
  fmtKm,
  locationLine,
  timeAgo,
} from '../../lib/format.js';
import { Cell, Timeline } from '../../components/Bits.jsx';
import MapView, { faultMapParts } from '../../components/MapView.jsx';
import { Async } from '../../components/States.jsx';

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
        return (
          <>
            <div className="border-b border-ink pb-4">
              <div className="eyebrow text-muted">
                Fault #{fault.reference} · {CATEGORY_LABEL[fault.category]}
              </div>
              <h1 className="display mt-2 text-3xl">{CUSTOMER_HEADLINE[fault.status]}</h1>
            </div>

            <div className="grid gap-5 lg:grid-cols-5 lg:items-start lg:gap-6">
              <div className="flex min-w-0 flex-col gap-5 lg:col-span-3">
                <section className="panel">
                  <MapView
                    markers={markers}
                    lines={lines}
                    className="h-64 md:h-96 lg:h-[30rem]"
                    ariaLabel="Map showing your service location, the technician and the link between them"
                  />
                  <div className="grid grid-cols-2 border-t border-ink">
                    <Cell label="Technician">{technician?.name ?? 'Not assigned yet'}</Cell>
                    <Cell label="Status" className="border-l border-ink">
                      {STATUS_LABEL[fault.status]}
                    </Cell>
                    <Cell label="Distance" className="border-t border-ink">
                      {enRoute || fault.status === 'ASSIGNED'
                        ? fmtKm(technician?.distanceKm)
                        : fault.status === 'ARRIVED' || fault.status === 'WORKING'
                          ? 'On site'
                          : '—'}
                    </Cell>
                    <Cell label="Last updated" className="border-l border-t border-ink">
                      {timeAgo(fault.updatedAt)}
                    </Cell>
                  </div>
                  {technician?.phone &&
                    fault.status !== 'RESOLVED' &&
                    fault.status !== 'CANCELLED' && (
                      <div className="border-t border-ink p-3">
                        <a
                          href={`tel:${technician.phone.replace(/\s/g, '')}`}
                          className="btn btn-outline w-full"
                        >
                          <Phone size={16} aria-hidden="true" />
                          Call {firstNames(technician.name)}
                        </a>
                      </div>
                    )}
                </section>
              </div>

              <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
                <section className="panel">
                  <div className="panel-head">Response timeline</div>
                  <Timeline fault={fault} audience="customer" />
                </section>

                {fault.status === 'RESOLVED' && (
                  <section className="panel">
                    <div className="panel-head bg-ok text-white">Resolution</div>
                    <div className="flex flex-col gap-2 p-4">
                      <div className="text-base font-black uppercase">
                        {OUTCOME_LABEL[fault.outcome] ?? 'Resolved'}
                      </div>
                      <p className="m-0 text-sm">{fault.resolutionNote}</p>
                      <div className="font-mono text-xs text-muted">
                        Completed {fmtDateTime(fault.resolvedAt)}
                      </div>
                    </div>
                  </section>
                )}

                <section className="panel">
                  <div className="panel-head">Your report</div>
                  <div className="flex flex-col gap-3 p-4 text-sm">
                    <div>
                      <div className="eyebrow text-muted">Service location</div>
                      <div className="mt-1 font-semibold">
                        {locationLine(fault.serviceLocation)} · Meter{' '}
                        {fault.serviceLocation.meterNumber}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow text-muted">Reported</div>
                      <div className="mt-1 font-semibold">{fmtDateTime(fault.reportedAt)}</div>
                    </div>
                    <div>
                      <div className="eyebrow text-muted">Description</div>
                      <div className="mt-1">{fault.description || 'No description given.'}</div>
                    </div>
                    {fault.photo && (
                      <img
                        src={fault.photo}
                        alt="Photo attached to the report"
                        className="max-h-64 w-full border border-line object-cover"
                      />
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        );
      }}
    </Async>
  );
}
