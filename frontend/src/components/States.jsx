import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';

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
          <p className="mt-1 text-sm">{error?.message || 'Something went wrong.'}</p>
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
      <Inbox size={22} className="mx-auto text-muted" aria-hidden="true" />
      <div className="mt-3 text-base font-black uppercase">{title}</div>
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

/** Handles the three states every data screen has before it can show its content. */
export function Async({ state, label, children }) {
  if (state.loading && !state.data) return <Loading label={label} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  return children(state.data);
}
