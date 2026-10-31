import { Tabs } from 'expo-router';
import { AppHeader } from '../../src/components/Shell.js';
import { tabLabel, tabScreenOptions } from '../../src/components/tabOptions.js';
import { NotificationsProvider, useNotifications } from '../../src/context/NotificationsContext.js';

const hidden = { href: null };

function CustomerTabs() {
  const { unread } = useNotifications();
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        ...tabScreenOptions,
        header: () => <AppHeader base="/customer" unread={unread} />,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: tabLabel('Home') }} />
      <Tabs.Screen name="report" options={{ tabBarLabel: tabLabel('Report') }} />
      <Tabs.Screen name="reports" options={{ tabBarLabel: tabLabel('Reports') }} />
      <Tabs.Screen
        name="notifications"
        options={{ tabBarLabel: tabLabel('Alerts'), tabBarBadge: unread > 0 ? unread : undefined }}
      />
      <Tabs.Screen name="submitted/[id]" options={hidden} />
      <Tabs.Screen name="faults/[id]" options={hidden} />
    </Tabs>
  );
}

export default function CustomerLayout() {
  return (
    <NotificationsProvider>
      <CustomerTabs />
    </NotificationsProvider>
  );
}
