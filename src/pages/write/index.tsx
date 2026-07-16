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

const WritePage: React.FC = () => {
  const { selectedCharacters, currentCharIndex, setCurrentCharIndex, nextChar, prevChar } = useAppStore();
  const [showHint, setShowHint] = useState(false);
  const [userStrokes, setUserStrokes] = useState<string[][]>([]);
  const [animCurrentStroke, setAnimCurrentStroke] = useState(0);
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
    setUserStrokes([]);
    setShowHint(false);
    setAnimCurrentStroke(0);
    return () => {
      animRendererRef.current?.destroy();
    };
  }, [currentCharIndex]);

  const initCanvas = (retryCount = 0) => {
    const MAX_RETRY = 5;
    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('#writeCanvas')
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
            drawGrid(ctx, { canvasWidth: lw, canvasHeight: lh, margin: 20, gridSize: 1024 });

            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#333333';
            ctxRef.current = ctx;
            canvasRef.current = canvas;
            console.log('[WritePage] Canvas initialized successfully');
          } else if (retryCount < MAX_RETRY) {
            console.warn(`[WritePage] Canvas init retry ${retryCount + 1}/${MAX_RETRY}`);
            initCanvas(retryCount + 1);
          } else {
            console.error('[WritePage] Canvas init failed after retries');
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
    drawGrid(ctxRef.current, { canvasWidth: w, canvasHeight: h, margin: 20, gridSize: 1024 });
    ctxRef.current.strokeStyle = '#333333';
    ctxRef.current.lineWidth = 4;
    setUserStrokes([]);
    setAnimCurrentStroke(0);
    animRendererRef.current?.destroy();
    animRendererRef.current = null;
  };

  // 笔顺动画 - 使用真实 medians 数据
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

    // 清除用户笔迹并绘制米字格
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 20, gridSize: 1024 });

    const renderer = new StrokeAnimationRenderer(ctx, strokeData.medians, {
      canvasWidth: w,
      canvasHeight: h,
      margin: 20,
    });
    renderer.setColors('rgba(71, 184, 129, 0.3)', 'rgba(255, 74, 74, 0.85)');
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
      // 恢复用户笔迹
      restoreUserStrokes();
    } else {
      setShowHint(true);
      setAnimCurrentStroke(0);
      startAnimation();
    }
  };

  const restoreUserStrokes = () => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    const { w, h } = logicalSizeRef.current;
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 20, gridSize: 1024 });
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    userStrokes.forEach(stroke => {
      ctx.beginPath();
      stroke.forEach((pt, i) => {
        const [x, y] = pt.split(',').map(Number);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  };

  const handleSubmit = async () => {
    animRendererRef.current?.destroy();

    // 使用真实评分
    const strokeData = getStrokeData(currentChar?.char || '');
    let score: number, accuracy: number;

    if (strokeData && userStrokes.length > 0) {
      const result = calculateScore(userStrokes, strokeData.medians);
      score = result.score;
      accuracy = result.accuracy;
    } else {
      // 未书写或无数据时给低分
      score = userStrokes.length > 0 ? 50 : 10;
      accuracy = score;
    }

    const aesthetics = Math.round(accuracy * 0.9 + 5);

    try {
      await callFunction<PracticeRecord>('savePracticeRecord', {
        character: currentChar?.char || '',
        mode: 'free',
        strokes: userStrokes,
        score,
        accuracy,
        aesthetics,
        duration: 30,
      });
      Taro.navigateTo({ url: `/pages/result/index?score=${score}&accuracy=${accuracy}&aesthetics=${aesthetics}&char=${currentChar?.char}` });
    } catch (err) {
      console.error('[WritePage] submit error:', err);
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
            <Text className={styles.charText}>{currentChar.char}</Text>
            <Text className={styles.charPinyin}>{currentChar.pinyin}</Text>
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
          id="writeCanvas"
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

      {showHint && (
        <View className={styles.hintPanel}>
          <Text className={styles.hintTitle}>笔画顺序提示（共{totalStrokes}画）</Text>
          <View className={styles.hintSteps}>
            {Array.from({ length: totalStrokes }).map((_, i) => (
              <View key={i} className={`${styles.hintStep} ${animCurrentStroke > i ? styles.hintStepDone : ''}`}>
                <Text>{i + 1}</Text>
              </View>
            ))}
          </View>
          <View className={styles.hintClose} onClick={handleToggleHint}>
            <Text>关闭提示</Text>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={`${styles.actionBtn} ${styles.hintBtn}`} onClick={handleToggleHint}>
          <Text>{showHint ? '停止演示' : '笔顺演示'}</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.clearBtn}`} onClick={handleClear}>
          <Text>清除</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.submitBtn}`} onClick={handleSubmit}>
          <Text>提交评分</Text>
        </View>
      </View>
    </View>
  );
};

export default WritePage;
