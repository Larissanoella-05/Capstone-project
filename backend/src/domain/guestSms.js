// Texts for a guest report: plain ASCII and under 160 characters, so each one is a single SMS.

export const GUEST_SMS_TYPES = new Set([
  'FAULT_SUBMITTED',
  'TECHNICIAN_ASSIGNED',
  'TECHNICIAN_ON_THE_WAY',
  'TECHNICIAN_ARRIVED',
  'FAULT_RESOLVED',
  'FAULT_CANCELLED',
]);

/** Accents are dropped (é becomes e) because a non-ASCII character makes the text 70 characters long. */
function ascii(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e]/g, '');
}

function firstName(name) {
  const first = name ? ascii(name).trim().split(/\s+/)[0] : '';
  return first ? first.slice(0, 20) : 'A technician';
}

/**
 * @param {string} type a notification type
 * @param {{ reference: string, token: string, technicianName?: string, webUrl: string }} details
 * @returns {{ type: string, message: string } | null} null when guests are not texted for this type
 */
export function guestSmsMessage(type, { reference, token, technicianName, webUrl }) {
  const link = `${webUrl}/track/${token}`;
  const who = firstName(technicianName);
  switch (type) {
    case 'FAULT_SUBMITTED':
      return {
        type,
        message: `Umuriro: report ${reference} received. Track: ${link} Urgent? Call 2727`,
      };
    case 'TECHNICIAN_ASSIGNED':
      return { type, message: `Umuriro ${reference}: ${who} is assigned. Track: ${link}` };
    case 'TECHNICIAN_ON_THE_WAY':
      return { type, message: `Umuriro ${reference}: ${who} is on the way. Track: ${link}` };
    case 'TECHNICIAN_ARRIVED':
      return { type, message: `Umuriro ${reference}: ${who} has arrived at the site.` };
    case 'FAULT_RESOLVED':
      return {
        type,
        message: `Umuriro ${reference}: your fault is marked fixed. Power still off? Report again or call 2727.`,
      };
    case 'FAULT_CANCELLED':
      return {
        type,
        message: `Umuriro ${reference}: your report was cancelled by the coordinator. Still a problem? Call 2727.`,
      };
    default:
      return null;
  }
}
