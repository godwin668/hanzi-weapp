import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { callFunction } from '@/services/cloud';
import { StatsData, GradeLevel } from '@/types';
import { getRandomCharacters } from '@/data/characters';
import GradeSelector from '@/components/GradeSelector';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { currentGrade, setCurrentGrade } = useAppStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [dailyChars, setDailyChars] = useState<{ char: string; pinyin: string }[]>([]);

  useEffect(() => {
    loadStats();
    setDailyChars(
      getRandomCharacters(currentGrade, 8).map((c) => ({ char: c.char, pinyin: c.pinyin }))
    );
  }, [currentGrade]);

  const loadStats = async () => {
    try {
      const data = await callFunction<StatsData>('getStats');
      setStats(data);
    } catch (err) {
      console.error('[HomePage] loadStats error:', err);
    }
  };

  const handleGradeSelect = (grade: GradeLevel) => {
    setCurrentGrade(grade);
  };

  const goToPractice = () => {
    Taro.switchTab({ url: '/pages/practice/index' });
  };

  const goToHistory = () => {
    Taro.switchTab({ url: '/pages/history/index' });
  };

  const goToTest = () => {
    Taro.navigateTo({ url: '/pages/test/index' });
  };

  const handleDailyCharClick = (char: { char: string; pinyin: string }) => {
    useAppStore.getState().setSelectedCharacters([char as any]);
    Taro.navigateTo({ url: '/pages/write/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.greeting}>你好，小朋友！</Text>
        <Text className={styles.gradeText}>当前：{currentGrade}年级</Text>
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats?.totalPractices || 0}</Text>
            <Text className={styles.statLabel}>练字次数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats?.totalTests || 0}</Text>
            <Text className={styles.statLabel}>测试次数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats?.avgScore || 0}</Text>
            <Text className={styles.statLabel}>平均分</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats?.correctRate || 0}%</Text>
            <Text className={styles.statLabel}>正确率</Text>
          </View>
        </View>
      </View>

      <View className={styles.body}>
        <View className={styles.section}>
          <GradeSelector currentGrade={currentGrade} onSelect={handleGradeSelect} />
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>快速开始</Text>
          <View className={styles.actions}>
            <View className={styles.actionCard} onClick={goToPractice}>
              <View className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #47B881, #7DD4A6)' }}>
                <Text>✏️</Text>
              </View>
              <Text className={styles.actionTitle}>开始练字</Text>
              <Text className={styles.actionDesc}>选择汉字进行练习</Text>
            </View>
            <View className={styles.actionCard} onClick={goToTest}>
              <View className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #FFB347, #FFC978)' }}>
                <Text>📝</Text>
              </View>
              <Text className={styles.actionTitle}>开始测试</Text>
              <Text className={styles.actionDesc}>检验学习成果</Text>
            </View>
            <View className={styles.actionCard} onClick={goToHistory}>
              <View className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #52C41A, #73D13D)' }}>
                <Text>📊</Text>
              </View>
              <Text className={styles.actionTitle}>学习记录</Text>
              <Text className={styles.actionDesc}>查看进步曲线</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>今日推荐</Text>
          <View className={styles.dailyChars}>
            {dailyChars.map((c) => (
              <View key={c.char} className={styles.dailyChar} onClick={() => handleDailyCharClick(c)}>
                <Text className={styles.dailyCharText}>{c.char}</Text>
                <Text className={styles.dailyCharPinyin}>{c.pinyin}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default HomePage;
