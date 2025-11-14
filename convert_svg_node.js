const fs = require('fs');
const path = require('path');

// Try to use sharp for high-quality SVG to PNG conversion
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Installing sharp...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install sharp --silent', { stdio: 'inherit' });
    sharp = require('sharp');
  } catch (err) {
    console.error('Failed to install sharp. Trying alternative...');
    process.exit(1);
  }
}

const iconsDir = 'icons';

async function convertSvgToPng(svgPath, pngPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(pngPath);
    
    // Make it white by processing the image
    const image = sharp(pngPath);
    const metadata = await image.metadata();
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Convert all non-transparent pixels to white
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) { // If not transparent
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        // Keep alpha as is
      }
    }
    
    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png()
    .toFile(pngPath);
    
    console.log(`  ✅ Created ${path.basename(pngPath)} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error converting ${svgPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Converting SVG icons to high-quality PNG using sharp...\n');
  
  // Convert do_not_disturb_on (rounded)
  const svgOn = path.join(iconsDir, 'do_not_disturb_on_rounded.svg');
  if (fs.existsSync(svgOn)) {
    console.log('Converting do_not_disturb_on (rounded):');
    for (const size of [16, 48, 128]) {
      await convertSvgToPng(svgOn, path.join(iconsDir, `icon${size}.png`), size);
    }
    await convertSvgToPng(svgOn, path.join(iconsDir, 'quiet_mode_on.png'), 48);
  }
  
  // Convert do_not_disturb_off (outlined)
  const svgOff = path.join(iconsDir, 'do_not_disturb_off_outlined.svg');
  if (fs.existsSync(svgOff)) {
    console.log('\nConverting do_not_disturb_off (outlined):');
    await convertSvgToPng(svgOff, path.join(iconsDir, 'quiet_mode_off.png'), 48);
  }
  
  console.log('\n✅ Done!');
}

main().catch(console.error);

