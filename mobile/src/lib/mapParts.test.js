import { faultMapParts } from './mapParts.js';

const fault = (
  status,
  technician = { id: 7, name: 'Jean Claude', location: { latitude: -1.95, longitude: 30.17 } }
) => ({
  id: 1,
  reference: 'FR-1042',
  status,
  serviceLocation: { latitude: -1.94, longitude: 30.18, cell: 'Cyaruzinge' },
  technician,
});

describe('faultMapParts', () => {
  it('shows only the fault, as unassigned, when REPORTED', () => {
    const { markers, lines } = faultMapParts(fault('REPORTED', null));
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({ id: 'fault-1', kind: 'unassigned', lat: -1.94, lng: 30.18 });
    expect(lines).toEqual([]);
  });

  it('does not show a technician for REPORTED even if one is attached', () => {
    expect(faultMapParts(fault('REPORTED')).markers).toHaveLength(1);
  });

  it.each(['ASSIGNED', 'ON_THE_WAY'])('shows the technician and a line when %s', (status) => {
    const { markers, lines } = faultMapParts(fault(status));
    expect(markers.map((m) => m.kind)).toEqual(['site', 'technician']);
    expect(lines).toEqual([
      [
        [-1.95, 30.17],
        [-1.94, 30.18],
      ],
    ]);
  });

  it.each(['ARRIVED', 'WORKING'])(
    'marks the technician on site and draws no line when %s',
    (status) => {
      const { markers, lines } = faultMapParts(fault(status));
      expect(markers[1].kind).toBe('onsite');
      expect(lines).toEqual([]);
    }
  );

  it('hides the technician once RESOLVED or CANCELLED', () => {
    expect(faultMapParts(fault('RESOLVED')).markers).toHaveLength(1);
    expect(faultMapParts(fault('CANCELLED')).markers).toHaveLength(1);
  });

  it('skips a technician with no known position', () => {
    const { markers, lines } = faultMapParts(
      fault('ON_THE_WAY', { id: 7, name: 'Jean Claude', location: null })
    );
    expect(markers).toHaveLength(1);
    expect(lines).toEqual([]);
  });
});
