import { UserProfile } from '@/types';

export default function updateUserProfile(data: { nickname?: string; avatar?: string; grade?: number }): UserProfile {
  return {
    _id: 'user_001',
    nickname: data.nickname || '小明',
    avatar: data.avatar || '',
    grade: (data.grade || 1) as 1,
    totalPractices: 25,
    totalTests: 5,
    createTime: Date.now(),
  };
}
