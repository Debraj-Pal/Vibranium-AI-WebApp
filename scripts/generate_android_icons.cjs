const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for standard PNG chunks
function makeCrcTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCrcTable();

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const bodyBuf = Buffer.concat([typeBuf, data]);
  const crc = crc32(bodyBuf);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, bodyBuf, crcBuf]);
}

/**
 * Creates a valid, standard RGBA PNG buffer from a raw pixel buffer
 */
function createPngBuffer(width, height, drawFn) {
  // Raw scanline buffer: each row has 1 filter byte (0) + width * 4 (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth: 8
  ihdrData[9] = 6; // color type: 6 (RGBA)
  ihdrData[10] = 0; // compression: 0
  ihdrData[11] = 0; // filter: 0
  ihdrData[12] = 0; // interlace: 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing helper: Vibranium AI App Icon
function drawVibraniumIcon(x, y, width, height, isRound = false) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Rounded icon boundary
  if (isRound && dist > r) {
    return [0, 0, 0, 0];
  } else if (!isRound) {
    const cornerRadius = r * 0.25;
    const innerX = Math.abs(dx) - (cx - cornerRadius);
    const innerY = Math.abs(dy) - (cy - cornerRadius);
    if (innerX > 0 && innerY > 0 && (innerX * innerX + innerY * innerY > cornerRadius * cornerRadius)) {
      return [0, 0, 0, 0];
    }
  }

  // Dark obsidian gradient background (0x0b0f19 to 0x1a162b)
  const normY = y / height;
  let bgR = Math.floor(11 + 15 * normY);
  let bgG = Math.floor(15 + 7 * normY);
  let bgB = Math.floor(25 + 18 * normY);

  // Futuristic 'V' shield logo in center
  const logoScale = r * 0.65;
  const lx = (x - cx) / logoScale; // -1 to 1
  const ly = (y - cy) / logoScale; // -1 to 1

  // Draw sleek glowing 'V' shape
  const vWidth = 0.22;
  const leftArm = Math.abs(ly - (1.4 * Math.abs(lx) - 0.7));
  const isVGlyph = (leftArm < vWidth) && (ly >= -0.7 && ly <= 0.7) && (Math.abs(lx) <= 0.85);

  // Outer glowing ring
  const ringDist = Math.abs(dist - r * 0.78);
  if (ringDist < r * 0.04) {
    return [0, 210, 255, 240]; // Bright Cyan Accent
  }

  if (isVGlyph) {
    // Gradient from Cyan (0, 210, 255) at top to Vibrant Purple (168, 85, 247) at bottom
    const t = (ly + 0.7) / 1.4;
    const vr = Math.floor(0 * (1 - t) + 168 * t);
    const vg = Math.floor(210 * (1 - t) + 85 * t);
    const vb = Math.floor(255 * (1 - t) + 247 * t);
    return [vr, vg, vb, 255];
  }

  // Center subtle glow
  if (dist < r * 0.5) {
    const glow = 1 - (dist / (r * 0.5));
    bgR = Math.min(255, Math.floor(bgR + 40 * glow));
    bgG = Math.min(255, Math.floor(bgG + 20 * glow));
    bgB = Math.min(255, Math.floor(bgB + 60 * glow));
  }

  return [bgR, bgG, bgB, 255];
}

// Foreground icon (transparent background)
function drawVibraniumForeground(x, y, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2;
  const logoScale = r * 0.45;
  const lx = (x - cx) / logoScale;
  const ly = (y - cy) / logoScale;

  const vWidth = 0.22;
  const leftArm = Math.abs(ly - (1.4 * Math.abs(lx) - 0.7));
  const isVGlyph = (leftArm < vWidth) && (ly >= -0.7 && ly <= 0.7) && (Math.abs(lx) <= 0.85);

  if (isVGlyph) {
    const t = (ly + 0.7) / 1.4;
    const vr = Math.floor(0 * (1 - t) + 168 * t);
    const vg = Math.floor(210 * (1 - t) + 85 * t);
    const vb = Math.floor(255 * (1 - t) + 247 * t);
    return [vr, vg, vb, 255];
  }
  return [0, 0, 0, 0];
}

// Splash screen generator
function drawVibraniumSplash(x, y, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.22;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background deep gradient
  const normY = y / height;
  let bgR = Math.floor(7 + 10 * normY);
  let bgG = Math.floor(10 + 6 * normY);
  let bgB = Math.floor(19 + 15 * normY);

  const logoScale = r * 0.8;
  const lx = (x - cx) / logoScale;
  const ly = (y - cy) / logoScale;

  const vWidth = 0.22;
  const leftArm = Math.abs(ly - (1.4 * Math.abs(lx) - 0.7));
  const isVGlyph = (leftArm < vWidth) && (ly >= -0.7 && ly <= 0.7) && (Math.abs(lx) <= 0.85);

  if (isVGlyph) {
    const t = (ly + 0.7) / 1.4;
    const vr = Math.floor(0 * (1 - t) + 168 * t);
    const vg = Math.floor(210 * (1 - t) + 85 * t);
    const vb = Math.floor(255 * (1 - t) + 247 * t);
    return [vr, vg, vb, 255];
  }

  // Ring around logo
  const ringDist = Math.abs(dist - r);
  if (ringDist < Math.max(2, r * 0.03)) {
    return [0, 210, 255, 230];
  }

  // Radial glow in center
  if (dist < r * 1.5) {
    const glow = Math.max(0, 1 - (dist / (r * 1.5)));
    bgR = Math.min(255, Math.floor(bgR + 50 * glow * glow));
    bgG = Math.min(255, Math.floor(bgG + 25 * glow * glow));
    bgB = Math.min(255, Math.floor(bgB + 80 * glow * glow));
  }

  return [bgR, bgG, bgB, 255];
}

const mipmaps = [
  { dir: 'android/app/src/main/res/mipmap-mdpi', size: 48, fgSize: 108 },
  { dir: 'android/app/src/main/res/mipmap-hdpi', size: 72, fgSize: 162 },
  { dir: 'android/app/src/main/res/mipmap-xhdpi', size: 96, fgSize: 216 },
  { dir: 'android/app/src/main/res/mipmap-xxhdpi', size: 144, fgSize: 324 },
  { dir: 'android/app/src/main/res/mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

const splashes = [
  { dir: 'android/app/src/main/res/drawable', w: 480, h: 800 },
  { dir: 'android/app/src/main/res/drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'android/app/src/main/res/drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'android/app/src/main/res/drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'android/app/src/main/res/drawable-port-xxhdpi', w: 960, h: 1600 },
  { dir: 'android/app/src/main/res/drawable-port-xxxhdpi', w: 1080, h: 1920 },
  { dir: 'android/app/src/main/res/drawable-land-mdpi', w: 480, h: 320 },
  { dir: 'android/app/src/main/res/drawable-land-hdpi', w: 800, h: 480 },
  { dir: 'android/app/src/main/res/drawable-land-xhdpi', w: 1280, h: 720 },
  { dir: 'android/app/src/main/res/drawable-land-xxhdpi', w: 1600, h: 960 },
  { dir: 'android/app/src/main/res/drawable-land-xxxhdpi', w: 1920, h: 1080 },
];

console.log('Generating pristine Android icons & splashes...');

for (const m of mipmaps) {
  fs.mkdirSync(m.dir, { recursive: true });
  fs.writeFileSync(path.join(m.dir, 'ic_launcher.png'), createPngBuffer(m.size, m.size, (x, y, w, h) => drawVibraniumIcon(x, y, w, h, false)));
  fs.writeFileSync(path.join(m.dir, 'ic_launcher_round.png'), createPngBuffer(m.size, m.size, (x, y, w, h) => drawVibraniumIcon(x, y, w, h, true)));
  fs.writeFileSync(path.join(m.dir, 'ic_launcher_foreground.png'), createPngBuffer(m.fgSize, m.fgSize, drawVibraniumForeground));
  console.log(`[OK] Generated mipmap icons in ${m.dir}`);
}

for (const s of splashes) {
  fs.mkdirSync(s.dir, { recursive: true });
  fs.writeFileSync(path.join(s.dir, 'splash.png'), createPngBuffer(s.w, s.h, drawVibraniumSplash));
  console.log(`[OK] Generated splash in ${s.dir} (${s.w}x${s.h})`);
}

console.log('All Android graphics generated with valid PNG signatures!');
