import {
  buildRegisterPayload,
  identifierError,
  looksLikeEmail,
  validateRegisterForm,
} from './registration.js';

const point = { latitude: -1.9532, longitude: 30.1668, accuracyM: 25 };
const form = (extra = {}) => ({
  name: 'Aline Mukamana',
  phone: '078 830 0114',
  email: '',
  password: 'longenough',
  meterNumber: '0421 5583 019',
  cell: 'Kibenga',
  village: '',
  landmark: '',
  point,
  ...extra,
});

describe('looksLikeEmail', () => {
  it('is true for something@something.tld', () => {
    expect(looksLikeEmail('aline@demo.rw')).toBe(true);
    expect(looksLikeEmail(' aline@demo.rw ')).toBe(true);
  });

  it.each(['', 'aline', 'aline@', '@demo.rw', 'a b@demo.rw', '0788300114'])(
    'is false for %p',
    (text) => {
      expect(looksLikeEmail(text)).toBe(false);
    }
  );
});

describe('identifierError', () => {
  it.each(['aline@demo.rw', '0788300114', '078 830 0114', '+250788300114'])(
    'accepts %p',
    (text) => {
      expect(identifierError(text)).toBe('');
    }
  );

  it('asks for the box to be filled in', () => {
    expect(identifierError('')).toMatch(/email or phone/i);
    expect(identifierError('   ')).toMatch(/email or phone/i);
  });

  it('says which kind is wrong', () => {
    expect(identifierError('aline@')).toMatch(/valid email/i);
    expect(identifierError('12345')).toMatch(/Rwandan mobile/i);
  });
});

describe('validateRegisterForm', () => {
  it('is empty for a complete form, with or without an email', () => {
    expect(validateRegisterForm(form())).toEqual({});
    expect(validateRegisterForm(form({ email: 'aline@example.rw' }))).toEqual({});
  });

  it('needs a name', () => {
    expect(validateRegisterForm(form({ name: '  ' })).name).toMatch(/name/i);
  });

  it.each(['', '12345', '0711234567', '+254712345678'])(
    'needs a Rwandan mobile number, not %p',
    (phone) => {
      expect(validateRegisterForm(form({ phone })).phone).toMatch(/Rwandan mobile/);
    }
  );

  it('checks an email only when one is typed', () => {
    expect(validateRegisterForm(form({ email: '' })).email).toBeUndefined();
    expect(validateRegisterForm(form({ email: 'aline@' })).email).toMatch(/valid email/i);
  });

  it('needs a password of at least 8 characters', () => {
    expect(validateRegisterForm(form({ password: '' })).password).toMatch(/8 characters/);
    expect(validateRegisterForm(form({ password: 'short12' })).password).toMatch(/8 characters/);
    expect(validateRegisterForm(form({ password: 'eightchr' })).password).toBeUndefined();
  });

  it.each(['', '12345', '0421 5583 01A', '042155830190'])(
    'needs a meter number of 11 or 13 digits, not %p',
    (meterNumber) => {
      expect(validateRegisterForm(form({ meterNumber })).meterNumber).toMatch(/11 or 13 digits/);
    }
  );

  it('accepts 13 digits', () => {
    expect(
      validateRegisterForm(form({ meterNumber: '1234567890123' })).meterNumber
    ).toBeUndefined();
  });

  it('needs a cell', () => {
    expect(validateRegisterForm(form({ cell: ' ' })).cell).toMatch(/cell/i);
  });

  it('needs the location to be found', () => {
    expect(validateRegisterForm(form({ point: null })).location).toMatch(/use my location/i);
  });

  it('reports every problem at once', () => {
    const errors = validateRegisterForm(
      form({ name: '', phone: '', password: '', meterNumber: '', cell: '', point: null })
    );
    expect(Object.keys(errors).sort()).toEqual([
      'cell',
      'location',
      'meterNumber',
      'name',
      'password',
      'phone',
    ]);
  });
});

describe('buildRegisterPayload', () => {
  it('sends the typed values and the point, and leaves out empty optional fields', () => {
    expect(buildRegisterPayload(form({ name: ' Aline Mukamana ' }))).toEqual({
      name: 'Aline Mukamana',
      phone: '078 830 0114',
      password: 'longenough',
      meterNumber: '0421 5583 019',
      cell: 'Kibenga',
      latitude: -1.9532,
      longitude: 30.1668,
    });
  });

  it('includes the email, village and landmark when they are filled in', () => {
    const body = buildRegisterPayload(
      form({ email: ' aline@example.rw ', village: ' Gasharu ', landmark: ' Blue gate ' })
    );
    expect(body).toMatchObject({
      email: 'aline@example.rw',
      village: 'Gasharu',
      landmark: 'Blue gate',
    });
  });

  it('never sends a role or the accuracy of the point', () => {
    const body = buildRegisterPayload(form());
    expect(body).not.toHaveProperty('role');
    expect(body).not.toHaveProperty('accuracyM');
  });
});
