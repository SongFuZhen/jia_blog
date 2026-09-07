/**
 * 从 public/icons/icon-source.png 生成 PWA 所需的全部图标尺寸。
 * 换图标时：替换 icon-source.png 后运行 `node scripts/gen-icons.mjs`。
 */
import sharp from "sharp";

const SRC = "public/icons/icon-source.png";
const OUT = "public/icons";

// 常规图标（全幅）
await sharp(SRC).resize(192, 192).toFile(`${OUT}/icon-192.png`);
await sharp(SRC).resize(512, 512).toFile(`${OUT}/icon-512.png`);

// maskable：内容缩到 80%，四周补奶油底色，避免安卓裁圆时切到主体
{
  const size = 512;
  const content = Math.round(size * 0.8);
  const pad = Math.round((size - content) / 2);
  await sharp(SRC)
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
await sharp(SRC).resize(180, 180).toFile(`${OUT}/apple-touch-icon.png`);

console.log("icons generated: 192 / 512 / maskable-512 / apple-touch-180");
