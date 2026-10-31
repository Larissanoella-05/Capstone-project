/**
 * Orders technicians for a fault so the coordinator sees the best choice first.
 *
 * Ranking keys, compared in order (a multi-key sort, O(n log n)):
 *   1. Availability  AVAILABLE before ON_JOB before OFF_DUTY
 *   2. Distance      closer to the service location first (unknown position last)
 *   3. Workload      fewer active jobs first
 *   4. Name          alphabetical, so the order is stable and predictable
 *
 * The first technician who is AVAILABLE is marked `recommended`.
 * Without a target location (no fault given) the list is sorted by name only.
 */
export class TechnicianRanker {
  static AVAILABILITY_ORDER = Object.freeze({ AVAILABLE: 0, ON_JOB: 1, OFF_DUTY: 2 });

  /** @param {{ id: number, availability: string, distanceKm: number|null, activeJobs: unknown[], name: string }[]} technicians */
  rank(technicians, { hasTarget = true } = {}) {
    const ordered = [...technicians].sort(
      hasTarget ? TechnicianRanker.compare : TechnicianRanker.compareByName
    );
    const recommendedId = hasTarget
      ? ordered.find((t) => t.availability === 'AVAILABLE')?.id
      : undefined;
    return ordered.map((technician) => ({
      ...technician,
      recommended: technician.id === recommendedId,
    }));
  }

  static compareByName(a, b) {
    return a.name.localeCompare(b.name);
  }

  static compare(a, b) {
    const order = TechnicianRanker.AVAILABILITY_ORDER;
    return (
      (order[a.availability] ?? 3) - (order[b.availability] ?? 3) ||
      (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) ||
      (a.activeJobs?.length ?? 0) - (b.activeJobs?.length ?? 0) ||
      TechnicianRanker.compareByName(a, b)
    );
  }
}

export const technicianRanker = new TechnicianRanker();
