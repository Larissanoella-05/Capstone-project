import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/Shell.js';
import { Async } from '../../../src/components/States.js';
import TrackingView from '../../../src/components/TrackingView.js';
import { useApi } from '../../../src/hooks/useApi.js';

export default function Tracking() {
  const { id } = useLocalSearchParams();
  // Polling keeps the status, the technician position and the timeline current.
  const state = useApi(`/faults/${id}`, { interval: 4000 });

  return (
    <Screen insetBottom>
      <Async state={state} label="Loading fault">
        {({ fault }) => <TrackingView fault={fault} />}
      </Async>
    </Screen>
  );
}
