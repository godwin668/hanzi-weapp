import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

const ResultPage: React.FC = () => {
  const router = useRouter();
  const { score = '0', accuracy = '0', aesthetics = '0', char = '', isTest = '0' } = router.params;

  const scoreNum = parseInt(score as string, 10) || 0;
  const accuracyNum = parseInt(accuracy as string, 10) || 0;
  const aestheticsNum = parseInt(aesthetics as string, 10) || 0;

  const getScoreLevel = (s: number) => {
    if (s >= 90) return { level: 'excellent', text: '太棒了！', emoji: '🌟' };
    if (s >= 75) return { level: 'good', text: '做得不错！', emoji: '👍' };
    if (s >= 60) return { level: 'fair', text: '继续加油！', emoji: '💪' };
    return { level: 'poor', text: '再练练吧！', emoji: '📖' };
  };

  const scoreInfo = getScoreLevel(scoreNum);

  const handleBack = () => {
    Taro.navigateBack();
  };

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
    Taro.showToast({ title: '点击右上角分享', icon: 'none' });
  };

  const handleContinue = () => {
    Taro.switchTab({ url: '/pages/practice/index' });
  };

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  return (
    <View className={styles.page}>
      <View className={classnames(styles.scoreCircle, styles[scoreInfo.level])}>
        <Text className={styles.scoreValue}>{scoreNum}</Text>
        <Text className={styles.scoreLabel}>分</Text>
      </View>

      <Text className={styles.encourage}>
        {scoreInfo.emoji} {scoreInfo.text}
      </Text>

      <View className={styles.detailSection}>
        <Text className={styles.detailTitle}>
          {isTest === '1' ? '测试' : '练习'}详情
        </Text>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>练习汉字</Text>
          <Text className={styles.detailValue}>{char}</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>综合评分</Text>
          <View className={styles.scoreBar}>
            <View
              className={styles.scoreBarFill}
              style={{ width: `${scoreNum}%`, background: 'linear-gradient(90deg, #47B881, #73D13D)' }}
            />
          </View>
          <Text className={styles.detailValue}>{scoreNum}分</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>笔画准确度</Text>
          <View className={styles.scoreBar}>
            <View
              className={styles.scoreBarFill}
              style={{ width: `${accuracyNum}%`, background: 'linear-gradient(90deg, #FFB347, #47B881)' }}
            />
          </View>
          <Text className={styles.detailValue}>{accuracyNum}%</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>书写美观度</Text>
          <View className={styles.scoreBar}>
            <View
              className={styles.scoreBarFill}
              style={{ width: `${aestheticsNum}%`, background: 'linear-gradient(90deg, #FF6B6B, #FFB347)' }}
            />
          </View>
          <Text className={styles.detailValue}>{aestheticsNum}%</Text>
        </View>
      </View>

      <View className={styles.compareSection}>
        <Text className={styles.detailTitle}>标准对比</Text>
        <View className={styles.compareGrid}>
          <View className={styles.compareItem}>
            <View className={classnames(styles.compareChar, styles.yourChar)}>
              <Text>{char}</Text>
            </View>
            <Text className={styles.compareLabel}>你的书写</Text>
          </View>
          <View className={styles.compareItem}>
            <View className={classnames(styles.compareChar, styles.standardChar)}>
              <Text>{char}</Text>
            </View>
            <Text className={styles.compareLabel}>标准字帖</Text>
          </View>
        </View>
      </View>

      <View className={styles.actions}>
        <View className={`${styles.actionBtn} ${styles.backBtn}`} onClick={handleGoHome}>
          <Text>返回首页</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.shareBtn}`} onClick={handleShare}>
          <Text>分享成果</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.continueBtn}`} onClick={handleContinue}>
          <Text>继续练字</Text>
        </View>
      </View>
    </View>
  );
};

export default ResultPage;
