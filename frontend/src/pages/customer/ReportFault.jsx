import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { CATEGORIES, locationLine } from '../../lib/format.js';
import { errorSummary } from '../../lib/formErrors.js';
import { PageHeading } from '../../components/Bits.jsx';
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <PageHeading eyebrow="New report" title="Report a fault">
        <p className="mb-0 mt-3 text-sm text-muted">
          Four short steps. The description and the photo are optional.
        </p>
      </PageHeading>

      <ErrorSummary items={errorSummary(errors, FIELDS)} />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-8">
        <fieldset id="category-group" className="m-0 flex min-w-0 flex-col border-0 p-0">
          <legend className="eyebrow mb-2 p-0">01 · Fault category</legend>
          <div
            className={`flex flex-col border ${errors.category ? 'border-danger' : 'border-ink'}`}
          >
            {CATEGORIES.map((item, index) => (
              <label
                key={item.value}
                className={`flex min-h-[60px] cursor-pointer items-center gap-3.5 px-3.5 py-2.5 ${
                  index < CATEGORIES.length - 1 ? 'border-b border-ink' : ''
                } ${category === item.value ? 'bg-volt' : 'bg-white'}`}
              >
                <input
                  type="radio"
                  name="category"
                  value={item.value}
                  checked={category === item.value}
                  onChange={() => {
                    setCategory(item.value);
                    setErrors((current) => ({ ...current, category: undefined }));
                  }}
                  className="m-0 h-5 w-5 shrink-0"
                />
                <span>
                  <span className="block text-base font-black uppercase">{item.label}</span>
                  <span className="block text-[13px]">{item.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.category && (
            <span className="mt-2 text-sm font-semibold text-danger">{errors.category}</span>
          )}
        </fieldset>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="eyebrow flex justify-between">
              <span>02 · Description</span>
              <span className="text-muted">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={4}
              className="field"
              placeholder="For example: electricity went off suddenly, the neighbours still have power."
              value={description}
              aria-invalid={Boolean(errors.description)}
              onChange={(event) => setDescription(event.target.value)}
            />
            {errors.description && (
              <span className="text-sm font-semibold text-danger">{errors.description}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="eyebrow flex justify-between">
              <span>03 · Photo</span>
              <span className="text-muted">(optional)</span>
            </div>
            {photo ? (
              <div className="flex items-center gap-3 border border-ink p-2">
                <img
                  src={photo.dataUrl}
                  alt="Selected fault"
                  className="h-16 w-16 border border-line object-cover"
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
              <label className="btn btn-outline w-full cursor-pointer border-dashed">
                <Camera size={16} aria-hidden="true" />
                Add a photo
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
              <span className="text-sm font-semibold text-danger">{errors.photo}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contact-phone" className="eyebrow">
              04 · Contact phone
            </label>
            <input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              className="field"
              value={contactPhone}
              aria-invalid={Boolean(errors.contactPhone)}
              onChange={(event) => setContactPhone(event.target.value)}
            />
            {errors.contactPhone && (
              <span className="text-sm font-semibold text-danger">{errors.contactPhone}</span>
            )}
          </div>

          <div className="border border-ink bg-paper p-4">
            {locations.loading ? (
              <div className="eyebrow text-muted">Loading your service location…</div>
            ) : location ? (
              <>
                <div className="eyebrow text-muted">
                  Service location · Meter {location.meterNumber}
                </div>
                <div className="mt-1 text-lg font-black uppercase">{locationLine(location)}</div>
                <p className="mb-0 mt-2 text-sm">
                  Your registered service location will automatically be associated with this
                  report.
                </p>
              </>
            ) : (
              <p className="m-0 text-sm font-semibold text-danger">
                {locations.error?.message ||
                  'No registered service location was found for your account.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <FormError>{formError}</FormError>

      <button
        type="submit"
        className="btn btn-volt btn-lg w-full lg:w-auto lg:self-end lg:px-12"
        disabled={submitting || !location}
      >
        {submitting ? 'Sending…' : 'Send report'}
      </button>
    </form>
  );
}
