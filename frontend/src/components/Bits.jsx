import { Check } from 'lucide-react';
import {
  CUSTOMER_TIMELINE_LABEL,
  STAGES,
  STATUS_LABEL,
  STATUS_TIME_FIELD,
  fmtTime,
} from '../lib/format.js';

/** Label on the left, value on the right, hairline underneath. */
export function KeyRow({ label, children, mono = false, last = false }) {
  return (
    <div className={`flex justify-between gap-4 py-2.5 ${last ? '' : 'border-b border-line'}`}>
      <span className="eyebrow shrink-0 leading-5 text-muted">{label}</span>
      <span className={`text-right text-sm ${mono ? 'font-mono font-medium' : 'font-semibold'}`}>
        {children}
      </span>
    </div>
  );
}

/** Label above value, used in the bordered detail grids. */
export function Cell({ label, children, className = '' }) {
  return (
    <div className={`p-3 ${className}`}>
      <div className="eyebrow text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold">{children}</div>
    </div>
  );
}

/** Page title block with the small label above it. */
export function PageHeading({ eyebrow, title, children }) {
  return (
    <div className="border-b border-ink pb-4">
      {eyebrow && <div className="eyebrow text-muted">{eyebrow}</div>}
      <h1 className="display mt-2 text-3xl">{title}</h1>
      {children}
    </div>
  );
}

/** Six numbered boxes: done stages are black, the current stage is yellow. */
export function StageBar({ status }) {
  const current = STAGES.indexOf(status);
  return (
    <div>
      <div className="grid grid-cols-6 border border-ink font-mono text-[11px]" aria-hidden="true">
        {STAGES.map((stage, index) => {
          const done = index < current || status === 'RESOLVED';
          const active = index === current && status !== 'RESOLVED';
          return (
            <div
              key={stage}
              className={`h-11 p-2 ${index > 0 ? 'border-l' : ''} ${
                done
                  ? 'border-white bg-ink text-white'
                  : active
                    ? 'border-ink bg-volt'
                    : 'border-ink text-muted'
              }`}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
          );
        })}
      </div>
      <div className="eyebrow mt-2">
        {current >= 0
          ? `Stage ${current + 1} of ${STAGES.length} · ${STATUS_LABEL[status]}`
          : (STATUS_LABEL[status] ?? status)}
      </div>
    </div>
  );
}

/**
 * The response timeline. Times come from the timestamp stored for each stage,
 * so every role reads the same history.
 */
export function Timeline({ fault, audience = 'customer' }) {
  const current = STAGES.indexOf(fault.status);
  const labels = audience === 'customer' ? CUSTOMER_TIMELINE_LABEL : STATUS_LABEL;

  return (
    <ol className="m-0 flex list-none flex-col gap-3.5 p-4">
      {STAGES.map((stage, index) => {
        const time = fault[STATUS_TIME_FIELD[stage]];
        const done = Boolean(time) && (index < current || fault.status === 'RESOLVED');
        const active = index === current && fault.status !== 'RESOLVED';
        return (
          <li
            key={stage}
            aria-current={active ? 'step' : undefined}
            className="flex items-center gap-3"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center border ${
                done ? 'border-ink bg-ink' : active ? 'border-ink bg-volt' : 'border-line bg-white'
              }`}
            >
              {done && <Check size={16} strokeWidth={2.5} color="#FFFFFF" aria-hidden="true" />}
              {active && <span className="h-2 w-2 bg-ink" />}
            </span>
            <span className={`flex-1 text-sm ${done || active ? 'font-bold' : 'text-muted'}`}>
              {labels[stage]}
              {active && (
                <span className="eyebrow mt-0.5 block text-[10px] font-normal text-muted">
                  Current stage
                </span>
              )}
            </span>
            <span className="font-mono text-xs">{fmtTime(time)}</span>
          </li>
        );
      })}
      {fault.status === 'CANCELLED' && (
        <li className="flex items-center gap-3">
          <span className="h-7 w-7 shrink-0 border border-danger bg-danger" />
          <span className="flex-1 text-sm font-bold">Report cancelled</span>
          <span className="font-mono text-xs">{fmtTime(fault.cancelledAt)}</span>
        </li>
      )}
    </ol>
  );
}

/** The small key under a map. */
export function MapLegend({ items }) {
  const swatch = {
    unassigned: 'bg-danger',
    site: 'bg-ink',
    onsite: 'rounded-full border-2 border-ink bg-ok',
    technician: 'rounded-full border-2 border-ink bg-volt',
  };
  const label = {
    unassigned: 'Unassigned fault',
    site: 'Assigned / on the way',
    onsite: 'Technician on site',
    technician: 'Technician',
  };
  return (
    <div className="eyebrow flex flex-wrap gap-x-5 gap-y-2 border-t border-ink px-4 py-3">
      {items.map((item) => (
        <span key={item} className="flex items-center gap-2">
          <span className={`inline-block h-3.5 w-3.5 ${swatch[item]}`} />
          {label[item]}
        </span>
      ))}
    </div>
  );
}
