import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serializeFault } from '../../src/domain/FaultSerializer.js';

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
