import * as SecureStore from 'expo-secure-store';
import { loadSavedReports, saveReport } from './guestStore.js';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('loadSavedReports', () => {
  it('reads the saved list back', async () => {
    SecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify([{ token: 't1', reference: 'FR-1' }])
    );
    expect(await loadSavedReports()).toEqual([{ token: 't1', reference: 'FR-1' }]);
  });

  it('gives an empty list when nothing is saved or the keystore fails', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    expect(await loadSavedReports()).toEqual([]);
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error('keystore'));
    expect(await loadSavedReports()).toEqual([]);
  });
});

describe('saveReport', () => {
  it('puts the new report first and keeps the older ones', async () => {
    SecureStore.getItemAsync.mockResolvedValue(
      JSON.stringify([{ token: 'old', reference: 'FR-1' }])
    );
    await saveReport({ token: 'new', reference: 'FR-2' });
    const [key, value] = SecureStore.setItemAsync.mock.calls[0];
    expect(key).toBe('umuriro.guestReports');
    expect(JSON.parse(value).map((item) => item.token)).toEqual(['new', 'old']);
  });

  it('does not throw when the keystore refuses to write', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockRejectedValue(new Error('keystore'));
    await expect(saveReport({ token: 't', reference: 'FR-3' })).resolves.toBeUndefined();
  });
});
