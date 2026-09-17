// Generates PWA icons from public/icons/app-icon-source.png (run: npm run icons)
import sharp from "sharp";

const src = "public/icons/app-icon-source.png";
const jobs = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/apple-touch-icon.png", 180, 0],
  ["public/icons/maskable-512.png", 512, 0.1],
  ["app/icon.png", 64, 0],
];

for (const [file, size, pad] of jobs) {
  const inner = Math.round(size * (1 - pad * 2));
  const img = sharp(src).resize(inner, inner, { fit: "cover" });
  if (pad > 0) {
    await img
      .extend({
        top: Math.round(size * pad),
        bottom: Math.round(size * pad),
        left: Math.round(size * pad),
        right: Math.round(size * pad),
        background: { r: 0, g: 60, b: 164, alpha: 1 },
      })
      .resize(size, size)
      .png()
      .toFile(file);
  } else {
    await img.png().toFile(file);
  }
  console.log("wrote", file);
}
