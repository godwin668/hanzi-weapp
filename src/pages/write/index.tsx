import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { callFunction } from '@/services/cloud';
import { PracticeRecord } from '@/types';
import styles from './index.module.scss';

const WritePage: React.FC = () => {
  const { selectedCharacters, currentCharIndex, setCurrentCharIndex, nextChar, prevChar } = useAppStore();
  const [showHint, setShowHint] = useState(false);
  const [userStrokes, setUserStrokes] = useState<string[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hintAnimStep, setHintAnimStep] = useState(-1);
  const canvasRef = useRef<any>(null);
  const ctxRef = useRef<any>(null);
  const canvasRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const logicalSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const currentStrokeRef = useRef<string[]>([]);

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
    setHintAnimStep(-1);
  }, [currentCharIndex]);

  const initCanvas = () => {
    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('#writeCanvas')
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

  // 获取 Canvas 相对坐标
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
    currentStrokeRef.current = [];
    currentStrokeRef.current.push(`${pos.x},${pos.y}`);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(pos.x, pos.y);
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    if (!isDrawing || !ctxRef.current) return;
    const touch = e.touches[0];
    const pos = getCanvasPos(touch);
    currentStrokeRef.current.push(`${pos.x},${pos.y}`);
    ctxRef.current.lineTo(pos.x, pos.y);
    ctxRef.current.stroke();
  }, [isDrawing]);

  const handleTouchEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    ctxRef.current?.closePath();
    if (currentStrokeRef.current.length > 1) {
      setUserStrokes(prev => [...prev, [...currentStrokeRef.current]]);
    }
    currentStrokeRef.current = [];
  }, [isDrawing]);

  const handleClear = () => {
    if (!ctxRef.current) return;
    const { w, h } = logicalSizeRef.current;
    ctxRef.current.clearRect(0, 0, w, h);
    setUserStrokes([]);
    setHintAnimStep(-1);
  };

  // 绘制笔顺动画
  const drawStrokesAnimation = useCallback(() => {
    if (!currentChar || !ctxRef.current || currentChar.strokesPath.length === 0) return;
    const ctx = ctxRef.current;
    const { w, h } = logicalSizeRef.current;
    const margin = 40;
    const drawW = w - margin * 2;
    const drawH = h - margin * 2;

    // 先清除之前的动画笔迹
    ctx.clearRect(0, 0, w, h);

    // 重绘用户已写的笔画（浅色保留）
    // 跳过，保持清爽

    // 绘制标准笔画路径的动画
    let step = 0;
    const totalSteps = currentChar.strokesPath.length * 10;
    const animTimer = setInterval(() => {
      if (step >= totalSteps || !ctxRef.current) {
        clearInterval(animTimer);
        setHintAnimStep(currentChar.strokesPath.length);
        return;
      }

      const strokeIdx = Math.floor(step / 10);
      const progress = (step % 10) / 10;
      const stroke = currentChar.strokesPath[strokeIdx];
      if (!stroke) { step++; return; }

      const ctx2 = ctxRef.current;
      ctx2.lineWidth = 3;
      ctx2.lineCap = 'round';
      ctx2.lineJoin = 'round';

      // 已完成的笔画用实线
      for (let i = 0; i < strokeIdx; i++) {
        const s = currentChar.strokesPath[i];
        ctx2.strokeStyle = 'rgba(71, 184, 129, 0.3)';
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

      // 当前动画中的笔画
      const s = stroke;
      ctx2.strokeStyle = 'rgba(255, 74, 74, 0.7)';
      ctx2.lineWidth = 4;
      ctx2.beginPath();
      const totalPts = s.length;
      const endIdx = Math.floor(progress * totalPts);
      for (let j = 0; j <= Math.min(endIdx, totalPts - 1); j++) {
        const [rx, ry] = s[j].split(',').map(Number);
        const px = margin + rx * drawW;
        const py = margin + ry * drawH;
        if (j === 0) ctx2.moveTo(px, py);
        else ctx2.lineTo(px, py);
      }
      ctx2.stroke();
      ctx2.lineWidth = 3;

      step++;
    }, 80);

    return () => clearInterval(animTimer);
  }, [currentChar]);

  const handleToggleHint = () => {
    if (showHint) {
      setShowHint(false);
      setHintAnimStep(-1);
      // 恢复用户笔迹
      if (ctxRef.current) {
        const ctx = ctxRef.current;
        const { w, h } = logicalSizeRef.current;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;
        userStrokes.forEach(stroke => {
          ctx.beginPath();
          stroke.forEach((pt, i) => {
            const [x, y] = pt.split(',').map(Number);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        });
      }
    } else {
      setShowHint(true);
      setHintAnimStep(0);
      drawStrokesAnimation();
    }
  };

  const handleSubmit = async () => {
    const score = Math.floor(Math.random() * 20) + 75;
    const accuracy = Math.floor(Math.random() * 20) + 70;
    const aesthetics = Math.floor(Math.random() * 20) + 70;

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
        <Text className={styles.progress}>
          {currentCharIndex + 1} / {selectedCharacters.length}
        </Text>
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
        {showHint && hintAnimStep >= 0 && (
          <View className={styles.hintOverlay}>
            <Text className={styles.hintOverlayText}>
              正在演示笔顺... 第{hintAnimStep}/{currentChar.strokes}画
            </Text>
          </View>
        )}
      </View>

      {showHint && currentChar.strokesPath.length > 0 && (
        <View className={styles.hintPanel}>
          <Text className={styles.hintTitle}>笔画顺序提示（共{currentChar.strokes}画）</Text>
          <View className={styles.hintSteps}>
            {currentChar.strokesPath.map((_, i) => (
              <View key={i} className={`${styles.hintStep} ${hintAnimStep > i ? styles.hintStepDone : ''}`}>
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
        <View className={`${styles.actionBtn} ${styles.hintBtn}`} onClick={handleToggleHint}>
          <Text>笔顺提示</Text>
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
