// Generates a valid 1200x630 PNG for og:image using pure Node.js standard libraries (zlib, fs)
import fs from "fs";
import zlib from "zlib";
import path from "path";

const width = 1200;
const height = 630;

// Create raw RGB pixel buffer (1 filter byte + width * 3 bytes per scanline)
const rowSize = 1 + width * 3;
const rawData = Buffer.alloc(rowSize * height);

for (let y = 0; y < height; y++) {
  const rowOffset = y * rowSize;
  rawData[rowOffset] = 0; // Filter type 0: None

  // Gradient background from dark slate #090d16 (9, 13, 22) to #0f172a (15, 23, 42)
  const ratio = y / height;
  const r = Math.floor(9 + (15 - 9) * ratio);
  const g = Math.floor(13 + (23 - 13) * ratio);
  const b = Math.floor(22 + (42 - 22) * ratio);

  for (let x = 0; x < width; x++) {
    const pxOffset = rowOffset + 1 + x * 3;

    // Add subtle cyan/emerald ambient glow around center-left
    const dx = x - 400;
    const dy = y - 315;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let pr = r;
    let pg = g;
    let pb = b;

    if (dist < 320) {
      const glow = (1 - dist / 320) * 0.45;
      pr = Math.min(255, Math.floor(pr + 6 * glow * 10));
      pg = Math.min(255, Math.floor(pg + 182 * glow));
      pb = Math.min(255, Math.floor(pb + 212 * glow));
    }

    // Border highlight
    if (x < 6 || x >= width - 6 || y < 6 || y >= height - 6) {
      pr = 30; pg = 41; pb = 59;
    }

    rawData[pxOffset] = pr;
    rawData[pxOffset + 1] = pg;
    rawData[pxOffset + 2] = pb;
  }
}

// Compress scanlines with DEFLATE
const compressedData = zlib.deflateSync(rawData);

// PNG signature
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcInput);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// IHDR chunk
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData[8] = 8; // bit depth
ihdrData[9] = 2; // color type: 2 (Truecolor RGB)
ihdrData[10] = 0; // compression
ihdrData[11] = 0; // filter
ihdrData[12] = 0; // interlace: none

const ihdrChunk = makeChunk("IHDR", ihdrData);
const idatChunk = makeChunk("IDAT", compressedData);
const iendChunk = makeChunk("IEND", Buffer.alloc(0));

const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);

const publicDir = path.resolve("./public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, "og-image.png"), pngBuffer);
console.log("Successfully generated 1200x630 og-image.png!");
