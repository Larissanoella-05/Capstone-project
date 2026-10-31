import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CATEGORY_LABEL, OUTCOMES, fmtTime, locationLine } from '../../lib/format.js';
import { KeyRow } from '../../components/Bits.jsx';
import { Async, FormError } from '../../components/States.jsx';

export default function ResolveJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const state = useApi(`/faults/${id}`);

  const [outcome, setOutcome] = useState('SUPPLY_RESTORED');
  const [resolutionNote, setResolutionNote] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [contacts, setContacts] = useState(0);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (resolutionNote.trim().length < 5) nextErrors.resolutionNote = 'Describe how the fault was resolved.';
    if (!workCompleted.trim()) nextErrors.workCompleted = 'List the work that was completed.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await api(`/faults/${id}/status`, {
        method: 'PATCH',
        body: {
          status: 'RESOLVED',
          outcome,
          resolutionNote: resolutionNote.trim(),
          workCompleted: workCompleted.trim(),
          clarificationContacts: contacts,
        },
      });
      toast('Fault marked as resolved. The customer has been notified.');
      navigate(`/technician/jobs/${id}`, { replace: true });
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <Async state={state} label="Loading job">
      {({ fault }) => {
        // The resolution form only makes sense once work has started.
        if (fault.status !== 'WORKING') return <Navigate to={`/technician/jobs/${fault.id}`} replace />;
        return (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <Link to={`/technician/jobs/${fault.id}`} className="eyebrow flex items-center gap-2 self-start">
              <ArrowLeft size={14} aria-hidden="true" />
              Job details
            </Link>

            <div className="border-b border-ink pb-4">
              <div className="eyebrow text-muted">Fault #{fault.reference}</div>
              <h1 className="display mt-2 text-3xl">Record resolution</h1>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-8">
            <div className="flex min-w-0 flex-col gap-5">
            <section className="panel px-4 py-1">
              <KeyRow label="Fault ID" mono>{fault.reference}</KeyRow>
              <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
              <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
              <KeyRow label="Arrival">{fmtTime(fault.arrivedAt)}</KeyRow>
              <KeyRow label="Completed" last>{fmtTime(new Date())} (now)</KeyRow>
            </section>

            <div className="flex flex-col gap-2">
              <label htmlFor="outcome" className="eyebrow">Outcome</label>
              <select id="outcome" className="field" value={outcome} onChange={(event) => setOutcome(event.target.value)}>
                {OUTCOMES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            </div>

            <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="resolution-note" className="eyebrow">Resolution description</label>
              <textarea
                id="resolution-note"
                rows={3}
                className="field"
                placeholder="What was wrong and how it was fixed."
                value={resolutionNote}
                aria-invalid={Boolean(errors.resolutionNote)}
                onChange={(event) => {
                  setResolutionNote(event.target.value);
                  setErrors((current) => ({ ...current, resolutionNote: undefined }));
                }}
              />
              {errors.resolutionNote ? (
                <span className="text-sm font-semibold text-danger">{errors.resolutionNote}</span>
              ) : (
                <span className="text-sm text-muted">An outcome note is required before a fault can be resolved.</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="work-completed" className="eyebrow">Work completed</label>
              <textarea
                id="work-completed"
                rows={3}
                className="field"
                placeholder="For example: replaced service fuse, tightened terminals, tested supply at the meter."
                value={workCompleted}
                aria-invalid={Boolean(errors.workCompleted)}
                onChange={(event) => {
                  setWorkCompleted(event.target.value);
                  setErrors((current) => ({ ...current, workCompleted: undefined }));
                }}
              />
              {errors.workCompleted && <span className="text-sm font-semibold text-danger">{errors.workCompleted}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="contacts" className="eyebrow">Clarification contacts</label>
              <div className="flex border border-ink">
                <button type="button" className="h-12 w-14 cursor-pointer border-r border-ink bg-white text-xl font-black" aria-label="One fewer" onClick={() => setContacts((n) => Math.max(0, n - 1))}>−</button>
                <input
                  id="contacts"
                  type="number"
                  min={0}
                  max={50}
                  inputMode="numeric"
                  className="h-12 min-w-0 flex-1 border-0 text-center font-mono text-lg"
                  value={contacts}
                  onChange={(event) => setContacts(Math.max(0, Math.min(50, Number(event.target.value) || 0)))}
                />
                <button type="button" className="h-12 w-14 cursor-pointer border-l border-ink bg-white text-xl font-black" aria-label="One more" onClick={() => setContacts((n) => Math.min(50, n + 1))}>+</button>
              </div>
              <span className="text-sm text-muted">How many times you had to call or message the customer to find the location.</span>
            </div>
            </div>
            </div>

            <FormError>{formError}</FormError>

            <button type="submit" className="btn btn-volt btn-lg w-full lg:w-auto lg:self-end lg:px-12" disabled={submitting}>
              {submitting ? 'Saving…' : 'Mark as Resolved'}
            </button>
            <p className="m-0 text-sm text-muted">
              The customer will be notified and the fault closed. Status times cannot be edited afterwards.
            </p>
          </form>
        );
      }}
    </Async>
  );
}
