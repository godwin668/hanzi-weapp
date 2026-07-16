const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const SIZE = 48;
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'tabbar');

function createPNG() {
  const png = new PNG({ width: SIZE, height: SIZE });
  // Fill transparent
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 255;
    png.data[i + 1] = 255;
    png.data[i + 2] = 255;
    png.data[i + 3] = 0;
  }
  return png;
}

function setPixel(png, x, y, r, g, b, a) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const idx = (SIZE * y + x) * 4;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fillRect(png, x1, y1, x2, y2, r, g, b, a) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setPixel(png, x, y, r, g, b, a);
    }
  }
}

function drawLine(png, x1, y1, x2, y2, r, g, b, a) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    setPixel(png, x1, y1, r, g, b, a);
    if (x1 === x2 && y1 === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x1 += sx; }
    if (e2 < dx) { err += dx; y1 += sy; }
  }
}

function thickLine(png, x1, y1, x2, y2, thickness, r, g, b, a) {
  for (let t = -Math.floor(thickness / 2); t <= Math.floor(thickness / 2); t++) {
    drawLine(png, x1 + t, y1, x2 + t, y2, r, g, b, a);
    drawLine(png, x1, y1 + t, x2, y2 + t, r, g, b, a);
  }
}

// ── Home icon ──
function drawHome(png, r, g, b) {
  const a = 255;
  // roof triangle
  thickLine(png, 24, 6, 6, 20, 3, r, g, b, a);
  thickLine(png, 24, 6, 42, 20, 3, r, g, b, a);
  // house body
  fillRect(png, 10, 20, 38, 41, r, g, b, a);
  // door
  fillRect(png, 19, 28, 29, 41, 255, 255, 255, 255);
}

// ── Pencil/Practice icon ──
function drawPractice(png, r, g, b) {
  const a = 255;
  // pencil body (diagonal)
  thickLine(png, 8, 40, 34, 14, 4, r, g, b, a);
  // pencil tip
  thickLine(png, 34, 14, 40, 8, 4, r, g, b, a);
  // eraser end
  fillRect(png, 4, 37, 10, 43, 255, 180, 180, 255);
}

// ── History/Clock icon ──
function drawHistory(png, r, g, b) {
  const a = 255;
  // circle outline
  const cx = 24, cy = 22, rad = 15;
  for (let angle = 0; angle < 360; angle += 2) {
    const radian = angle * Math.PI / 180;
    for (let t = -1.5; t <= 1.5; t++) {
      const x = Math.round(cx + (rad + t) * Math.cos(radian));
      const y = Math.round(cy + (rad + t) * Math.sin(radian));
      setPixel(png, x, y, r, g, b, a);
    }
  }
  // clock hands
  thickLine(png, cx, cy, cx, cy - 9, 2.5, r, g, b, a);
  thickLine(png, cx, cy, cx + 7, cy + 4, 2, r, g, b, a);
  // list lines below
  fillRect(png, 10, 38, 38, 41, r, g, b, a);
  fillRect(png, 10, 43, 32, 45, r, g, b, a);
}

// ── Mine/Person icon ──
function drawMine(png, r, g, b) {
  const a = 255;
  // head circle
  const cx = 24, cy = 13, rad = 8;
  for (let angle = 0; angle < 360; angle += 2) {
    const radian = angle * Math.PI / 180;
    for (let t = -1.5; t <= 1.5; t++) {
      const x = Math.round(cx + (rad + t) * Math.cos(radian));
      const y = Math.round(cy + (rad + t) * Math.sin(radian));
      setPixel(png, x, y, r, g, b, a);
    }
  }
  // body arc
  const bcx = 24, bcy = 28, brad = 13;
  for (let angle = 180; angle <= 360; angle += 2) {
    const radian = angle * Math.PI / 180;
    for (let t = -1.5; t <= 1.5; t++) {
      const x = Math.round(bcx + (brad + t) * Math.cos(radian));
      const y = Math.round(bcy + (brad + t) * Math.sin(radian));
      setPixel(png, x, y, r, g, b, a);
    }
  }
  // fill body
  for (let y = 21; y <= 41; y++) {
    for (let x = 11; x <= 37; x++) {
      const dx = x - 24, dy = y - 28;
      if (dx * dx / (13 * 13) + dy * dy / (13 * 13) <= 1 && dy >= 0) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

const icons = {
  'home': { draw: drawHome, color: [153, 153, 153] },
  'home-selected': { draw: drawHome, color: [79, 140, 255] },
  'practice': { draw: drawPractice, color: [153, 153, 153] },
  'practice-selected': { draw: drawPractice, color: [79, 140, 255] },
  'history': { draw: drawHistory, color: [153, 153, 153] },
  'history-selected': { draw: drawHistory, color: [79, 140, 255] },
  'mine': { draw: drawMine, color: [153, 153, 153] },
  'mine-selected': { draw: drawMine, color: [79, 140, 255] },
};

for (const [name, config] of Object.entries(icons)) {
  const png = createPNG();
  config.draw(png, ...config.color);
  const buf = PNG.sync.write(png);
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), buf);
  console.log(`Generated: ${name}.png`);
}

console.log('\nDone! All 8 tabbar icons generated.');
