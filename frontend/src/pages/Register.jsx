import { useMemo, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext.jsx';
import { errorSummary } from '../lib/formErrors.js';
import { accuracyText, locationErrorMessage, pointFromPosition } from '../lib/guestReport.js';
import { buildRegisterPayload, validateRegisterForm } from '../lib/registration.js';
import { Card } from '../components/Card.jsx';
import { Field } from '../components/Field.jsx';
import MapView from '../components/MapView.jsx';
import { ErrorSummary, FormError } from '../components/States.jsx';

// The fields in page order, for the "There is a problem" summary.
const FIELDS = [
  { key: 'name', id: 'name' },
  { key: 'phone', id: 'phone' },
  { key: 'email', id: 'email' },
  { key: 'password', id: 'password' },
  { key: 'meterNumber', id: 'meter' },
  { key: 'cell', id: 'cell' },
  { key: 'location', id: 'use-location' },
];

// The API names its fields as the request body does; the page keys the location by one name.
const API_FIELD = { latitude: 'location', longitude: 'location' };

const LOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

export default function Register() {
  const { user, register } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [meterNumber, setMeterNumber] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');
  const [landmark, setLandmark] = useState('');
  const [point, setPoint] = useState(null); // { latitude, longitude, accuracyM }
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const markers = useMemo(
    () =>
      point
        ? [
            {
              id: 'home-point',
              lat: point.latitude,
              lng: point.longitude,
              kind: 'unassigned',
              label: 'Your home',
            },
          ]
        : [],
    [point]
  );

  // A new account is signed in straight away, so this also sends the new customer to their home.
  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

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

  async function onSubmit(event) {
    event.preventDefault();
    const form = { name, phone, email, password, meterNumber, cell, village, landmark, point };
    const nextErrors = validateRegisterForm(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await register(buildRegisterPayload(form));
    } catch (error) {
      // A taken phone or email is shown on its own field; anything else above the button.
      const field = error.details?.[0]?.field;
      const key = API_FIELD[field] ?? field;
      if (FIELDS.some((item) => item.key === key)) setErrors({ [key]: error.message });
      else setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto flex w-full max-w-[560px] flex-col gap-3.5"
    >
      <div>
        <h1 className="display text-[26px]">Create your account</h1>
        <p className="mb-0 mt-1.5 text-sm text-grey">
          One account to report faults and follow them. It takes about two minutes.
        </p>
      </div>

      <ErrorSummary items={errorSummary(errors, FIELDS)} />

      <Field id="name" label="Full name" error={errors.name}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className="field"
          value={name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
          onChange={(event) => {
            setName(event.target.value);
            clearError('name');
          }}
        />
      </Field>

      <Field
        id="phone"
        label="Phone number"
        error={errors.phone}
        help="You can sign in with it, and it is where we text updates."
      >
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="078 123 4567"
          className="field"
          value={phone}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? 'phone-error' : 'phone-help'}
          onChange={(event) => {
            setPhone(event.target.value);
            clearError('phone');
          }}
        />
      </Field>

      <Field id="email" label="Email" hint="(optional)" error={errors.email}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="field"
          value={email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError('email');
          }}
        />
      </Field>

      <Field id="password" label="Password" error={errors.password} help="At least 8 characters.">
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="field pr-16"
            value={password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : 'password-help'}
            onChange={(event) => {
              setPassword(event.target.value);
              clearError('password');
            }}
          />
          <button
            type="button"
            aria-label="Show password"
            aria-pressed={showPassword}
            aria-controls="password"
            className="absolute inset-y-0 right-0 min-w-11 cursor-pointer bg-transparent px-3 text-xs font-semibold text-grey focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </Field>

      <Card className="flex flex-col gap-3.5 px-[18px] py-4">
        <div className="heading-weight flex items-center gap-2 text-lg">
          <MapPin size={18} className="shrink-0 text-accent" aria-hidden="true" />
          Your meter
        </div>

        <Field
          id="meter"
          label="Meter number"
          error={errors.meterNumber}
          help="Printed on your meter and on your token receipt. Shared meter? Enter your landlord's meter number."
        >
          <input
            id="meter"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="field"
            value={meterNumber}
            aria-invalid={Boolean(errors.meterNumber)}
            aria-describedby={errors.meterNumber ? 'meter-error' : 'meter-help'}
            onChange={(event) => {
              setMeterNumber(event.target.value);
              clearError('meterNumber');
            }}
          />
        </Field>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field id="cell" label="Cell" error={errors.cell}>
            <input
              id="cell"
              type="text"
              autoComplete="off"
              className="field"
              value={cell}
              aria-invalid={Boolean(errors.cell)}
              aria-describedby={errors.cell ? 'cell-error' : undefined}
              onChange={(event) => {
                setCell(event.target.value);
                clearError('cell');
              }}
            />
          </Field>
          <Field id="village" label="Village" hint="(optional)">
            <input
              id="village"
              type="text"
              autoComplete="off"
              className="field"
              value={village}
              onChange={(event) => setVillage(event.target.value)}
            />
          </Field>
        </div>

        <Field id="landmark" label="Landmark" hint="(optional)">
          <input
            id="landmark"
            type="text"
            autoComplete="off"
            placeholder="For example: near the blue gate"
            className="field"
            value={landmark}
            onChange={(event) => setLandmark(event.target.value)}
          />
        </Field>

        <button
          id="use-location"
          type="button"
          className="btn btn-accent w-full"
          onClick={findMe}
          disabled={locating}
        >
          <LocateFixed size={18} aria-hidden="true" />
          {locating ? 'Finding your location…' : point ? 'Update my location' : 'Use my location'}
        </button>
        {errors.location && (
          <span role="alert" className="text-sm font-semibold text-red">
            {errors.location}
          </span>
        )}
        {point && (
          <div role="status" className="text-sm">
            <div className="font-semibold">Location found</div>
            <div className="text-grey">{accuracyText(point.accuracyM)}</div>
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
      </Card>

      <FormError>{formError}</FormError>

      <button type="submit" className="btn btn-accent btn-lg w-full" disabled={submitting}>
        {submitting ? 'Creating your account…' : 'Create account'}
      </button>

      <p className="m-0 text-center text-sm text-grey">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </form>
  );
}
