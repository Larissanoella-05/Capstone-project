// A phone camera makes a photo of several MB; the API stores at most about 1 MB as a data URL.
// So a big photo is scaled down in the browser first, instead of being refused.

/** A photo this small is sent as it is. */
export const SEND_AS_IS_BYTES = 1024 * 1024;
/** The biggest file read at all; beyond this the phone may run out of memory decoding it. */
export const MAX_PICKED_BYTES = 30 * 1024 * 1024;
/** The data URL must stay under what the API accepts (1.5 million characters). */
export const MAX_DATA_URL_CHARS = 1_400_000;

/** Tried in order until the picture fits: smaller and more compressed each time. */
export const ATTEMPTS = [
  { maxSide: 1600, quality: 0.8 },
  { maxSide: 1280, quality: 0.72 },
  { maxSide: 1024, quality: 0.65 },
  { maxSide: 800, quality: 0.6 },
];

/** The size with the longest side no more than `maxSide`, keeping the shape. */
export function scaledSize(width, height, maxSide) {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const factor = maxSide / longest;
  return { width: Math.round(width * factor), height: Math.round(height * factor) };
}

/** Why a chosen file cannot be the photo, or null if it can. */
export function photoProblem(file) {
  if (!file.type.startsWith('image/')) return 'Choose an image file for the photo.';
  if (file.size > MAX_PICKED_BYTES) return 'Choose a photo smaller than 30 MB.';
  return null;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The photo could not be read.'));
    reader.readAsDataURL(file);
  });
}

async function decodeImage(file) {
  const bitmap = await createImageBitmap(file);
  return { width: bitmap.width, height: bitmap.height, source: bitmap };
}

function encodeJpeg(image, { width, height }, quality) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(image.source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Scales an image down until its data URL fits. Returns null if no attempt fits.
 * `decode` and `encode` are the browser's; tests pass fakes.
 */
export async function shrinkPhoto(file, { decode = decodeImage, encode = encodeJpeg } = {}) {
  const image = await decode(file);
  for (const { maxSide, quality } of ATTEMPTS) {
    const dataUrl = await encode(image, scaledSize(image.width, image.height, maxSide), quality);
    if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
  }
  return null;
}

/** The photo as a data URL the API accepts. Throws an Error with a message that can be shown. */
export async function photoToDataUrl(file, deps) {
  if (file.size <= SEND_AS_IS_BYTES) return readAsDataUrl(file);
  let dataUrl;
  try {
    dataUrl = await shrinkPhoto(file, deps);
  } catch {
    throw new Error('This photo could not be opened. Take a new photo instead.');
  }
  if (!dataUrl) throw new Error('This photo is too detailed to send. Take a new photo instead.');
  return dataUrl;
}
