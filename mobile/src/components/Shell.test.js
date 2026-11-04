import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppHeader } from './Shell.js';

const mockRouter = { back: jest.fn(), navigate: jest.fn() };
const mockLogout = jest.fn();
// The icon font is a binary asset that Jest cannot load; the icons are not what is being tested.
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../context/AuthContext.js', () => ({ useAuth: () => ({ logout: mockLogout }) }));
jest.mock('./Backdrop.js', () => () => null);

beforeEach(() => jest.clearAllMocks());

describe('AppHeader', () => {
  it('shows the UMURIRO brand, like the landing page', async () => {
    await render(<AppHeader base="/customer" />);
    expect(screen.getByText('UMURIRO')).toBeTruthy();
  });

  it('has no back arrow on a tab screen', async () => {
    await render(<AppHeader base="/customer" />);
    expect(screen.queryByLabelText('Back')).toBeNull();
  });

  it('goes back from a detail screen', async () => {
    await render(<AppHeader base="/technician" back />);
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('opens the landing page from the home icon', async () => {
    await render(<AppHeader base="/customer" />);
    await fireEvent.press(screen.getByLabelText('Landing page'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/landing');
  });

  it('opens the role home from the brand and the alerts from the bell', async () => {
    await render(<AppHeader base="/technician" unread={2} />);
    await fireEvent.press(screen.getByLabelText('Umuriro, go to your home screen'));
    await fireEvent.press(screen.getByLabelText('Notifications, 2 unread'));
    expect(mockRouter.navigate).toHaveBeenNthCalledWith(1, '/technician');
    expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, '/technician/notifications');
  });

  it('signs out', async () => {
    await render(<AppHeader base="/customer" />);
    await fireEvent.press(screen.getByLabelText('Sign out'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
