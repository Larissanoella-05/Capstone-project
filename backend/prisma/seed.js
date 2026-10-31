/**
 * Sample data for the Ndera Sector pilot (Gasabo District, Kigali).
 * Names, phone numbers, meter numbers and coordinates are invented for the demo.
 * Coordinates are approximate points inside the real cells of Ndera Sector.
 *
 * Run with:  npm run db:seed
 * Running it again wipes the tables and starts from the same state.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'demo1234';

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);
const daysAgoAt = (days, hour, minute) => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  date.setHours(hour, minute, 0, 0);
  return date;
};
const plus = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

const customers = [
  {
    key: 'aline',
    name: 'Aline Mukamana',
    email: 'aline@demo.rw',
    phone: '+250 788 300 114',
    location: {
      meterNumber: '0421 5583 019',
      village: 'Gasharu',
      cell: 'Kibenga',
      landmark: 'Behind Ndera health centre, blue gate',
      latitude: -1.9532,
      longitude: 30.1668,
    },
  },
  {
    key: 'ericn',
    name: 'Eric Niyonzima',
    email: 'eric.n@demo.rw',
    phone: '+250 788 412 907',
    location: {
      meterNumber: '0421 5590 772',
      village: 'Akasemuromba',
      cell: 'Bwiza',
      landmark: 'Opposite the Bwiza water point',
      latitude: -1.9446,
      longitude: 30.1572,
    },
  },
  {
    key: 'claudine',
    name: 'Claudine Uwase',
    email: 'claudine@demo.rw',
    phone: '+250 783 556 210',
    location: {
      meterNumber: '0421 5604 388',
      village: 'Karubibi',
      cell: 'Mukuyu',
      landmark: 'Second house after the Mukuyu primary school',
      latitude: -1.9611,
      longitude: 30.1822,
    },
  },
  {
    key: 'bosco',
    name: 'Jean Bosco Nkurunziza',
    email: 'jeanbosco@demo.rw',
    phone: '+250 785 119 643',
    location: {
      meterNumber: '0421 5571 204',
      village: 'Gatare',
      cell: 'Cyaruzinge',
      landmark: 'Shop with the green door, main road',
      latitude: -1.9382,
      longitude: 30.1761,
    },
  },
  {
    key: 'diane',
    name: 'Diane Umutoni',
    email: 'diane@demo.rw',
    phone: '+250 782 740 058',
    location: {
      meterNumber: '0421 5622 915',
      village: 'Jurwe',
      cell: 'Rudashya',
      landmark: 'Near the Rudashya market stalls',
      latitude: -1.9481,
      longitude: 30.1903,
    },
  },
];

const technicians = [
  {
    key: 'jeanclaude',
    name: 'Jean Claude Habimana',
    email: 'jeanclaude@demo.rw',
    phone: '+250 788 410 101',
    staffNumber: 'TEC-014',
    position: { latitude: -1.9395, longitude: 30.159, label: 'Masoro road' },
  },
  {
    key: 'patrick',
    name: 'Patrick Nshimiyimana',
    email: 'patrick@demo.rw',
    phone: '+250 788 410 102',
    staffNumber: 'TEC-021',
    position: { latitude: -1.9476, longitude: 30.1868, label: 'Rudashya road' },
  },
  {
    key: 'emmanuel',
    name: 'Emmanuel Ndayisaba',
    email: 'emmanuel@demo.rw',
    phone: '+250 788 410 103',
    staffNumber: 'TEC-009',
    position: { latitude: -1.9503, longitude: 30.1731, label: 'Ndera centre' },
  },
  {
    key: 'ericm',
    name: 'Eric Mugisha',
    email: 'eric.m@demo.rw',
    phone: '+250 788 410 104',
    staffNumber: 'TEC-027',
    position: { latitude: -1.9421, longitude: 30.1718, label: 'On the way to Cyaruzinge' },
  },
];

// Resolved history: spread over the last week so the analytics page has real intervals to measure.
// steps = minutes from report to [assigned, on the way, arrived, working, resolved]
const resolvedFaults = [
  {
    customer: 'aline',
    technician: 'jeanclaude',
    category: 'METER_ISSUE',
    priority: 'LOW',
    at: daysAgoAt(6, 14, 12),
    steps: [9, 14, 31, 33, 52],
    contacts: 1,
    outcome: 'SUPPLY_RESTORED',
    description: 'Meter display is blank after last night’s rain.',
    note: 'Reseated the meter communication cable and confirmed the display and token loading.',
  },
  {
    customer: 'diane',
    technician: 'patrick',
    category: 'POWER_OUTAGE',
    priority: 'HIGH',
    at: daysAgoAt(5, 8, 40),
    steps: [6, 9, 22, 24, 49],
    contacts: 0,
    outcome: 'SUPPLY_RESTORED',
    description: 'No power since early morning. Neighbours have electricity.',
    note: 'Replaced a burnt service fuse at the pole and tested supply at the meter.',
  },
  {
    customer: 'bosco',
    technician: 'emmanuel',
    category: 'LOW_VOLTAGE',
    priority: 'MEDIUM',
    at: daysAgoAt(4, 17, 5),
    steps: [8, 13, 33, 35, 71],
    contacts: 2,
    outcome: 'TEMPORARY_REPAIR',
    description: 'Fridge keeps switching off in the evening.',
    note: 'Tightened a loose neutral at the service connection. Voltage stable, conductor to be replaced.',
  },
  {
    customer: 'claudine',
    technician: 'ericm',
    category: 'DAMAGED_CONNECTION',
    priority: 'CRITICAL',
    at: daysAgoAt(3, 11, 20),
    steps: [4, 6, 19, 20, 58],
    contacts: 0,
    outcome: 'SUPPLY_RESTORED',
    description: 'Service wire hanging low over the path after a branch fell.',
    note: 'Isolated the line, re-tensioned and re-clamped the service drop, then restored supply.',
  },
  {
    customer: 'ericn',
    technician: 'jeanclaude',
    category: 'POWER_OUTAGE',
    priority: 'HIGH',
    at: daysAgoAt(3, 15, 48),
    steps: [7, 10, 27, 29, 46],
    contacts: 0,
    outcome: 'SUPPLY_RESTORED',
    description: 'Power went off while cooking, the breaker is still up.',
    note: 'Found a loose live terminal at the meter. Re-terminated and tested.',
  },
  {
    customer: 'aline',
    technician: 'emmanuel',
    category: 'POWER_OUTAGE',
    priority: 'HIGH',
    at: daysAgoAt(2, 12, 32),
    steps: [8, 12, 30, 31, 55],
    contacts: 0,
    outcome: 'SUPPLY_RESTORED',
    description: 'Whole compound has no electricity.',
    note: 'Replaced blown fuse at the service point and tested supply.',
  },
  {
    customer: 'diane',
    technician: 'patrick',
    category: 'METER_ISSUE',
    priority: 'LOW',
    at: daysAgoAt(2, 9, 15),
    steps: [10, 16, 29, 30, 44],
    contacts: 1,
    outcome: 'NO_FAULT_FOUND',
    description: 'Token will not load on the meter.',
    note: 'Meter working normally. Customer was entering an expired token; showed how to load a new one.',
  },
  {
    customer: 'bosco',
    technician: 'ericm',
    category: 'LOW_VOLTAGE',
    priority: 'MEDIUM',
    at: daysAgoAt(1, 18, 22),
    steps: [6, 10, 26, 28, 63],
    contacts: 0,
    outcome: 'REFERRED',
    description: 'Lights very dim every evening.',
    note: 'Voltage drop is on the shared low-voltage line. Referred to the network team for a line upgrade.',
  },
  {
    customer: 'claudine',
    technician: 'jeanclaude',
    category: 'POWER_OUTAGE',
    priority: 'HIGH',
    at: minutesAgo(190),
    steps: [5, 8, 24, 25, 47],
    contacts: 0,
    outcome: 'SUPPLY_RESTORED',
    description: 'Power off since this morning.',
    note: 'Reset the tripped service cut-out and tightened the terminals.',
  },
];

// Open faults waiting on the coordinator when the demo starts.
const openFaults = [
  {
    customer: 'bosco',
    technician: 'ericm',
    status: 'ASSIGNED',
    category: 'METER_ISSUE',
    priority: 'LOW',
    at: minutesAgo(46),
    assignedAfter: 9,
    description: 'Meter shows an error code and beeps.',
  },
  {
    customer: 'ericn',
    status: 'REPORTED',
    category: 'LOW_VOLTAGE',
    priority: 'MEDIUM',
    at: minutesAgo(24),
    description: 'Lights flicker and the TV restarts by itself.',
  },
  {
    customer: 'claudine',
    status: 'REPORTED',
    category: 'DAMAGED_CONNECTION',
    priority: 'CRITICAL',
    at: minutesAgo(11),
    description: 'Sparks at the connection on the pole next to the house.',
  },
];

async function main() {
  console.log('Clearing existing data…');
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "DeviceToken", "Notification", "TechnicianLocation", "FaultStatusHistory", "FaultReport", "ServiceLocation", "ServiceCoordinator", "Technician", "Customer", "User" RESTART IDENTITY CASCADE'
  );

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const customerByKey = {};
  const technicianByKey = {};

  for (const c of customers) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        passwordHash,
        role: 'CUSTOMER',
        customer: {
          create: {
            serviceLocations: { create: [{ ...c.location, sector: 'Ndera', district: 'Gasabo' }] },
          },
        },
      },
      include: { customer: { include: { serviceLocations: true } } },
    });
    customerByKey[c.key] = {
      user,
      customer: user.customer,
      location: user.customer.serviceLocations[0],
    };
  }

  for (const t of technicians) {
    const user = await prisma.user.create({
      data: {
        name: t.name,
        email: t.email,
        phone: t.phone,
        passwordHash,
        role: 'TECHNICIAN',
        technician: { create: { staffNumber: t.staffNumber, onDuty: true } },
      },
      include: { technician: true },
    });
    technicianByKey[t.key] = { user, technician: user.technician, position: t.position };
  }

  const grace = await prisma.user.create({
    data: {
      name: 'Grace Ingabire',
      email: 'grace@demo.rw',
      phone: '+250 788 200 045',
      passwordHash,
      role: 'COORDINATOR',
      coordinator: { create: { office: 'Ndera Sector' } },
    },
    include: { coordinator: true },
  });

  const STAGES = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED'];

  async function createFault({
    customer,
    technician,
    status,
    category,
    priority,
    at,
    description,
    stamps = {},
    extra = {},
  }) {
    const c = customerByKey[customer];
    const t = technician ? technicianByKey[technician] : null;
    const fault = await prisma.faultReport.create({
      data: {
        reference: `TMP-${customer}-${at.getTime()}`,
        category,
        priority,
        status,
        description,
        contactPhone: c.user.phone,
        customerId: c.customer.id,
        serviceLocationId: c.location.id,
        technicianId: t?.technician.id ?? null,
        assignedById: t ? grace.coordinator.id : null,
        reportedAt: at,
        ...stamps,
        ...extra,
      },
    });
    const reference = `FR-${1000 + fault.id}`;
    await prisma.faultReport.update({ where: { id: fault.id }, data: { reference } });
    return { ...fault, reference, c, t };
  }

  console.log('Creating resolved history…');
  for (const f of resolvedFaults) {
    const [assigned, onTheWay, arrived, working, resolved] = f.steps.map((m) => plus(f.at, m));
    const fault = await createFault({
      ...f,
      status: 'RESOLVED',
      stamps: {
        assignedAt: assigned,
        onTheWayAt: onTheWay,
        arrivedAt: arrived,
        workingAt: working,
        resolvedAt: resolved,
      },
      extra: {
        outcome: f.outcome,
        resolutionNote: f.note,
        workCompleted: f.note,
        clarificationContacts: f.contacts,
      },
    });

    await prisma.faultStatusHistory.createMany({
      data: [
        {
          faultId: fault.id,
          status: 'REPORTED',
          changedById: fault.c.user.id,
          createdAt: f.at,
          note: 'Fault reported by customer',
        },
        ...STAGES.map((status, index) => ({
          faultId: fault.id,
          status,
          changedById: status === 'ASSIGNED' ? grace.id : fault.t.user.id,
          createdAt: plus(f.at, f.steps[index]),
          note: status === 'ASSIGNED' ? `Assigned to ${fault.t.user.name}` : null,
        })),
      ],
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: fault.c.user.id,
          faultId: fault.id,
          type: 'FAULT_SUBMITTED',
          title: 'Fault Received',
          message: `We have received your electricity fault report #${fault.reference}. A service coordinator will assign a technician.`,
          read: true,
          createdAt: f.at,
        },
        {
          userId: fault.c.user.id,
          faultId: fault.id,
          type: 'TECHNICIAN_ARRIVED',
          title: 'Technician Arrived',
          message: `${fault.t.user.name.split(' ').slice(0, 2).join(' ')} has arrived at your service location for fault #${fault.reference}.`,
          read: true,
          createdAt: arrived,
        },
        {
          userId: fault.c.user.id,
          faultId: fault.id,
          type: 'FAULT_RESOLVED',
          title: 'Fault Resolved',
          message: `Your electricity fault #${fault.reference} has been resolved. Thank you for your patience.`,
          read: true,
          createdAt: resolved,
        },
      ],
    });
  }

  console.log('Creating open faults…');
  for (const f of openFaults) {
    const assignedAt = f.assignedAfter ? plus(f.at, f.assignedAfter) : null;
    const fault = await createFault({ ...f, stamps: assignedAt ? { assignedAt } : {} });

    await prisma.faultStatusHistory.create({
      data: {
        faultId: fault.id,
        status: 'REPORTED',
        changedById: fault.c.user.id,
        createdAt: f.at,
        note: 'Fault reported by customer',
      },
    });
    await prisma.notification.create({
      data: {
        userId: fault.c.user.id,
        faultId: fault.id,
        type: 'FAULT_SUBMITTED',
        title: 'Fault Received',
        message: `We have received your electricity fault report #${fault.reference}. A service coordinator will assign a technician.`,
        createdAt: f.at,
      },
    });

    if (assignedAt) {
      await prisma.faultStatusHistory.create({
        data: {
          faultId: fault.id,
          status: 'ASSIGNED',
          changedById: grace.id,
          createdAt: assignedAt,
          note: `Assigned to ${fault.t.user.name}`,
        },
      });
      await prisma.notification.createMany({
        data: [
          {
            userId: fault.c.user.id,
            faultId: fault.id,
            type: 'TECHNICIAN_ASSIGNED',
            title: 'Technician Assigned',
            message: `${fault.t.user.name} has been assigned to your electricity fault #${fault.reference}.`,
            createdAt: assignedAt,
          },
          {
            userId: fault.t.user.id,
            faultId: fault.id,
            type: 'JOB_ASSIGNED',
            title: 'New Job Assigned',
            message: `Fault #${fault.reference} at ${fault.c.location.cell} Cell has been assigned to you.`,
            createdAt: assignedAt,
          },
        ],
      });
    }
  }

  console.log('Placing technicians on the map…');
  for (const t of Object.values(technicianByKey)) {
    await prisma.technicianLocation.create({
      data: { technicianId: t.technician.id, ...t.position, recordedAt: minutesAgo(4) },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    serviceLocations: await prisma.serviceLocation.count(),
    faults: await prisma.faultReport.count(),
    statusHistory: await prisma.faultStatusHistory.count(),
    notifications: await prisma.notification.count(),
  };
  console.log('Seed complete:', counts);
  console.log(`\nDemo accounts (password for all: ${DEMO_PASSWORD})`);
  console.log('  Customer             aline@demo.rw');
  console.log('  Service Coordinator  grace@demo.rw');
  console.log('  Technician           jeanclaude@demo.rw');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
