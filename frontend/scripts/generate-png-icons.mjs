import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel;
  const rawData = Buffer.alloc((scanlineLength + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (scanlineLength + 1);
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);

    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Icon design drawing logic
function drawSJobIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Squircle background corner radius
  const cornerRadius = 0.22;
  const cx = Math.abs(nx - 0.5);
  const cy = Math.abs(ny - 0.5);
  const dx = Math.max(0, cx - (0.5 - cornerRadius));
  const dy = Math.max(0, cy - (0.5 - cornerRadius));
  const distToCorner = Math.sqrt(dx * dx + dy * dy);

  if (distToCorner > cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Base background gradient: Deep navy to dark indigo
  const bgGrad = (nx + ny) * 0.5;
  let r = Math.round(9 + bgGrad * 25);
  let g = Math.round(13 + bgGrad * 18);
  let b = Math.round(22 + bgGrad * 50);

  // Border highlight
  const isBorder = (distToCorner > cornerRadius - 0.02) || 
                   (cx > 0.48 && cy < 0.48) || 
                   (cy > 0.48 && cx < 0.48);
  if (isBorder) {
    r = Math.min(255, r + 40);
    g = Math.min(255, g + 40);
    b = Math.min(255, b + 90);
  }

  // Calendar Box: nx in [0.24, 0.76], ny in [0.28, 0.80]
  const inCalX = nx >= 0.24 && nx <= 0.76;
  const inCalY = ny >= 0.28 && ny <= 0.80;
  const calStroke = 0.045;

  const isCalBorder = inCalX && inCalY && (
    nx <= 0.24 + calStroke ||
    nx >= 0.76 - calStroke ||
    ny <= 0.28 + calStroke ||
    ny >= 0.80 - calStroke
  );

  // Calendar binder rings at top: nx around 0.36 & 0.64, ny in [0.20, 0.32]
  const isRing1 = Math.abs(nx - 0.38) < 0.035 && ny >= 0.20 && ny <= 0.32;
  const isRing2 = Math.abs(nx - 0.62) < 0.035 && ny >= 0.20 && ny <= 0.32;

  if (isRing1 || isRing2) {
    return [129, 140, 248, 255]; // Indigo ring
  }

  if (isCalBorder) {
    // Gradient on calendar outline: Indigo to Emerald
    const t = (nx + ny - 0.5);
    const cr = Math.round(99 + (16 - 99) * t);
    const cg = Math.round(102 + (185 - 102) * t);
    const cb = Math.round(241 + (129 - 241) * t);
    return [cr, cg, cb, 255];
  }

  // Stylized "S" / Checkmark in center:
  // Center checkmark line 1: (0.35, 0.54) to (0.46, 0.66)
  // Line 2: (0.46, 0.66) to (0.68, 0.42)
  const d1 = distToSegment(nx, ny, 0.36, 0.54, 0.47, 0.65);
  const d2 = distToSegment(nx, ny, 0.47, 0.65, 0.68, 0.40);
  const minD = Math.min(d1, d2);

  if (minD < 0.038) {
    // Glowing emerald checkmark
    const glow = 1 - (minD / 0.038);
    const cr = Math.round(16 + glow * 36);
    const cg = Math.round(185 + glow * 55);
    const cb = Math.round(129 + glow * 50);
    return [cr, cg, cb, 255];
  }

  // Soft emerald halo behind checkmark
  if (minD < 0.12) {
    const halo = (1 - (minD / 0.12)) * 0.3;
    r = Math.min(255, Math.round(r + 16 * halo * 2));
    g = Math.min(255, Math.round(g + 185 * halo));
    b = Math.min(255, Math.round(b + 129 * halo));
  }

  return [r, g, b, 255];
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Generate icons
const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating 192x192 icon...');
const png192 = createPNG(192, 192, drawSJobIcon);
fs.writeFileSync(path.join(outDir, 'icon-192x192.png'), png192);

console.log('Generating 512x512 icon...');
const png512 = createPNG(512, 512, drawSJobIcon);
fs.writeFileSync(path.join(outDir, 'icon-512x512.png'), png512);

console.log('Generating apple-touch-icon (180x180)...');
const png180 = createPNG(180, 180, drawSJobIcon);
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), png180);

console.log('Generating maskable 512x512 icon...');
fs.writeFileSync(path.join(outDir, 'icon-maskable-512x512.png'), png512);

console.log('Done! All PWA PNG icons generated successfully.');
