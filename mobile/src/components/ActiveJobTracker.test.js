import { act, render } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AppState } from 'react-native';
import { api } from '../lib/api.js';
import ActiveJobTracker from './ActiveJobTracker.js';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));
jest.mock('../lib/api.js', () => ({ api: jest.fn() }));

const mockToast = jest.fn();
jest.mock('../context/ToastContext.js', () => ({ useToast: () => mockToast }));

const mockSetStatus = jest.fn();
jest.mock('../context/TrackingContext.js', () => ({
  useTracking: () => ({ status: 'idle', setStatus: mockSetStatus }),
}));

let mockFaults = [];
jest.mock('../hooks/useApi.js', () => ({ useApi: () => ({ data: { faults: mockFaults } }) }));

const job = (status) => ({ id: 5, status, assignedAt: '2026-10-28T08:00:00Z' });
const fix = (latitude, longitude) => ({ coords: { latitude, longitude } });
// About 111,320 m per degree of latitude.
const north = (meters) => fix(-1.95 + meters / 111320, 30.17);

let onPosition;
let removeWatch;
let appStateHandler;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockFaults = [job('ON_THE_WAY')];
  removeWatch = jest.fn();
  Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: true });
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true });
  Location.watchPositionAsync.mockImplementation(async (_options, callback) => {
    onPosition = callback;
    return { remove: removeWatch };
  });
  api.mockResolvedValue({});
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    appStateHandler = handler;
    return { remove: jest.fn() };
  });
  AppState.currentState = 'active';
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const settle = () => act(async () => {});

describe('ActiveJobTracker', () => {
  it('starts watching for an ON_THE_WAY job, reports sharing, and posts the first fix with the job id', async () => {
    await render(<ActiveJobTracker />);
    await settle();
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);
    expect(mockSetStatus).toHaveBeenLastCalledWith('sharing');

    await act(async () => onPosition(fix(-1.95, 30.17)));

    expect(api).toHaveBeenCalledWith('/technicians/me/location', {
      method: 'POST',
      body: { latitude: -1.95, longitude: 30.17, faultId: 5, label: 'Device location' },
    });
  });

  it('does not post a second fix that arrives straight after the first', async () => {
    await render(<ActiveJobTracker />);
    await settle();
    await act(async () => onPosition(north(0)));
    await act(async () => onPosition(north(60)));
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('posts a fix that arrived too early once the 15 s limit has passed', async () => {
    await render(<ActiveJobTracker />);
    await settle();
    await act(async () => onPosition(north(0)));

    await act(async () => {
      await jest.advanceTimersByTimeAsync(12000);
      onPosition(north(40)); // far enough, but only 12 s after the last post
    });
    expect(api).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(3200);
    });
    expect(api).toHaveBeenCalledTimes(2);
    expect(api.mock.calls[1][1].body.latitude).toBeCloseTo(-1.95 + 40 / 111320, 6);
  });

  it('does not track an ASSIGNED job', async () => {
    mockFaults = [job('ASSIGNED')];
    await render(<ActiveJobTracker />);
    await settle();
    expect(Location.getForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
  });

  it('stops watching when the job is resolved', async () => {
    const view = await render(<ActiveJobTracker />);
    await settle();
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);

    mockFaults = [{ ...job('RESOLVED'), resolvedAt: '2026-10-28T10:00:00Z' }];
    await view.rerender(<ActiveJobTracker />);
    await settle();

    expect(removeWatch).toHaveBeenCalled();
  });

  it('stops watching in the background and starts again on return', async () => {
    await render(<ActiveJobTracker />);
    await settle();

    await act(async () => appStateHandler('background'));
    expect(removeWatch).toHaveBeenCalledTimes(1);

    await act(async () => appStateHandler('active'));
    await settle();
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(2);
  });

  it('shows one message and never watches or posts when permission is refused', async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: false });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false });
    await render(<ActiveJobTracker />);
    await settle();

    expect(mockSetStatus).toHaveBeenCalledWith('denied');
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
    expect(api).not.toHaveBeenCalled();
  });

  it('does not repeat the refusal message when the app returns to the foreground', async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: false });
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false });
    await render(<ActiveJobTracker />);
    await settle();

    await act(async () => appStateHandler('background'));
    await act(async () => appStateHandler('active'));
    await settle();

    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('asks for permission only when it has not been granted already', async () => {
    await render(<ActiveJobTracker />);
    await settle();
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('keeps going when a post fails', async () => {
    api.mockRejectedValueOnce(new Error('offline'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<ActiveJobTracker />);
    await settle();

    await act(async () => onPosition(north(0)));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(20000);
      onPosition(north(60));
    });

    expect(api).toHaveBeenCalledTimes(2);
  });

  it('reports an error when the position watch cannot start', async () => {
    Location.watchPositionAsync.mockRejectedValue(new Error('GPS off'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<ActiveJobTracker />);
    await settle();

    expect(mockSetStatus).toHaveBeenCalledWith('error');
    expect(mockToast).toHaveBeenCalledTimes(1);
  });
});
