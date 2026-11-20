// Copy for the public /privacy page. Kept out of the component so a test can scan it.
import { HOTLINE } from './landingCopy.js';

export const POLICY = {
  title: 'Privacy policy',
  updated: '20 November 2026',
  approval: 'SEPT26-BSE-025',
  contactEmail: 's.noella@alustudent.com',
  sections: [
    {
      heading: 'What this is',
      paragraphs: [
        'Umuriro Response is a final-year capstone project at African Leadership University. It helps people in Ndera Sector, Kigali, report an electricity fault and follow its progress.',
        `It is a research prototype and is not connected to the Rwanda Energy Group, so a report made here does not reach a REG technician. To report a real fault, call ${HOTLINE}. The study was approved by the ALU Research Ethics Committee (approval code SEPT26-BSE-025).`,
      ],
    },
    {
      heading: 'What we collect',
      paragraphs: [
        'If you register, we store your name, your email or phone number, and a password that is kept only as a hash. A customer account also holds the meter number and the registered position of each service location.',
        'When you report a fault, we store its type, a written place or the position your phone reports, and an optional photo. A guest report also stores the phone number you give. Technicians are tracked only while they work on a job.',
        'Phone users who allow notifications also have a device token stored, so the app can send updates. We do not track customers.',
      ],
    },
    {
      heading: 'Why we collect it',
      paragraphs: [
        'Your position and phone number let a coordinator send a technician and let the system tell you how the repair is going. Stage times and arrival distances are used only to describe how the system worked during the study.',
      ],
    },
    {
      heading: 'How it is protected',
      paragraphs: [
        'All traffic uses HTTPS. A customer’s reports can be opened only by that customer, by coordinators and by the assigned technician. Sign-in, registration and guest reports are rate-limited.',
        'A guest’s tracking link is an unguessable key. The page it opens hides your phone number, meter number and the technician’s surname, and the link stops working seven days after the fault is resolved.',
      ],
    },
    {
      heading: 'Where it is kept',
      paragraphs: [
        'The service runs on free plans of Render, Vercel and Neon, and your data may be stored on servers outside Rwanda. Photos are stored inside the database. Text messages are sent only when the service has a phone gateway connected; otherwise they are only logged.',
      ],
    },
    {
      heading: 'A tradeoff worth knowing',
      paragraphs: [
        'You can report a fault without signing in, because nobody should need an account in an emergency. A guest report cannot be verified, so it relies on your phone number and on the expiring tracking link.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'Taking part is voluntary and unpaid. You can stop at any time, and you can ask questions about this study or about your data at any time.',
      ],
    },
    {
      heading: 'Retention',
      paragraphs: [
        'Test reports and the phone numbers attached to them will be deleted when the study ends. Combined figures, such as the usability scores in the project report, contain no identifiers and may be kept.',
      ],
    },
    {
      heading: 'Not a replacement for 2727',
      paragraphs: [
        `Umuriro Response does not diagnose faults or estimate when power will return. For an emergency or a real outage, call ${HOTLINE}.`,
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        'This project is owned by Shimirwa Larissa Noella at African Leadership University. For questions about how your data is handled, write to s.noella@alustudent.com.',
      ],
    },
  ],
};
