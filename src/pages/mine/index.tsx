import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { callFunction } from '@/services/cloud';
import { UserProfile, GradeLevel, StatsData } from '@/types';
import GradeSelector from '@/components/GradeSelector';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { currentGrade, setCurrentGrade, userProfile, setUserProfile } = useAppStore();
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    loadUserProfile();
    loadStats();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await callFunction<UserProfile>('getUserProfile');
      setUserProfile(user);
      if (user.grade) {
        setCurrentGrade(user.grade);
      }
    } catch (err) {
      console.error('[MinePage] loadUserProfile error:', err);
      setUserProfile({
        nickname: '小朋友',
        avatar: '',
        grade: currentGrade,
        totalPractices: 0,
        totalTests: 0,
        createTime: Date.now(),
      });
    }
  };

  const loadStats = async () => {
    try {
      const data = await callFunction<StatsData>('getStats');
      setStats(data);
    } catch (err) {
      console.error('[MinePage] loadStats error:', err);
    }
  };

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
    Taro.showToast({ title: '点击右上角分享', icon: 'none' });
  };

  const gradeLabels: Record<GradeLevel, string> = { 1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级' };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Text>{userProfile?.avatar || '😊'}</Text>
        </View>
        <View className={styles.userInfo}>
          <Text className={styles.nickname}>{userProfile?.nickname || '小朋友'}</Text>
          <Text className={styles.gradeText}>{gradeLabels[currentGrade]}</Text>
        </View>
      </View>

      <View className={styles.body}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>学习统计</Text>
          <View className={styles.menuItem}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>✏️</Text>
              <Text className={styles.menuLabel}>总练习次数</Text>
            </View>
            <Text className={styles.menuValue}>{stats?.totalPractices || 0}次</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>📝</Text>
              <Text className={styles.menuLabel}>总测试次数</Text>
            </View>
            <Text className={styles.menuValue}>{stats?.totalTests || 0}次</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>⭐</Text>
              <Text className={styles.menuLabel}>平均得分</Text>
            </View>
            <Text className={styles.menuValue}>{stats?.avgScore || 0}分</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>🎯</Text>
              <Text className={styles.menuLabel}>正确率</Text>
            </View>
            <Text className={styles.menuValue}>{stats?.correctRate || 0}%</Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>设置</Text>
          <View className={styles.menuItem} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <View className={styles.menuLeft} style={{ marginBottom: '16rpx' }}>
              <Text className={styles.menuIcon}>📚</Text>
              <Text className={styles.menuLabel}>当前年级</Text>
            </View>
            <GradeSelector currentGrade={currentGrade} onSelect={setCurrentGrade} />
          </View>
          <View className={styles.menuItem}>
            <View className={styles.menuLeft}>
              <Text className={styles.menuIcon}>ℹ️</Text>
              <Text className={styles.menuLabel}>关于小程序</Text>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
        </View>

        <View className={styles.shareBtn} onClick={handleShare}>
          <Text>分享我的学习成果</Text>
        </View>
      </View>
    </View>
  );
};

export default MinePage;
