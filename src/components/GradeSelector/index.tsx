import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { GradeLevel } from '@/types';
import styles from './index.module.scss';

interface GradeSelectorProps {
  currentGrade: GradeLevel;
  onSelect: (grade: GradeLevel) => void;
}

const grades: GradeLevel[] = [1, 2, 3, 4, 5, 6];

const GradeSelector: React.FC<GradeSelectorProps> = ({ currentGrade, onSelect }) => {
  return (
    <View className={styles.selector}>
      <Text className={styles.label}>选择年级</Text>
      <View className={styles.grades}>
        {grades.map((g) => (
          <View
            key={g}
            className={classnames(styles.gradeItem, currentGrade === g && styles.active)}
            onClick={() => onSelect(g)}
          >
            <Text>{g}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default GradeSelector;
