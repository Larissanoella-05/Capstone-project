import { aTechnician, noticeText } from '../domain/notificationText.js';

/** Always called inside the transaction of the event it describes, so the two cannot drift apart. */
export function notify(tx, { userId, faultId, type, title, message }) {
  return tx.notification.create({ data: { userId, faultId, type, title, message } });
}

const TYPE_FOR_STATUS = {
  ON_THE_WAY: 'TECHNICIAN_ON_THE_WAY',
  ARRIVED: 'TECHNICIAN_ARRIVED',
  RESOLVED: 'FAULT_RESOLVED',
  CANCELLED: 'FAULT_CANCELLED',
};

/**
 * @param {string} status
 * @param {{ reference: string, technicianName?: string, language?: string }} details
 */
export function customerMessageFor(status, { reference, technicianName, language = 'en' }) {
  const type = TYPE_FOR_STATUS[status];
  if (!type) return null; // WORKING does not notify the customer
  const technician = technicianName
    ? technicianName.split(' ').slice(0, 2).join(' ')
    : aTechnician(language);
  return { type, ...noticeText(type, language, { reference, technician }) };
}
