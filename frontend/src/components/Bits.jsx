import { Cable, Check, CircleHelp, Gauge, Zap, ZapOff } from 'lucide-react';
import {
  CUSTOMER_TIMELINE_LABEL,
  STATUS_LABEL,
  STATUS_TIME_FIELD,
  fmtTime,
} from '../lib/format.js';
import { STEPPER_STEPS, stepperState } from '../lib/stepper.js';

const CATEGORY_ICON = {
  POWER_OUTAGE: ZapOff,
  LOW_VOLTAGE: Zap,
  DAMAGED_CONNECTION: Cable,
  METER_ISSUE: Gauge,
  OTHER: CircleHelp,
};

/** Square tint tile with the icon of a fault category, used in lists of faults. */
export function FaultIcon({ category }) {
  const Icon = CATEGORY_ICON[category] ?? Zap;
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-tint text-accent">
      <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}

/** Round tile with the initials of a person, used in the greeting row. */
export function Avatar({ name }) {
  const initials = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  return (
    <span
      aria-hidden="true"
      className="heading-weight flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm text-on-accent"
    >
      {initials}
    </span>
  );
}

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
export function PageHeading({ eyebrow, title, action, children }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1 className="display mt-1.5 text-[26px]">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Five segments: done steps are the accent colour, the current step is a lighter accent. */
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
              className={`h-[5px] min-w-px flex-1 rounded-[3px] ${
                done ? 'bg-accent' : active ? 'bg-accent/45' : 'bg-line'
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
 * so every role reads the same history. Done = accent circle with a check, current = accent ring, to do = outlined.
 * `plain` lists the five status names without times, for "what happens next".
 */
export function VerticalTimeline({ fault, audience = 'customer', plain = false }) {
  const { current, resolved } = stepperState(fault.status);
  const labels = audience === 'customer' && !plain ? CUSTOMER_TIMELINE_LABEL : STATUS_LABEL;
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
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? 'border-accent bg-accent text-on-accent'
                    : active
                      ? 'border-accent bg-white font-bold text-accent'
                      : 'border-border bg-white text-mute'
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : index + 1}
              </span>
              {!last && <span className={`h-[26px] w-0.5 ${done ? 'bg-accent' : 'bg-line'}`} />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
              <span
                className={`heading-weight text-sm ${done || active ? 'text-ink' : 'text-mute'}`}
              >
                {labels[step]}
              </span>
              {!plain && (
                <span className="text-xs text-grey">
                  {fmtTime(time)}
                  {active && ' · current stage'}
                </span>
              )}
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="flex items-start gap-3.5">
          <span className="h-6 w-6 shrink-0 rounded-full border border-red bg-red" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
            <span className="heading-weight text-sm text-red">Report cancelled</span>
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
    unassigned: 'rounded-full border border-white bg-accent shadow-sm',
    site: 'rounded-tag border border-white bg-ink shadow-sm',
    onsite: 'rounded-tag border border-white bg-green shadow-sm',
    technician: 'rounded-tag border border-white bg-blue shadow-sm',
  };
  const hasBolt = { onsite: true, technician: true };
  const label = {
    unassigned: 'Unassigned',
    site: 'Assigned',
    onsite: 'Technician on site',
    technician: 'Technician',
  };
  return (
    <div className="eyebrow flex flex-wrap gap-x-3.5 gap-y-2 px-5 py-3.5">
      {items.map((item) => (
        <span key={item} className="flex items-center gap-1.5">
          <span
            className={`flex items-center justify-center ${hasBolt[item] ? 'h-4 w-4' : 'h-3 w-3'} ${swatch[item]}`}
          >
            {hasBolt[item] && <Zap size={10} strokeWidth={0} fill="white" aria-hidden="true" />}
          </span>
          {label[item]}
        </span>
      ))}
    </div>
  );
}
