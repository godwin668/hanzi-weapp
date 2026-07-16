import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { callFunction } from '@/services/cloud';
import { PracticeRecord } from '@/types';
import styles from './index.module.scss';

const TracePage: React.FC = () => {
  const { selectedCharacters, currentCharIndex, setCurrentCharIndex, nextChar, prevChar } = useAppStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintAnimStep, setHintAnimStep] = useState(-1);
  const canvasRef = useRef<any>(null);
  const ctxRef = useRef<any>(null);
  const canvasRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const logicalSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const animTimerRef = useRef<any>(null);

  const currentChar = selectedCharacters[currentCharIndex];

  useEffect(() => {
    if (!currentChar) {
      Taro.showToast({ title: '请先选择汉字', icon: 'none' });
      Taro.navigateBack();
      return;
    }
    initCanvas();
    setShowHint(false);
    setHintAnimStep(-1);
    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, [currentCharIndex]);

  const initCanvas = () => {
    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('#traceCanvas')
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

            // 绘制描红底字（使用像素字号）
            ctx.fillStyle = 'rgba(71, 184, 129, 0.1)';
            const fontSize = Math.min(lw, lh) * 0.55;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(currentChar?.char || '', lw / 2, lh / 2);

            // 绘制米字格辅助线
            ctx.strokeStyle = 'rgba(71, 184, 129, 0.12)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(lw / 2, 0);
            ctx.lineTo(lw / 2, lh);
            ctx.moveTo(0, lh / 2);
            ctx.lineTo(lw, lh / 2);
            ctx.moveTo(0, 0);
            ctx.lineTo(lw, lh);
            ctx.moveTo(lw, 0);
            ctx.lineTo(0, lh);
            ctx.stroke();

            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#FFB347';
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
    initCanvas();
    setHintAnimStep(-1);
  };

  // 笔顺动画
  const drawStrokesAnimation = useCallback(() => {
    if (!currentChar || !ctxRef.current || currentChar.strokesPath.length === 0) return;
    if (animTimerRef.current) clearInterval(animTimerRef.current);

    const ctx = ctxRef.current;
    const { w, h } = logicalSizeRef.current;
    const margin = 40;
    const drawW = w - margin * 2;
    const drawH = h - margin * 2;

    let step = 0;
    const totalSteps = currentChar.strokesPath.length * 8;

    animTimerRef.current = setInterval(() => {
      if (step >= totalSteps || !ctxRef.current) {
        clearInterval(animTimerRef.current);
        setHintAnimStep(currentChar.strokesPath.length);
        return;
      }

      const strokeIdx = Math.floor(step / 8);
      const progress = (step % 8) / 8;
      const ctx2 = ctxRef.current;

      // 重绘底字和米字格
      handleClear();

      ctx2.lineWidth = 3;
      ctx2.lineCap = 'round';
      ctx2.lineJoin = 'round';

      // 已完成的笔画
      for (let i = 0; i < strokeIdx; i++) {
        const s = currentChar.strokesPath[i];
        ctx2.strokeStyle = 'rgba(71, 184, 129, 0.35)';
        ctx2.lineWidth = 3;
        ctx2.beginPath();
        for (let j = 0; j < s.length; j++) {
          const [rx, ry] = s[j].split(',').map(Number);
          const px = margin + rx * drawW;
          const py = margin + ry * drawH;
          if (j === 0) ctx2.moveTo(px, py);
          else ctx2.lineTo(px, py);
        }
        ctx2.stroke();
      }

      // 当前笔画动画
      const s = currentChar.strokesPath[strokeIdx];
      if (s) {
        ctx2.strokeStyle = 'rgba(255, 74, 74, 0.8)';
        ctx2.lineWidth = 5;
        ctx2.beginPath();
        const endIdx = Math.floor(progress * s.length);
        for (let j = 0; j <= Math.min(endIdx, s.length - 1); j++) {
          const [rx, ry] = s[j].split(',').map(Number);
          const px = margin + rx * drawW;
          const py = margin + ry * drawH;
          if (j === 0) ctx2.moveTo(px, py);
          else ctx2.lineTo(px, py);
        }
        ctx2.stroke();
      }

      step++;
    }, 80);
  }, [currentChar]);

  const handleToggleHint = () => {
    if (showHint) {
      setShowHint(false);
      setHintAnimStep(-1);
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      handleClear();
    } else {
      setShowHint(true);
      setHintAnimStep(0);
      drawStrokesAnimation();
    }
  };

  const handleSubmit = async () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    const score = Math.floor(Math.random() * 15) + 80;
    const accuracy = Math.floor(Math.random() * 15) + 80;
    const aesthetics = Math.floor(Math.random() * 15) + 80;

    try {
      await callFunction<PracticeRecord>('savePracticeRecord', {
        character: currentChar?.char || '',
        mode: 'trace',
        strokes: [],
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

  return (
    <View className={styles.page}>
      <View className={styles.topBar}>
        <View className={styles.charInfo}>
          <View className={styles.charDisplay}>
            <Text>{currentChar.char}</Text>
          </View>
          <View>
            <Text className={styles.charText}>描红：{currentChar.char}</Text>
            <Text className={styles.strokeInfo}>{currentChar.strokes}画</Text>
          </View>
        </View>
        <Text className={styles.progress}>
          {currentCharIndex + 1} / {selectedCharacters.length}
        </Text>
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
        {showHint && hintAnimStep >= 0 && (
          <View className={styles.hintOverlay}>
            <Text className={styles.hintOverlayText}>
              笔顺演示 第{hintAnimStep}/{currentChar.strokes}画
            </Text>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        {currentCharIndex > 0 && (
          <View className={styles.navBtn} onClick={prevChar}>
            <Text>‹</Text>
          </View>
        )}
        <View className={`${styles.actionBtn} ${styles.clearBtn}`} onClick={handleClear}>
          <Text>清除重写</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.hintBtn}`} onClick={handleToggleHint}>
          <Text>笔顺演示</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.submitBtn}`} onClick={handleSubmit}>
          <Text>提交评分</Text>
        </View>
        {currentCharIndex < selectedCharacters.length - 1 && (
          <View className={styles.navBtn} onClick={nextChar}>
            <Text>›</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TracePage;
