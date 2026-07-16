import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { getCharactersByGrade, getRandomCharacters } from '@/data/characters';
import { CharacterInfo, PracticeMode } from '@/types';
import GradeSelector from '@/components/GradeSelector';
import CharacterGrid from '@/components/CharacterGrid';
import styles from './index.module.scss';

const PracticePage: React.FC = () => {
  const {
    currentGrade,
    setCurrentGrade,
    practiceMode,
    setPracticeMode,
    selectedCharacters,
    setSelectedCharacters,
    addSelectedCharacter,
    removeSelectedCharacter,
    customCount,
    setCustomCount,
  } = useAppStore();

  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const modes: { key: PracticeMode; label: string }[] = [
    { key: 'free', label: '自由书写' },
    { key: 'trace', label: '描红练习' },
    { key: 'test', label: '测试模式' },
  ];

  useEffect(() => {
    setCharacters(getCharactersByGrade(currentGrade));
  }, [currentGrade]);

  const handleToggleChar = (char: CharacterInfo) => {
    if (selectedCharacters.find((c) => c.char === char.char)) {
      removeSelectedCharacter(char.char);
    } else {
      addSelectedCharacter(char);
    }
  };

  const handleSelectAll = () => {
    if (selectedCharacters.length === characters.length) {
      setSelectedCharacters([]);
    } else {
      setSelectedCharacters([...characters]);
    }
  };

  const handleRandomSelect = () => {
    setSelectedCharacters(getRandomCharacters(currentGrade, customCount));
  };

  const handleStart = () => {
    if (selectedCharacters.length === 0) return;
    if (practiceMode === 'trace') {
      Taro.navigateTo({ url: '/pages/trace/index' });
    } else if (practiceMode === 'test') {
      Taro.navigateTo({ url: '/pages/test/index' });
    } else {
      Taro.navigateTo({ url: '/pages/write/index' });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.topSection}>
        <GradeSelector currentGrade={currentGrade} onSelect={setCurrentGrade} />

        <View className={styles.modeTabs}>
          {modes.map((m) => (
            <View
              key={m.key}
              className={classnames(styles.modeTab, practiceMode === m.key && styles.active)}
              onClick={() => setPracticeMode(m.key)}
            >
              <Text>{m.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.customRow}>
          <Text className={styles.customLabel}>随机选字数：</Text>
          <View className={styles.stepper}>
            <View className={styles.stepperBtn} onClick={() => setCustomCount(Math.max(1, customCount - 1))}>
              <Text>−</Text>
            </View>
            <Text className={styles.stepperValue}>{customCount}</Text>
            <View className={styles.stepperBtn} onClick={() => setCustomCount(Math.min(20, customCount + 1))}>
              <Text>+</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView scrollY className={styles.charSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            {currentGrade}年级汉字（{characters.length}个）
          </Text>
          <View className={styles.selectAll} onClick={handleSelectAll}>
            <Text>{selectedCharacters.length === characters.length ? '取消全选' : '全选'}</Text>
          </View>
        </View>
        <CharacterGrid
          characters={characters}
          selectedChars={selectedCharacters.map((c) => c.char)}
          onToggle={handleToggleChar}
        />
        <View className={styles.selectedInfo}>
          <Text onClick={handleRandomSelect}>
            已选 {selectedCharacters.length} 个字（点击随机选{customCount}个）
          </Text>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View
          className={classnames(styles.startBtn, selectedCharacters.length === 0 && styles.disabled)}
          onClick={handleStart}
        >
          <Text>开始练字（{selectedCharacters.length}个字）</Text>
        </View>
      </View>
    </View>
  );
};

export default PracticePage;
