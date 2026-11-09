/** Where the signed-in user for the "/" route should go: 'wait', a role home path, or 'landing'. */
export function homeDecision(user, loading, homeByRole) {
  if (loading) return 'wait';
  if (user) return homeByRole[user.role];
  return 'landing';
}

/** Every action on the landing page goes to sign-in, remembering where the visitor was heading. */
export function loginLink(target) {
  return { to: '/login', state: { from: target } };
}

/** Where a user who has just signed in goes: the page they were heading to if it is in their own area, else their home. */
export function postLoginPath(from, role, homeByRole) {
  const home = homeByRole[role];
  const inOwnArea = typeof from === 'string' && (from === home || from.startsWith(`${home}/`));
  return inOwnArea ? from : home;
}

/** Creating an account is open to any customer. */
export const registerLink = { to: '/register' };

/** Reporting needs no account, so these actions go straight to the report form. */
export const guestReportLink = { to: '/report' };

export const TARGETS = {
  customerReport: '/customer/report',
  customer: '/customer',
  coordinator: '/coordinator',
  technician: '/technician',
};
