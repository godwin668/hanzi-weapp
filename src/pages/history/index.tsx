import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { callFunction } from '@/services/cloud';
import { PracticeRecord, TestRecord, StatsData } from '@/types';
import styles from './index.module.scss';

const HistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'practice' | 'test'>('practice');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);

  useEffect(() => {
    loadStats();
    loadPracticeRecords();
    loadTestRecords();
  }, []);

  const loadStats = async () => {
    try {
      const data = await callFunction<StatsData>('getStats');
      setStats(data);
    } catch (err) {
      console.error('[HistoryPage] loadStats error:', err);
    }
  };

  const loadPracticeRecords = async () => {
    try {
      const { records } = await callFunction<{ records: PracticeRecord[]; total: number }>('getPracticeRecords', { page: 1, pageSize: 20 });
      setPracticeRecords(records);
    } catch (err) {
      console.error('[HistoryPage] loadPracticeRecords error:', err);
    }
  };

  const loadTestRecords = async () => {
    try {
      const { records } = await callFunction<{ records: TestRecord[]; total: number }>('getTestRecords', { page: 1, pageSize: 20 });
      setTestRecords(records);
    } catch (err) {
      console.error('[HistoryPage] loadTestRecords error:', err);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const modeLabel = (mode: string) => {
    switch (mode) {
      case 'free': return '自由书写';
      case 'trace': return '描红练习';
      case 'test': return '测试模式';
      default: return mode;
    }
  };

  const maxCount = Math.max(...(stats?.weeklyData.map((d) => d.count) || [1]), 1);

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, activeTab === 'practice' && styles.active)}
          onClick={() => setActiveTab('practice')}
        >
          <Text>练习记录</Text>
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'test' && styles.active)}
          onClick={() => setActiveTab('test')}
        >
          <Text>测试记录</Text>
        </View>
      </View>

      <View className={styles.statsOverview}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats?.totalPractices || 0}</Text>
          <Text className={styles.statLabel}>总练习</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats?.totalTests || 0}</Text>
          <Text className={styles.statLabel}>总测试</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats?.totalCharacters || 0}</Text>
          <Text className={styles.statLabel}>练字数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats?.avgScore || 0}</Text>
          <Text className={styles.statLabel}>平均分</Text>
        </View>
      </View>

      {stats?.weeklyData && stats.weeklyData.length > 0 && (
        <View className={styles.chartSection}>
          <Text className={styles.chartTitle}>本周练习趋势</Text>
          <View className={styles.chartContainer}>
            <View className={styles.chartBars}>
              {stats.weeklyData.map((d, i) => (
                <View key={i} className={styles.chartBarWrap}>
                  <View
                    className={styles.chartBar}
                    style={{
                      height: `${(d.count / maxCount) * 180}rpx`,
                      background: 'linear-gradient(180deg, #47B881, #7DD4A6)',
                    }}
                  />
                  <Text className={styles.chartLabel}>{d.date}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View className={styles.recordsSection}>
        {activeTab === 'practice' && (
          practiceRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>还没有练习记录，快去练字吧！</Text>
            </View>
          ) : (
            practiceRecords.map((r) => (
              <View key={r._id} className={styles.recordCard}>
                <View className={styles.recordLeft}>
                  <View className={styles.recordChar}>
                    <Text>{r.character}</Text>
                  </View>
                  <View className={styles.recordInfo}>
                    <Text>{r.character}</Text>
                    <Text className={styles.recordMode}>{modeLabel(r.mode)}</Text>
                  </View>
                </View>
                <View className={styles.recordRight}>
                  <Text className={styles.recordScore}>{r.score}分</Text>
                  <Text className={styles.recordTime}>{formatDate(r.createTime)}</Text>
                </View>
              </View>
            ))
          )
        )}

        {activeTab === 'test' && (
          testRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>还没有测试记录，快去测试吧！</Text>
            </View>
          ) : (
            testRecords.map((r) => (
              <View key={r._id} className={styles.recordCard}>
                <View className={styles.recordLeft}>
                  <View className={styles.recordChar}>
                    <Text>{r.characters[0]}</Text>
                  </View>
                  <View className={styles.recordInfo}>
                    <Text>{r.characters.join('、')}</Text>
                    <Text className={styles.recordMode}>{r.characters.length}个字</Text>
                  </View>
                </View>
                <View className={styles.recordRight}>
                  <Text className={styles.recordScore}>{r.avgAccuracy}%</Text>
                  <Text className={styles.recordTime}>{formatDate(r.createTime)}</Text>
                </View>
              </View>
            ))
          )
        )}
      </View>
    </View>
  );
};

export default HistoryPage;
