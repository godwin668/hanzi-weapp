import { create } from 'zustand';
import { GradeLevel, PracticeMode, CharacterInfo, PracticeRecord, UserProfile } from '@/types';

interface AppState {
  // 用户
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;

  // 年级
  currentGrade: GradeLevel;
  setCurrentGrade: (grade: GradeLevel) => void;

  // 选字
  selectedCharacters: CharacterInfo[];
  setSelectedCharacters: (chars: CharacterInfo[]) => void;
  addSelectedCharacter: (char: CharacterInfo) => void;
  removeSelectedCharacter: (char: string) => void;

  // 练习模式
  practiceMode: PracticeMode;
  setPracticeMode: (mode: PracticeMode) => void;

  // 当前书写索引
  currentCharIndex: number;
  setCurrentCharIndex: (index: number) => void;
  nextChar: () => void;
  prevChar: () => void;

  // 练习记录
  practiceRecords: PracticeRecord[];
  setPracticeRecords: (records: PracticeRecord[]) => void;
  addPracticeRecord: (record: PracticeRecord) => void;

  // 自定义字数
  customCount: number;
  setCustomCount: (count: number) => void;

  // 最近一次书写的笔迹数据（用于结果页对比展示）
  lastSessionData: { char: string; userStrokes: string[][] } | null;
  setLastSessionData: (data: { char: string; userStrokes: string[][] } | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),

  currentGrade: 1,
  setCurrentGrade: (grade) => set({ currentGrade: grade }),

  selectedCharacters: [],
  setSelectedCharacters: (chars) => set({ selectedCharacters: chars }),
  addSelectedCharacter: (char) =>
    set((state) => ({
      selectedCharacters: [...state.selectedCharacters, char],
    })),
  removeSelectedCharacter: (char) =>
    set((state) => ({
      selectedCharacters: state.selectedCharacters.filter((c) => c.char !== char),
    })),

  practiceMode: 'free',
  setPracticeMode: (mode) => set({ practiceMode: mode }),

  currentCharIndex: 0,
  setCurrentCharIndex: (index) => set({ currentCharIndex: index }),
  nextChar: () => {
    const { currentCharIndex, selectedCharacters } = get();
    if (currentCharIndex < selectedCharacters.length - 1) {
      set({ currentCharIndex: currentCharIndex + 1 });
    }
  },
  prevChar: () => {
    const { currentCharIndex } = get();
    if (currentCharIndex > 0) {
      set({ currentCharIndex: currentCharIndex - 1 });
    }
  },

  practiceRecords: [],
  setPracticeRecords: (records) => set({ practiceRecords: records }),
  addPracticeRecord: (record) =>
    set((state) => ({
      practiceRecords: [record, ...state.practiceRecords],
    })),

  customCount: 5,
  setCustomCount: (count) => set({ customCount: count }),

  lastSessionData: null,
  setLastSessionData: (data) => set({ lastSessionData: data }),
}));
