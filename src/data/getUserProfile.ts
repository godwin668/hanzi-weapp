import { UserProfile } from '@/types';

export default function getUserProfile(): UserProfile {
  return {
    _id: 'user_001',
    nickname: '小明',
    avatar: '',
    grade: 1,
    totalPractices: 25,
    totalTests: 5,
    createTime: Date.now() - 86400000 * 7,
  };
}
