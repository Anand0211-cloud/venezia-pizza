const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, 'src', 'assets', 'variety_pizza_hero.jpg');
const outputPath = path.join(__dirname, 'src', 'assets', 'variety_pizza_hero.png');

const data = fs.readFileSync(inputPath);
const raw = jpeg.decode(data, { useTArray: true });
const w = raw.width;
const h = raw.height;

const cx = w / 2;
const cy = h / 2;
const targetRadius = 426;

// Create tight square output matching exact wooden board size + 4px margin
const size = Math.ceil(targetRadius * 2 + 4);
const outPng = new PNG({ width: size, height: size, filterType: -1 });

const outCx = size / 2;
const outCy = size / 2;

for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const outIdx = (size * y + x) << 2;
    const dx = x - outCx;
    const dy = y - outCy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const inX = Math.round(cx + dx);
    const inY = Math.round(cy + dy);

    if (inX >= 0 && inX < w && inY >= 0 && inY < h) {
      const inIdx = (inY * w + inX) << 2;
      const r = raw.data[inIdx];
      const g = raw.data[inIdx + 1];
      const b = raw.data[inIdx + 2];
      const brightness = (r + g + b) / 3;

      let alpha = 255;
      if (dist > targetRadius + 1) {
        alpha = 0;
      } else if (dist > targetRadius - 1.5) {
        // Smooth anti-aliased edge
        const edgeFactor = (targetRadius + 1 - dist) / 2.5;
        alpha = Math.round(255 * Math.min(1, Math.max(0, edgeFactor)));
      }

      // If background is white-ish near edge, reduce alpha
      if (dist > targetRadius - 6 && brightness > 230) {
        alpha = 0;
      }

      outPng.data[outIdx] = alpha > 0 ? r : 0;
      outPng.data[outIdx + 1] = alpha > 0 ? g : 0;
      outPng.data[outIdx + 2] = alpha > 0 ? b : 0;
      outPng.data[outIdx + 3] = alpha;
    } else {
      outPng.data[outIdx] = 0;
      outPng.data[outIdx + 1] = 0;
      outPng.data[outIdx + 2] = 0;
      outPng.data[outIdx + 3] = 0;
    }
  }
}

const buffer = PNG.sync.write(outPng);
fs.writeFileSync(outputPath, buffer);
console.log(`Saved tight transparent pizza PNG to ${outputPath}, size: ${size}x${size}`);
