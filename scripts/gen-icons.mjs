/**
 * 从 public/icons/icon-source.png 生成 PWA 全部图标尺寸。
 * 先 trim 自动裁掉四周纯色背景，再让主体撑满画布（留 6% 边距），
 * 避免「图里留白多 → 图标看起来很小」。
 * 换图标时：替换 icon-source.png → node scripts/gen-icons.mjs → node scripts/gen-favicon.mjs
 */
import sharp from "sharp";

const SRC = "public/icons/icon-source.png";
const OUT = "public/icons";

// 1. 裁掉四周纯色背景
const trimmed = await sharp(SRC).trim({ threshold: 25 }).toBuffer();
const meta = await sharp(trimmed).metadata();
console.log(`trim 后主体: ${meta.width}x${meta.height}`);

// 2. 居中放到正方形画布（主体占 94%，轻微留边防贴边）
async function fitted(size) {
  const content = await sharp(trimmed)
    .resize(Math.round(size * 0.94), Math.round(size * 0.94))
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: "#FDF9F7" },
  }).composite([{ input: content, gravity: "center" }]);
}

// 常规图标（全幅）
await (await fitted(192)).png().toFile(`${OUT}/icon-192.png`);
await (await fitted(512)).png().toFile(`${OUT}/icon-512.png`);

// maskable：内容缩到 80%，四周补奶油底色，避免安卓裁圆时切到主体
{
  const size = 512;
  const content = Math.round(size * 0.8);
  const pad = Math.round((size - content) / 2);
  await sharp(trimmed)
    .resize(content, content)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: "#FDF9F7",
    })
    .toFile(`${OUT}/icon-maskable-512.png`);
}

// iOS 桌面图标
await (await fitted(180)).png().toFile(`${OUT}/apple-touch-icon.png`);

// favicon 源
await (await fitted(256)).png({ palette: true, quality: 90 }).toFile(`${OUT}/icon-256.png`);

console.log("icons generated: 192 / 512 / maskable-512 / apple-touch-180 / 256");
