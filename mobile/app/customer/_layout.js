import { Tabs } from 'expo-router';
import { AppHeader } from '../../src/components/Shell.js';
import { tabLabel, tabScreenOptions } from '../../src/components/tabOptions.js';

const hidden = { href: null };

export default function CustomerLayout() {
  return (
    <Tabs screenOptions={{ ...tabScreenOptions, header: () => <AppHeader base="/customer" /> }}>
      <Tabs.Screen name="index" options={{ tabBarLabel: tabLabel('Home') }} />
      <Tabs.Screen name="report" options={{ tabBarLabel: tabLabel('Report') }} />
      <Tabs.Screen name="reports" options={{ tabBarLabel: tabLabel('Reports') }} />
      <Tabs.Screen name="notifications" options={{ tabBarLabel: tabLabel('Alerts') }} />
      <Tabs.Screen name="submitted/[id]" options={hidden} />
      <Tabs.Screen name="faults/[id]" options={hidden} />
    </Tabs>
  );
}
