import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../src/components/Bits.js';
import { Screen } from '../../../src/components/Shell.js';
import { Async, EmptyState } from '../../../src/components/States.js';
import TrackingView from '../../../src/components/TrackingView.js';
import { useT } from '../../../src/context/LanguageContext.js';
import { useApi } from '../../../src/hooks/useApi.js';

export default function GuestTracking() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const t = useT();

  const state = useApi(`/public/faults/${token}`, { interval: 4000 });

  return (
    <Screen insetBottom>
      {state.error?.status === 404 ? (
        <EmptyState
          title={t('This tracking link is not valid')}
          action={
            <Button label={t('Report a fault')} onPress={() => router.replace('/guest/report')} />
          }
        >
          {t(
            'The report may have been closed more than 7 days ago. If a fault is still not fixed, report it again or call 2727.'
          )}
        </EmptyState>
      ) : (
        <Async state={state} label="Loading fault">
          {({ fault }) => <TrackingView fault={fault} />}
        </Async>
      )}
    </Screen>
  );
}
