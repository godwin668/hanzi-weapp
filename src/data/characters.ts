import { CharacterInfo, GradeLevel } from '@/types';

// 各年级汉字列表（仅包含元信息，笔画数据从 strokeData.ts 获取）
const grade1Characters: CharacterInfo[] = [
  { char: '一', pinyin: 'yī', strokes: 1, strokesPath: [], grade: 1 },
  { char: '二', pinyin: 'èr', strokes: 2, strokesPath: [], grade: 1 },
  { char: '三', pinyin: 'sān', strokes: 3, strokesPath: [], grade: 1 },
  { char: '十', pinyin: 'shí', strokes: 2, strokesPath: [], grade: 1 },
  { char: '人', pinyin: 'rén', strokes: 2, strokesPath: [], grade: 1 },
  { char: '大', pinyin: 'dà', strokes: 3, strokesPath: [], grade: 1 },
  { char: '小', pinyin: 'xiǎo', strokes: 3, strokesPath: [], grade: 1 },
  { char: '天', pinyin: 'tiān', strokes: 4, strokesPath: [], grade: 1 },
  { char: '日', pinyin: 'rì', strokes: 4, strokesPath: [], grade: 1 },
  { char: '月', pinyin: 'yuè', strokes: 4, strokesPath: [], grade: 1 },
  { char: '水', pinyin: 'shuǐ', strokes: 4, strokesPath: [], grade: 1 },
  { char: '火', pinyin: 'huǒ', strokes: 4, strokesPath: [], grade: 1 },
  { char: '山', pinyin: 'shān', strokes: 3, strokesPath: [], grade: 1 },
  { char: '田', pinyin: 'tián', strokes: 5, strokesPath: [], grade: 1 },
  { char: '木', pinyin: 'mù', strokes: 4, strokesPath: [], grade: 1 },
  { char: '上', pinyin: 'shàng', strokes: 3, strokesPath: [], grade: 1 },
  { char: '下', pinyin: 'xià', strokes: 3, strokesPath: [], grade: 1 },
  { char: '中', pinyin: 'zhōng', strokes: 4, strokesPath: [], grade: 1 },
  { char: '口', pinyin: 'kǒu', strokes: 3, strokesPath: [], grade: 1 },
  { char: '目', pinyin: 'mù', strokes: 5, strokesPath: [], grade: 1 },
];

const grade2Characters: CharacterInfo[] = [
  { char: '花', pinyin: 'huā', strokes: 7, strokesPath: [], grade: 2 },
  { char: '草', pinyin: 'cǎo', strokes: 9, strokesPath: [], grade: 2 },
  { char: '红', pinyin: 'hóng', strokes: 6, strokesPath: [], grade: 2 },
  { char: '绿', pinyin: 'lǜ', strokes: 11, strokesPath: [], grade: 2 },
  { char: '明', pinyin: 'míng', strokes: 8, strokesPath: [], grade: 2 },
  { char: '林', pinyin: 'lín', strokes: 8, strokesPath: [], grade: 2 },
  { char: '从', pinyin: 'cóng', strokes: 4, strokesPath: [], grade: 2 },
  { char: '好', pinyin: 'hǎo', strokes: 6, strokesPath: [], grade: 2 },
  { char: '学', pinyin: 'xué', strokes: 8, strokesPath: [], grade: 2 },
  { char: '校', pinyin: 'xiào', strokes: 10, strokesPath: [], grade: 2 },
  { char: '雨', pinyin: 'yǔ', strokes: 8, strokesPath: [], grade: 2 },
  { char: '东', pinyin: 'dōng', strokes: 5, strokesPath: [], grade: 2 },
  { char: '西', pinyin: 'xī', strokes: 6, strokesPath: [], grade: 2 },
  { char: '北', pinyin: 'běi', strokes: 5, strokesPath: [], grade: 2 },
  { char: '马', pinyin: 'mǎ', strokes: 3, strokesPath: [], grade: 2 },
  { char: '鸟', pinyin: 'niǎo', strokes: 5, strokesPath: [], grade: 2 },
  { char: '鱼', pinyin: 'yú', strokes: 8, strokesPath: [], grade: 2 },
  { char: '风', pinyin: 'fēng', strokes: 4, strokesPath: [], grade: 2 },
  { char: '云', pinyin: 'yún', strokes: 4, strokesPath: [], grade: 2 },
];

const grade3Characters: CharacterInfo[] = [
  { char: '春', pinyin: 'chūn', strokes: 9, strokesPath: [], grade: 3 },
  { char: '夏', pinyin: 'xià', strokes: 10, strokesPath: [], grade: 3 },
  { char: '秋', pinyin: 'qiū', strokes: 9, strokesPath: [], grade: 3 },
  { char: '冬', pinyin: 'dōng', strokes: 5, strokesPath: [], grade: 3 },
  { char: '江', pinyin: 'jiāng', strokes: 6, strokesPath: [], grade: 3 },
  { char: '河', pinyin: 'hé', strokes: 8, strokesPath: [], grade: 3 },
  { char: '美', pinyin: 'měi', strokes: 9, strokesPath: [], grade: 3 },
  { char: '星', pinyin: 'xīng', strokes: 9, strokesPath: [], grade: 3 },
  { char: '阳', pinyin: 'yáng', strokes: 6, strokesPath: [], grade: 3 },
  { char: '光', pinyin: 'guāng', strokes: 6, strokesPath: [], grade: 3 },
  { char: '雪', pinyin: 'xuě', strokes: 11, strokesPath: [], grade: 3 },
  { char: '国', pinyin: 'guó', strokes: 8, strokesPath: [], grade: 3 },
  { char: '家', pinyin: 'jiā', strokes: 10, strokesPath: [], grade: 3 },
  { char: '笑', pinyin: 'xiào', strokes: 10, strokesPath: [], grade: 3 },
  { char: '书', pinyin: 'shū', strokes: 4, strokesPath: [], grade: 3 },
  { char: '画', pinyin: 'huà', strokes: 8, strokesPath: [], grade: 3 },
  { char: '金', pinyin: 'jīn', strokes: 8, strokesPath: [], grade: 3 },
  { char: '石', pinyin: 'shí', strokes: 5, strokesPath: [], grade: 3 },
  { char: '飞', pinyin: 'fēi', strokes: 3, strokesPath: [], grade: 3 },
  { char: '高', pinyin: 'gāo', strokes: 10, strokesPath: [], grade: 3 },
];

const grade4Characters: CharacterInfo[] = [
  { char: '潮', pinyin: 'cháo', strokes: 15, strokesPath: [], grade: 4 },
  { char: '观', pinyin: 'guān', strokes: 6, strokesPath: [], grade: 4 },
  { char: '雾', pinyin: 'wù', strokes: 13, strokesPath: [], grade: 4 },
  { char: '熟', pinyin: 'shú', strokes: 15, strokesPath: [], grade: 4 },
  { char: '淘', pinyin: 'táo', strokes: 11, strokesPath: [], grade: 4 },
  { char: '震', pinyin: 'zhèn', strokes: 15, strokesPath: [], grade: 4 },
  { char: '牵', pinyin: 'qiān', strokes: 9, strokesPath: [], grade: 4 },
  { char: '鹅', pinyin: 'é', strokes: 12, strokesPath: [], grade: 4 },
  { char: '卵', pinyin: 'luǎn', strokes: 7, strokesPath: [], grade: 4 },
  { char: '霸', pinyin: 'bà', strokes: 21, strokesPath: [], grade: 4 },
  { char: '豌', pinyin: 'wān', strokes: 15, strokesPath: [], grade: 4 },
  { char: '豆', pinyin: 'dòu', strokes: 7, strokesPath: [], grade: 4 },
  { char: '坑', pinyin: 'kēng', strokes: 7, strokesPath: [], grade: 4 },
  { char: '洼', pinyin: 'wā', strokes: 9, strokesPath: [], grade: 4 },
  { char: '庄', pinyin: 'zhuāng', strokes: 6, strokesPath: [], grade: 4 },
  { char: '稼', pinyin: 'jià', strokes: 15, strokesPath: [], grade: 4 },
  { char: '葡', pinyin: 'pú', strokes: 12, strokesPath: [], grade: 4 },
];

const grade5Characters: CharacterInfo[] = [
  { char: '窃', pinyin: 'qiè', strokes: 9, strokesPath: [], grade: 5 },
  { char: '魂', pinyin: 'hún', strokes: 13, strokesPath: [], grade: 5 },
  { char: '幽', pinyin: 'yōu', strokes: 9, strokesPath: [], grade: 5 },
  { char: '葬', pinyin: 'zàng', strokes: 12, strokesPath: [], grade: 5 },
  { char: '愁', pinyin: 'chóu', strokes: 13, strokesPath: [], grade: 5 },
  { char: '甚', pinyin: 'shèn', strokes: 9, strokesPath: [], grade: 5 },
  { char: '婪', pinyin: 'lán', strokes: 11, strokesPath: [], grade: 5 },
  { char: '踮', pinyin: 'diǎn', strokes: 15, strokesPath: [], grade: 5 },
  { char: '檐', pinyin: 'yán', strokes: 17, strokesPath: [], grade: 5 },
  { char: '皱', pinyin: 'zhòu', strokes: 10, strokesPath: [], grade: 5 },
  { char: '酸', pinyin: 'suān', strokes: 14, strokesPath: [], grade: 5 },
  { char: '撑', pinyin: 'chēng', strokes: 15, strokesPath: [], grade: 5 },
  { char: '柜', pinyin: 'guì', strokes: 8, strokesPath: [], grade: 5 },
  { char: '侣', pinyin: 'lǚ', strokes: 8, strokesPath: [], grade: 5 },
  { char: '娱', pinyin: 'yú', strokes: 10, strokesPath: [], grade: 5 },
  { char: '盒', pinyin: 'hé', strokes: 11, strokesPath: [], grade: 5 },
  { char: '豫', pinyin: 'yù', strokes: 15, strokesPath: [], grade: 5 },
  { char: '趟', pinyin: 'tàng', strokes: 15, strokesPath: [], grade: 5 },
  { char: '诵', pinyin: 'sòng', strokes: 9, strokesPath: [], grade: 5 },
];

const grade6Characters: CharacterInfo[] = [
  { char: '邀', pinyin: 'yāo', strokes: 16, strokesPath: [], grade: 6 },
  { char: '俯', pinyin: 'fǔ', strokes: 10, strokesPath: [], grade: 6 },
  { char: '瀑', pinyin: 'pù', strokes: 18, strokesPath: [], grade: 6 },
  { char: '峭', pinyin: 'qiào', strokes: 10, strokesPath: [], grade: 6 },
  { char: '躯', pinyin: 'qū', strokes: 11, strokesPath: [], grade: 6 },
  { char: '蕴', pinyin: 'yùn', strokes: 15, strokesPath: [], grade: 6 },
  { char: '侠', pinyin: 'xiá', strokes: 8, strokesPath: [], grade: 6 },
  { char: '勤', pinyin: 'qín', strokes: 13, strokesPath: [], grade: 6 },
  { char: '勉', pinyin: 'miǎn', strokes: 9, strokesPath: [], grade: 6 },
  { char: '吻', pinyin: 'wěn', strokes: 7, strokesPath: [], grade: 6 },
  { char: '庞', pinyin: 'páng', strokes: 8, strokesPath: [], grade: 6 },
  { char: '烤', pinyin: 'kǎo', strokes: 10, strokesPath: [], grade: 6 },
  { char: '韵', pinyin: 'yùn', strokes: 13, strokesPath: [], grade: 6 },
  { char: '朦', pinyin: 'méng', strokes: 17, strokesPath: [], grade: 6 },
  { char: '胧', pinyin: 'lóng', strokes: 9, strokesPath: [], grade: 6 },
  { char: '凄', pinyin: 'qī', strokes: 10, strokesPath: [], grade: 6 },
  { char: '斑', pinyin: 'bān', strokes: 12, strokesPath: [], grade: 6 },
  { char: '斓', pinyin: 'lán', strokes: 16, strokesPath: [], grade: 6 },
];

export const allCharacters: Record<GradeLevel, CharacterInfo[]> = {
  1: grade1Characters,
  2: grade2Characters,
  3: grade3Characters,
  4: grade4Characters,
  5: grade5Characters,
  6: grade6Characters,
};

export function getCharactersByGrade(grade: GradeLevel): CharacterInfo[] {
  return allCharacters[grade] || [];
}

export function getCharacterByChar(char: string): CharacterInfo | undefined {
  for (const grade of Object.values(allCharacters)) {
    const found = grade.find((c) => c.char === char);
    if (found) return found;
  }
  return undefined;
}

export function getRandomCharacters(grade: GradeLevel, count: number): CharacterInfo[] {
  const chars = getCharactersByGrade(grade);
  const shuffled = [...chars].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
