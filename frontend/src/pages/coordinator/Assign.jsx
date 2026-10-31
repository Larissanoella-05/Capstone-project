import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CATEGORY_LABEL, firstNames, fmtDateTime, fmtKm, locationLine } from '../../lib/format.js';
import { Cell, KeyRow, MapLegend } from '../../components/Bits.jsx';
import MapView, { faultMarker } from '../../components/MapView.jsx';
import { AvailabilityPill, PriorityPill } from '../../components/Pills.jsx';
import { EmptyState, ErrorState, FormError, Loading } from '../../components/States.jsx';

export default function Assign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const faultState = useApi(`/faults/${id}`);
  const techState = useApi(`/technicians?faultId=${id}`, { interval: 5000 });
  const [assigning, setAssigning] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [formError, setFormError] = useState('');

  const fault = faultState.data?.fault;
  const technicians = useMemo(() => techState.data?.technicians ?? [], [techState.data]);
  // The API ranks technicians (available → nearest → least busy) and flags the best one.
  const recommended = technicians.find((technician) => technician.recommended);

  const markers = useMemo(() => {
    if (!fault) return [];
    return [
      faultMarker(fault),
      ...technicians
        .filter((technician) => technician.location)
        .map((technician) => ({
          id: `tech-${technician.id}`,
          lat: technician.location.latitude,
          lng: technician.location.longitude,
          kind: 'technician',
          label: `${technician.name} · ${fmtKm(technician.distanceKm)}`,
        })),
    ];
  }, [fault, technicians]);

  async function assign(technician) {
    setAssigning(technician.id);
    setFormError('');
    try {
      await api(`/faults/${id}/assign`, { method: 'POST', body: { technicianId: technician.id } });
      toast(`Technician assigned successfully: ${technician.name}.`);
      navigate(`/coordinator/faults/${id}`, { replace: true });
    } catch (error) {
      setFormError(error.message);
      setAssigning(null);
    }
  }

  const error = faultState.error || techState.error;
  if (error)
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          faultState.reload();
          techState.reload();
        }}
      />
    );
  if (!fault || !techState.data) return <Loading label="Loading technicians" />;

  const assignable = ['REPORTED', 'ASSIGNED'].includes(fault.status);

  return (
    <>
      <Link
        to={`/coordinator/faults/${fault.id}`}
        className="eyebrow -mb-4 flex items-center gap-2 self-start"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Fault #{fault.reference}
      </Link>

      <div className="border-b border-ink pb-5">
        <div className="eyebrow text-muted">
          Fault #{fault.reference} · {CATEGORY_LABEL[fault.category]}
        </div>
        <h1 className="display mt-2 text-[clamp(2rem,5vw,3rem)]">Assign technician</h1>
      </div>

      {!assignable ? (
        <EmptyState
          title="This fault can no longer be reassigned"
          action={
            <Link to={`/coordinator/faults/${fault.id}`} className="btn btn-ink">
              Open fault
            </Link>
          }
        >
          The response has already started or the report is closed.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <section className="panel">
              <MapView
                markers={markers}
                selectedId={hovered ? `tech-${hovered}` : null}
                className="h-[400px]"
                ariaLabel={`Map showing fault ${fault.reference} and the positions of ${technicians.length} technicians`}
              />
              <MapLegend
                items={[fault.status === 'REPORTED' ? 'unassigned' : 'site', 'technician']}
              />
            </section>

            <section className="panel">
              <h2 className="panel-head m-0 font-normal">Fault information</h2>
              <div className="px-4 py-1">
                <KeyRow label="Fault ID" mono>
                  #{fault.reference}
                </KeyRow>
                <KeyRow label="Priority">
                  <PriorityPill priority={fault.priority} />
                </KeyRow>
                <KeyRow label="Reported">{fmtDateTime(fault.reportedAt)}</KeyRow>
                <KeyRow label="Customer">{fault.customer.name}</KeyRow>
                <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
                <KeyRow label="Meter number" mono>
                  {fault.serviceLocation.meterNumber}
                </KeyRow>
                <KeyRow label="Landmark note" last>
                  {fault.serviceLocation.landmark || '—'}
                </KeyRow>
              </div>
              <div className="border-t border-ink p-4">
                <div className="eyebrow text-muted">Description</div>
                <p className="mb-0 mt-1 text-sm">
                  {fault.description || 'The customer did not add a description.'}
                </p>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="eyebrow m-0 font-normal">Technicians · available first, then nearest</h2>
            <FormError>{formError}</FormError>
            {technicians.length === 0 && <EmptyState title="No technicians on record" />}
            {technicians.map((technician) => {
              const isCurrent = fault.technician?.id === technician.id;
              return (
                <article
                  key={technician.id}
                  className="panel"
                  onMouseEnter={() => setHovered(technician.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="flex items-start justify-between gap-3 p-4">
                    <h3 className="m-0 text-lg font-black uppercase">{technician.name}</h3>
                    <AvailabilityPill availability={technician.availability} />
                  </div>
                  <div className="grid grid-cols-3 border-t border-ink">
                    <Cell label="Location">{technician.location?.label ?? 'Not recorded'}</Cell>
                    <Cell label="Distance" className="border-l border-ink">
                      {technician.distanceKm !== null
                        ? `${fmtKm(technician.distanceKm)} away`
                        : '—'}
                      {recommended?.id === technician.id && (
                        <span className="ml-1 bg-volt px-1 font-mono text-[10px] font-medium uppercase">
                          Recommended
                        </span>
                      )}
                    </Cell>
                    <Cell label="Active jobs" className="border-l border-ink">
                      {technician.activeJobs.length}
                    </Cell>
                  </div>
                  <div className="border-t border-ink p-3">
                    <button
                      type="button"
                      className={`btn w-full ${technician.availability === 'AVAILABLE' ? 'btn-ink' : 'btn-outline'}`}
                      disabled={Boolean(assigning) || isCurrent || !technician.onDuty}
                      onClick={() => assign(technician)}
                    >
                      {isCurrent
                        ? 'Currently assigned'
                        : assigning === technician.id
                          ? 'Assigning…'
                          : `Assign ${firstNames(technician.name)}`}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
