/** Where a notification should open for this role. `data` is { faultId, type }, as the backend pushes it. */
export function routeForNotification(role, data) {
  const base = { CUSTOMER: '/customer', TECHNICIAN: '/technician' }[role];
  if (!base) return null;
  const faultId = Number(data?.faultId);
  if (!Number.isInteger(faultId) || faultId <= 0) return `${base}/notifications`;
  return role === 'CUSTOMER' ? `/customer/faults/${faultId}` : `/technician/jobs/${faultId}`;
}
