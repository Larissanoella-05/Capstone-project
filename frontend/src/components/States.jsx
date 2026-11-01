import { useEffect, useRef } from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';

export function Loading({ label = 'Loading' }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 border border-line px-4 py-10 text-muted"
    >
      <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
      <span className="eyebrow">{label}…</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="border border-danger">
      <div className="flex items-start gap-3 p-4">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <div className="text-base font-black uppercase">This did not load</div>
          <p className="mt-1 text-sm">
            {error?.message || 'Could not load this. Check your connection and try again.'}
          </p>
        </div>
      </div>
      {onRetry && (
        <div className="border-t border-danger p-3">
          <button type="button" className="btn btn-outline w-full" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="border border-line px-4 py-8 text-center">
      <div className="text-base font-black uppercase">{title}</div>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Inline message under a form. */
export function FormError({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 border border-danger bg-white p-3 text-sm font-semibold text-danger"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

/**
 * "There is a problem" box at the top of a form. Focus moves to it when it appears, and each
 * entry links to its field. `items` come from `errorSummary` in lib/formErrors.js.
 */
export function ErrorSummary({ items }) {
  const ref = useRef(null);
  const count = items.length;
  useEffect(() => {
    if (count) ref.current?.focus();
  }, [count]);
  if (!count) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="border-2 border-danger bg-white p-4 focus:outline-none"
    >
      <h2 className="m-0 text-base font-black uppercase text-danger">There is a problem</h2>
      <ul className="mb-0 mt-2 list-none p-0 text-sm font-semibold">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="inline-flex min-h-11 items-center text-danger underline"
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(item.id);
                target?.scrollIntoView({ block: 'center' });
                const input = target?.matches('input, textarea')
                  ? target
                  : target?.querySelector('input');
                input?.focus();
              }}
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Handles the three states every data screen has before it can show its content. */
export function Async({ state, label, children }) {
  if (state.loading && !state.data) return <Loading label={label} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  return children(state.data);
}
