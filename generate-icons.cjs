#!/usr/bin/env node
const fs = require('fs');
const zlib = require('zlib');

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createPNG(width, height, drawFn) {
  const chunks = [];
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  function makeChunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  chunks.push(makeChunk('IHDR', ihdr));

  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = drawFn(x, y, width, height);
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }
  const compressed = zlib.deflateSync(Buffer.concat(rows));
  chunks.push(makeChunk('IDAT', compressed));
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(chunks);
}

// Draw stylized "B" letter in accent color on dark background
function drawIcon(x, y, w, h) {
  const bg     = [10, 10, 15];       // #0A0A0F
  const accent = [200, 241, 53];     // #C8F135
  const dim    = [30, 50, 8];        // darker accent tint for background

  // Normalize
  const nx = x / w;
  const ny = y / h;

  // Subtle radial gradient background (slightly lighter center)
  const cx = 0.5, cy = 0.5;
  const dist = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);
  const bgColor = dist < 0.6
    ? [14, 14, 22]
    : bg;

  // Rounded square icon border glow
  const margin = 0.06;
  const rCorner = 0.22;
  if (nx < margin || nx > 1 - margin || ny < margin || ny > 1 - margin) return bgColor;

  // "B" letter geometry (proportions tuned for legibility at small sizes)
  const lx = 0.18; // left edge of B
  const rx = 0.82; // rightmost extent
  const sw = 0.14; // stroke width

  // Left vertical stem
  const inStem = nx >= lx && nx <= lx + sw && ny >= 0.12 && ny <= 0.88;

  // Top bar
  const inTopBar = ny >= 0.12 && ny <= 0.12 + sw && nx >= lx && nx <= 0.68;

  // Middle bar
  const inMidBar = ny >= 0.48 && ny <= 0.48 + sw * 0.85 && nx >= lx && nx <= 0.62;

  // Bottom bar
  const inBotBar = ny >= 0.88 - sw && ny <= 0.88 && nx >= lx && nx <= 0.72;

  // Upper bump (right half of top loop) — rounded rectangle approximation
  const inUpperBump =
    nx >= 0.60 && nx <= rx - 0.04 &&
    ny >= 0.12 + sw && ny <= 0.48 &&
    // Simulate rounded right side with a simple quadrant trim
    !(nx > rx - 0.14 && (ny < 0.12 + sw + 0.07 || ny > 0.48 - 0.07));

  // Lower bump (slightly wider lower loop)
  const inLowerBump =
    nx >= 0.60 && nx <= rx &&
    ny >= 0.48 + sw * 0.85 && ny <= 0.88 - sw &&
    !(nx > rx - 0.10 && (ny < 0.48 + sw * 0.85 + 0.07 || ny > 0.88 - sw - 0.07));

  if (inStem || inTopBar || inMidBar || inBotBar || inUpperBump || inLowerBump) {
    return accent;
  }

  return bgColor;
}

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/icon-192.png', createPNG(192, 192, drawIcon));
fs.writeFileSync('public/icon-512.png', createPNG(512, 512, drawIcon));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, drawIcon));
console.log('Icons generated in public/');
