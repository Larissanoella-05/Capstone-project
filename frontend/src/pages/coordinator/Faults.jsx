import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import {
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  STAGES,
  STATUS_LABEL,
  fmtDateTime,
} from '../../lib/format.js';
import { CoordinatorHeading } from '../../components/CoordinatorShell.jsx';
import { PriorityPill, StatusPill } from '../../components/Pills.jsx';
import { Async, EmptyState } from '../../components/States.jsx';
import { pagedPath, pageSummary } from '../../lib/paging.js';

const DEFAULTS = { search: '', status: 'OPEN', priority: 'ALL', date: 'ANY', page: 1 };

export default function Faults() {
  const [filters, setFilters] = useState(DEFAULTS);
  const [search, setSearch] = useState('');

  // Wait until typing pauses before asking the API.
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((current) => ({ ...current, search: search.trim(), page: 1 })),
      300
    );
    return () => clearTimeout(timer);
  }, [search]);

  const state = useApi(pagedPath(filters), { interval: 5000 });
  // Only the count is needed here, so ask for a single row instead of every report.
  const totals = useApi('/faults?status=ALL&pageSize=1', { interval: 15000 });
  const set = (key) => (event) =>
    setFilters((current) => ({ ...current, [key]: event.target.value, page: 1 }));
  const goToPage = (page) => setFilters((current) => ({ ...current, page }));
  const { page: _page, ...activeFilters } = filters;
  const { page: _defaultPage, ...defaultFilters } = DEFAULTS;
  const filtered = JSON.stringify(activeFilters) !== JSON.stringify(defaultFilters);

  // If reports disappear while the coordinator is on a late page, step back to the last page that exists.
  const lastPage = state.data?.totalPages;
  useEffect(() => {
    if (lastPage && filters.page > lastPage)
      setFilters((current) => ({ ...current, page: lastPage }));
  }, [lastPage, filters.page]);

  return (
    <>
      <CoordinatorHeading
        eyebrow={
          state.data && totals.data
            ? `${state.data.total} of ${totals.data.total} reports`
            : 'All reports'
        }
        title="Fault management"
      />

      <div className="grid grid-cols-1 gap-4 border border-ink p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
          <label htmlFor="search" className="eyebrow">
            Search
          </label>
          <input
            id="search"
            type="search"
            className="field"
            placeholder="Fault ID, category, cell, customer or technician"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="eyebrow">
            Status
          </label>
          <select id="status" className="field" value={filters.status} onChange={set('status')}>
            <option value="OPEN">All open</option>
            {STAGES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
            <option value="CANCELLED">Cancelled</option>
            <option value="ALL">All reports</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="priority" className="eyebrow">
            Priority
          </label>
          <select
            id="priority"
            className="field"
            value={filters.priority}
            onChange={set('priority')}
          >
            <option value="ALL">All priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABEL[priority]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="date" className="eyebrow">
            Reported
          </label>
          <select id="date" className="field" value={filters.date} onChange={set('date')}>
            <option value="ANY">Any date</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">Last 7 days</option>
          </select>
        </div>
        <button
          type="button"
          className="btn btn-outline min-h-12"
          disabled={!filtered && !search}
          onClick={() => {
            setSearch('');
            setFilters(DEFAULTS);
          }}
        >
          Clear
        </button>
      </div>

      <Async state={state} label="Loading faults">
        {({ faults, total, page, pageSize }) =>
          faults.length === 0 ? (
            <EmptyState title="No faults match">
              {filtered
                ? 'Change or clear the filters to see more reports.'
                : 'There are no open faults right now.'}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto border border-ink">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead>
                  <tr className="eyebrow bg-paper">
                    {[
                      'Fault ID',
                      'Category',
                      'Customer',
                      'Location',
                      'Priority',
                      'Reported',
                      'Status',
                      'Technician',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="border-b border-ink px-3 py-3 font-medium"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {faults.map((fault) => (
                    <tr
                      key={fault.id}
                      className="border-b border-line last:border-b-0 hover:bg-paper"
                    >
                      <td className="px-3 py-3 font-mono text-xs font-medium">{fault.reference}</td>
                      <td className="px-3 py-3 font-bold">{CATEGORY_LABEL[fault.category]}</td>
                      <td className="px-3 py-3">{fault.customer.name}</td>
                      <td className="px-3 py-3">{fault.serviceLocation.cell}</td>
                      <td className="px-3 py-3">
                        <PriorityPill priority={fault.priority} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">
                        {fmtDateTime(fault.reportedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={fault.status} audience="coordinator" />
                      </td>
                      <td className="px-3 py-3">{fault.technician?.name ?? '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          {fault.status === 'REPORTED' && (
                            <Link
                              to={`/coordinator/faults/${fault.id}/assign`}
                              className="btn btn-volt min-h-9 px-3 text-xs"
                            >
                              Assign
                            </Link>
                          )}
                          <Link
                            to={`/coordinator/faults/${fault.id}`}
                            className="btn btn-outline min-h-9 px-3 text-xs"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager
                summary={pageSummary({ page, pageSize, total })}
                onPrevious={() => goToPage(page - 1)}
                onNext={() => goToPage(page + 1)}
              />
            </div>
          )
        }
      </Async>
    </>
  );
}

function Pager({ summary, onPrevious, onNext }) {
  return (
    <nav
      aria-label="Fault list pages"
      className="flex items-center justify-between gap-3 border-t border-ink px-3 py-3"
    >
      <p className="font-mono text-xs">
        {summary.from}–{summary.to} of {summary.total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-outline min-h-9 px-3 text-xs"
          disabled={!summary.hasPrevious}
          onClick={onPrevious}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-outline min-h-9 px-3 text-xs"
          disabled={!summary.hasNext}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
