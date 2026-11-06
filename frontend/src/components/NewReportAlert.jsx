import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import {
  acknowledgeNewReports,
  newReportsText,
  tabTitle,
  updateNewReports,
} from '../lib/newReports.js';

/** Tells the coordinator, on any coordinator page, that a report arrived that nobody has picked up. */
export default function NewReportAlert() {
  const unassigned = useApi('/faults?status=REPORTED', { interval: 8000 });
  const [state, setState] = useState(null);

  useEffect(() => {
    if (unassigned.data) setState((current) => updateNewReports(current, unassigned.data.faults));
  }, [unassigned.data]);

  const count = state?.fresh.size ?? 0;

  // The tab title shows the count, so it is seen from another tab or window too.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = tabTitle(base, count);
    return () => {
      document.title = base;
    };
  }, [count]);

  if (count === 0) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 border-2 border-accent bg-accent px-4 py-3 text-on-accent"
    >
      <p className="m-0 text-sm font-bold">{newReportsText(count)}</p>
      <div className="flex gap-2">
        <Link
          to="/coordinator"
          className="btn btn-outline min-h-11 bg-paper px-3 text-xs text-ink"
          onClick={() => setState(acknowledgeNewReports)}
        >
          View
        </Link>
        <button
          type="button"
          className="btn btn-outline min-h-11 bg-paper px-3 text-xs text-ink"
          onClick={() => setState(acknowledgeNewReports)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
