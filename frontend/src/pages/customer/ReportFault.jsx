import { useState } from 'react';
import { Camera, ChevronLeft, MapPin, TriangleAlert, X } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { CATEGORY_LABEL, CATEGORIES, locationLine } from '../../lib/format.js';
import { errorSummary } from '../../lib/formErrors.js';
import { photoProblem, photoToDataUrl } from '../../lib/photo.js';
import { STEP_NAMES, validateStep } from '../../lib/reportSteps.js';
import { Card } from '../../components/Card.jsx';
import { CategoryOption, Field } from '../../components/Field.jsx';
import { ErrorSummary, FormError } from '../../components/States.jsx';

// The fields in page order, for the "There is a problem" summary.
const FIELDS = [
  { key: 'category', id: 'category-group' },
  { key: 'description', id: 'description' },
  { key: 'photo', id: 'photo-input' },
  { key: 'contactPhone', id: 'contact-phone' },
];

/** The step a validation error belongs to, so a failed send can jump back to it. */
function stepOfFirstError(errors) {
  if (errors.category) return 1;
  return 2;
}

export default function ReportFault() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { reloadNotifications } = useOutletContext() ?? {};
  const locations = useApi('/service-locations');

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState(user.phone ?? '');
  const [photo, setPhoto] = useState(null); // { name, dataUrl }
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const location = locations.data?.serviceLocations?.[0];
  const form = { category, description, contactPhone, hasLocation: Boolean(location) };

  async function onPhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = photoProblem(file);
    if (problem) {
      setErrors((current) => ({ ...current, photo: problem }));
      return;
    }
    try {
      setPhoto({ name: file.name, dataUrl: await photoToDataUrl(file) });
      setErrors((current) => ({ ...current, photo: undefined }));
    } catch (error) {
      setErrors((current) => ({ ...current, photo: error.message }));
    }
  }

  function goBack() {
    setErrors({});
    setFormError('');
    if (step === 1) navigate('/customer');
    else setStep(step - 1);
  }

  async function send() {
    const nextErrors = validateStep(3, form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) {
      setStep(stepOfFirstError(nextErrors));
      return;
    }

    setSubmitting(true);
    try {
      const { fault } = await api('/faults', {
        method: 'POST',
        body: {
          category,
          description: description.trim(),
          contactPhone: contactPhone.trim(),
          serviceLocationId: location?.id,
          photo: photo?.dataUrl,
        },
      });
      reloadNotifications?.();
      navigate(`/customer/submitted/${fault.id}`, { replace: true });
    } catch (error) {
      setFormError(`Your report was not sent. What you typed is still here. ${error.message}`);
      setSubmitting(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    if (step === 3) {
      send();
      return;
    }
    const nextErrors = validateStep(step, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep(step + 1);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={step === 1 ? 'Back to home' : 'Back to the previous step'}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line bg-white"
          onClick={goBack}
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <h1 className="display text-[22px]">Report a fault</h1>
          <div className="text-xs text-grey">
            Step {step} of {STEP_NAMES.length} · {STEP_NAMES[step - 1]}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5" aria-hidden="true">
        {STEP_NAMES.map((name, index) => (
          <div
            key={name}
            className={`h-[5px] flex-1 rounded-[3px] ${index < step ? 'bg-accent' : 'bg-line'}`}
          />
        ))}
      </div>

      <ErrorSummary items={errorSummary(errors, FIELDS)} />

      {step === 1 && (
        <fieldset id="category-group" className="m-0 flex min-w-0 flex-col border-0 p-0">
          <legend className="heading-weight mb-3 p-0 text-lg">What is the problem?</legend>
          <div className="grid gap-2.5 md:grid-cols-2">
            {CATEGORIES.map((item) => (
              <CategoryOption
                key={item.value}
                name="category"
                value={item.value}
                label={item.label}
                hint={item.hint}
                checked={category === item.value}
                onChange={() => {
                  setCategory(item.value);
                  setErrors((current) => ({ ...current, category: undefined }));
                }}
              />
            ))}
          </div>
          {errors.category && (
            <span className="mt-2 text-sm font-semibold text-red">{errors.category}</span>
          )}
        </fieldset>
      )}

      {step === 2 && (
        <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-8">
          <Card className="flex flex-col gap-1.5 px-[18px] py-4">
            {locations.loading ? (
              <div className="eyebrow">Loading your service location…</div>
            ) : location ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="eyebrow">Registered location · Meter {location.meterNumber}</div>
                  <span className="pill bg-tint text-accent">Auto</span>
                </div>
                <div className="heading-weight flex items-center gap-2 text-[15px]">
                  <MapPin size={18} className="shrink-0 text-accent" aria-hidden="true" />
                  {locationLine(location)}
                </div>
                <p className="m-0 text-[11px] text-grey">
                  Your registered service location is added to this report automatically.
                </p>
              </>
            ) : (
              <p className="m-0 text-sm font-semibold text-red">
                {locations.error?.message ||
                  'No registered service location was found for your account.'}
              </p>
            )}
          </Card>

          <div className="flex min-w-0 flex-col gap-3.5">
            <Field
              id="description"
              label="What happened?"
              hint="(optional)"
              error={errors.description}
            >
              <textarea
                id="description"
                rows={4}
                className="field"
                placeholder="Describe the problem"
                value={description}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'description-error' : undefined}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>

            <div className="flex flex-col gap-1.5">
              <div className="eyebrow flex justify-between">
                <span>Photo</span>
                <span>(optional)</span>
              </div>
              {photo ? (
                <div className="flex items-center gap-3 rounded-control border border-border bg-white p-2">
                  <img
                    src={photo.dataUrl}
                    alt="Selected fault"
                    className="h-16 w-16 rounded-control border border-line object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {photo.name}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline px-3"
                    aria-label="Remove photo"
                    onClick={() => setPhoto(null)}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border bg-white px-4 py-[22px] has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
                  <Camera size={26} strokeWidth={1.75} aria-hidden="true" />
                  <span className="text-xs font-semibold">Add a photo</span>
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={onPhotoChange}
                  />
                </label>
              )}
              {errors.photo && (
                <span className="text-sm font-semibold text-red">{errors.photo}</span>
              )}
            </div>

            <Field id="contact-phone" label="Contact phone" error={errors.contactPhone}>
              <input
                id="contact-phone"
                type="tel"
                autoComplete="tel"
                className="field"
                value={contactPhone}
                aria-invalid={Boolean(errors.contactPhone)}
                aria-describedby={errors.contactPhone ? 'contact-phone-error' : undefined}
                onChange={(event) => setContactPhone(event.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-8">
          <Card className="px-[18px] py-1.5">
            <ReviewRow label="Type">{CATEGORY_LABEL[category]}</ReviewRow>
            <ReviewRow label="Location">
              {locationLine(location)} · Meter {location?.meterNumber}
            </ReviewRow>
            <ReviewRow label="Contact phone">{contactPhone.trim() || '—'}</ReviewRow>
            <ReviewRow label="Description" last={!photo}>
              {description.trim() || 'No description given.'}
            </ReviewRow>
            {photo && (
              <div className="py-2.5">
                <img
                  src={photo.dataUrl}
                  alt="Selected fault"
                  className="h-24 w-24 rounded-control border border-line object-cover"
                />
              </div>
            )}
          </Card>

          <p className="m-0 flex items-start gap-2.5 rounded-card border border-red bg-white p-4 text-[13px]">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-red" aria-hidden="true" />
            <span>
              If you can see a fallen, sparking or exposed wire, stay away from it and call{' '}
              <strong>2727</strong> now. This report is for the pilot and is not an emergency line.
            </span>
          </p>
        </div>
      )}

      <FormError>{formError}</FormError>

      <div className="sticky-bar">
        <button
          type="submit"
          className="btn btn-accent btn-lg w-full lg:w-auto lg:px-12"
          disabled={submitting || (step > 1 && !location)}
        >
          {step === 3 ? (submitting ? 'Sending…' : 'Send report') : 'Continue'}
        </button>
      </div>
    </form>
  );
}

function ReviewRow({ label, children, last = false }) {
  return (
    <div className={`py-2.5 ${last ? '' : 'border-b border-line'}`}>
      <div className="eyebrow">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{children}</div>
    </div>
  );
}
