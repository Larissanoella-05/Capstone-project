/** How many faults the coordinator list shows per page. The API allows up to 100. */
export const PAGE_SIZE = 20;

/**
 * The words and buttons under a paged list: "21–40 of 53", and whether Previous and Next work.
 * @param {{ page: number, pageSize: number, total: number }} paging
 */
export function pageSummary({ page, pageSize, total }) {
  if (total === 0) return { from: 0, to: 0, total, hasPrevious: false, hasNext: false };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { from, to, total, hasPrevious: page > 1, hasNext: to < total };
}

/**
 * The address of one page of the fault list. Filters that mean "everything" are left out.
 * @param {{ status: string, priority?: string, date?: string, search?: string, page: number }} filters
 */
export function pagedPath({ status, priority, date, search, page }) {
  const params = new URLSearchParams({ status });
  if (priority && priority !== 'ALL') params.set('priority', priority);
  if (date && date !== 'ANY') params.set('date', date);
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('pageSize', String(PAGE_SIZE));
  return `/faults?${params}`;
}
