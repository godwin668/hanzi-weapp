import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { callFunction } from '@/services/cloud';
import { TestRecord } from '@/types';
import { getStrokeData } from '@/data/strokeData';
import { drawGrid } from '@/utils/canvasStrokeRenderer';
import { calculateScore } from '@/utils/strokeScoring';
import { createBrushState, calcBrushWidth, resetBrushState } from '@/utils/pressureBrush';
import styles from './index.module.scss';

const TestPage: React.FC = () => {
  const { selectedCharacters } = useAppStore();
  const [charIndex, setCharIndex] = useState(0);
  const [completedChars, setCompletedChars] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);
  const [userStrokes, setUserStrokes] = useState<string[][]>([]);
  const canvasRef = useRef<any>(null);
  const ctxRef = useRef<any>(null);
  const canvasRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const logicalSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const timerRef = useRef<any>(null);
  const currentStrokeRef = useRef<string[]>([]);
  const isDrawingRef = useRef(false);
  const brushRef = useRef(createBrushState());

  const currentChar = selectedCharacters[charIndex];

  useEffect(() => {
    if (selectedCharacters.length === 0) {
      Taro.showToast({ title: '请先选择汉字', icon: 'none' });
      Taro.navigateBack();
      return;
    }
    initCanvas();
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (currentChar) {
      handleClear();
    }
  }, [charIndex]);

  const initCanvas = (retryCount = 0) => {
    const MAX_RETRY = 5;
    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('#testCanvas')
        .fields({ node: true, size: true, rect: true })
        .exec((res) => {
          console.log('[TestPage] Query result:', JSON.stringify(res));
          if (res[0] && res[0].node) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = Taro.getSystemInfoSync().pixelRatio;
            canvas.width = res[0].width * dpr;
            canvas.height = res[0].height * dpr;
            ctx.scale(dpr, dpr);

            const lw = res[0].width;
            const lh = res[0].height;
            console.log('[TestPage] Canvas size:', lw, 'x', lh, 'dpr:', dpr);
            logicalSizeRef.current = { w: lw, h: lh };
            canvasRectRef.current = { left: res[0].left, top: res[0].top, width: lw, height: lh };

            // 绘制米字格
            drawGrid(ctx, { canvasWidth: lw, canvasHeight: lh, margin: 30, gridSize: 1024 });

            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#333333';
            ctxRef.current = ctx;
            canvasRef.current = canvas;
            console.log('[TestPage] Canvas initialized successfully, ctxRef set:', !!ctxRef.current);
          } else if (retryCount < MAX_RETRY) {
            console.warn(`[TestPage] Canvas init retry ${retryCount + 1}/${MAX_RETRY}`);
            initCanvas(retryCount + 1);
          } else {
            console.error('[TestPage] Canvas init failed after retries, res:', JSON.stringify(res));
            Taro.showToast({ title: '画布加载失败，请重试', icon: 'none' });
          }
        });
    }, 100 + retryCount * 150);
  };

  const getCanvasPos = (touch: any) => {
    // 兼容不同事件格式：直接属性 或 detail
    const x = touch.x ?? touch.clientX ?? 0;
    const y = touch.y ?? touch.clientY ?? 0;
    return { x, y };
  };

  const handleTouchStart = useCallback((e: any) => {
    const touch = e.touches[0];
    if (!ctxRef.current) return;
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
    const touch = e.touches[0];
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
      setUserStrokes(prev => [...prev, [...currentStrokeRef.current]]);
    }
    currentStrokeRef.current = [];
  }, []);

  const handleClear = () => {
    if (!ctxRef.current) return;
    const { w, h } = logicalSizeRef.current;
    ctxRef.current.clearRect(0, 0, w, h);
    drawGrid(ctxRef.current, { canvasWidth: w, canvasHeight: h, margin: 30, gridSize: 1024 });
    ctxRef.current.strokeStyle = '#333333';
    ctxRef.current.lineWidth = 4;
    setUserStrokes([]);
  };

  const handleNextChar = () => {
    // 使用真实评分
    const strokeData = getStrokeData(currentChar?.char || '');
    let score: number;

    if (strokeData && userStrokes.length > 0) {
      const result = calculateScore(userStrokes, strokeData.medians);
      score = result.score;
    } else {
      score = userStrokes.length > 0 ? 50 : 10;
    }

    const newScores = [...scores];
    newScores[charIndex] = score;
    setScores(newScores);
    setCompletedChars([...completedChars, charIndex]);

    if (charIndex < selectedCharacters.length - 1) {
      setCharIndex(charIndex + 1);
    }
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);

    // 最后一个字的评分
    const strokeData = getStrokeData(currentChar?.char || '');
    let lastScore: number;
    if (strokeData && userStrokes.length > 0) {
      const result = calculateScore(userStrokes, strokeData.medians);
      lastScore = result.score;
    } else {
      lastScore = userStrokes.length > 0 ? 50 : 10;
    }

    const finalScores = [...scores];
    finalScores[charIndex] = lastScore;
    const avgAccuracy = finalScores.reduce((a, b) => a + b, 0) / finalScores.length;

    // 保存最后一个字的笔迹数据用于结果页对比展示
    useAppStore.getState().setLastSessionData({
      char: currentChar?.char || '',
      userStrokes: [...userStrokes],
    });

    try {
      await callFunction<TestRecord>('saveTestRecord', {
        characters: selectedCharacters.map((c) => c.char),
        scores: finalScores,
        avgAccuracy: Math.round(avgAccuracy),
        totalTime: timer,
      });
      Taro.redirectTo({
        url: `/pages/result/index?score=${Math.round(avgAccuracy)}&accuracy=${Math.round(avgAccuracy)}&aesthetics=${Math.round(avgAccuracy)}&char=${selectedCharacters.map(c => c.char).join('')}&isTest=1`,
      });
    } catch (err) {
      console.error('[TestPage] submit error:', err);
      Taro.redirectTo({
        url: `/pages/result/index?score=${Math.round(avgAccuracy)}&accuracy=${Math.round(avgAccuracy)}&aesthetics=${Math.round(avgAccuracy)}&char=${selectedCharacters.map(c => c.char).join('')}&isTest=1`,
      });
    }
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
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
            <Text className={styles.charText}>请写：{currentChar.char}</Text>
            <Text className={styles.progress}>
              {charIndex + 1} / {selectedCharacters.length}
            </Text>
          </View>
        </View>
        <Text className={styles.timer}>{formatTime(timer)}</Text>
      </View>

      <View className={styles.charList}>
        {selectedCharacters.map((c, i) => (
          <View
            key={i}
            className={classnames(
              styles.charTag,
              i === charIndex && styles.active,
              completedChars.includes(i) && styles.done
            )}
          >
            <Text>{c.char}</Text>
          </View>
        ))}
      </View>

      <View className={styles.canvasWrapper}>
        <Canvas
          id="testCanvas"
          type="2d"
          className={styles.canvas}
          disableScroll
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.actionBtn} ${styles.clearBtn}`} onClick={handleClear}>
          <Text>清除</Text>
        </View>
        {charIndex < selectedCharacters.length - 1 ? (
          <View className={`${styles.actionBtn} ${styles.submitBtn}`} onClick={handleNextChar}>
            <Text>下一个字</Text>
          </View>
        ) : (
          <View className={`${styles.actionBtn} ${styles.submitBtn}`} onClick={handleSubmit}>
            <Text>提交测试</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TestPage;
