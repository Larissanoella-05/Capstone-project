import { Tabs } from 'expo-router';
import { tabIcon, tabLabel, tabScreenOptions } from '../../../src/components/tabOptions.js';
import { useNotifications } from '../../../src/context/NotificationsContext.js';

export default function TechnicianTabs() {
  const { unread } = useNotifications();
  return (
    <Tabs backBehavior="history" screenOptions={{ ...tabScreenOptions, headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ tabBarLabel: tabLabel('Home'), tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ tabBarLabel: tabLabel('Jobs'), tabBarIcon: tabIcon('list') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarLabel: tabLabel('Alerts'),
          tabBarIcon: tabIcon('bell'),
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
    </Tabs>
  );
}
