const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

function removeBackground(inputPath, outputPath, bgThreshold = 180, greenThreshold = 60) {
  const data = fs.readFileSync(inputPath);
  const raw = jpeg.decode(data, { useTArray: true });
  const w = raw.width;
  const h = raw.height;

  const png = new PNG({ width: w, height: h, filterType: -1 });

  // Flood-fill from corners to find the background mask
  // Background pixels: near-white (high R,G,B all > 200) OR near the dark maroon/brown (#5c1f1f) background
  const visited = new Uint8Array(w * h);
  const isBg = new Uint8Array(w * h);

  function getIdx(x, y) { return y * w + x; }
  function getRawIdx(x, y) { return (y * w + x) << 2; }

  function isBackgroundPixel(x, y) {
    const i = getRawIdx(x, y);
    const r = raw.data[i];
    const g = raw.data[i + 1];
    const b = raw.data[i + 2];

    // White/light background
    if (r > 200 && g > 200 && b > 200) return true;

    // Dark maroon/wine background (the dark red/brown color in the uploaded image)
    // rgb roughly around 80-100 r, 20-40 g, 30-50 b
    if (r > 50 && r < 140 && g < 60 && b < 80 && r > g * 1.5 && r > b * 1.4) return true;

    // Very dark near-black background
    if (r < 40 && g < 40 && b < 40) return true;

    return false;
  }

  // BFS flood fill from edges
  const queue = [];
  for (let x = 0; x < w; x++) {
    if (isBackgroundPixel(x, 0)) { queue.push([x, 0]); visited[getIdx(x, 0)] = 1; isBg[getIdx(x, 0)] = 1; }
    if (isBackgroundPixel(x, h - 1)) { queue.push([x, h - 1]); visited[getIdx(x, h - 1)] = 1; isBg[getIdx(x, h - 1)] = 1; }
  }
  for (let y = 0; y < h; y++) {
    if (isBackgroundPixel(0, y)) { queue.push([0, y]); visited[getIdx(0, y)] = 1; isBg[getIdx(0, y)] = 1; }
    if (isBackgroundPixel(w - 1, y)) { queue.push([w - 1, y]); visited[getIdx(w - 1, y)] = 1; isBg[getIdx(w - 1, y)] = 1; }
  }

  const dx = [0, 0, 1, -1];
  const dy = [1, -1, 0, 0];
  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    for (let d = 0; d < 4; d++) {
      const nx = cx + dx[d];
      const ny = cy + dy[d];
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[getIdx(nx, ny)] && isBackgroundPixel(nx, ny)) {
        visited[getIdx(nx, ny)] = 1;
        isBg[getIdx(nx, ny)] = 1;
        queue.push([nx, ny]);
      }
    }
  }

  // Write output with transparency for background pixels
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = getIdx(x, y);
      const ri = i << 2;
      const r = raw.data[ri];
      const g = raw.data[ri + 1];
      const b = raw.data[ri + 2];

      let alpha = 255;
      if (isBg[i]) {
        alpha = 0;
      } else {
        // Soft edges near background
        let nearBg = false;
        for (let d = 0; d < 4; d++) {
          const nx = x + dx[d];
          const ny = y + dy[d];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && isBg[getIdx(nx, ny)]) {
            nearBg = true;
            break;
          }
        }
        if (nearBg) {
          alpha = 180;
        }
      }

      png.data[ri] = alpha > 0 ? r : 0;
      png.data[ri + 1] = alpha > 0 ? g : 0;
      png.data[ri + 2] = alpha > 0 ? b : 0;
      png.data[ri + 3] = alpha;
    }
  }

  const buf = PNG.sync.write(png);
  fs.writeFileSync(outputPath, buf);
  console.log(`Saved to ${outputPath} (${w}x${h})`);
}

// Check if user provided path as argument
const inputFile = process.argv[2] || path.join(__dirname, 'src', 'assets', 'burger_hero_raw.jpg');
const outputFile = path.join(__dirname, 'src', 'assets', 'burger_hero.png');
removeBackground(inputFile, outputFile);
