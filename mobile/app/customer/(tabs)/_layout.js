import { Tabs } from 'expo-router';
import { tabIcon, tabLabel, tabScreenOptions } from '../../../src/components/tabOptions.js';
import { useNotifications } from '../../../src/context/NotificationsContext.js';

export default function CustomerTabs() {
  const { unread } = useNotifications();
  return (
    <Tabs backBehavior="history" screenOptions={{ ...tabScreenOptions, headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ tabBarLabel: tabLabel('Home'), tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="report"
        options={{ tabBarLabel: tabLabel('Report'), tabBarIcon: tabIcon('alert-triangle') }}
      />
      <Tabs.Screen
        name="reports"
        options={{ tabBarLabel: tabLabel('Reports'), tabBarIcon: tabIcon('list') }}
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
