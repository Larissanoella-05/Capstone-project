import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../theme.js';

/** Options shared by the customer and technician tab bars: flat, square, black when active. */
export const tabScreenOptions = {
  tabBarActiveTintColor: colors.white,
  tabBarInactiveTintColor: colors.ink,
  tabBarActiveBackgroundColor: colors.ink,
  tabBarInactiveBackgroundColor: colors.white,
  tabBarIconStyle: { display: 'none' },
  tabBarStyle: { height: 64, borderTopWidth: 1, borderTopColor: colors.ink, backgroundColor: colors.white },
  tabBarItemStyle: { justifyContent: 'center', borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.ink },
};

/** A tab label in the monospace caps style of the web tab bar. */
export const tabLabel = (title) =>
  function TabLabel({ color }) {
    return (
      <Text style={{ color, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>{title}</Text>
    );
  };
