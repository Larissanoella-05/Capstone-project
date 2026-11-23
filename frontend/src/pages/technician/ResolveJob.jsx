import { useT } from '../../context/LanguageContext.jsx';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { CATEGORY_LABEL, OUTCOMES, fmtTime, locationLine } from '../../lib/format.js';
import { KeyRow } from '../../components/Bits.jsx';
import { Async, FormError } from '../../components/States.jsx';

export default function ResolveJob() {
  const t = useT();

  const { id } = useParams();
  const navigate = useNavigate();
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
    if (resolutionNote.trim().length < 5)
      nextErrors.resolutionNote = t('Describe how the fault was resolved.');
    if (!workCompleted.trim()) nextErrors.workCompleted = t('List the work that was completed.');
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
      navigate(`/technician/jobs/${id}/closed`, { replace: true });
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <Async state={state} label="Loading job">
      {({ fault }) => {
        // The resolution form only makes sense once work has started.
        if (fault.status !== 'WORKING')
          return <Navigate to={`/technician/jobs/${fault.id}`} replace />;
        return (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <Link
              to={`/technician/jobs/${fault.id}`}
              className="flex items-center gap-2 self-start text-sm font-semibold no-underline"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {t('Job details')}
            </Link>

            <div>
              <div className="eyebrow">
                {t('Fault #{reference}', { reference: fault.reference })}
              </div>
              <h1 className="display mt-1.5 text-[26px]">{t('Close job')}</h1>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-8">
              <div className="flex min-w-0 flex-col gap-5">
                <section className="panel px-4 py-1">
                  <KeyRow label={t('Fault ID')} mono>
                    {fault.reference}
                  </KeyRow>
                  <KeyRow label={t('Category')}>{t(CATEGORY_LABEL[fault.category])}</KeyRow>
                  <KeyRow label={t('Location')}>{locationLine(fault.serviceLocation)}</KeyRow>
                  <KeyRow label={t('Arrival')}>{fmtTime(fault.arrivedAt)}</KeyRow>
                  <KeyRow label={t('Completed')} last>
                    {fmtTime(new Date())} ({t('now')})
                  </KeyRow>
                </section>

                <div className="flex flex-col gap-2">
                  <label htmlFor="outcome" className="eyebrow">
                    {t('Outcome')}
                  </label>
                  <select
                    id="outcome"
                    className="field"
                    value={outcome}
                    onChange={(event) => setOutcome(event.target.value)}
                  >
                    {OUTCOMES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="resolution-note" className="eyebrow">
                    {t('Resolution description')}
                  </label>
                  <textarea
                    id="resolution-note"
                    rows={3}
                    className="field"
                    placeholder={t('What was wrong and how it was fixed.')}
                    value={resolutionNote}
                    aria-invalid={Boolean(errors.resolutionNote)}
                    onChange={(event) => {
                      setResolutionNote(event.target.value);
                      setErrors((current) => ({ ...current, resolutionNote: undefined }));
                    }}
                  />
                  {errors.resolutionNote ? (
                    <span className="text-sm font-semibold text-danger">
                      {errors.resolutionNote}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">
                      {t('An outcome note is required before a fault can be resolved.')}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="work-completed" className="eyebrow">
                    {t('Work completed')}
                  </label>
                  <textarea
                    id="work-completed"
                    rows={3}
                    className="field"
                    placeholder={t(
                      'For example: replaced service fuse, tightened terminals, tested supply at the meter.'
                    )}
                    value={workCompleted}
                    aria-invalid={Boolean(errors.workCompleted)}
                    onChange={(event) => {
                      setWorkCompleted(event.target.value);
                      setErrors((current) => ({ ...current, workCompleted: undefined }));
                    }}
                  />
                  {errors.workCompleted && (
                    <span className="text-sm font-semibold text-danger">
                      {errors.workCompleted}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="contacts" className="eyebrow">
                    {t('Clarification contacts')}
                  </label>
                  <div className="flex overflow-hidden rounded-control border border-border bg-white">
                    <button
                      type="button"
                      className="h-12 w-14 cursor-pointer border-0 border-r border-border bg-white text-xl heading-weight"
                      aria-label={t('One fewer')}
                      onClick={() => setContacts((n) => Math.max(0, n - 1))}
                    >
                      −
                    </button>
                    <input
                      id="contacts"
                      type="number"
                      min={0}
                      max={50}
                      inputMode="numeric"
                      className="h-12 min-w-0 flex-1 border-0 text-center text-lg"
                      value={contacts}
                      onChange={(event) =>
                        setContacts(Math.max(0, Math.min(50, Number(event.target.value) || 0)))
                      }
                    />
                    <button
                      type="button"
                      className="h-12 w-14 cursor-pointer border-0 border-l border-border bg-white text-xl heading-weight"
                      aria-label={t('One more')}
                      onClick={() => setContacts((n) => Math.min(50, n + 1))}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-muted">
                    {t(
                      'How many times you had to call or message the customer to find the location.'
                    )}
                  </span>
                </div>
              </div>
            </div>

            <FormError>{formError}</FormError>

            <p className="m-0 text-sm text-muted">
              {t(
                'The customer will be notified and the fault closed. Status times cannot be edited afterwards.'
              )}
            </p>
            <div className="sticky-bar">
              <button
                type="submit"
                className="btn btn-volt btn-lg w-full lg:w-auto lg:px-12"
                disabled={submitting}
              >
                {submitting ? t('Saving…') : t('Mark as resolved')}
              </button>
            </div>
          </form>
        );
      }}
    </Async>
  );
}
