import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme.js';

/** Options shared by the customer and technician tab bars: white bar, red indicator above the active tab. */
export const tabScreenOptions = {
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.ash,
  tabBarStyle: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  tabBarItemStyle: { justifyContent: 'center' },
  tabBarBadgeStyle: {
    backgroundColor: colors.accent,
    color: colors.onAccent,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
};

/** A tab label in the small bold style of the web tab bar. */
export const tabLabel = (title) =>
  function TabLabel({ color }) {
    return <Text style={{ color, fontFamily: fonts.semibold, fontSize: 11 }}>{title}</Text>;
  };

/** A tab icon with the 3 px accent bar above it when the tab is active. */
export const tabIcon = (name) =>
  function TabIcon({ color, focused }) {
    return (
      <View style={styles.iconWrap}>
        {focused ? <View style={styles.bar} /> : null}
        <Feather name={name} size={22} color={color} />
      </View>
    );
  };

const styles = StyleSheet.create({
  iconWrap: { width: 56, alignItems: 'center', justifyContent: 'center', height: 28 },
  bar: {
    position: 'absolute',
    top: -9,
    width: 40,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.accent,
  },
});
