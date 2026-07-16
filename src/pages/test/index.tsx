import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { callFunction } from '@/services/cloud';
import { TestRecord } from '@/types';
import styles from './index.module.scss';

const TestPage: React.FC = () => {
  const { selectedCharacters } = useAppStore();
  const [charIndex, setCharIndex] = useState(0);
  const [completedChars, setCompletedChars] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [timer, setTimer] = useState(0);
  const canvasRef = useRef<any>(null);
  const ctxRef = useRef<any>(null);
  const canvasRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const logicalSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const timerRef = useRef<any>(null);

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

  const initCanvas = () => {
    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('#testCanvas')
        .fields({ node: true, size: true, rect: true })
        .exec((res) => {
          if (res[0]) {
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

            // 绘制米字格辅助线
            ctx.strokeStyle = 'rgba(71, 184, 129, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(lw / 2, 0);
            ctx.lineTo(lw / 2, lh);
            ctx.moveTo(0, lh / 2);
            ctx.lineTo(lw, lh / 2);
            ctx.stroke();

            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#333333';
            ctxRef.current = ctx;
            canvasRef.current = canvas;
          }
        });
    }, 300);
  };

  const getCanvasPos = (touch: any) => {
    const rect = canvasRectRef.current;
    if (rect) {
      return { x: touch.x - rect.left, y: touch.y - rect.top };
    }
    return { x: touch.x, y: touch.y };
  };

  const handleTouchStart = useCallback((e: any) => {
    const touch = e.touches[0];
    if (!ctxRef.current) return;
    const pos = getCanvasPos(touch);
    setIsDrawing(true);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(pos.x, pos.y);
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    if (!isDrawing || !ctxRef.current) return;
    const touch = e.touches[0];
    const pos = getCanvasPos(touch);
    ctxRef.current.lineTo(pos.x, pos.y);
    ctxRef.current.stroke();
  }, [isDrawing]);

  const handleTouchEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    ctxRef.current?.closePath();
  }, [isDrawing]);

  const handleClear = () => {
    if (!ctxRef.current) return;
    const { w, h } = logicalSizeRef.current;
    ctxRef.current.clearRect(0, 0, w, h);
    // 重绘米字格
    const ctx = ctxRef.current;
    ctx.strokeStyle = 'rgba(71, 184, 129, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#333333';
  };

  const handleNextChar = () => {
    const score = Math.floor(Math.random() * 20) + 70;
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
    const finalScores = [...scores];
    finalScores[charIndex] = Math.floor(Math.random() * 20) + 70;
    const avgAccuracy = finalScores.reduce((a, b) => a + b, 0) / finalScores.length;

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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          disableScroll
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
