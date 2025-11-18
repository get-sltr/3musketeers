const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgPath = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

console.log('🎨 Generating PWA icons from SVG...\n');

// Check if sharp is available
try {
  const sharp = require('sharp');
  
  // Use sharp for high-quality conversion
  const svgBuffer = fs.readFileSync(svgPath);
  
  Promise.all(sizes.map(size => {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    console.log(`Generating ${size}x${size}...`);
    
    return sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)
      .then(() => console.log(`✓ Created ${outputPath}`));
  }))
  .then(() => {
    console.log('\n✅ All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Update manifest.json with new icons');
    console.log('2. Verify icons in public/ directory');
  })
  .catch(err => {
    console.error('❌ Error generating icons:', err);
    process.exit(1);
  });
  
} catch (err) {
  console.log('⚠️  Sharp not installed. Installing sharp...\n');
  console.log('Run: npm install sharp --save-dev\n');
  console.log('Then run this script again: node scripts/generate-icons.js');
  process.exit(1);
}
