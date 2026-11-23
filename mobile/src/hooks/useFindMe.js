import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { pointFromPosition } from '../lib/guestReport.js';

/**
 * Reads the phone's position once, on a button press.
 * Returns { point, locating, note, findMe }: `point` is { latitude, longitude, accuracyM } or null,
 * and `note` is a message fit to show when the position could not be read.
 * `onFound` runs with the new point, so a form can clear its own location error.
 */
export function useFindMe(onFound) {
  const [point, setPoint] = useState(null);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState('');

  const findMe = useCallback(async () => {
    setNote('');
    setLocating(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setNote('Location is off for this app. Allow it in Settings, then try again.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const found = pointFromPosition(position);
      setPoint(found);
      onFound?.(found);
    } catch (error) {
      console.warn('[location] could not read the position:', error.message);
      setNote('Your phone could not find its position. Check that GPS is on and try again.');
    } finally {
      setLocating(false);
    }
  }, [onFound]);

  return { point, locating, note, findMe };
}
