import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { fmtDate } from '../../lib/format.js';
import { placeLabel } from '../../lib/guestReport.js';
import { isLate, waitingMinutes, waitingText, workQueue } from '../../lib/workQueue.js';
import { MapLegend } from '../../components/Bits.jsx';
import { CoordinatorHeading } from '../../components/CoordinatorShell.jsx';
import MapView, { faultMarker } from '../../components/MapView.jsx';
import { PriorityPill, StatusPill } from '../../components/Pills.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/States.jsx';

function Tile({ label, value, note, unit, highlight = false }) {
  return (
    <div
      className={`panel flex min-h-[120px] flex-col justify-between p-4 ${highlight ? 'border-accent bg-accent text-on-accent' : ''}`}
    >
      <div className={`eyebrow ${highlight ? 'text-on-accent/85' : ''}`}>{label}</div>
      <div>
        <div className="text-4xl heading-weight leading-none">
          {value}
          {unit && <span className="ml-1 text-base font-bold">{unit}</span>}
        </div>
        {note && (
          <div className={`mt-1 text-xs ${highlight ? 'text-on-accent/85' : 'text-muted'}`}>
            {note}
          </div>
        )}
      </div>
    </div>
  );
}

function WaitingCell({ minutes }) {
  if (minutes === null) return <td className="px-3 py-3 text-muted">—</td>;
  return (
    <td
      className={`relative whitespace-nowrap px-3 py-3 font-mono text-xs ${isLate(minutes) ? 'font-bold text-accent' : ''}`}
    >
      {waitingText(minutes)}
      {isLate(minutes) && <span className="sr-only"> (late)</span>}
    </td>
  );
}

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const overview = useApi('/stats/overview', { interval: 5000 });
  const faults = useApi('/faults?status=OPEN', { interval: 5000 });
  const technicians = useApi('/technicians', { interval: 5000 });
  const [selectedId, setSelectedId] = useState(null);

  // The waiting times move on even when the data has not changed.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const open = useMemo(() => workQueue([...(faults.data?.faults ?? [])]), [faults.data]);
  const stats = overview.data?.overview;

  const markers = useMemo(() => {
    const faultMarkers = open.map((fault) => faultMarker(fault, () => setSelectedId(fault.id)));
    const technicianMarkers = (technicians.data?.technicians ?? [])
      .filter((technician) => technician.location && technician.onDuty)
      .map((technician) => ({
        id: `tech-${technician.id}`,
        lat: technician.location.latitude,
        lng: technician.location.longitude,
        kind: technician.activeJobs.some((job) => ['ARRIVED', 'WORKING'].includes(job.status))
          ? 'onsite'
          : 'technician',
        label: technician.name,
      }));
    return [...faultMarkers, ...technicianMarkers];
  }, [open, technicians.data]);

  const firstError = overview.error || faults.error;

  return (
    <>
      <CoordinatorHeading eyebrow={`Ndera Sector · ${fmtDate()}`} title="Response overview" />

      {firstError ? (
        <ErrorState
          error={firstError}
          onRetry={() => {
            overview.reload();
            faults.reload();
          }}
        />
      ) : !stats || !faults.data ? (
        <Loading label="Loading the response overview" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
            <Tile label="Open faults" value={stats.openFaults} note="Total active" />
            <Tile
              label="Unassigned faults"
              value={stats.reported}
              note="Reported, need a technician"
              highlight={stats.reported > 0}
            />
            <Tile label="Assigned" value={stats.assigned} note="Technician not yet moving" />
            <Tile
              label="Technicians on the way"
              value={stats.onTheWay}
              note={`${stats.onSite} on site`}
            />
            <Tile
              label="Resolved today"
              value={stats.resolvedToday}
              note={`${stats.resolved} in total`}
            />
            <Tile
              label="Technicians available"
              value={stats.techniciansAvailable}
              note={`of ${stats.techniciansOnDuty} on duty`}
            />
            <Tile
              label="Average response time"
              value={stats.averageResponseMinutes ?? '—'}
              unit={stats.averageResponseMinutes !== null ? 'min' : undefined}
              note="Report to arrival"
            />
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <section className="panel min-w-0">
              <div className="panel-head">
                <span>Live response map</span>
                <Link to="/coordinator/monitoring">Open monitoring</Link>
              </div>
              <MapView
                markers={markers}
                selectedId={selectedId ? `fault-${selectedId}` : null}
                className="h-[420px]"
                ariaLabel={`Map of Ndera Sector with ${open.length} open faults and the technicians on duty`}
              />
              <MapLegend items={['unassigned', 'site', 'onsite', 'technician']} />
            </section>

            <section className="panel min-w-0 self-start">
              <div className="panel-head">
                <h2 className="m-0 text-sm">Open faults · {open.length}</h2>
                <Link to="/coordinator/faults">Manage all</Link>
              </div>
              {open.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No open faults">
                    Every reported fault has been resolved.
                  </EmptyState>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="eyebrow bg-paper">
                        {['Fault', 'Location', 'Priority', 'Status', 'Waiting', 'Technician'].map(
                          (heading) => (
                            <th
                              key={heading}
                              scope="col"
                              className="border-b border-line px-3 py-2.5 font-medium"
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {open.map((fault) => (
                        <tr
                          key={fault.id}
                          tabIndex={0}
                          aria-selected={selectedId === fault.id}
                          onClick={() => setSelectedId(fault.id)}
                          onDoubleClick={() => navigate(`/coordinator/faults/${fault.id}`)}
                          onKeyDown={(event) =>
                            event.key === 'Enter' && navigate(`/coordinator/faults/${fault.id}`)
                          }
                          className={`cursor-pointer border-b border-line last:border-b-0 ${selectedId === fault.id ? 'bg-volt-soft' : 'hover:bg-paper'}`}
                        >
                          <td className="px-3 py-3 font-mono text-xs font-medium">
                            <Link
                              to={`/coordinator/faults/${fault.id}`}
                              className="inline-flex min-h-11 items-center underline underline-offset-2"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {fault.reference}
                            </Link>
                          </td>
                          <td className="px-3 py-3 font-semibold">
                            {placeLabel(fault.serviceLocation)}
                          </td>
                          <td className="px-3 py-3">
                            <PriorityPill priority={fault.priority} />
                          </td>
                          <td className="px-3 py-3">
                            <StatusPill status={fault.status} audience="coordinator" />
                          </td>
                          <WaitingCell minutes={waitingMinutes(fault, now)} />
                          <td className="px-3 py-2">
                            {fault.status === 'REPORTED' ? (
                              <Link
                                to={`/coordinator/faults/${fault.id}/assign`}
                                className="btn btn-volt min-h-11 px-3 text-xs"
                                onClick={(event) => event.stopPropagation()}
                              >
                                Assign
                              </Link>
                            ) : (
                              (fault.technician?.name ?? '—')
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="eyebrow border-t border-line px-4 py-3 text-muted">
                Select a row to highlight the fault on the map. Open it from the fault ID.
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
