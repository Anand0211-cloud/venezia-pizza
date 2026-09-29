const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

function cleanCutout(inputJpgPath, outputPngPath) {
  const jpegData = fs.readFileSync(inputJpgPath);
  const rawData = jpeg.decode(jpegData, { useTArray: true });
  
  const width = rawData.width;
  const height = rawData.height;
  const png = new PNG({ width, height, filterType: -1 });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const r = rawData.data[idx];
      const g = rawData.data[idx + 1];
      const b = rawData.data[idx + 2];

      // Convert RGB to HSL / Saturation / Green dominance
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const brightness = (r + g + b) / 3;

      // Check if it's green foliage
      // For green leaves: green is highest or distinctly higher than (r + b) / 2
      const isGreenDominant = g > r * 0.95 && g > b * 1.05 && (g - Math.min(r, b) > 15);
      const isDarkFoliage = (g > r || g > b) && brightness < 160 && (g - min > 8);

      let alpha = 0;

      if (isGreenDominant || isDarkFoliage) {
        // It's leaf / foliage!
        // Calculate edge softness based on green strength
        const greenStrength = (g - (r + b) / 2);
        if (greenStrength > 18) {
          alpha = 255;
        } else {
          alpha = Math.min(255, Math.max(0, Math.round((greenStrength / 18) * 255)));
        }
      } else {
        // Background pixel
        alpha = 0;
      }

      // If alpha is 0, make RGB 0 too to avoid fringe
      png.data[idx] = alpha > 0 ? r : 0;
      png.data[idx + 1] = alpha > 0 ? g : 0;
      png.data[idx + 2] = alpha > 0 ? b : 0;
      png.data[idx + 3] = alpha;
    }
  }

  // Morphological / soft pass: smooth boundary pixels slightly
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outputPngPath, buffer);
  console.log(`Successfully generated crisp cutout PNG to: ${outputPngPath}`);
}

const inputPath = path.join(__dirname, 'src', 'assets', 'green_lettuce.jpg');
const outputPath = path.join(__dirname, 'src', 'assets', 'green_lettuce.png');
cleanCutout(inputPath, outputPath);
