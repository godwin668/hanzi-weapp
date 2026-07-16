import { useState, useRef, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { createBrushState, calcBrushWidth, resetBrushState } from '@/utils/pressureBrush';

/**
 * Canvas 核心操作 Hook，封装三个书写页面（write/trace/test）共用的
 * Canvas 初始化、触摸绘制、清除等逻辑。
 */
export interface CanvasCoreOptions {
  /** Canvas 选择器 ID，如 '#writeCanvas' */
  canvasId: string;
  /** 是否禁用触摸事件（如笔顺演示期间） */
  disabled?: boolean;
  /** 默认画笔颜色 */
  strokeColor?: string;
}

export function useCanvasCore(options: CanvasCoreOptions) {
  const { canvasId, disabled = false, strokeColor = '#333333' } = options;

  const canvasRef = useRef<any>(null);
  const ctxRef = useRef<any>(null);
  const logicalSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const currentStrokeRef = useRef<string[]>([]);
  const isDrawingRef = useRef(false);
  const brushRef = useRef(createBrushState());
  const disabledRef = useRef(disabled);
  const strokeColorRef = useRef(strokeColor);

  const [userStrokes, setUserStrokes] = useState<string[][]>([]);

  // 同步外部状态到 ref（避免 touch handler 闭包过期）
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);
  useEffect(() => { strokeColorRef.current = strokeColor; }, [strokeColor]);

  /**
   * 从触摸事件中提取坐标（兼容不同事件格式）
   */
  const getCanvasPos = (touch: any) => {
    const x = touch.x ?? touch.clientX ?? 0;
    const y = touch.y ?? touch.clientY ?? 0;
    return { x, y };
  };

  /**
   * 初始化 Canvas 2D 上下文，处理 DPR 缩放
   * @param onReady Canvas 就绪后的回调，传入 ctx 和逻辑尺寸
   */
  const initCanvas = useCallback(
    (onReady?: (ctx: any, w: number, h: number) => void, retryCount = 0) => {
      const MAX_RETRY = 5;
      setTimeout(() => {
        const query = Taro.createSelectorQuery();
        query
          .select(canvasId)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res[0] && res[0].node) {
              const canvas = res[0].node;
              const ctx = canvas.getContext('2d');
              const dpr = Taro.getSystemInfoSync().pixelRatio;
              const lw = res[0].width;
              const lh = res[0].height;
              canvas.width = lw * dpr;
              canvas.height = lh * dpr;
              ctx.scale(dpr, dpr);

              logicalSizeRef.current = { w: lw, h: lh };

              ctx.lineWidth = 4;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.strokeStyle = strokeColorRef.current;

              ctxRef.current = ctx;
              canvasRef.current = canvas;

              console.log(`[useCanvasCore] ${canvasId} init OK, size: ${lw}x${lh}, dpr: ${dpr}`);

              onReady?.(ctx, lw, lh);
            } else if (retryCount < MAX_RETRY) {
              console.warn(`[useCanvasCore] ${canvasId} init retry ${retryCount + 1}/${MAX_RETRY}`);
              initCanvas(onReady, retryCount + 1);
            } else {
              console.error(`[useCanvasCore] ${canvasId} init failed after retries`);
              Taro.showToast({ title: '画布加载失败，请重试', icon: 'none' });
            }
          });
      }, 100 + retryCount * 150);
    },
    [canvasId],
  );

  // ========== 触摸事件 ==========

  const handleTouchStart = useCallback((e: any) => {
    if (disabledRef.current || !ctxRef.current) return;
    const touch = e.touches?.[0] || e.detail || {};
    const pos = getCanvasPos(touch);
    isDrawingRef.current = true;
    currentStrokeRef.current = [];
    currentStrokeRef.current.push(`${pos.x},${pos.y}`);
    resetBrushState(brushRef.current);
    ctxRef.current.lineWidth = brushRef.current.currentWidth;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(pos.x, pos.y);
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    if (!isDrawingRef.current || !ctxRef.current) return;
    const touch = e.touches?.[0] || e.detail || {};
    const pos = getCanvasPos(touch);
    currentStrokeRef.current.push(`${pos.x},${pos.y}`);
    const { width } = calcBrushWidth(brushRef.current, pos);
    ctxRef.current.lineWidth = width;
    ctxRef.current.lineTo(pos.x, pos.y);
    ctxRef.current.stroke();
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    ctxRef.current?.closePath();
    if (currentStrokeRef.current.length > 1) {
      setUserStrokes((prev) => [...prev, [...currentStrokeRef.current]]);
    }
    currentStrokeRef.current = [];
  }, []);

  // ========== 清除 ==========

  /**
   * 清除画布并重置状态
   * @param redraw 清除后的重绘回调
   */
  const clearCanvas = useCallback(
    (redraw?: (ctx: any, w: number, h: number) => void) => {
      if (!ctxRef.current) return;
      const { w, h } = logicalSizeRef.current;
      ctxRef.current.clearRect(0, 0, w, h);
      ctxRef.current.strokeStyle = strokeColorRef.current;
      ctxRef.current.lineWidth = 4;
      setUserStrokes([]);
      redraw?.(ctxRef.current, w, h);
    },
    [],
  );

  /**
   * 重绘所有已保存的笔画到画布
   */
  const redrawStrokes = useCallback((strokes: string[][]) => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    ctx.strokeStyle = strokeColorRef.current;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach((stroke) => {
      ctx.beginPath();
      stroke.forEach((pt, i) => {
        const [x, y] = pt.split(',').map(Number);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, []);

  return {
    canvasRef,
    ctxRef,
    logicalSizeRef,
    userStrokes,
    setUserStrokes,
    initCanvas,
    clearCanvas,
    redrawStrokes,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getCanvasPos,
  };
}
