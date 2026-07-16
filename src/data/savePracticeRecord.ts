import { PracticeRecord } from '@/types';

export default function savePracticeRecord(data: Record<string, any>): PracticeRecord {
  return {
    _id: 'pr_' + Date.now(),
    character: data.character || '一',
    mode: data.mode || 'free',
    strokes: data.strokes || [],
    score: data.score || 85,
    accuracy: data.accuracy || 80,
    aesthetics: data.aesthetics || 75,
    duration: data.duration || 30,
    createTime: Date.now(),
  };
}
