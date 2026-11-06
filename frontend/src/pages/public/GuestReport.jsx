import { useMemo, useState } from 'react';
import { Camera, LocateFixed, MapPin, TriangleAlert, Upload, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { CATEGORIES } from '../../lib/format.js';
import { errorSummary } from '../../lib/formErrors.js';
import {
  SAVED_REPORTS_KEY,
  accuracyText,
  buildGuestPayload,
  locationErrorMessage,
  parseSavedReports,
  photoProblem,
  pointFromPosition,
  rememberReport,
  trackingPath,
  validateGuestForm,
} from '../../lib/guestReport.js';
import { Card } from '../../components/Card.jsx';
import { CategoryOption, Field } from '../../components/Field.jsx';
import MapView from '../../components/MapView.jsx';
import { ErrorSummary, FormError } from '../../components/States.jsx';

// The fields in page order, for the "There is a problem" summary.
const FIELDS = [
  { key: 'category', id: 'category-group' },
  { key: 'location', id: 'place' },
  { key: 'contactPhone', id: 'contact-phone' },
  { key: 'claimedMeter', id: 'meter' },
  { key: 'description', id: 'description' },
  { key: 'photo', id: 'photo-camera' },
];

const LOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The photo could not be read.'));
    reader.readAsDataURL(file);
  });
}

/** Reports kept in this browser, so "my reports on this phone" works without an account. */
function loadSaved() {
  try {
    return parseSavedReports(localStorage.getItem(SAVED_REPORTS_KEY));
  } catch {
    return [];
  }
}

function saveReport(entry) {
  try {
    localStorage.setItem(
      SAVED_REPORTS_KEY,
      JSON.stringify(rememberReport(loadSaved(), { ...entry, savedAt: Date.now() }))
    );
  } catch {
    // Storage can be blocked; the reference and link on the next page are still shown.
  }
}

export default function GuestReport() {
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [point, setPoint] = useState(null); // { latitude, longitude, accuracyM }
  const [placeText, setPlaceText] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [claimedMeter, setClaimedMeter] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null); // { name, dataUrl }
  const [website, setWebsite] = useState(''); // hidden field: people leave it empty
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved] = useState(loadSaved);

  const markers = useMemo(
    () =>
      point
        ? [
            {
              id: 'reported-point',
              lat: point.latitude,
              lng: point.longitude,
              kind: 'unassigned',
              label: 'Where the fault is',
            },
          ]
        : [],
    [point]
  );

  function clearError(key) {
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function findMe() {
    setLocationNote('');
    if (!('geolocation' in navigator)) {
      setLocationNote(locationErrorMessage(0));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint(pointFromPosition(position));
        clearError('location');
        setLocating(false);
      },
      (error) => {
        setLocationNote(locationErrorMessage(error.code));
        setLocating(false);
      },
      LOCATION_OPTIONS
    );
  }

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
      setPhoto({ name: file.name, dataUrl: await readAsDataUrl(file) });
      clearError('photo');
    } catch (error) {
      setErrors((current) => ({ ...current, photo: error.message }));
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    const form = { category, contactPhone, point, placeText, claimedMeter, description, photo };
    const nextErrors = validateGuestForm(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const { fault } = await api('/public/faults', {
        method: 'POST',
        body: { ...buildGuestPayload(form), website },
      });
      saveReport({ token: fault.trackingToken, reference: fault.reference });
      navigate(`/report/sent/${fault.trackingToken}`, {
        replace: true,
        state: { reference: fault.reference, sms: fault.sms },
      });
    } catch (error) {
      setFormError(`Your report was not sent. What you typed is still here. ${error.message}`);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
      <div>
        <h1 className="display text-[26px]">Report a fault</h1>
        <p className="mb-0 mt-1.5 text-sm text-grey">No account needed. It takes about a minute.</p>
      </div>

      <p className="m-0 flex items-start gap-2.5 rounded-card border border-red bg-white p-4 text-[13px]">
        <TriangleAlert size={18} className="mt-0.5 shrink-0 text-red" aria-hidden="true" />
        <span>
          If you can see a fallen, sparking or exposed wire, stay away from it and call{' '}
          <strong>2727</strong> now. This report is for the pilot and is not an emergency line.
        </span>
      </p>

      <ErrorSummary items={errorSummary(errors, FIELDS)} />

      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-3.5">
          <fieldset id="category-group" className="m-0 flex min-w-0 flex-col border-0 p-0">
            <legend className="heading-weight mb-3 p-0 text-lg">What is the problem?</legend>
            <div className="grid gap-2.5">
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
                    clearError('category');
                  }}
                />
              ))}
            </div>
            {errors.category && (
              <span className="mt-2 text-sm font-semibold text-red">{errors.category}</span>
            )}
          </fieldset>
        </div>

        <div className="flex min-w-0 flex-col gap-3.5">
          <Card className="flex flex-col gap-3 px-[18px] py-4">
            <div className="heading-weight flex items-center gap-2 text-lg">
              <MapPin size={18} className="shrink-0 text-accent" aria-hidden="true" />
              Where is the fault?
            </div>
            <button
              type="button"
              className="btn btn-accent w-full"
              onClick={findMe}
              disabled={locating}
            >
              <LocateFixed size={18} aria-hidden="true" />
              {locating
                ? 'Finding your location…'
                : point
                  ? 'Update my location'
                  : 'Use my location'}
            </button>
            {point && (
              <div role="status" className="text-sm">
                <div className="font-semibold">Location found</div>
                <div className="text-grey">{accuracyText(point.accuracyM)}</div>
                <div className="text-xs text-grey">
                  If the fault is somewhere else, describe where below.
                </div>
              </div>
            )}
            {locationNote && (
              <p role="alert" className="m-0 text-sm font-semibold text-red">
                {locationNote}
              </p>
            )}
            {point && (
              <div className="overflow-hidden rounded-control">
                <MapView
                  markers={markers}
                  interactive={false}
                  className="h-40"
                  ariaLabel="Map showing the location your phone found"
                />
              </div>
            )}
            <Field
              id="place"
              label="Describe the place"
              hint={point ? '(optional)' : undefined}
              error={errors.location}
              help="Village, cell, a landmark, or the house number."
            >
              <textarea
                id="place"
                rows={2}
                className="field"
                placeholder="For example: near the blue gate, Kibenga cell"
                value={placeText}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? 'place-error' : 'place-help'}
                onChange={(event) => {
                  setPlaceText(event.target.value);
                  clearError('location');
                }}
              />
            </Field>
          </Card>

          <Field
            id="contact-phone"
            label="Your phone number"
            error={errors.contactPhone}
            help="We use it to text you updates about this fault only, and so the technician can call you."
          >
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="078 123 4567"
              className="field"
              value={contactPhone}
              aria-invalid={Boolean(errors.contactPhone)}
              aria-describedby={errors.contactPhone ? 'contact-phone-error' : 'contact-phone-help'}
              onChange={(event) => {
                setContactPhone(event.target.value);
                clearError('contactPhone');
              }}
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-8">
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

          <Field
            id="meter"
            label="Meter number"
            hint="(optional)"
            error={errors.claimedMeter}
            help="Printed on your meter and on your token receipt. It helps us match your report; it is not checked."
          >
            <input
              id="meter"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="field"
              value={claimedMeter}
              aria-invalid={Boolean(errors.claimedMeter)}
              aria-describedby={errors.claimedMeter ? 'meter-error' : 'meter-help'}
              onChange={(event) => setClaimedMeter(event.target.value)}
            />
          </Field>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
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
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{photo.name}</span>
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
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border bg-white px-3 py-4 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
                <Camera size={26} strokeWidth={1.75} aria-hidden="true" />
                <span className="text-xs font-semibold">Take a photo</span>
                <input
                  id="photo-camera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={onPhotoChange}
                />
              </label>
              <label className="flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border bg-white px-3 py-4 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
                <Upload size={26} strokeWidth={1.75} aria-hidden="true" />
                <span className="text-xs font-semibold">Choose a photo</span>
                <input
                  id="photo-file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onPhotoChange}
                />
              </label>
            </div>
          )}
          {errors.photo && <span className="text-sm font-semibold text-red">{errors.photo}</span>}
        </div>
      </div>

      {/* Hidden from people; a simple bot fills every field it finds. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>
      </div>

      <FormError>{formError}</FormError>

      <div className="sticky-bar">
        <button
          type="submit"
          className="btn btn-accent btn-lg w-full lg:w-auto lg:px-12"
          disabled={submitting}
        >
          {submitting ? 'Sending…' : 'Send report'}
        </button>
      </div>

      {saved.length > 0 && (
        <section aria-labelledby="saved-heading" className="flex flex-col gap-2">
          <h2 id="saved-heading" className="heading-weight m-0 text-base">
            Reports from this phone
          </h2>
          <Card className="divide-y divide-line">
            {saved.map((item) => (
              <Link
                key={item.token}
                to={trackingPath(item.token)}
                className="flex min-h-11 items-center justify-between px-[18px] py-3 text-sm font-semibold text-ink no-underline"
              >
                <span>#{item.reference}</span>
                <span className="text-accent">Track</span>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </form>
  );
}
