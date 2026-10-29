import { Linking } from 'react-native';

/** Opens a tel: or maps link. Returns false (instead of throwing) when the phone has no app to handle it. */
export async function openLink(url) {
  try {
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.warn('[links] could not open', url.split(':')[0], error.message);
    return false;
  }
}
