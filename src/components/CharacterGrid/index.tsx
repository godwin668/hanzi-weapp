import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { CharacterInfo } from '@/types';
import styles from './index.module.scss';

interface CharacterGridProps {
  characters: CharacterInfo[];
  selectedChars: string[];
  onToggle: (char: CharacterInfo) => void;
}

const CharacterGrid: React.FC<CharacterGridProps> = ({ characters, selectedChars, onToggle }) => {
  return (
    <View className={styles.grid}>
      {characters.map((char) => (
        <View
          key={char.char}
          className={classnames(styles.gridItem, selectedChars.includes(char.char) && styles.selected)}
          onClick={() => onToggle(char)}
        >
          <View>
            <Text>{char.char}</Text>
            <Text className={styles.pinyin}>{char.pinyin}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default CharacterGrid;
