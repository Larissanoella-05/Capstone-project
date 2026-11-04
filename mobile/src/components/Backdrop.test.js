import { render, screen } from '@testing-library/react-native';
import Backdrop from './Backdrop.js';

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  const Drawing = (props) => <View {...props} />;
  const Path = (props) => <View testID="path" {...props} />;
  return {
    __esModule: true,
    default: Drawing,
    Path,
    Circle: View,
    Defs: View,
    RadialGradient: View,
    Rect: View,
    Stop: View,
  };
});

// Each drawing has one path: the circuit lines and one per pylon.
describe('Backdrop', () => {
  it('draws the circuit and one pylon in the corner by default', async () => {
    await render(<Backdrop />);
    expect(screen.getAllByTestId('path', { hidden: true })).toHaveLength(2);
  });

  it('adds a middle and a left pylon when asked, for the sign-in screen', async () => {
    await render(<Backdrop pylons />);
    expect(screen.getAllByTestId('path', { hidden: true })).toHaveLength(4);
  });
});
