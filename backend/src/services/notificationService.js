/**
 * Creates in-app notifications. Always called inside the same database
 * transaction as the event that caused it, so the two cannot drift apart.
 */
export function notify(tx, { userId, faultId, type, title, message }) {
  return tx.notification.create({ data: { userId, faultId, type, title, message } });
}

/**
 * The message a customer receives when their fault enters a status.
 * @param {string} status
 * @param {{ reference: string, technicianName?: string }} details
 */
export function customerMessageFor(status, { reference, technicianName }) {
  const first = technicianName ? technicianName.split(' ').slice(0, 2).join(' ') : 'A technician';
  switch (status) {
    case 'ON_THE_WAY':
      return {
        type: 'TECHNICIAN_ON_THE_WAY',
        title: 'Technician On the Way',
        message: `${first} is on the way to your service location for fault #${reference}.`,
      };
    case 'ARRIVED':
      return {
        type: 'TECHNICIAN_ARRIVED',
        title: 'Technician Arrived',
        message: `${first} has arrived at your service location for fault #${reference}.`,
      };
    case 'RESOLVED':
      return {
        type: 'FAULT_RESOLVED',
        title: 'Fault Resolved',
        message: `Your electricity fault #${reference} has been resolved. Thank you for your patience.`,
      };
    case 'CANCELLED':
      return {
        type: 'FAULT_CANCELLED',
        title: 'Report Cancelled',
        message: `Your fault report #${reference} was cancelled by the service coordinator.`,
      };
    default:
      return null; // WORKING does not notify the customer
  }
}
