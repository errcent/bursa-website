import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "../public/mockups/sources/device-scene-composite-source.png");

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

function isBlack(r, g, b) {
  return r < 24 && g < 24 && b < 24;
}

function findBlackRects(minArea = 5000) {
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const rects = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pi = y * width + x;
      if (visited[pi]) continue;
      const idx = pi * 4;
      if (!isBlack(data[idx], data[idx + 1], data[idx + 2])) continue;

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
        const cidx = cpi * 4;
        if (!isBlack(data[cidx], data[cidx + 1], data[cidx + 2])) continue;
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
          x: Number(((minX / width) * 100).toFixed(2)),
          y: Number(((minY / height) * 100).toFixed(2)),
          w: Number((((maxX - minX + 1) / width) * 100).toFixed(2)),
          h: Number((((maxY - minY + 1) / height) * 100).toFixed(2)),
          pixels: count,
        });
      }
    }
  }

  return rects.sort((a, b) => b.pixels - a.pixels);
}

console.log(JSON.stringify(findBlackRects(), null, 2));
