import { Tabs } from 'expo-router';
import ActiveJobTracker from '../../src/components/ActiveJobTracker.js';
import { AppHeader } from '../../src/components/Shell.js';
import { tabLabel, tabScreenOptions } from '../../src/components/tabOptions.js';
import { NotificationsProvider, useNotifications } from '../../src/context/NotificationsContext.js';
import { TrackingProvider } from '../../src/context/TrackingContext.js';

const hidden = { href: null };

function TechnicianTabs() {
  const { unread } = useNotifications();
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        ...tabScreenOptions,
        header: () => <AppHeader base="/technician" unread={unread} />,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: tabLabel('Home') }} />
      <Tabs.Screen name="jobs" options={{ tabBarLabel: tabLabel('Jobs') }} />
      <Tabs.Screen
        name="notifications"
        options={{ tabBarLabel: tabLabel('Alerts'), tabBarBadge: unread > 0 ? unread : undefined }}
      />
      <Tabs.Screen name="jobs/[id]" options={hidden} />
      <Tabs.Screen name="jobs/[id]/resolve" options={hidden} />
    </Tabs>
  );
}

export default function TechnicianLayout() {
  return (
    <NotificationsProvider>
      <TrackingProvider>
        <ActiveJobTracker />
        <TechnicianTabs />
      </TrackingProvider>
    </NotificationsProvider>
  );
}
