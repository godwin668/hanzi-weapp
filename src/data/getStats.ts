import { StatsData } from '@/types';

export default function getStats(): StatsData {
  const now = Date.now();
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];

  return {
    totalPractices: 25,
    totalTests: 5,
    totalCharacters: 50,
    avgScore: 86.5,
    correctRate: 82.3,
    weeklyData: weekDays.map((date, i) => ({
      date,
      count: Math.floor(Math.random() * 5) + 1,
      score: Math.floor(Math.random() * 20) + 75,
    })),
    monthlyData: months.map((month, i) => ({
      month,
      count: Math.floor(Math.random() * 20) + 5,
      score: Math.floor(Math.random() * 15) + 78,
    })),
  };
}
