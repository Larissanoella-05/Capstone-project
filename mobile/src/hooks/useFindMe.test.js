import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useFindMe } from './useFindMe.js';

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}));

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('useFindMe', () => {
  it('stores the position and tells the form it was found', async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: true });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -1.9532001, longitude: 30.1668004, accuracy: 24.6 },
    });
    const onFound = jest.fn();
    const { result } = await renderHook(() => useFindMe(onFound));
    await act(async () => result.current.findMe());
    expect(result.current.point).toEqual({ latitude: -1.9532, longitude: 30.1668, accuracyM: 25 });
    expect(onFound).toHaveBeenCalledWith(result.current.point);
    expect(result.current.locating).toBe(false);
  });

  it('asks for permission once and explains a refusal', async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: false });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false });
    const { result } = await renderHook(() => useFindMe());
    await act(async () => result.current.findMe());
    expect(result.current.point).toBeNull();
    expect(result.current.note).toMatch(/Allow it in Settings/);
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('explains a GPS failure instead of throwing', async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: true });
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('no fix'));
    const { result } = await renderHook(() => useFindMe());
    await act(async () => result.current.findMe());
    expect(result.current.note).toMatch(/GPS is on/);
    expect(result.current.locating).toBe(false);
  });
});
