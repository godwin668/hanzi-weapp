/**
 * 基于运笔速度模拟笔触粗细（压力感应）
 * - 速度慢 → 笔画粗（模拟用力顿笔）
 * - 速度快 → 笔画细（模拟快速轻划）
 */

interface Point {
  x: number;
  y: number;
}

interface BrushState {
  prevPoint: Point | null;
  prevTime: number;
  currentWidth: number;
}

const MIN_WIDTH = 2;   // 最快时的最细笔宽
const MAX_WIDTH = 8;   // 最慢时的最粗笔宽
const SMOOTHING = 0.3; // 宽度平滑过渡系数

/** 计算两点间距离 */
function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 根据速度计算笔宽：速度越小越粗，速度越大越细 */
function speedToWidth(speed: number): number {
  // speed 单位: px/ms，典型范围 0.05 ~ 2.0
  // 使用指数衰减曲线：慢速时宽度接近 MAX_WIDTH，快速时接近 MIN_WIDTH
  const maxSpeed = 2.0;  // 超过此速度则最细
  const minSpeed = 0.05; // 低于此速度则最粗

  const clampedSpeed = Math.max(minSpeed, Math.min(maxSpeed, speed));
  const t = (clampedSpeed - minSpeed) / (maxSpeed - minSpeed); // 0(慢) ~ 1(快)
  return MAX_WIDTH - t * (MAX_WIDTH - MIN_WIDTH);
}

/** 创建画笔状态 */
export function createBrushState(): BrushState {
  return {
    prevPoint: null,
    prevTime: 0,
    currentWidth: MAX_WIDTH,
  };
}

/**
 * 根据当前触摸点计算新的笔宽
 * 返回 { width: 平滑后的笔宽, speed: 原始速度 }
 */
export function calcBrushWidth(
  state: BrushState,
  point: Point,
): { width: number } {
  const now = Date.now();

  if (state.prevPoint && state.prevTime > 0) {
    const dist = distance(state.prevPoint, point);
    const dt = now - state.prevTime;

    if (dt > 0 && dist > 0) {
      const speed = dist / dt;
      const targetWidth = speedToWidth(speed);
      // 平滑过渡，避免宽度突变
      state.currentWidth = state.currentWidth + (targetWidth - state.currentWidth) * SMOOTHING;
    }
  }

  state.prevPoint = point;
  state.prevTime = now;

  return { width: state.currentWidth };
}

/** 重置画笔状态（touchstart 时调用） */
export function resetBrushState(state: BrushState): void {
  state.prevPoint = null;
  state.prevTime = 0;
  state.currentWidth = MAX_WIDTH;
}
