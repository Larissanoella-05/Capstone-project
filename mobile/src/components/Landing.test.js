import { fireEvent, render, screen } from '@testing-library/react-native';
import Landing from './Landing.js';

const mockPush = jest.fn();
// The icon font is a binary asset that Jest cannot load; the icons are not what is being tested.
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../assets/landing/silhouette.jpg', () => ({ uri: 'mock' }));
jest.mock('../../assets/landing/poles.jpg', () => ({ uri: 'mock' }));
jest.mock('../../assets/landing/panel.jpg', () => ({ uri: 'mock' }));
jest.mock('../../assets/landing/tower.jpg', () => ({ uri: 'mock' }));
jest.mock('../context/ToastContext.js', () => ({ useToast: () => jest.fn() }));
let mockUser = null;
jest.mock('../context/AuthContext.js', () => ({
  useAuth: () => ({ user: mockUser }),
  HOME_BY_ROLE: { CUSTOMER: '/customer', TECHNICIAN: '/technician' },
}));
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Path: View,
    Circle: View,
    Defs: View,
    RadialGradient: View,
    Rect: View,
    Stop: View,
  };
});

beforeEach(() => {
  mockPush.mockClear();
  mockNavigate.mockClear();
  mockUser = null;
});

describe('Landing', () => {
  it('shows the headline and the tagline', async () => {
    await render(<Landing />);
    expect(screen.getByText(/RESTORES/)).toBeTruthy();
    expect(
      screen.getByText('Report a fault. Get a technician. Track it until the lights are back.')
    ).toBeTruthy();
  });

  it('opens the sign-in screen from the header, the hero and the footer', async () => {
    await render(<Landing />);
    await fireEvent.press(screen.getByText('Sign in'));
    await fireEvent.press(screen.getAllByLabelText('Report a fault')[0]);
    await fireEvent.press(screen.getByText('Technician jobs'));
    expect(mockPush).toHaveBeenCalledTimes(3);
    for (const call of mockPush.mock.calls) expect(call[0]).toBe('/login');
  });

  it.each([
    ['CUSTOMER', '/customer'],
    ['TECHNICIAN', '/technician'],
  ])('leads a signed-in %s to their own app, not the sign-in screen', async (role, home) => {
    mockUser = { role };
    await render(<Landing />);
    expect(screen.queryByText('Sign in')).toBeNull();
    expect(screen.queryByLabelText('Report a fault')).toBeNull();
    // The header button and the hero button.
    for (const button of screen.getAllByText('Open my app')) await fireEvent.press(button);
    await fireEvent.press(screen.getByText('Technician jobs'));
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledTimes(3);
    for (const call of mockNavigate.mock.calls) expect(call[0]).toBe(home);
  });

  it('shows the same UMURIRO brand in the header and the footer', async () => {
    await render(<Landing />);
    expect(screen.getAllByText('UMURIRO')).toHaveLength(2);
  });

  it('has one Report a fault button in the header and none in the hero', async () => {
    await render(<Landing />);
    expect(screen.getAllByLabelText('Report a fault')).toHaveLength(1);
  });

  it('ends with the footer instead of the Secure reliable power section', async () => {
    await render(<Landing />);
    expect(screen.queryByText(/Secure reliable power/)).toBeNull();
    expect(screen.getByText('Quick Links')).toBeTruthy();
    expect(screen.getByText('Electricity provider (REG)')).toBeTruthy();
    expect(screen.getByText('Toll free: 2727')).toBeTruthy();
    expect(screen.getByText('info@reg.rw')).toBeTruthy();
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
