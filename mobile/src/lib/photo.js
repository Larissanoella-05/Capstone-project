// Picks a photo and shrinks it so the data URL fits the API's limit (backend fault.schemas.js).
const MAX_DATA_URL_LENGTH = 1500000;
const MAX_WIDTH = 1280;
const QUALITIES = [0.6, 0.4, 0.3];

export function fitsPhotoLimit(dataUrl) {
  return (
    typeof dataUrl === 'string' &&
    dataUrl.startsWith('data:image/') &&
    dataUrl.length <= MAX_DATA_URL_LENGTH
  );
}

/**
 * Opens the camera or the gallery and returns { name, uri, dataUrl }, or null if the person cancelled.
 * Throws an Error with a message fit to show when permission is refused or the photo cannot be shrunk enough.
 */
export async function pickAndPreparePhoto(source) {
  // Loaded here so the pure helper above can be tested without the native modules.
  const ImagePicker = await import('expo-image-picker');
  const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

  // Only the camera needs a permission: the gallery picker returns the one photo the person chose.
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Allow camera access in Settings to take a photo.');
  }

  const launch =
    source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const picked = await launch({ mediaTypes: ['images'], quality: 1 });
  if (picked.canceled || !picked.assets?.length) return null;
  const asset = picked.assets[0];

  for (const compress of QUALITIES) {
    const result = await manipulateAsync(asset.uri, [{ resize: { width: MAX_WIDTH } }], {
      compress,
      format: SaveFormat.JPEG,
      base64: true,
    });
    const dataUrl = `data:image/jpeg;base64,${result.base64}`;
    if (fitsPhotoLimit(dataUrl))
      return { name: asset.fileName || 'photo.jpg', uri: result.uri, dataUrl };
  }
  throw new Error('That photo is too large to send. Try another one.');
}
