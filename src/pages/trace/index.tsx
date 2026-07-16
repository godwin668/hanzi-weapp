import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { callFunction } from '@/services/cloud';
import { PracticeRecord } from '@/types';
import { getStrokeData } from '@/data/strokeData';
import { StrokeAnimationRenderer, drawGrid, drawAllStrokeOutlines } from '@/utils/canvasStrokeRenderer';
import { calculateScore } from '@/utils/strokeScoring';
import { useCanvasCore } from '@/hooks/useCanvasCore';
import styles from './index.module.scss';

const TracePage: React.FC = () => {
  const { selectedCharacters, currentCharIndex, nextChar, prevChar } = useAppStore();
  const [showHint, setShowHint] = useState(false);
  const [animCurrentStroke, setAnimCurrentStroke] = useState(0);
  const animRendererRef = useRef<StrokeAnimationRenderer | null>(null);
  const showHintRef = useRef(false);

  const currentChar = selectedCharacters[currentCharIndex];

  const {
    ctxRef,
    logicalSizeRef,
    userStrokes,
    setUserStrokes,
    initCanvas,
    clearCanvas,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCanvasCore({
    canvasId: '#traceCanvas',
    disabled: showHint,
    strokeColor: '#FFB347',
  });

  useEffect(() => { showHintRef.current = showHint; }, [showHint]);

  const strokeData = getStrokeData(currentChar?.char || '');
  const totalStrokes = strokeData?.medians.length || currentChar?.strokes;

  // ========== 绘制描红底字 ==========

  const drawBaseOutline = useCallback((ctx: any, w: number, h: number) => {
    const sd = getStrokeData(currentChar?.char || '');
    if (sd) {
      drawAllStrokeOutlines(
        ctx, sd.strokes,
        { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 },
        false, 'rgba(71, 184, 129, 0.1)',
      );
    }
  }, [currentChar]);

  // ========== Canvas 初始化 ==========

  useEffect(() => {
    if (!currentChar) {
      Taro.showToast({ title: '请先选择汉字', icon: 'none' });
      Taro.navigateBack();
      return;
    }
    setUserStrokes([]);
    setShowHint(false);
    setAnimCurrentStroke(0);
    initCanvas((ctx, w, h) => {
      drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 });
      drawBaseOutline(ctx, w, h);
    });
    return () => {
      animRendererRef.current?.destroy();
    };
  }, [currentCharIndex]);

  // ========== 笔顺动画 ==========

  const startAnimation = useCallback(() => {
    if (!currentChar) return;
    if (!ctxRef.current) {
      Taro.showToast({ title: '画布尚未就绪，请稍候', icon: 'none' });
      return;
    }

    const sd = getStrokeData(currentChar.char);
    if (!sd || sd.medians.length === 0) {
      Taro.showToast({ title: '暂无该字笔顺数据', icon: 'none' });
      return;
    }

    const { w, h } = logicalSizeRef.current;
    const ctx = ctxRef.current;

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 });
    drawAllStrokeOutlines(
      ctx, sd.strokes,
      { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 },
      false, 'rgba(71, 184, 129, 0.07)',
    );

    const renderer = new StrokeAnimationRenderer(ctx, sd.medians, {
      canvasWidth: w, canvasHeight: h, margin: 30,
    });
    renderer.drawBackground = () => {
      ctx.clearRect(0, 0, w, h);
      drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 });
      drawAllStrokeOutlines(
        ctx, sd.strokes,
        { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 },
        false, 'rgba(71, 184, 129, 0.07)',
      );
    };
    renderer.setColors('rgba(71, 184, 129, 0.35)', 'rgba(255, 74, 74, 0.85)');
    renderer.onAnimationFrame((state) => {
      setAnimCurrentStroke(state.currentStrokeIndex + 1);
    });
    renderer.onAnimationComplete(() => {
      setAnimCurrentStroke(sd.medians.length);
    });

    animRendererRef.current = renderer;
    renderer.start(60);
  }, [currentChar, ctxRef, logicalSizeRef]);

  // ========== 操作 ==========

  const handleClear = () => {
    clearCanvas((ctx, w, h) => {
      drawGrid(ctx, { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 });
      drawBaseOutline(ctx, w, h);
    });
    setAnimCurrentStroke(0);
    animRendererRef.current?.destroy();
    animRendererRef.current = null;
  };

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

    const sd = getStrokeData(currentChar?.char || '');
    let score: number, accuracy: number;

    if (sd && userStrokes.length > 0) {
      const result = calculateScore(userStrokes, sd.medians);
      score = result.score;
      accuracy = result.accuracy;
    } else {
      score = userStrokes.length > 0 ? 55 : 15;
      accuracy = score;
    }

    const aesthetics = Math.round(accuracy * 0.9 + 5);

    useAppStore.getState().setLastSessionData({
      char: currentChar?.char || '',
      userStrokes: [...userStrokes],
    });

    try {
      await callFunction<PracticeRecord>('savePracticeRecord', {
        character: currentChar?.char || '',
        mode: 'trace',
        strokes: userStrokes,
        score, accuracy, aesthetics,
        duration: 35,
      });
    } catch (err) {
      console.error('[TracePage] submit error:', err);
    }
    Taro.navigateTo({
      url: `/pages/result/index?score=${score}&accuracy=${accuracy}&aesthetics=${aesthetics}&char=${currentChar?.char}`,
    });
  };

  if (!currentChar) return null;

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
                <Text>{'<'}</Text>
              </View>
            )}
            {currentCharIndex < selectedCharacters.length - 1 && (
              <View className={styles.navBtn} onClick={nextChar}>
                <Text>{'>'}</Text>
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
          disableScroll
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
