/**
 * Tracks which unassigned reports the coordinator has already been told about.
 * The first list is the starting point: reports already waiting when the page opens are not "new".
 * @param {{ seen: Set<number>, fresh: Set<number> } | null} state
 * @param {{ id: number, status: string }[]} faults
 */
export function updateNewReports(state, faults) {
  const unassigned = faults.filter((fault) => fault.status === 'REPORTED').map((fault) => fault.id);
  if (!state) return { seen: new Set(unassigned), fresh: new Set() };

  const seen = new Set(state.seen);
  const fresh = new Set(state.fresh);
  for (const id of unassigned) {
    if (!seen.has(id)) {
      seen.add(id);
      fresh.add(id);
    }
  }
  // A report that someone has since assigned or cancelled no longer needs attention.
  for (const id of fresh) if (!unassigned.includes(id)) fresh.delete(id);
  return { seen, fresh };
}

/** The coordinator has seen the alert: keep what has been seen, clear what is new. */
export function acknowledgeNewReports(state) {
  return state ? { seen: state.seen, fresh: new Set() } : state;
}

export const newReportsText = (count) =>
  count === 1 ? '1 new report needs a technician' : `${count} new reports need a technician`;

/** The browser tab title, with the count in front while there is something new. */
export const tabTitle = (base, count) => (count > 0 ? `(${count}) ${base}` : base);
