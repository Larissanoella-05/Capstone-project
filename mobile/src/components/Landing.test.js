import { fireEvent, render, screen } from '@testing-library/react-native';
import Landing from './Landing.js';

const mockPush = jest.fn();
// The icon font is a binary asset that Jest cannot load; the icons are not what is being tested.
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../assets/landing/silhouette.jpg', () => ({ uri: 'mock' }));
jest.mock('../../assets/landing/poles.jpg', () => ({ uri: 'mock' }));
jest.mock('../../assets/landing/panel.jpg', () => ({ uri: 'mock' }));
jest.mock('../../assets/landing/tower.jpg', () => ({ uri: 'mock' }));
jest.mock('../context/ToastContext.js', () => ({ useToast: () => jest.fn() }));
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View, Path: View };
});

beforeEach(() => mockPush.mockClear());

describe('Landing', () => {
  it('shows the headline and the tagline', async () => {
    await render(<Landing />);
    expect(screen.getByText(/RESTORES/)).toBeTruthy();
    expect(
      screen.getByText('Report a fault. Get a technician. Track it until the lights are back.')
    ).toBeTruthy();
  });

  it('opens the sign-in screen from every sign-in action', async () => {
    await render(<Landing />);
    await fireEvent.press(screen.getByText('Sign in'));
    await fireEvent.press(screen.getByText('Sign in to report'));
    await fireEvent.press(screen.getAllByLabelText('Report a fault')[0]);
    expect(mockPush).toHaveBeenCalledTimes(3);
    for (const call of mockPush.mock.calls) expect(call[0]).toBe('/login');
  });

  it('has no sign-in action on the coordinator card, which is web only', async () => {
    await render(<Landing />);
    expect(screen.getByText('On the web dashboard')).toBeTruthy();
    expect(screen.queryByText('Open coordinator view ↗')).toBeNull();
  });

  it('expands a FAQ answer when its question is pressed', async () => {
    await render(<Landing />);
    expect(screen.queryByText(/Service coordinators see new reports/)).toBeNull();
    await fireEvent.press(screen.getByText('Who gets my report?'));
    expect(screen.getByText(/Service coordinators see new reports/)).toBeTruthy();
  });
});
