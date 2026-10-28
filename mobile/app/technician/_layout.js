import { Tabs } from 'expo-router';
import { AppHeader } from '../../src/components/Shell.js';
import { tabLabel, tabScreenOptions } from '../../src/components/tabOptions.js';

const hidden = { href: null };

export default function TechnicianLayout() {
  return (
    <Tabs screenOptions={{ ...tabScreenOptions, header: () => <AppHeader base="/technician" /> }}>
      <Tabs.Screen name="index" options={{ tabBarLabel: tabLabel('Home') }} />
      <Tabs.Screen name="jobs" options={{ tabBarLabel: tabLabel('Jobs') }} />
      <Tabs.Screen name="notifications" options={{ tabBarLabel: tabLabel('Alerts') }} />
      <Tabs.Screen name="jobs/[id]" options={hidden} />
      <Tabs.Screen name="jobs/[id]/resolve" options={hidden} />
    </Tabs>
  );
}
