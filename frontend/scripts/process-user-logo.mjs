import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const inputPath = 'public/logo.jpg';
  const outDir = 'public';
  const iconsDir = 'public/icons';

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Loading user logo:', inputPath);
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  console.log(`Original size: ${width}x${height}`);

  // Create transparent buffer
  // Logo is dark blue on white background
  const transparentData = Buffer.alloc(data.length);
  const darkThemeData = Buffer.alloc(data.length); // For dark mode: logo becomes white/indigo, bg is transparent

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Grayscale luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Background is near white (lum > 220)
    // Dark strokes have lum < 120
    let alpha = 0;
    if (lum < 235) {
      // Invert luminance so dark strokes become opaque (255)
      alpha = Math.min(255, Math.round(((235 - lum) / (235 - 70)) * 255));
    }

    // 1. Transparent original navy logo
    transparentData[i] = r;
    transparentData[i + 1] = g;
    transparentData[i + 2] = b;
    transparentData[i + 3] = alpha;

    // 2. Dark theme logo: strokes become bright indigo/cyan (#60a5fa to #a855f7)
    // or crisp white (#ffffff)
    darkThemeData[i] = 255;
    darkThemeData[i + 1] = 255;
    darkThemeData[i + 2] = 255;
    darkThemeData[i + 3] = alpha;
  }

  // Save full transparent logo (emblem + text)
  await sharp(transparentData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(outDir, 'logo.png'));
  console.log('Saved public/logo.png');

  // Save white transparent logo for dark mode
  await sharp(darkThemeData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(outDir, 'logo-white.png'));
  console.log('Saved public/logo-white.png');

  // Now, let's extract JUST the hexagon emblem (top part without the "SJob" text)
  // Looking at the 1024x1024 image:
  // Hexagon is roughly from y: 160 to y: 660, x: 260 to x: 764
  // Let's create an emblem crop for the App Icon and Header Badge
  const emblemCrop = await sharp(transparentData, { raw: { width, height, channels: 4 } })
    .extract({ left: 280, top: 160, width: 464, height: 480 })
    .png()
    .toBuffer();

  await sharp(emblemCrop)
    .toFile(path.join(iconsDir, 'emblem.png'));
  console.log('Saved public/icons/emblem.png');

  // Also create a dark-theme glowing emblem
  const darkEmblemCrop = await sharp(darkThemeData, { raw: { width, height, channels: 4 } })
    .extract({ left: 280, top: 160, width: 464, height: 480 })
    .png()
    .toBuffer();

  await sharp(darkEmblemCrop)
    .toFile(path.join(iconsDir, 'emblem-white.png'));
  console.log('Saved public/icons/emblem-white.png');

  // Generate PWA Icons (192, 512, apple-touch, maskable)
  // We place the emblem centered on the app's sleek dark squircle background (#090d16 with subtle glow)
  for (const size of [192, 512, 180]) {
    const emblemSize = Math.round(size * 0.72);
    const resizedEmblem = await sharp(darkEmblemCrop)
      .resize(emblemSize, emblemSize, { fit: 'contain' })
      .toBuffer();

    // Background SVG with rounded squircle
    const bgSvg = Buffer.from(`
      <svg width="${size}" height="${size}">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="50%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#090d16"/>
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#bg)"/>
      </svg>
    `);

    const iconBuffer = await sharp(bgSvg)
      .composite([
        {
          input: resizedEmblem,
          top: Math.round((size - emblemSize) / 2),
          left: Math.round((size - emblemSize) / 2),
        },
      ])
      .png()
      .toBuffer();

    if (size === 192) {
      await sharp(iconBuffer).toFile(path.join(iconsDir, 'icon-192x192.png'));
      console.log('Saved public/icons/icon-192x192.png');
    } else if (size === 512) {
      await sharp(iconBuffer).toFile(path.join(iconsDir, 'icon-512x512.png'));
      await sharp(iconBuffer).toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));
      console.log('Saved public/icons/icon-512x512.png & maskable');
    } else if (size === 180) {
      await sharp(iconBuffer).toFile(path.join(iconsDir, 'apple-touch-icon.png'));
      console.log('Saved public/icons/apple-touch-icon.png');
    }
  }

  console.log('All logo assets generated successfully!');
}

main().catch(console.error);
