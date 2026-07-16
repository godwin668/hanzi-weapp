const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const SIZE = 200;
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'icons');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function createPNG() {
  const png = new PNG({ width: SIZE, height: SIZE });
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
  const lx = Math.max(0, Math.min(x1, x2));
  const rx = Math.min(SIZE - 1, Math.max(x1, x2));
  const ty = Math.max(0, Math.min(y1, y2));
  const by = Math.min(SIZE - 1, Math.max(y1, y2));
  for (let y = ty; y <= by; y++) {
    for (let x = lx; x <= rx; x++) {
      setPixel(png, x, y, r, g, b, a);
    }
  }
}

function fillRoundedRect(png, x, y, w, h, radius, r, g, b, a) {
  // Simple rounded rect by filling center and drawing edge arcs
  fillRect(png, x + radius, y, x + w - radius, y + h, r, g, b, a);
  fillRect(png, x, y + radius, x + w, y + h - radius, r, g, b, a);
  // corner fills (approximate circles)
  for (let cx of [x + radius, x + w - radius]) {
    for (let cy of [y + radius, y + h - radius]) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            setPixel(png, cx + dx, cy + dy, r, g, b, a);
          }
        }
      }
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

function fillCircle(png, cx, cy, radius, r, g, b, a) {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        setPixel(png, cx + x, cy + y, r, g, b, a);
      }
    }
  }
}

function drawCircle(png, cx, cy, radius, thickness, r, g, b, a) {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const dist = Math.sqrt(x * x + y * y);
      if (dist >= radius - thickness / 2 && dist <= radius + thickness / 2) {
        setPixel(png, cx + x, cy + y, r, g, b, a);
      }
    }
  }
}

// ============================================================
// Design 1: Brush & Ink Stroke (水墨毛笔)
// ============================================================
function drawBrushIcon(png) {
  const bg = [71, 184, 129]; // green theme
  const light = [144, 217, 178];
  const dark = [45, 140, 90];
  const white = [255, 255, 255];
  const ink = [40, 40, 40];

  // Background - rounded rect
  fillRoundedRect(png, 10, 10, 180, 180, 30, ...bg, 255);

  // Brush handle - diagonal from top-right to center-left
  const bx1 = 150, by1 = 30, bx2 = 70, by2 = 130;
  // Handle body (thick)
  for (let i = -5; i <= 5; i++) {
    drawLine(png, bx1 + i, by1 - 10, bx2 + i, by2 - 10, 180, 140, 100, 255);
  }
  // Handle top cap
  fillRect(png, bx1 - 6, by1 - 22, bx1 + 6, by1 - 8, 160, 120, 80, 255);

  // Brush tip (dark, wider at bottom)
  const tip_top_y = by2 - 10;
  for (let i = 0; i < 8; i++) {
    const spread = 3 + i * 2;
    thickLine(png, bx2 - spread, tip_top_y + i * 4, bx2 + spread, tip_top_y + i * 4, 1, ...ink, 255);
  }
  // Tip point
  thickLine(png, bx2, tip_top_y + 28, bx2 + 3, tip_top_y + 42, 3, ...ink, 255);
  thickLine(png, bx2, tip_top_y + 28, bx2 - 3, tip_top_y + 42, 3, ...ink, 255);

  // Ink stroke swirl (decorative)
  const sx = 100, sy = 70;
  for (let angle = 0; angle < 540; angle += 3) {
    const rad = angle * Math.PI / 180;
    const r = 15 + angle / 30;
    const px = Math.round(sx + r * Math.cos(rad));
    const py = Math.round(sy + r * Math.sin(rad));
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        setPixel(png, px + dx, py + dy, ...white, 200);
      }
    }
  }

  // Small stars around
  drawStar(png, 50, 60, 6, white, 180);
  drawStar(png, 140, 160, 5, white, 140);
  drawStar(png, 35, 120, 4, white, 120);
}

function drawStar(png, cx, cy, size, color, alpha) {
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    const x1 = Math.round(cx + size * Math.cos(angle));
    const y1 = Math.round(cy + size * Math.sin(angle));
    const x2 = Math.round(cx + size * 0.4 * Math.cos(angle + 36 * Math.PI / 180));
    const y2 = Math.round(cy + size * 0.4 * Math.sin(angle + 36 * Math.PI / 180));
    drawLine(png, cx, cy, x1, y1, ...color, alpha);
    if (i < 4) {
      const nextAngle = ((i + 1) * 72 - 90) * Math.PI / 180;
      const nx1 = Math.round(cx + size * Math.cos(nextAngle));
      const ny1 = Math.round(cy + size * Math.sin(nextAngle));
      drawLine(png, x1, y1, x2, y2, ...color, alpha);
      drawLine(png, x2, y2, nx1, ny1, ...color, alpha);
    }
  }
}

// ============================================================
// Design 2: 田字格 + 永字 (Grid + Character)
// ============================================================
function drawGridIcon(png) {
  const bg = [52, 73, 94]; // dark blue-grey
  const grid = [255, 255, 255];
  const red = [231, 76, 60];
  const gold = [241, 196, 15];

  // Background
  fillRoundedRect(png, 10, 10, 180, 180, 30, ...bg, 255);

  // 田字格 (field grid) - dashed lines
  const gx = 45, gy = 35, gs = 110;
  // Outer border
  thickLine(png, gx, gy, gx + gs, gy, 3, ...grid, 255);
  thickLine(png, gx, gy + gs, gx + gs, gy + gs, 3, ...grid, 255);
  thickLine(png, gx, gy, gx, gy + gs, 3, ...grid, 255);
  thickLine(png, gx + gs, gy, gx + gs, gy + gs, 3, ...grid, 255);
  // Cross lines (dashed)
  for (let i = gx + 8; i < gx + gs; i += 12) {
    const end = Math.min(i + 6, gx + gs);
    thickLine(png, i, gy + gs / 2, end, gy + gs / 2, 2, ...grid, 140);
  }
  for (let i = gy + 8; i < gy + gs; i += 12) {
    const end = Math.min(i + 6, gy + gs);
    thickLine(png, gx + gs / 2, i, gx + gs / 2, end, 2, ...grid, 140);
  }

  // Draw simplified "永" character strokes (white)
  const cx = gx + gs / 2, cy = gy + gs / 2 + 5;
  // 点 (dot)
  fillCircle(png, cx, cy - 25, 4, ...gold, 255);
  // 横 (horizontal)
  thickLine(png, cx - 22, cy - 14, cx + 18, cy - 16, 4, ...gold, 255);
  // 竖 (vertical)
  thickLine(png, cx - 6, cy - 16, cx - 6, cy + 20, 4, ...gold, 255);
  // 撇 (left-falling)
  thickLine(png, cx - 6, cy - 10, cx - 28, cy + 24, 4, ...gold, 255);
  // 捺 (right-falling)
  thickLine(png, cx - 6, cy + 5, cx + 22, cy + 24, 4, ...gold, 255);

  // Small brush in corner
  thickLine(png, 35, 170, 35, 155, 3, ...gold, 200);
  thickLine(png, 33, 170, 37, 170, 4, ...gold, 200);
}

// ============================================================
// Design 3: Star Medal (小达人勋章)
// ============================================================
function drawMedalIcon(png) {
  const navy = [25, 42, 86];
  const gold = [241, 196, 15];
  const goldDark = [200, 160, 10];
  const white = [255, 255, 255];
  const red = [231, 76, 60];

  // Background
  fillRoundedRect(png, 10, 10, 180, 180, 30, ...navy, 255);

  // Large star (medal shape)
  const scx = 100, scy = 80, sr = 55;
  drawBigStar(png, scx, scy, sr, gold, goldDark);

  // Inner circle
  fillCircle(png, scx, scy, 30, ...navy, 255);
  drawCircle(png, scx, scy, 30, 3, ...gold, 255);

  // "笔" simplified strokes inside
  // Horizontal strokes
  thickLine(png, scx - 14, scy - 10, scx + 14, scy - 10, 3, ...gold, 255);
  thickLine(png, scx - 10, scy - 2, scx + 10, scy - 2, 3, ...gold, 255);
  thickLine(png, scx - 14, scy + 6, scx + 14, scy + 6, 3, ...gold, 255);
  // Vertical stroke
  thickLine(png, scx, scy - 12, scx, scy + 16, 3, ...gold, 255);

  // Ribbon below
  const rx = scx, ry = scy + sr + 5;
  thickLine(png, rx - 20, ry, rx, ry + 20, 6, ...red, 255);
  thickLine(png, rx + 20, ry, rx, ry + 20, 6, ...red, 255);
  thickLine(png, rx - 20, ry, rx + 20, ry, 5, ...red, 255);

  // Small stars
  drawStar(png, 40, 40, 8, gold, 150);
  drawStar(png, 160, 40, 8, gold, 150);
  drawStar(png, 40, 160, 8, gold, 150);
  drawStar(png, 160, 160, 8, gold, 150);
}

function drawBigStar(png, cx, cy, size, fillColor, strokeColor) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * 36 - 90) * Math.PI / 180;
    const r = i % 2 === 0 ? size : size * 0.45;
    points.push({
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle))
    });
  }
  // Fill star (simple scanline fill)
  for (let y = cy - size; y <= cy + size; y++) {
    let inside = false;
    let crossings = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        const x = p1.x + (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y);
        crossings.push(x);
      }
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i < crossings.length - 1; i += 2) {
      for (let x = Math.round(crossings[i]); x <= Math.round(crossings[i + 1]); x++) {
        setPixel(png, x, y, ...fillColor, 255);
      }
    }
  }
  // Stroke star
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    thickLine(png, p1.x, p1.y, p2.x, p2.y, 2, ...strokeColor, 255);
  }
}

// ============================================================
// Design 4: Modern Minimal - Stroke Lines
// ============================================================
function drawModernIcon(png) {
  const teal = [26, 188, 156];
  const tealDark = [20, 150, 125];
  const white = [255, 255, 255];
  const coral = [255, 107, 107];

  // Background
  fillRoundedRect(png, 10, 10, 180, 180, 30, ...teal, 255);

  // Abstract brush stroke pattern (horizontal + diagonal)
  // Stroke 1 - thick horizontal
  for (let y = 50; y <= 65; y++) {
    for (let x = 40; x <= 160; x++) {
      const alpha = y <= 52 || y >= 63 ? 120 : 255;
      setPixel(png, x, y, ...white, alpha);
    }
  }
  // Taper right end
  for (let y = 50; y <= 65; y++) {
    for (let x = 155; x <= 170; x++) {
      if ((x - 155) / 15 > (y - 50) / 15) continue;
      setPixel(png, x, y, ...white, 100);
    }
  }

  // Stroke 2 - vertical with hook
  for (let x = 95; x <= 110; x++) {
    for (let y = 50; y <= 140; y++) {
      const alpha = x <= 97 || x >= 108 ? 120 : 255;
      setPixel(png, x, y, ...white, alpha);
    }
  }
  // Hook at bottom (left turn)
  for (let y = 135; y <= 150; y++) {
    for (let x = 70; x <= 110; x++) {
      if ((y - 135) / 15 < (110 - x) / 40) continue;
      setPixel(png, x, y, ...white, 180);
    }
  }

  // Stroke 3 - diagonal left-falling
  thickLine(png, 110, 50, 50, 150, 12, ...coral, 255);
  // Taper
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const px = Math.round(50 + (60 - 50) * t);
    const py = Math.round(150 - (150 - 145) * t);
    setPixel(png, px, py, ...coral, 100);
  }

  // Small decorative dot
  fillCircle(png, 135, 40, 6, ...white, 255);
}

// ============================================================
// Design 5: Calligraphy "汉" character + brush
// ============================================================
function drawHanziIcon(png) {
  const orange = [230, 126, 34];
  const orangeLight = [243, 156, 18];
  const white = [255, 255, 255];
  const ink = [44, 62, 80];

  // Background
  fillRoundedRect(png, 10, 10, 180, 180, 30, ...orange, 255);

  // Simplified "汉" character
  const cx = 100, cy = 90;

  // Left part: 氵(three drops)
  // Drop 1
  fillCircle(png, cx - 35, cy - 25, 6, ...white, 255);
  // Drop 2
  fillCircle(png, cx - 28, cy - 5, 5, ...white, 255);
  // Drop 3 - with tail
  thickLine(png, cx - 22, cy + 10, cx - 22, cy + 25, 4, ...white, 255);
  thickLine(png, cx - 22, cy + 20, cx - 12, cy + 32, 4, ...white, 255);

  // Right part: 又
  // Horizontal stroke
  thickLine(png, cx + 5, cy - 20, cx + 30, cy - 20, 4, ...white, 255);
  // Vertical-left stroke
  thickLine(png, cx + 5, cy - 20, cx - 5, cy + 30, 4, ...white, 255);
  // Right-falling stroke
  thickLine(png, cx + 5, cy - 10, cx + 25, cy + 25, 4, ...white, 255);

  // Small brush decoration at bottom-right
  thickLine(png, 155, 165, 145, 145, 3, ...ink, 200);
  thickLine(png, 145, 145, 148, 135, 2, ...ink, 200);
}

// ============================================================
// Generate all icons
// ============================================================
const icons = [
  { name: 'icon-brush', draw: drawBrushIcon, desc: '毛笔水墨风格' },
  { name: 'icon-grid', draw: drawGridIcon, desc: '田字格永字风格' },
  { name: 'icon-medal', draw: drawMedalIcon, desc: '小达人勋章风格' },
  { name: 'icon-modern', draw: drawModernIcon, desc: '现代简约笔画风格' },
  { name: 'icon-hanzi', draw: drawHanziIcon, desc: '汉字书法风格' },
];

for (const icon of icons) {
  const png = createPNG();
  icon.draw(png);
  const buf = PNG.sync.write(png);
  fs.writeFileSync(path.join(OUT_DIR, `${icon.name}.png`), buf);
  console.log(`Generated: ${icon.name}.png — ${icon.desc}`);
}

console.log('\nDone! 5 app icons generated in src/assets/icons/');
