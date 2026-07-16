/**
 * Canvas 笔画渲染工具
 * 支持基于 hanzi-writer-data medians 数据的笔画动画渲染
 * 坐标基于 1024x1024 网格，渲染时自动缩放
 */

export interface RenderConfig {
  canvasWidth: number;
  canvasHeight: number;
  margin?: number;       // 边距
  gridSize?: number;     // 源数据网格大小（默认 1024）
  lineWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
}

const DEFAULT_CONFIG: Required<RenderConfig> = {
  canvasWidth: 300,
  canvasHeight: 300,
  margin: 30,
  gridSize: 1024,
  lineWidth: 4,
  lineCap: 'round',
  lineJoin: 'round',
};

/** 将 1024 网格坐标转换为 Canvas 坐标 */
function toCanvas(
  rx: number, ry: number,
  config: Required<RenderConfig>
): { x: number; y: number } {
  const { margin, canvasWidth, canvasHeight, gridSize } = config;
  const drawW = canvasWidth - margin * 2;
  const drawH = canvasHeight - margin * 2;
  return {
    x: margin + (rx / gridSize) * drawW,
    y: margin + (ry / gridSize) * drawH,
  };
}

/** 绘制米字格辅助线 */
export function drawGrid(
  ctx: any,
  config: Required<RenderConfig>,
  color: string = 'rgba(71, 184, 129, 0.12)'
) {
  const { canvasWidth: w, canvasHeight: h } = config;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  // 十字线
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  // 对角线
  ctx.moveTo(0, 0);
  ctx.lineTo(w, h);
  ctx.moveTo(w, 0);
  ctx.lineTo(0, h);
  ctx.stroke();
  ctx.restore();
}

/** 绘制单笔画（基于 medians 中心线数据） */
export function drawStroke(
  ctx: any,
  medians: number[][],
  config: Required<RenderConfig>,
  color: string = '#333333',
  lineWidth?: number,
) {
  if (medians.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth || config.lineWidth;
  ctx.lineCap = config.lineCap;
  ctx.lineJoin = config.lineJoin;
  ctx.beginPath();

  const first = toCanvas(medians[0][0], medians[0][1], config);
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < medians.length; i++) {
    const pt = toCanvas(medians[i][0], medians[i][1], config);
    ctx.lineTo(pt.x, pt.y);
  }

  ctx.stroke();
  ctx.restore();
}

/** 绘制所有笔画（静态） */
export function drawAllStrokes(
  ctx: any,
  allMedians: number[][][],
  config: Required<RenderConfig>,
  color: string = '#333333',
  lineWidth?: number,
) {
  for (const medians of allMedians) {
    drawStroke(ctx, medians, config, color, lineWidth);
  }
}

/** 笔顺动画状态 */
export interface AnimationState {
  currentStrokeIndex: number;  // 当前正在画的笔画索引
  progress: number;            // 当前笔画进度 0-1
  completedStrokes: number;    // 已完成的笔画数
  isAnimating: boolean;
}

/**
 * 笔顺动画渲染器
 * 逐笔绘制笔画动画
 */
export class StrokeAnimationRenderer {
  private ctx: any;
  private config: Required<RenderConfig>;
  private allMedians: number[][][];
  private state: AnimationState;
  private animationTimer: any = null;
  private onFrame: ((state: AnimationState) => void) | null = null;
  private onComplete: (() => void) | null = null;

  // 颜色配置
  private completedColor = 'rgba(71, 184, 129, 0.35)';
  private activeColor = 'rgba(255, 74, 74, 0.85)';

  constructor(
    ctx: any,
    allMedians: number[][][],
    config: Partial<RenderConfig> = {},
  ) {
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.allMedians = allMedians;
    this.state = {
      currentStrokeIndex: 0,
      progress: 0,
      completedStrokes: 0,
      isAnimating: false,
    };
  }

  getState(): AnimationState {
    return { ...this.state };
  }

  setColors(completedColor: string, activeColor: string) {
    this.completedColor = completedColor;
    this.activeColor = activeColor;
  }

  onAnimationFrame(cb: (state: AnimationState) => void) {
    this.onFrame = cb;
  }

  onAnimationComplete(cb: () => void) {
    this.onComplete = cb;
  }

  /** 绘制背景（米字格等），子类可覆盖 */
  drawBackground() {
    const { canvasWidth: w, canvasHeight: h } = this.config;
    this.ctx.clearRect(0, 0, w, h);
    drawGrid(this.ctx, this.config);
  }

  /** 渲染当前动画帧 */
  private renderFrame() {
    if (!this.ctx) return;

    // 清除并重绘背景
    this.drawBackground();

    // 绘制已完成的笔画
    for (let i = 0; i < this.state.currentStrokeIndex; i++) {
      drawStroke(this.ctx, this.allMedians[i], this.config, this.completedColor, 3);
    }

    // 绘制当前动画中的笔画
    const currentMedians = this.allMedians[this.state.currentStrokeIndex];
    if (currentMedians && currentMedians.length > 1) {
      const totalPts = currentMedians.length;
      const endIdx = Math.floor(this.state.progress * (totalPts - 1)) + 1;
      const partialMedians = currentMedians.slice(0, Math.min(endIdx + 1, totalPts));
      drawStroke(this.ctx, partialMedians, this.config, this.activeColor, 5);
    }
  }

  /** 开始动画 */
  start(speedMs: number = 40) {
    this.stop();
    this.state = {
      currentStrokeIndex: 0,
      progress: 0,
      completedStrokes: 0,
      isAnimating: true,
    };

    const totalStepsPerStroke = 12; // 每笔画的分步数

    this.animationTimer = setInterval(() => {
      if (!this.state.isAnimating) {
        this.stop();
        return;
      }

      // 更新进度
      this.state.progress += 1 / totalStepsPerStroke;

      if (this.state.progress >= 1) {
        // 当前笔画完成
        this.state.completedStrokes++;
        this.state.progress = 0;
        this.state.currentStrokeIndex++;

        if (this.state.currentStrokeIndex >= this.allMedians.length) {
          // 全部完成
          this.state.isAnimating = false;
          this.renderFrame();
          this.stop();
          if (this.onComplete) this.onComplete();
          return;
        }
      }

      this.renderFrame();
      if (this.onFrame) this.onFrame(this.getState());
    }, speedMs);
  }

  /** 跳到指定笔画 */
  jumpToStroke(index: number) {
    this.state.currentStrokeIndex = Math.min(index, this.allMedians.length - 1);
    this.state.progress = 0;
    this.state.completedStrokes = this.state.currentStrokeIndex;
    this.renderFrame();
  }

  /** 停止动画 */
  stop() {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
    this.state.isAnimating = false;
  }

  /** 销毁 */
  destroy() {
    this.stop();
    this.onFrame = null;
    this.onComplete = null;
  }
}
