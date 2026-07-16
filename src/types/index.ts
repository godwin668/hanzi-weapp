// 年级枚举
export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;

// 练习模式
export type PracticeMode = 'free' | 'trace' | 'test';

// 标准笔画数据（来自 hanzi-writer-data）
export interface StrokeCharData {
  strokes: string[];      // SVG path 字符串数组
  medians: number[][][];  // 每笔中心线坐标 [x,y][]，基于 1024x1024 网格
}

// 汉字信息
export interface CharacterInfo {
  char: string;
  pinyin: string;
  strokes: number;
  strokesPath: string[][]; // 保留兼容（旧模拟数据，逐步淘汰）
  grade: GradeLevel;
}

// 练习记录
export interface PracticeRecord {
  _id?: string;
  character: string;
  mode: PracticeMode;
  strokes: string[][];     // 用户书写的笔画路径
  score: number;           // 0-100
  accuracy: number;        // 笔画准确度 0-100
  aesthetics: number;      // 美观度 0-100
  duration: number;        // 练习时长（秒）
  createTime: number;
}

// 测试记录
export interface TestRecord {
  _id?: string;
  characters: string[];
  scores: number[];
  avgAccuracy: number;
  totalTime: number;
  createTime: number;
}

// 用户信息
export interface UserProfile {
  _id?: string;
  nickname: string;
  avatar: string;
  grade: GradeLevel;
  totalPractices: number;
  totalTests: number;
  createTime: number;
}

// 统计数据
export interface StatsData {
  totalPractices: number;
  totalTests: number;
  totalCharacters: number;
  avgScore: number;
  correctRate: number;
  weeklyData: { date: string; count: number; score: number }[];
  monthlyData: { month: string; count: number; score: number }[];
}

// 笔画点
export interface StrokePoint {
  x: number;
  y: number;
}
