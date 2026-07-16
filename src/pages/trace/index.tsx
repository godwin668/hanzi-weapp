import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { callFunction } from '@/services/cloud';
import { PracticeRecord } from '@/types';
import { getStrokeData } from '@/data/strokeData';
import { StrokeAnimationRenderer, drawGrid } from '@/utils/canvasStrokeRenderer';
import { calculateScore } from '@/utils/strokeScoring';
import styles from './index.module.scss';

const TracePage: React.FC = () => {
  const { selectedCharacters, currentCharIndex, setCurrentCharIndex, nextChar, prevChar } = useAppStore();
  const [showHint, setShowHint] = useState(false);
  const [animCurrentStroke, setAnimCurrentStroke] = useState(0);
  const [userStrokes, setUserStrokes] = useState<string[][]>([]);
  const canvasRef = useRef<any>(null);
  const ctxRef = useRef<any>(null);
  const canvasRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const logicalSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const currentStrokeRef = useRef<string[]>([]);
  const animRendererRef = useRef<StrokeAnimationRenderer | null>(null);
  const isDrawingRef = useRef(false);

  const currentChar = selectedCharacters[currentCharIndex];

  useEffect(() => {
    if (!currentChar) {
      Taro.showToast({ title: '请先选择汉字', icon: 'none' });
      Taro.navigateBack();
      return;
    }
    initCanvas();
    setShowHint(false);
    setAnimCurrentStroke(0);
    setUserStrokes([]);
    return () => {
      animRendererRef.current?.destroy();
    };
  }, [currentCharIndex]);

  const initCanvas = (retryCount = 0) => {
    const MAX_RETRY = 5;
    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('#traceCanvas')
        .fields({ node: true, size: true, rect: true })
        .exec((res) => {
          if (res[0] && res[0].node) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = Taro.getSystemInfoSync().pixelRatio;
            canvas.width = res[0].width * dpr;
            canvas.height = res[0].height * dpr;
            ctx.scale(dpr, dpr);

            const lw = res[0].width;
            const lh = res[0].height;
            logicalSizeRef.current = { w: lw, h: lh };
            canvasRectRef.current = { left: res[0].left, top: res[0].top, width: lw, height: lh };

            // 绘制米字格
            drawGrid(ctx, { canvasWidth: lw, canvasHeight: lh, margin: 30, gridSize: 1024 });

            // 绘制描红底字（基于真实 medians 数据）
            const strokeData = getStrokeData(currentChar?.char || '');
            if (strokeData) {
              const margin = 30;
              const drawW = lw - margin * 2;
              const drawH = lh - margin * 2;

              ctx.save();
              ctx.strokeStyle = 'rgba(71, 184, 129, 0.08)';
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              for (const medians of strokeData.medians) {
                if (medians.length < 2) continue;
                ctx.beginPath();
                const firstX = margin + (medians[0][0] / 1024) * drawW;
                const firstY = margin + (medians[0][1] / 1024) * drawH;
                ctx.moveTo(firstX, firstY);
                for (let i = 1; i < medians.length; i++) {
                  const px = margin + (medians[i][0] / 1024) * drawW;
                  const py = margin + (medians[i][1] / 1024) * drawH;
                  ctx.lineTo(px, py);
                }
                ctx.stroke();
              }
              ctx.restore();
            }

            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#FFB347';
            ctxRef.current = ctx;
            canvasRef.current = canvas;
            console.log('[TracePage] Canvas initialized successfully');
          } else if (retryCount < MAX_RETRY) {
            console.warn(`[TracePage] Canvas init retry ${retryCount + 1}/${MAX_RETRY}`);
            initCanvas(retryCount + 1);
          } else {
            console.error('[TracePage] Canvas init failed after retries');
            Taro.showToast({ title: '画布加载失败，请重试', icon: 'none' });
          }
        });
    }, 100 + retryCount * 150);
  };

  const getCanvasPos = (touch: any) => {
    // Canvas 2D 中 touch.x/y 已相对于 Canvas 左上角，无需减去 rect
    return { x: touch.x, y: touch.y };
  };

  const handleTouchStart = useCallback((e: any) => {
    if (showHint || !ctxRef.current) return;
    const touch = e.touches[0];
    const pos = getCanvasPos(touch);
    isDrawingRef.current = true;
    currentStrokeRef.current = [];
    currentStrokeRef.current.push(`${pos.x},${pos.y}`);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(pos.x, pos.y);
  }, [showHint]);

  const handleTouchMove = useCallback((e: any) => {
    if (!isDrawingRef.current || !ctxRef.current) return;
    const touch = e.touches[0];
    const pos = getCanvasPos(touch);
    currentStrokeRef.current.push(`${pos.x},${pos.y}`);
    ctxRef.current.lineTo(pos.x, pos.y);
    ctxRef.current.stroke();
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    ctxRef.current?.closePath();
    if (currentStrokeRef.current.length > 1) {
      setUserStrokes(prev => [...prev, [...currentStrokeRef.current]]);
    }
    currentStrokeRef.current = [];
  }, []);

  const handleClear = () => {
    if (!ctxRef.current) return;
    const { w, h } = logicalSizeRef.current;
    ctxRef.current.clearRect(0, 0, w, h);
    setUserStrokes([]);
    setAnimCurrentStroke(0);
    animRendererRef.current?.destroy();
    animRendererRef.current = null;
    initCanvas();
  };

  // 笔顺动画
  const startAnimation = useCallback(() => {
    if (!currentChar) return;
    if (!ctxRef.current) {
      Taro.showToast({ title: '画布尚未就绪，请稍候', icon: 'none' });
      return;
    }

    const strokeData = getStrokeData(currentChar.char);
    if (!strokeData || strokeData.medians.length === 0) {
      Taro.showToast({ title: '暂无该字笔顺数据', icon: 'none' });
      return;
    }

    const { w, h } = logicalSizeRef.current;
    const ctx = ctxRef.current;

    // 清除并重绘底字
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 });

    // 淡色底字
    const margin = 30;
    const drawW = w - margin * 2;
    const drawH = h - margin * 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(71, 184, 129, 0.06)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const medians of strokeData.medians) {
      if (medians.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(margin + (medians[0][0] / 1024) * drawW, margin + (medians[0][1] / 1024) * drawH);
      for (let i = 1; i < medians.length; i++) {
        ctx.lineTo(margin + (medians[i][0] / 1024) * drawW, margin + (medians[i][1] / 1024) * drawH);
      }
      ctx.stroke();
    }
    ctx.restore();

    const renderer = new StrokeAnimationRenderer(ctx, strokeData.medians, {
      canvasWidth: w,
      canvasHeight: h,
      margin: 30,
    });
    // 覆盖 drawBackground 以保留底字
    renderer.drawBackground = () => {
      ctx.clearRect(0, 0, w, h);
      drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 });
      // 重绘底字
      ctx.save();
      ctx.strokeStyle = 'rgba(71, 184, 129, 0.06)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const medians of strokeData.medians) {
        if (medians.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(margin + (medians[0][0] / 1024) * drawW, margin + (medians[0][1] / 1024) * drawH);
        for (let i = 1; i < medians.length; i++) {
          ctx.lineTo(margin + (medians[i][0] / 1024) * drawW, margin + (medians[i][1] / 1024) * drawH);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    renderer.setColors('rgba(71, 184, 129, 0.35)', 'rgba(255, 74, 74, 0.85)');
    renderer.onAnimationFrame((state) => {
      setAnimCurrentStroke(state.currentStrokeIndex + 1);
    });
    renderer.onAnimationComplete(() => {
      setAnimCurrentStroke(strokeData.medians.length);
    });

    animRendererRef.current = renderer;
    renderer.start(60);
  }, [currentChar]);

  const handleToggleHint = () => {
    if (showHint) {
      setShowHint(false);
      setAnimCurrentStroke(0);
      animRendererRef.current?.destroy();
      animRendererRef.current = null;
      handleClear();
    } else {
      setShowHint(true);
      setAnimCurrentStroke(0);
      startAnimation();
    }
  };

  const handleSubmit = async () => {
    animRendererRef.current?.destroy();

    const strokeData = getStrokeData(currentChar?.char || '');
    let score: number, accuracy: number;

    if (strokeData && userStrokes.length > 0) {
      const result = calculateScore(userStrokes, strokeData.medians);
      score = result.score;
      accuracy = result.accuracy;
    } else {
      score = userStrokes.length > 0 ? 55 : 15;
      accuracy = score;
    }

    const aesthetics = Math.round(accuracy * 0.9 + 5);

    try {
      await callFunction<PracticeRecord>('savePracticeRecord', {
        character: currentChar?.char || '',
        mode: 'trace',
        strokes: userStrokes,
        score,
        accuracy,
        aesthetics,
        duration: 35,
      });
      Taro.navigateTo({ url: `/pages/result/index?score=${score}&accuracy=${accuracy}&aesthetics=${aesthetics}&char=${currentChar?.char}` });
    } catch (err) {
      console.error('[TracePage] submit error:', err);
      Taro.navigateTo({ url: `/pages/result/index?score=${score}&accuracy=${accuracy}&aesthetics=${aesthetics}&char=${currentChar?.char}` });
    }
  };

  if (!currentChar) return null;

  const strokeData = getStrokeData(currentChar.char);
  const totalStrokes = strokeData?.medians.length || currentChar.strokes;

  return (
    <View className={styles.page}>
      <View className={styles.topBar}>
        <View className={styles.charInfo}>
          <View className={styles.charDisplay}>
            <Text>{currentChar.char}</Text>
          </View>
          <View>
            <Text className={styles.charText}>描红：{currentChar.char}</Text>
            <Text className={styles.strokeInfo}>{totalStrokes}画</Text>
          </View>
        </View>
        <View className={styles.topRight}>
          <View className={styles.prevNext}>
            {currentCharIndex > 0 && (
              <View className={styles.navBtn} onClick={prevChar}>
                <Text>‹</Text>
              </View>
            )}
            {currentCharIndex < selectedCharacters.length - 1 && (
              <View className={styles.navBtn} onClick={nextChar}>
                <Text>›</Text>
              </View>
            )}
          </View>
          <Text className={styles.progress}>
            {currentCharIndex + 1} / {selectedCharacters.length}
          </Text>
        </View>
      </View>

      <View className={styles.canvasWrapper}>
        <Canvas
          id="traceCanvas"
          type="2d"
          className={styles.canvas}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          disableScroll
        />
        {showHint && animCurrentStroke > 0 && (
          <View className={styles.hintOverlay}>
            <Text className={styles.hintOverlayText}>
              笔顺演示 第{animCurrentStroke}/{totalStrokes}画
            </Text>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.actionBtn} ${styles.clearBtn}`} onClick={handleClear}>
          <Text>清除重写</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.hintBtn}`} onClick={handleToggleHint}>
          <Text>{showHint ? '停止演示' : '笔顺演示'}</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.submitBtn}`} onClick={handleSubmit}>
          <Text>提交评分</Text>
        </View>
      </View>
    </View>
  );
};

export default TracePage;
