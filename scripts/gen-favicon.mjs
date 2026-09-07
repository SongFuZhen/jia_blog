/**
 * 生成多尺寸 app/favicon.ico（16/32/48/64/128/256，PNG 内嵌式 ICO）。
 * 源用已裁切填充的 icon-256.png，高分屏下不糊。
 * 换图标时：先跑 scripts/gen-icons.mjs，再跑本脚本。
 */
import sharp from "sharp";
import fs from "node:fs";

const SRC = "public/icons/icon-256.png";
const SIZES = [16, 32, 48, 64, 128, 256];

const pngs = [];
for (const size of SIZES) {
  const buf = await sharp(SRC).resize(size, size).png().toBuffer();
  pngs.push({ size, buf });
}

const count = pngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(count, 4);

let offset = 6 + 16 * count;
const entries = [];
const datas = [];
for (const { size, buf } of pngs) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width（256 约定写 0）
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bit count
  entry.writeUInt32LE(buf.length, 8);
  entry.writeUInt32LE(offset, 12);
  entries.push(entry);
  datas.push(buf);
  offset += buf.length;
}

fs.writeFileSync("app/favicon.ico", Buffer.concat([header, ...entries, ...datas]));
console.log(`favicon.ico: ${SIZES.join("/")} px, ${(offset / 1024).toFixed(1)} KB`);
