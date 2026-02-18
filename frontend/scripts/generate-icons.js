const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const iconsDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

// 파란 배경 + 흰색 음표 SVG
const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#2563EB"/>
  <g transform="translate(130, 70)" fill="white">
    <ellipse cx="70" cy="310" rx="58" ry="42" transform="rotate(-20, 70, 310)"/>
    <rect x="118" y="80" width="14" height="240"/>
    <path d="M132 80 C 180 95, 200 145, 175 190 C 165 155, 148 130, 132 125"/>
  </g>
</svg>`;

async function generate() {
  const buf = Buffer.from(svg);
  await sharp(buf).resize(192, 192).png().toFile(path.join(iconsDir, "icon-192.png"));
  await sharp(buf).resize(512, 512).png().toFile(path.join(iconsDir, "icon-512.png"));
  console.log("PWA icons generated: icon-192.png, icon-512.png");
}

generate().catch(console.error);
