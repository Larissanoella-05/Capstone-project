import { Stack } from 'expo-router';
import { AppHeader } from '../../src/components/Shell.js';
import { NotificationsProvider, useNotifications } from '../../src/context/NotificationsContext.js';
import { colors } from '../../src/theme.js';

// The tabs sit at the bottom of the stack, so a link straight to a fault still has Home to go back to.
export const unstable_settings = { initialRouteName: '(tabs)' };

function Header({ back }) {
  const { unread } = useNotifications();
  return <AppHeader base="/customer" unread={unread} back={back} />;
}

// The fault screens live in this stack, above the tabs. A tab hidden from the tab bar is redirected
// to the first tab when it gets focus, so it cannot hold a detail screen.
export default function CustomerLayout() {
  return (
    <NotificationsProvider>
      <Stack
        screenOptions={{
          // The tabs are the top of this app: a back arrow only belongs on the screens opened above them.
          header: ({ back, route }) => <Header back={Boolean(back) && route.name !== '(tabs)'} />,
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
    </NotificationsProvider>
  );
}
