// Draws the Umuriro app icons from the same bolt as frontend/public/favicon.svg (a yellow bolt on near-black).
// No dependencies: it rasterises the polygon with 4x4 supersampling and writes PNG files itself.
//
//   node scripts/make-icons.js
//
// Output goes to assets/. Re-run it after changing the colours or proportions below.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const INK = [0x0b, 0x0b, 0x0b];
const VOLT = [0xff, 0xd4, 0x00];
const WHITE = [0xff, 0xff, 0xff];

// favicon.svg path "M13 2 4 14h7l-1 8 9-12h-7z", in a 24 x 24 box.
const BOLT = [[13, 2], [4, 14], [11, 14], [10, 22], [19, 10], [12, 10]];
const BOLT_CENTRE = [11.5, 12]; // middle of the bolt's bounding box (x 4..19, y 2..22)
const BOLT_HEIGHT = 20;

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** size: canvas in pixels. boltFraction: bolt height as a share of the canvas. background: [r,g,b] or null (transparent). */
function render(size, { boltFraction, boltColor, background = null }) {
  const scale = (boltFraction * size) / BOLT_HEIGHT;
  const polygon = BOLT.map(([x, y]) => [size / 2 + (x - BOLT_CENTRE[0]) * scale, size / 2 + (y - BOLT_CENTRE[1]) * scale]);
  const minX = Math.max(0, Math.floor(Math.min(...polygon.map((p) => p[0]))) - 1);
  const maxX = Math.min(size - 1, Math.ceil(Math.max(...polygon.map((p) => p[0]))) + 1);
  const minY = Math.max(0, Math.floor(Math.min(...polygon.map((p) => p[1]))) - 1);
  const maxY = Math.min(size - 1, Math.ceil(Math.max(...polygon.map((p) => p[1]))) + 1);

  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let coverage = 0;
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        let hits = 0;
        for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) if (insidePolygon(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4, polygon)) hits++;
        coverage = hits / 16;
      }
      const at = (y * size + x) * 4;
      if (background) {
        // Opaque background with the bolt blended over it.
        for (let c = 0; c < 3; c++) pixels[at + c] = Math.round(background[c] * (1 - coverage) + boltColor[c] * coverage);
        pixels[at + 3] = 255;
      } else {
        pixels[at] = boltColor[0];
        pixels[at + 1] = boltColor[1];
        pixels[at + 2] = boltColor[2];
        pixels[at + 3] = Math.round(coverage * 255);
      }
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0; // filter: none
    pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const flat = (size, colour) => {
  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) pixels.set([...colour, 255], i * 4);
  return pixels;
};

// The adaptive icon is cropped to a circle or squircle, so its foreground must stay inside the central ~60%.
const FILES = [
  { file: 'icon.png', size: 1024, pixels: (s) => render(s, { boltFraction: 0.58, boltColor: VOLT, background: INK }) },
  { file: 'android-icon-foreground.png', size: 512, pixels: (s) => render(s, { boltFraction: 0.46, boltColor: VOLT }) },
  { file: 'android-icon-background.png', size: 512, pixels: (s) => flat(s, INK) },
  // Android draws the monochrome (themed) icon from the alpha channel only.
  { file: 'android-icon-monochrome.png', size: 432, pixels: (s) => render(s, { boltFraction: 0.46, boltColor: WHITE }) },
  // Status-bar icon for notifications: white on transparent, as large as the 96 px box allows.
  { file: 'notification-icon.png', size: 96, pixels: (s) => render(s, { boltFraction: 0.86, boltColor: WHITE }) },
  // On the splash screen the bolt sits on the plain #0B0B0B background set in app.config.js.
  { file: 'splash-icon.png', size: 1024, pixels: (s) => render(s, { boltFraction: 0.8, boltColor: VOLT }) },
  { file: 'favicon.png', size: 48, pixels: (s) => render(s, { boltFraction: 0.6, boltColor: VOLT, background: INK }) },
];

const assets = path.join(__dirname, '..', 'assets');
for (const { file, size, pixels } of FILES) {
  const png = encodePng(size, pixels(size));
  fs.writeFileSync(path.join(assets, file), png);
  console.log(`${file}  ${size}x${size}  ${png.length} bytes`);
}
