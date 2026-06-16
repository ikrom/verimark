// Run once: `node tests/e2e/fixtures/make-fixture.mjs`
import { writeFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 100;
const H = 100;
const channels = 3;
const stride = W * channels;
const raw = Buffer.alloc((stride + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (stride + 1)] = 0;
  for (let x = 0; x < W; x++) {
    const off = y * (stride + 1) + 1 + x * 3;
    raw[off] = 200;
    raw[off + 1] = 60;
    raw[off + 2] = 60;
  }
}
const idat = zlib.deflateSync(raw);

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  let c = 0xffffffff;
  for (const b of Buffer.concat([t, data])) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  crc.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0);
  return Buffer.concat([len, t, data, crc]);
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
const out = join(__dirname, "sample.png");
mkdirSync(__dirname, { recursive: true });
writeFileSync(out, png);
console.log(`Wrote ${statSync(out).size} bytes to ${out}`);
