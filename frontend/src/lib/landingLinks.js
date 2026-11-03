// Routing helpers for the public landing page at "/".

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

export const TARGETS = {
  customerReport: '/customer/report',
  customer: '/customer',
  coordinator: '/coordinator',
  technician: '/technician',
};
