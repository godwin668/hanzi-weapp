import { TestRecord } from '@/types';

const mockRecords: TestRecord[] = [
  { _id: 'tr1', characters: ['一', '二', '三'], scores: [85, 90, 88], avgAccuracy: 87.7, totalTime: 90, createTime: Date.now() - 86400000 },
  { _id: 'tr2', characters: ['大', '人', '天'], scores: [78, 82, 75], avgAccuracy: 78.3, totalTime: 120, createTime: Date.now() - 86400000 * 3 },
  { _id: 'tr3', characters: ['小', '日', '月', '水'], scores: [92, 88, 85, 90], avgAccuracy: 88.8, totalTime: 150, createTime: Date.now() - 86400000 * 5 },
  { _id: 'tr4', characters: ['火', '山', '田', '木'], scores: [80, 76, 82, 78], avgAccuracy: 79, totalTime: 130, createTime: Date.now() - 86400000 * 7 },
  { _id: 'tr5', characters: ['上', '下', '中', '口', '目'], scores: [88, 85, 90, 92, 86], avgAccuracy: 88.2, totalTime: 180, createTime: Date.now() - 86400000 * 10 },
];

export default function getTestRecords(data?: { page?: number; pageSize?: number }): { records: TestRecord[]; total: number } {
  const page = data?.page || 1;
  const pageSize = data?.pageSize || 10;
  const start = (page - 1) * pageSize;
  return { records: mockRecords.slice(start, start + pageSize), total: mockRecords.length };
}
