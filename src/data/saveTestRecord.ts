import { TestRecord } from '@/types';

export default function saveTestRecord(data: Record<string, any>): TestRecord {
  return {
    _id: 'tr_' + Date.now(),
    characters: data.characters || ['一', '二'],
    scores: data.scores || [85, 90],
    avgAccuracy: data.avgAccuracy || 87.5,
    totalTime: data.totalTime || 120,
    createTime: Date.now(),
  };
}
