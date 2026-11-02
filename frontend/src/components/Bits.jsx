import { Check } from 'lucide-react';
import {
  CUSTOMER_TIMELINE_LABEL,
  STATUS_LABEL,
  STATUS_TIME_FIELD,
  fmtTime,
} from '../lib/format.js';
import { STEPPER_STEPS, stepperState } from '../lib/stepper.js';

/** Label on the left, value on the right, hairline underneath. */
export function KeyRow({ label, children, mono = false, last = false }) {
  return (
    <div className={`flex justify-between gap-4 py-2.5 ${last ? '' : 'border-b border-line'}`}>
      <span className="eyebrow shrink-0 leading-5">{label}</span>
      <span className={`text-right text-[13px] ${mono ? 'font-medium' : 'font-semibold'}`}>
        {children}
      </span>
    </div>
  );
}

/** Label above value, used in the bordered detail grids. */
export function Cell({ label, children, className = '' }) {
  return (
    <div className={`p-3 ${className}`}>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-[13px] font-semibold">{children}</div>
    </div>
  );
}

/** Page title block with the small label above it. */
export function PageHeading({ eyebrow, title, children }) {
  return (
    <div>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className="display mt-2 text-[26px]">{title}</h1>
      {children}
    </div>
  );
}

/** Five segments: done steps are ink, the current step is yellow with an ink border. */
export function Stepper({ status }) {
  const { current, resolved } = stepperState(status);
  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {STEPPER_STEPS.map((step, index) => {
          const done = resolved || index < current;
          const active = index === current && !resolved;
          return (
            <div
              key={step}
              className={`h-1.5 min-w-px flex-1 rounded-[3px] ${
                done ? 'bg-ink' : active ? 'border border-ink bg-yellow' : 'bg-line'
              }`}
            />
          );
        })}
      </div>
      <div className="eyebrow mt-2">
        {current >= 0
          ? `Stage ${current + 1} of ${STEPPER_STEPS.length} · ${STATUS_LABEL[status]}`
          : (STATUS_LABEL[status] ?? status)}
      </div>
    </div>
  );
}

/**
 * The response timeline. Times come from the timestamp stored for each stage,
 * so every role reads the same history. Done = ink circle with a check, current = yellow, to do = outlined.
 */
export function VerticalTimeline({ fault, audience = 'customer' }) {
  const { current, resolved } = stepperState(fault.status);
  const labels = audience === 'customer' ? CUSTOMER_TIMELINE_LABEL : STATUS_LABEL;
  const cancelled = fault.status === 'CANCELLED';

  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {STEPPER_STEPS.map((step, index) => {
        const time = fault[STATUS_TIME_FIELD[step]];
        const done = Boolean(time) && (resolved || index < current);
        const active = index === current && !resolved;
        const last = index === STEPPER_STEPS.length - 1 && !cancelled;
        return (
          <li
            key={step}
            aria-current={active ? 'step' : undefined}
            className="flex items-start gap-3.5"
          >
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? 'border-ink bg-ink text-white'
                    : active
                      ? 'border-ink bg-yellow font-medium text-ink'
                      : 'border-border bg-white text-mute'
                }`}
              >
                {done ? (
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  String(index + 1).padStart(2, '0')
                )}
              </span>
              {!last && <span className={`h-[26px] w-0.5 ${done ? 'bg-ink' : 'bg-line'}`} />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
              <span
                className={`heading-weight text-sm uppercase ${done || active ? 'text-ink' : 'text-mute'}`}
              >
                {labels[step]}
              </span>
              <span className="text-xs text-grey">
                {fmtTime(time)}
                {active && ' · current stage'}
              </span>
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="flex items-start gap-3.5">
          <span className="h-7 w-7 shrink-0 rounded-full border border-red bg-red" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
            <span className="heading-weight text-sm uppercase text-red">Report cancelled</span>
            <span className="text-xs text-grey">{fmtTime(fault.cancelledAt)}</span>
          </div>
        </li>
      )}
    </ol>
  );
}

/** The small key under a map. */
export function MapLegend({ items }) {
  const swatch = {
    unassigned: 'rounded-full border border-ink bg-red',
    site: 'rounded-full border border-ink bg-yellow',
    onsite: 'rounded-full border border-ink bg-green',
    technician: 'rounded-[3px] border border-ink bg-ink',
  };
  const label = {
    unassigned: 'Unassigned',
    site: 'Assigned',
    onsite: 'On site',
    technician: 'Technician',
  };
  return (
    <div className="eyebrow flex flex-wrap gap-x-3.5 gap-y-2 px-5 py-3.5">
      {items.map((item) => (
        <span key={item} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 ${swatch[item]}`} />
          {label[item]}
        </span>
      ))}
    </div>
  );
}
