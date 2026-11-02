import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { CATEGORIES, locationLine } from '../../lib/format.js';
import { errorSummary } from '../../lib/formErrors.js';
import { PageHeading } from '../../components/Bits.jsx';
import { CategoryOption, Field } from '../../components/Field.jsx';
import { ErrorSummary, FormError } from '../../components/States.jsx';

const MAX_PHOTO_BYTES = 1024 * 1024; // 1 MB

// The fields in page order, for the "There is a problem" summary.
const FIELDS = [
  { key: 'category', id: 'category-group' },
  { key: 'description', id: 'description' },
  { key: 'photo', id: 'photo-input' },
  { key: 'contactPhone', id: 'contact-phone' },
];

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The photo could not be read.'));
    reader.readAsDataURL(file);
  });
}

export default function ReportFault() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { reloadNotifications } = useOutletContext() ?? {};
  const locations = useApi('/service-locations');

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState(user.phone ?? '');
  const [photo, setPhoto] = useState(null); // { name, dataUrl }
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const location = locations.data?.serviceLocations?.[0];

  async function onPhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, photo: 'Choose an image file for the photo.' }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((current) => ({
        ...current,
        photo: 'Choose a photo smaller than 1 MB.',
      }));
      return;
    }
    try {
      setPhoto({ name: file.name, dataUrl: await readAsDataUrl(file) });
      setErrors((current) => ({ ...current, photo: undefined }));
    } catch (error) {
      setErrors((current) => ({ ...current, photo: error.message }));
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!category) nextErrors.category = 'Choose the type of fault.';
    if (description.length > 1000)
      nextErrors.description = 'Shorten the description to 1000 characters or fewer.';
    if (contactPhone && !/^[+\d][\d\s-]{7,}$/.test(contactPhone.trim())) {
      nextErrors.contactPhone = 'Enter a phone number such as +250 788 300 114.';
    }
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

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

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
      <PageHeading eyebrow="New report" title="Report a fault">
        <p className="mb-0 mt-3.5 text-xs text-grey">
          Tell us what is wrong. It takes less than a minute.
        </p>
      </PageHeading>

      <ErrorSummary items={errorSummary(errors, FIELDS)} />

      <div className="panel flex flex-col gap-1.5 px-[18px] py-4">
        {locations.loading ? (
          <div className="eyebrow">Loading your service location…</div>
        ) : location ? (
          <>
            <div className="eyebrow">Service location · Meter {location.meterNumber}</div>
            <div className="heading-weight text-[15px] uppercase">{locationLine(location)}</div>
            <p className="m-0 text-[11px] text-grey">
              Your registered service location will automatically be associated with this report.
            </p>
          </>
        ) : (
          <p className="m-0 text-sm font-semibold text-red">
            {locations.error?.message ||
              'No registered service location was found for your account.'}
          </p>
        )}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-8">
        <fieldset id="category-group" className="m-0 flex min-w-0 flex-col border-0 p-0">
          <legend className="eyebrow mb-3.5 p-0">01 · Fault category</legend>
          <div className="flex flex-col gap-2.5">
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

        <div className="flex min-w-0 flex-col gap-3.5">
          <Field
            id="description"
            label="02 · Description"
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
              <span>03 · Photo</span>
              <span>(optional)</span>
            </div>
            {photo ? (
              <div className="flex items-center gap-3 rounded-control border border-border bg-white p-2">
                <img
                  src={photo.dataUrl}
                  alt="Selected fault"
                  className="h-16 w-16 rounded-lg border border-line object-cover"
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
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border bg-white px-4 py-[22px] has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
                <Camera size={26} strokeWidth={1.75} aria-hidden="true" />
                <span className="text-xs font-medium uppercase tracking-[0.04em]">Add a photo</span>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onPhotoChange}
                />
              </label>
            )}
            {errors.photo && <span className="text-sm font-semibold text-red">{errors.photo}</span>}
          </div>

          <Field id="contact-phone" label="04 · Contact phone" error={errors.contactPhone}>
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

      <FormError>{formError}</FormError>

      <button
        type="submit"
        className="btn btn-ink w-full lg:w-auto lg:self-end lg:px-12"
        disabled={submitting || !location}
      >
        {submitting ? 'Sending…' : 'Submit fault'}
      </button>
    </form>
  );
}
