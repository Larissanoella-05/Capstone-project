import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serializeFault, serializePublicFault } from '../../src/domain/FaultSerializer.js';

const row = (extra = {}) => ({
  id: 5,
  reference: 'FR-1005',
  category: 'POWER_OUTAGE',
  description: 'No power',
  contactPhone: '+250788000001',
  photo: 'data:image/png;base64,AAAA',
  priority: 'HIGH',
  status: 'ARRIVED',
  reportedAt: new Date('2026-10-01T08:00:00Z'),
  arrivedAt: new Date('2026-10-01T08:30:00Z'),
  arrivalDistanceM: 42,
  clarificationContacts: 1,
  customer: { id: 2, user: { name: 'Aline', phone: '+250788000001' } },
  serviceLocation: {
    id: 9,
    meterNumber: 'M-1',
    village: 'Rugende',
    cell: 'Kibenga',
    sector: 'Ndera',
    district: 'Gasabo',
    landmark: 'Blue gate',
    latitude: -1.95,
    longitude: 30.17,
  },
  technician: {
    id: 4,
    staffNumber: 'T-04',
    user: { name: 'Jean Claude', phone: '+250788000002' },
    locations: [
      { latitude: -1.951, longitude: 30.17, label: 'Device', recordedAt: new Date('2026-10-01') },
    ],
  },
  history: [
    {
      id: 1,
      status: 'REPORTED',
      note: null,
      createdAt: new Date('2026-10-01T08:00:00Z'),
      changedBy: { name: 'Aline' },
    },
  ],
  ...extra,
});

describe('serializeFault', () => {
  it('shapes a full row into the JSON the three clients share', () => {
    const fault = serializeFault(row());
    assert.equal(fault.reference, 'FR-1005');
    assert.equal(fault.arrivalDistanceM, 42);
    assert.equal(fault.customer.name, 'Aline');
    assert.equal(fault.serviceLocation.cell, 'Kibenga');
    assert.equal(fault.technician.name, 'Jean Claude');
    assert.equal(fault.technician.location.label, 'Device');
    assert.deepEqual(
      fault.history.map((h) => [h.status, h.changedBy]),
      [['REPORTED', 'Aline']]
    );
  });

  it('computes the technician distance from the last recorded position', () => {
    assert.equal(serializeFault(row()).technician.distanceKm, 0.1);
  });

  it('leaves optional parts empty instead of failing', () => {
    const fault = serializeFault(
      row({ technician: null, customer: null, photo: undefined, arrivalDistanceM: undefined })
    );
    assert.equal(fault.technician, null);
    assert.equal(fault.customer, null);
    assert.equal(fault.photo, null);
    assert.equal(fault.arrivalDistanceM, null);
  });

  it('gives a technician with no position a null location and distance', () => {
    const fault = serializeFault(row({ technician: { ...row().technician, locations: [] } }));
    assert.equal(fault.technician.location, null);
    assert.equal(fault.technician.distanceKm, null);
  });

  it('treats a missing history as an empty list', () => {
    assert.deepEqual(serializeFault(row({ history: undefined })).history, []);
  });
});

/** A report made without an account: no customer, no registered location, its own point. */
const guestRow = (extra = {}) =>
  row({
    customerId: null,
    customer: null,
    serviceLocation: null,
    history: [
      {
        id: 1,
        status: 'ASSIGNED',
        note: 'Assigned to Jean Claude Habimana',
        createdAt: new Date('2026-10-01T08:10:00Z'),
        changedBy: { name: 'Grace Ingabire' },
      },
    ],
    contactPhone: '+250788123456',
    latitude: -1.94,
    longitude: 30.16,
    accuracyM: 35,
    locationSource: 'GPS',
    cell: 'Kibenga',
    placeText: 'Near the blue gate',
    claimedMeter: '01234567890',
    trackingToken: 'secret-token',
    ...extra,
  });

describe('serializeFault for a guest report', () => {
  it('builds a serviceLocation from the report so the clients keep working', () => {
    const fault = serializeFault(guestRow());
    assert.deepEqual(fault.serviceLocation, {
      id: null,
      meterNumber: '01234567890',
      village: null,
      cell: 'Kibenga',
      sector: 'Ndera',
      district: 'Gasabo',
      landmark: 'Near the blue gate',
      latitude: -1.94,
      longitude: 30.16,
    });
    assert.equal(fault.customer, null);
  });

  it('says Unknown when the cell is not known yet', () => {
    assert.equal(serializeFault(guestRow({ cell: null })).serviceLocation.cell, 'Unknown');
  });

  it('flags the report as a guest report and keeps the accuracy and how the point was found', () => {
    const fault = serializeFault(guestRow());
    assert.equal(fault.isGuest, true);
    assert.equal(fault.accuracyM, 35);
    assert.equal(fault.locationSource, 'GPS');
  });

  it('marks a registered report as not a guest report', () => {
    const fault = serializeFault(row());
    assert.equal(fault.isGuest, false);
    assert.equal(fault.accuracyM, null);
  });

  it('measures the technician distance to the report point', () => {
    const fault = serializeFault(guestRow());
    assert.equal(typeof fault.technician.distanceKm, 'number');
  });

  it('has no map point for a written place only', () => {
    const fault = serializeFault(guestRow({ latitude: null, longitude: null, accuracyM: null }));
    assert.equal(fault.serviceLocation.latitude, null);
    assert.equal(fault.technician.distanceKm, null);
  });

  it('never exposes the tracking token', () => {
    assert.equal(JSON.stringify(serializeFault(guestRow())).includes('secret-token'), false);
  });
});

describe('serializePublicFault', () => {
  it('keeps the shape the tracking view reads', () => {
    const fault = serializePublicFault(guestRow());
    assert.equal(fault.reference, 'FR-1005');
    assert.equal(fault.status, 'ARRIVED');
    assert.equal(fault.serviceLocation.cell, 'Kibenga');
    assert.equal(fault.technician.location.label, 'Device');
    assert.equal(fault.history.length, 1);
  });

  it('shows the technician by first name only, with no phone or staff number', () => {
    const { technician } = serializePublicFault(guestRow());
    assert.equal(technician.name, 'Jean');
    assert.equal(technician.phone, null);
    assert.equal(technician.staffNumber, null);
    assert.equal(technician.id, null);
  });

  it('leaves out every phone number, the meter number and who changed the status', () => {
    const fault = serializePublicFault(guestRow());
    const text = JSON.stringify(fault);
    assert.equal(text.includes('+250788123456'), false);
    assert.equal(text.includes('+250788000002'), false);
    assert.equal(text.includes('01234567890'), false);
    assert.equal(text.includes('secret-token'), false);
    assert.equal(fault.contactPhone, null);
    assert.equal(fault.serviceLocation.meterNumber, null);
    assert.equal(fault.history[0].changedBy, null);
    assert.equal(fault.history[0].note, null); // notes can name staff in full
    assert.equal(text.includes('Habimana'), false);
    assert.equal(text.includes('Ingabire'), false);
    assert.equal(fault.customer, null);
  });

  it('works for a report that has no technician yet', () => {
    const fault = serializePublicFault(guestRow({ technician: null }));
    assert.equal(fault.technician, null);
  });
});
