import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useToast } from '../context/ToastContext.js';
import { useTracking } from '../context/TrackingContext.js';
import { useApi } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { pickActiveJob } from '../lib/jobs.js';
import { TRACKED_STATUSES, shouldPostLocation } from '../lib/location.js';

const MIN_MS = 15000;

/**
 * Renders nothing. While the technician's active job is on the way, arrived or working and the app is in
 * the foreground, it watches the phone's position and posts it so the customer and coordinator maps follow.
 * Foreground only: no background permission, so updates stop when the phone locks or the app closes.
 */
export default function ActiveJobTracker() {
  const toast = useToast();
  const { setStatus } = useTracking();
  const { data } = useApi('/faults', { interval: 5000 });
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const warnedFor = useRef(null);
  // Android backgrounds the app while its permission dialog is open; that must not restart the tracker.
  const asking = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (!asking.current) setAppActive(next === 'active');
    });
    return () => subscription.remove();
  }, []);

  const active = pickActiveJob(data?.faults ?? []);
  const trackedId = active && TRACKED_STATUSES.includes(active.status) ? active.id : null;

  useEffect(() => {
    if (!trackedId || !appActive) return undefined;

    let cancelled = false;
    let subscription = null;
    let timer = null;
    let lastPosted = null;
    let pending = null;

    // Say a problem once per job, not every time the screen comes back to the foreground.
    const warnOnce = (message) => {
      if (warnedFor.current === trackedId) return;
      warnedFor.current = trackedId;
      toast(message, 'error');
    };

    const post = async (fix) => {
      lastPosted = { ...fix, postedAt: Date.now() };
      pending = null;
      try {
        await api('/technicians/me/location', {
          method: 'POST',
          body: { ...fix, faultId: trackedId, label: 'Device location' },
        });
      } catch (error) {
        console.warn('[location] could not post position:', error.message);
      }
    };

    const onFix = ({ coords }) => {
      // A fix can arrive after the job ended or the app was backgrounded; drop it.
      if (cancelled) return;
      const fix = { latitude: coords.latitude, longitude: coords.longitude };
      const now = Date.now();
      if (shouldPostLocation(lastPosted, fix, now)) {
        clearTimeout(timer);
        timer = null;
        post(fix);
        return;
      }
      // Too soon. Android delivers on distance, so there may be no further fix for a while: keep this one
      // and give it a single retry once the time limit has passed.
      pending = fix;
      if (!timer && lastPosted) {
        timer = setTimeout(
          () => {
            timer = null;
            if (!cancelled && pending && shouldPostLocation(lastPosted, pending, Date.now()))
              post(pending);
          },
          Math.max(0, lastPosted.postedAt + MIN_MS - now) + 50
        );
      }
    };

    (async () => {
      setStatus('starting');
      try {
        asking.current = true;
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) permission = await Location.requestForegroundPermissionsAsync();
        asking.current = false;
        if (cancelled) return;
        if (!permission.granted) {
          setStatus('denied');
          warnOnce(
            'Location is off, so the customer cannot see you on the map. Allow it in Settings.'
          );
          return;
        }
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: MIN_MS, distanceInterval: 25 },
          onFix
        );
        if (cancelled) {
          subscription.remove();
          return;
        }
        setStatus('sharing');
      } catch (error) {
        asking.current = false;
        console.warn('[location] could not start tracking:', error.message);
        if (!cancelled) {
          setStatus('error');
          warnOnce('Could not read your location. Check that GPS is on.');
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription?.remove();
      setStatus('idle');
    };
  }, [trackedId, appActive, toast, setStatus]);

  return null;
}
