import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const png = join(__dirname, "../public/mockups/device-scene-composite.png");

const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

function findTransparentRects(minArea = 8000) {
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const rects = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pi = y * width + x;
      if (visited[pi]) continue;
      const ai = pi * 4 + 3;
      if (data[ai] > 8) continue;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;
      const stack = [[x, y]];

      while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
        const cpi = cy * width + cx;
        if (visited[cpi]) continue;
        const ca = data[cpi * 4 + 3];
        if (ca > 8) continue;
        visited[cpi] = 1;
        count += 1;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }

      if (count >= minArea) {
        rects.push({
          x: (minX / width) * 100,
          y: (minY / height) * 100,
          w: ((maxX - minX + 1) / width) * 100,
          h: ((maxY - minY + 1) / height) * 100,
          pixels: count,
        });
      }
    }
  }

  return rects.sort((a, b) => b.pixels - a.pixels);
}

const rects = findTransparentRects();
console.log(JSON.stringify(rects, null, 2));
