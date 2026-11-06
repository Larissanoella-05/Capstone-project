import { useState } from 'react';
import { Check, LocateFixed, Navigation, Phone, Route } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  CATEGORY_LABEL,
  OUTCOME_LABEL,
  STAGES,
  STATUS_LABEL,
  STATUS_TIME_FIELD,
  coordinatesText,
  fmtDateTime,
  fmtKm,
  fmtTime,
  locationLine,
} from '../../lib/format.js';
import { Stepper } from '../../components/Bits.jsx';
import MapView, { faultMapParts } from '../../components/MapView.jsx';
import { PriorityPill, StatusPill } from '../../components/Pills.jsx';
import { reporterName, reporterPhone } from '../../lib/guestReport.js';
import { Async, FormError } from '../../components/States.jsx';

// What the main button does at each stage.
const NEXT_ACTION = {
  ASSIGNED: {
    status: 'ON_THE_WAY',
    label: 'Start: on my way',
    done: 'Status updated: On the Way.',
  },
  ON_THE_WAY: { status: 'ARRIVED', label: 'I have arrived', done: 'Status updated: Arrived.' },
  ARRIVED: { status: 'WORKING', label: 'Start work', done: 'Status updated: Working.' },
};

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const state = useApi(`/faults/${id}`, { interval: 5000 });
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');

  async function run(key, task, successMessage) {
    setBusy(key);
    setActionError('');
    try {
      await task();
      await state.reload();
      if (successMessage) toast(successMessage);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <Async state={state} label="Loading job">
      {({ fault }) => {
        const location = fault.serviceLocation;
        const position = fault.technician?.location;
        const { markers, lines } = faultMapParts(fault);
        const next = NEXT_ACTION[fault.status];
        const stageIndex = STAGES.indexOf(fault.status);
        const canMove = ['ASSIGNED', 'ON_THE_WAY'].includes(fault.status);
        const customerPhone = reporterPhone(fault);

        const advance = () =>
          run(
            'status',
            () =>
              api(`/faults/${fault.id}/status`, { method: 'PATCH', body: { status: next.status } }),
            next.done
          );

        // Prototype stand-in for live GPS: step the stored position 30% closer to the service location.
        const moveCloser = () =>
          run(
            'move',
            () => {
              const from = position ?? {
                latitude: location.latitude + 0.012,
                longitude: location.longitude - 0.01,
              };
              return api('/technicians/me/location', {
                method: 'POST',
                body: {
                  latitude: from.latitude + (location.latitude - from.latitude) * 0.3,
                  longitude: from.longitude + (location.longitude - from.longitude) * 0.3,
                  faultId: fault.id,
                  label: `On the way to ${location.cell}`,
                },
              });
            },
            'Location updated.'
          );

        const useDeviceLocation = () => {
          if (!navigator.geolocation) {
            setActionError('This device does not share its location.');
            return;
          }
          setBusy('gps');
          setActionError('');
          navigator.geolocation.getCurrentPosition(
            (result) =>
              run(
                'gps',
                () =>
                  api('/technicians/me/location', {
                    method: 'POST',
                    body: {
                      latitude: result.coords.latitude,
                      longitude: result.coords.longitude,
                      faultId: fault.id,
                      label: 'Device location',
                    },
                  }),
                'Location updated from this device.'
              ),
            () => {
              setBusy('');
              setActionError(
                'Location permission was refused. Use “Move closer” to simulate movement instead.'
              );
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        };

        return (
          <>
            <div className="flex flex-col gap-3">
              <div className="eyebrow text-muted">
                Fault #{fault.reference} · Reported {fmtTime(fault.reportedAt)}
              </div>
              <h1 className="display mt-1.5 text-[26px]">{CATEGORY_LABEL[fault.category]}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <PriorityPill priority={fault.priority} withLabel />
                <StatusPill status={fault.status} />
              </div>
              <Stepper status={fault.status} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
              <div className="flex min-w-0 flex-col gap-5">
                <section className="panel">
                  <MapView
                    markers={markers}
                    lines={lines}
                    className="h-60 md:h-80"
                    ariaLabel={`Map showing the service location for fault ${fault.reference} and your position`}
                  />
                  <div className="border-t border-line p-4">
                    <div className="eyebrow text-muted">Service location</div>
                    <div className="mt-1 text-lg heading-weight">{locationLine(location)}</div>
                    <div className="mt-1 text-sm">
                      {[location.village && `${location.village} village`, location.landmark]
                        .filter(Boolean)
                        .join('. ')}
                    </div>
                    <div className="mt-2 font-mono text-xs">
                      {coordinatesText(location)}
                      {canMove && fault.technician?.distanceKm !== null
                        ? ` · ${fmtKm(fault.technician.distanceKm)} away`
                        : ''}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-line p-3">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ink"
                    >
                      <Navigation size={16} aria-hidden="true" />
                      Navigate
                    </a>
                    {customerPhone ? (
                      <a
                        href={`tel:${customerPhone.replace(/\s/g, '')}`}
                        className="btn btn-outline"
                      >
                        <Phone size={16} aria-hidden="true" />
                        Call customer
                      </a>
                    ) : (
                      <span />
                    )}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">Response status</div>
                  <ol className="m-0 list-none p-0">
                    {STAGES.slice(1).map((stage, index) => {
                      const step = index + 1;
                      const time = fault[STATUS_TIME_FIELD[stage]];
                      const done = step < stageIndex || fault.status === 'RESOLVED';
                      const active = step === stageIndex && fault.status !== 'RESOLVED';
                      return (
                        <li
                          key={stage}
                          aria-current={active ? 'step' : undefined}
                          className={`flex items-center gap-3 px-4 py-3 ${index > 0 ? 'border-t border-line' : ''} ${active ? 'bg-tint' : ''}`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${done ? 'border-accent bg-accent' : active ? 'border-accent bg-white' : 'border-line'}`}
                          >
                            {done && (
                              <Check size={14} strokeWidth={3} color="#FFFFFF" aria-hidden="true" />
                            )}
                            {active && <span className="h-2 w-2 rounded-full bg-accent" />}
                          </span>
                          <span
                            className={`flex-1 text-sm ${done || active ? 'font-bold' : 'text-muted'}`}
                          >
                            {STATUS_LABEL[stage]}
                          </span>
                          <span className="font-mono text-xs">
                            {active ? `Now · ${fmtTime(time)}` : fmtTime(time)}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>

                {canMove && (
                  <section className="panel">
                    <div className="panel-head">
                      <span>My location</span>
                      <span className="text-muted">Prototype</span>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                      <p className="m-0 text-sm">
                        {position
                          ? `Last position: ${position.label ?? 'recorded'} at ${fmtTime(position.recordedAt)}. The customer and the coordinator see it on their maps.`
                          : 'No position recorded yet.'}
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={Boolean(busy)}
                          onClick={moveCloser}
                        >
                          <Route size={16} aria-hidden="true" />
                          {busy === 'move' ? 'Moving…' : 'Move closer'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={Boolean(busy)}
                          onClick={useDeviceLocation}
                        >
                          <LocateFixed size={16} aria-hidden="true" />
                          {busy === 'gps' ? 'Locating…' : 'Use device location'}
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                {fault.status === 'RESOLVED' && (
                  <section className="panel">
                    <div className="panel-head bg-ok text-white">Resolution recorded</div>
                    <div className="flex flex-col gap-2 p-4 text-sm">
                      <div className="text-base heading-weight">{OUTCOME_LABEL[fault.outcome]}</div>
                      <p className="m-0">{fault.resolutionNote}</p>
                      {fault.workCompleted && (
                        <p className="m-0">
                          <span className="font-bold">Work completed:</span> {fault.workCompleted}
                        </p>
                      )}
                      <div className="font-mono text-xs text-muted">
                        Completed {fmtDateTime(fault.resolvedAt)}
                      </div>
                    </div>
                  </section>
                )}

                <section className="panel">
                  <div className="panel-head">Description</div>
                  <div className="flex flex-col gap-3 p-4 text-sm">
                    <p className="m-0">
                      {fault.description || 'The customer did not add a description.'}
                    </p>
                    {fault.photo && (
                      <img
                        src={fault.photo}
                        alt="Photo attached by the customer"
                        className="max-h-64 w-full border border-line object-cover"
                      />
                    )}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">Customer</div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <div className="text-base font-bold">{reporterName(fault)}</div>
                      {location.meterNumber && (
                        <div className="font-mono text-xs">Meter {location.meterNumber}</div>
                      )}
                    </div>
                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone.replace(/\s/g, '')}`}
                        className="btn btn-outline"
                      >
                        <Phone size={16} aria-hidden="true" />
                        Call
                      </a>
                    )}
                  </div>
                </section>

                <Link to="/technician/jobs" className="btn btn-outline">
                  Back to my jobs
                </Link>
              </div>
            </div>

            {(next || fault.status === 'WORKING') && (
              <div className="sticky-bar flex flex-col gap-3">
                <FormError>{actionError}</FormError>
                {next ? (
                  <button
                    type="button"
                    className="btn btn-volt btn-lg w-full lg:w-auto lg:self-end lg:px-12"
                    disabled={Boolean(busy)}
                    onClick={advance}
                  >
                    {busy === 'status' ? 'Updating…' : next.label}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-volt btn-lg w-full lg:w-auto lg:self-end lg:px-12"
                    onClick={() => navigate(`/technician/jobs/${fault.id}/resolve`)}
                  >
                    Record resolution
                  </button>
                )}
              </div>
            )}
          </>
        );
      }}
    </Async>
  );
}
