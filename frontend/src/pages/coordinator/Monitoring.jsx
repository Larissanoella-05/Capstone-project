import { useMemo } from 'react';
import { X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { CATEGORY_LABEL, fmtKm, locationLine, timeAgo } from '../../lib/format.js';
import { KeyRow, MapLegend } from '../../components/Bits.jsx';
import { CoordinatorHeading } from '../../components/CoordinatorShell.jsx';
import MapView, { faultMarker } from '../../components/MapView.jsx';
import { PriorityPill, StatusPill } from '../../components/Pills.jsx';
import { ErrorState, Loading } from '../../components/States.jsx';

export default function Monitoring() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = Number(searchParams.get('fault')) || null;
  const select = (id) => setSearchParams(id ? { fault: String(id) } : {}, { replace: true });

  const faultsState = useApi('/faults?status=OPEN', { interval: 4000 });
  const techState = useApi('/technicians', { interval: 4000 });

  const faults = faultsState.data?.faults ?? [];
  const technicians = (techState.data?.technicians ?? []).filter((technician) => technician.onDuty);
  const selected = faults.find((fault) => fault.id === selectedId) ?? null;

  const { markers, lines } = useMemo(() => {
    const faultMarkers = faults.map((fault) => faultMarker(fault, () => select(fault.id)));
    const technicianMarkers = technicians
      .filter((technician) => technician.location)
      .map((technician) => ({
        id: `tech-${technician.id}`,
        lat: technician.location.latitude,
        lng: technician.location.longitude,
        kind: technician.activeJobs.some((job) => ['ARRIVED', 'WORKING'].includes(job.status))
          ? 'onsite'
          : 'technician',
        label: technician.name,
      }));
    // A link is drawn only while a technician is travelling to a fault.
    const links = faults
      .filter((fault) => fault.status === 'ON_THE_WAY' && fault.technician?.location)
      .map((fault) => [
        [fault.technician.location.latitude, fault.technician.location.longitude],
        [fault.serviceLocation.latitude, fault.serviceLocation.longitude],
      ]);
    return { markers: [...faultMarkers, ...technicianMarkers], lines: links };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faultsState.data, techState.data]);

  const error = faultsState.error || techState.error;

  return (
    <>
      <CoordinatorHeading
        eyebrow={
          faultsState.data
            ? `${faults.length} active faults · ${technicians.length} technicians on duty`
            : 'Ndera Sector'
        }
        title="Live monitoring"
      />

      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            faultsState.reload();
            techState.reload();
          }}
        />
      ) : !faultsState.data || !techState.data ? (
        <Loading label="Loading the live map" />
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="panel">
            <MapView
              markers={markers}
              lines={lines}
              selectedId={selectedId ? `fault-${selectedId}` : null}
              className="h-[560px]"
              ariaLabel="Live map of Ndera Sector showing active faults and technician positions"
            />
            <MapLegend items={['unassigned', 'site', 'onsite', 'technician']} />
          </section>

          <div className="flex flex-col gap-4">
            {selected ? (
              <aside aria-label={`Fault ${selected.reference}`} className="panel">
                <div className="flex items-start justify-between gap-3 border-b border-ink bg-volt p-4">
                  <div>
                    <div className="font-mono text-xs">{selected.reference}</div>
                    <h2 className="display mt-1 text-2xl">{CATEGORY_LABEL[selected.category]}</h2>
                  </div>
                  <button
                    type="button"
                    aria-label="Close fault details"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center border border-ink bg-white"
                    onClick={() => select(null)}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="px-4 py-1">
                  <KeyRow label="Technician">{selected.technician?.name ?? 'Not assigned'}</KeyRow>
                  <KeyRow label="Status">
                    <StatusPill status={selected.status} audience="coordinator" />
                  </KeyRow>
                  <KeyRow label="Priority">
                    <PriorityPill priority={selected.priority} />
                  </KeyRow>
                  <KeyRow label="Location">{locationLine(selected.serviceLocation)}</KeyRow>
                  <KeyRow label="Distance remaining" mono>
                    {['ASSIGNED', 'ON_THE_WAY'].includes(selected.status)
                      ? fmtKm(selected.technician?.distanceKm)
                      : ['ARRIVED', 'WORKING'].includes(selected.status)
                        ? 'On site'
                        : '—'}
                  </KeyRow>
                  <KeyRow label="Last updated" last>
                    {timeAgo(selected.updatedAt)}
                  </KeyRow>
                </div>
                {selected.serviceLocation.landmark && (
                  <p className="m-0 border-t border-ink bg-paper p-4 text-sm">
                    {selected.serviceLocation.landmark}
                  </p>
                )}
                <div className="flex flex-col gap-3 border-t border-ink p-3">
                  {selected.status === 'REPORTED' && (
                    <Link to={`/coordinator/faults/${selected.id}/assign`} className="btn btn-volt">
                      Assign Technician
                    </Link>
                  )}
                  <Link to={`/coordinator/faults/${selected.id}`} className="btn btn-ink">
                    Open fault
                  </Link>
                </div>
              </aside>
            ) : (
              <p className="eyebrow m-0 border border-line p-4 text-muted">
                Select a fault on the map or in the list to see its progress.
              </p>
            )}

            <section className="panel">
              <div className="panel-head">Active faults · {faults.length}</div>
              {faults.length === 0 ? (
                <p className="m-0 p-4 text-sm text-muted">No active faults.</p>
              ) : (
                faults.map((fault, index) => (
                  <button
                    key={fault.id}
                    type="button"
                    aria-pressed={fault.id === selectedId}
                    onClick={() => select(fault.id)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left ${index > 0 ? 'border-t border-line' : ''} ${
                      fault.id === selectedId ? 'bg-volt-soft' : 'bg-white hover:bg-paper'
                    }`}
                  >
                    <span>
                      <span className="block font-mono text-xs">
                        {fault.reference} · {fault.serviceLocation.cell}
                      </span>
                      <span className="block text-sm font-bold">
                        {fault.technician?.name ?? 'No technician'}
                      </span>
                    </span>
                    <StatusPill status={fault.status} audience="coordinator" />
                  </button>
                ))
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
