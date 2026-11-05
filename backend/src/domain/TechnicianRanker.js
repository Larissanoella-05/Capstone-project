/** Sorts by availability, distance (unknown last), workload, then name; the first AVAILABLE one is `recommended`. */
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
