const fs = require('fs');
const path = require('path');

// Function to create a simple PNG (1x1 colored pixel, then scaled by app)
function createColoredPNG(color) {
  // Simple PNG header for a 1x1 pixel image
  // PNG signature
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk (image header)
  const width = Buffer.alloc(4);
  width.writeUInt32BE(100, 0);
  const height = Buffer.alloc(4);
  height.writeUInt32BE(60, 0);
  
  const ihdr = Buffer.concat([
    width,
    height,
    Buffer.from([8, 2, 0, 0, 0]), // bit depth, color type, compression, filter, interlace
  ]);
  
  // Create IHDR chunk with CRC
  const ihdrChunk = createChunk('IHDR', ihdr);
  
  // IDAT chunk (image data) - simple colored rectangle
  const [r, g, b] = [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ];
  
  const pixelData = Buffer.alloc(100 * 60 * 3 + 60); // RGB + filter byte per row
  let offset = 0;
  for (let y = 0; y < 60; y++) {
    pixelData[offset++] = 0; // filter type
    for (let x = 0; x < 100; x++) {
      pixelData[offset++] = r;
      pixelData[offset++] = g;
      pixelData[offset++] = b;
    }
  }
  
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(pixelData);
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const combined = Buffer.concat([typeBuffer, data]);
  
  const crc32 = calculateCRC32(combined);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32, 0);
  
  return Buffer.concat([length, combined, crcBuffer]);
}

function calculateCRC32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crc ^ data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create images
const images = [
  { filename: 'tesla3.png', color: '#E82127' },
  { filename: 'teslay.png', color: '#E82127' },
  { filename: 'nleaf.png', color: '#FFB300' },
  { filename: 'hy5.png', color: '#003DA5' },
  { filename: 'kia6.avif', color: '#FF0000' }, // Will create PNG instead
];

const imagesDir = path.join(__dirname, 'assets', 'images');

images.forEach(img => {
  // Replace .avif with .png
  const filename = img.filename.replace('.avif', '.png');
  const filepath = path.join(imagesDir, filename);
  
  try {
    const pngData = createColoredPNG(img.color);
    fs.writeFileSync(filepath, pngData);
    console.log(`✓ Created ${filename}`);
  } catch (err) {
    console.error(`✗ Error creating ${filename}:`, err.message);
  }
});

console.log('\nAll images created successfully!');
