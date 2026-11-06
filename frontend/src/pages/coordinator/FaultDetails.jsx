import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { fmtMetres } from '../../lib/distance.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  CATEGORY_LABEL,
  OUTCOME_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  coordinatesText,
  fmtDateTime,
  fmtMinutes,
  isOpen,
  locationLine,
  minutesBetween,
} from '../../lib/format.js';
import { CallLink, KeyRow, MapLegend, VerticalTimeline } from '../../components/Bits.jsx';
import MapView, { faultMapParts } from '../../components/MapView.jsx';
import { PriorityPill, StatusPill } from '../../components/Pills.jsx';
import { accuracyText, reporterName, reporterPhone } from '../../lib/guestReport.js';
import { Async, FormError } from '../../components/States.jsx';

export default function FaultDetails() {
  const { id } = useParams();
  const toast = useToast();
  const state = useApi(`/faults/${id}`, { interval: 4000 });
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState('');

  async function run(task, message) {
    setBusy(true);
    setActionError('');
    try {
      await task();
      await state.reload();
      toast(message);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  }

  return (
    <Async state={state} label="Loading fault">
      {({ fault }) => {
        const { markers, lines } = faultMapParts(fault);
        const location = fault.serviceLocation;
        const canAssign = ['REPORTED', 'ASSIGNED'].includes(fault.status);
        return (
          <>
            <Link
              to="/coordinator/faults"
              className="eyebrow -mb-4 flex items-center gap-2 self-start"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Fault management
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
              <div>
                <div className="eyebrow text-muted">Fault #{fault.reference} · Test report</div>
                <h1 className="display mt-1.5 text-[clamp(1.5rem,3.5vw,1.75rem)]">
                  {CATEGORY_LABEL[fault.category]}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill status={fault.status} audience="coordinator" />
                  <PriorityPill priority={fault.priority} withLabel />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {canAssign && (
                  <Link
                    to={`/coordinator/faults/${fault.id}/assign`}
                    className="btn btn-volt btn-lg"
                  >
                    {fault.technician ? 'Reassign technician' : 'Assign technician'}
                  </Link>
                )}
                {isOpen(fault) && (
                  <Link
                    to={`/coordinator/monitoring?fault=${fault.id}`}
                    className="btn btn-outline btn-lg"
                  >
                    View live location
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="flex flex-col gap-8">
                <section className="panel">
                  <MapView
                    markers={markers}
                    lines={lines}
                    className="h-[380px]"
                    ariaLabel={`Map showing the service location for fault ${fault.reference} and the assigned technician`}
                  />
                  <MapLegend
                    items={
                      fault.status === 'REPORTED'
                        ? ['unassigned']
                        : ['site', 'technician', 'onsite']
                    }
                  />
                </section>

                <section className="panel">
                  <h2 className="panel-head m-0">
                    {fault.isGuest
                      ? 'Guest reporter and location'
                      : 'Customer and service location'}
                  </h2>
                  <div className="px-4 py-1">
                    <KeyRow label="Customer">
                      {reporterName(fault)}
                      {fault.isGuest && <> · unverified, no account</>}
                    </KeyRow>
                    <KeyRow label="Phone" mono>
                      <CallLink phone={reporterPhone(fault)} />
                    </KeyRow>
                    <KeyRow label="Location">
                      {location.village ? `${location.village} village, ` : ''}
                      {locationLine(location)}
                    </KeyRow>
                    <KeyRow label="District">{location.district}</KeyRow>
                    <KeyRow
                      label={fault.isGuest ? 'Meter number (typed, not checked)' : 'Meter number'}
                      mono
                    >
                      {location.meterNumber ?? '—'}
                    </KeyRow>
                    <KeyRow label="Coordinates" mono>
                      {coordinatesText(location)}
                      {fault.isGuest &&
                        Number.isFinite(fault.accuracyM) &&
                        ` · ${accuracyText(fault.accuracyM)}`}
                    </KeyRow>
                    <KeyRow label="Landmark note" last>
                      {location.landmark || '—'}
                    </KeyRow>
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-8">
                <section className="panel">
                  <h2 className="panel-head m-0">Report</h2>
                  <div className="px-4 py-1">
                    <KeyRow label="Fault ID" mono>
                      #{fault.reference}
                    </KeyRow>
                    <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
                    <KeyRow label="Report time">{fmtDateTime(fault.reportedAt)}</KeyRow>
                    <KeyRow label="Current status">
                      <StatusPill status={fault.status} audience="coordinator" />
                    </KeyRow>
                    <KeyRow label="Priority">
                      <PriorityPill priority={fault.priority} />
                    </KeyRow>
                    <KeyRow label="Assigned technician" last>
                      {fault.technician
                        ? `${fault.technician.name} · ${fault.technician.staffNumber}`
                        : 'Not assigned'}
                    </KeyRow>
                  </div>
                  <div className="border-t border-line p-4">
                    <div className="eyebrow text-muted">Description</div>
                    <p className="mb-0 mt-1 text-sm">
                      {fault.description || 'The customer did not add a description.'}
                    </p>
                    {fault.photo && (
                      <img
                        src={fault.photo}
                        alt="Photo attached by the customer"
                        className="mt-3 max-h-64 w-full border border-line object-cover"
                      />
                    )}
                  </div>
                </section>

                <section className="panel">
                  <h2 className="panel-head m-0">Response timeline</h2>
                  <VerticalTimeline fault={fault} audience="coordinator" />
                </section>

                {fault.status === 'RESOLVED' && (
                  <section className="panel">
                    <h2 className="panel-head m-0 bg-ok text-white">Resolution</h2>
                    <div className="flex flex-col gap-2 p-4 text-sm">
                      <div className="text-base heading-weight">{OUTCOME_LABEL[fault.outcome]}</div>
                      <p className="m-0">{fault.resolutionNote}</p>
                      {fault.workCompleted && (
                        <p className="m-0">
                          <span className="font-bold">Work completed:</span> {fault.workCompleted}
                        </p>
                      )}
                    </div>
                  </section>
                )}

                <section className="panel">
                  <h2 className="panel-head m-0">Measured intervals</h2>
                  <div className="px-4 py-1">
                    <KeyRow label="Report to assignment" mono>
                      {fmtMinutes(minutesBetween(fault.reportedAt, fault.assignedAt))}
                    </KeyRow>
                    <KeyRow label="Location identification" mono>
                      {fmtMinutes(minutesBetween(fault.assignedAt, fault.onTheWayAt))}
                    </KeyRow>
                    <KeyRow label="Assignment to arrival" mono>
                      {fmtMinutes(minutesBetween(fault.assignedAt, fault.arrivedAt))}
                    </KeyRow>
                    <KeyRow label="On-site work" mono>
                      {fmtMinutes(minutesBetween(fault.arrivedAt, fault.resolvedAt))}
                    </KeyRow>
                    <KeyRow label="Arrival distance from the registered point" mono>
                      {fmtMetres(fault.arrivalDistanceM)}
                    </KeyRow>
                    <KeyRow label="Clarification contacts" mono last>
                      {fault.status === 'RESOLVED' ? fault.clarificationContacts : '—'}
                    </KeyRow>
                  </div>
                </section>

                {isOpen(fault) && (
                  <section className="panel">
                    <h2 className="panel-head m-0">Coordinator actions</h2>
                    <div className="flex flex-col gap-4 p-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="priority" className="eyebrow">
                          Change priority
                        </label>
                        <select
                          id="priority"
                          className="field"
                          value={fault.priority}
                          disabled={busy}
                          onChange={(event) =>
                            run(
                              () =>
                                api(`/faults/${fault.id}`, {
                                  method: 'PATCH',
                                  body: { priority: event.target.value },
                                }),
                              `Priority changed to ${PRIORITY_LABEL[event.target.value]}.`
                            )
                          }
                        >
                          {PRIORITIES.map((priority) => (
                            <option key={priority} value={priority}>
                              {PRIORITY_LABEL[priority]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <FormError>{actionError}</FormError>
                      {confirmCancel ? (
                        <div className="rounded-control border border-danger p-3">
                          <p className="m-0 text-sm font-semibold">
                            Cancel report #{fault.reference}? The customer will be notified.
                          </p>
                          <div className="mt-3 flex gap-3">
                            <button
                              type="button"
                              className="btn flex-1 border-danger bg-danger text-white"
                              disabled={busy}
                              onClick={() =>
                                run(
                                  () =>
                                    api(`/faults/${fault.id}/status`, {
                                      method: 'PATCH',
                                      body: {
                                        status: 'CANCELLED',
                                        note: 'Cancelled by coordinator',
                                      },
                                    }),
                                  'Report cancelled.'
                                )
                              }
                            >
                              Cancel report
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline flex-1"
                              disabled={busy}
                              onClick={() => setConfirmCancel(false)}
                            >
                              Keep report
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn self-start border-danger text-danger"
                          onClick={() => setConfirmCancel(true)}
                        >
                          Cancel report
                        </button>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </>
        );
      }}
    </Async>
  );
}
