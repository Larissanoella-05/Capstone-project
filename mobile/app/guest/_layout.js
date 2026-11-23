import { Stack } from 'expo-router';
import { GuestHeader } from '../../src/components/Shell.js';
import { colors } from '../../src/theme.js';

// Open to everyone, so there is no account and no tab bar: a screen opened above the report form gets a back arrow.
export default function GuestLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ back }) => <GuestHeader back={Boolean(back)} />,
        contentStyle: { backgroundColor: colors.paper },
      }}
    />
  );
}
