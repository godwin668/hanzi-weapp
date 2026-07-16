import { PracticeRecord } from '@/types';

const mockRecords: PracticeRecord[] = [
  { _id: 'pr1', character: '一', mode: 'free', strokes: [], score: 90, accuracy: 88, aesthetics: 85, duration: 25, createTime: Date.now() - 86400000 },
  { _id: 'pr2', character: '二', mode: 'trace', strokes: [], score: 95, accuracy: 92, aesthetics: 90, duration: 30, createTime: Date.now() - 86400000 * 2 },
  { _id: 'pr3', character: '三', mode: 'free', strokes: [], score: 82, accuracy: 78, aesthetics: 75, duration: 35, createTime: Date.now() - 86400000 * 3 },
  { _id: 'pr4', character: '大', mode: 'trace', strokes: [], score: 88, accuracy: 85, aesthetics: 82, duration: 28, createTime: Date.now() - 86400000 * 4 },
  { _id: 'pr5', character: '人', mode: 'free', strokes: [], score: 92, accuracy: 90, aesthetics: 88, duration: 22, createTime: Date.now() - 86400000 * 5 },
  { _id: 'pr6', character: '天', mode: 'trace', strokes: [], score: 78, accuracy: 75, aesthetics: 72, duration: 40, createTime: Date.now() - 86400000 * 6 },
  { _id: 'pr7', character: '小', mode: 'free', strokes: [], score: 96, accuracy: 94, aesthetics: 92, duration: 20, createTime: Date.now() - 86400000 * 7 },
  { _id: 'pr8', character: '日', mode: 'free', strokes: [], score: 85, accuracy: 82, aesthetics: 80, duration: 32, createTime: Date.now() - 86400000 * 8 },
  { _id: 'pr9', character: '月', mode: 'trace', strokes: [], score: 91, accuracy: 89, aesthetics: 87, duration: 26, createTime: Date.now() - 86400000 * 9 },
  { _id: 'pr10', character: '水', mode: 'free', strokes: [], score: 80, accuracy: 76, aesthetics: 74, duration: 38, createTime: Date.now() - 86400000 * 10 },
];

export default function getPracticeRecords(data?: { page?: number; pageSize?: number }): { records: PracticeRecord[]; total: number } {
  const page = data?.page || 1;
  const pageSize = data?.pageSize || 10;
  const start = (page - 1) * pageSize;
  return { records: mockRecords.slice(start, start + pageSize), total: mockRecords.length };
}
