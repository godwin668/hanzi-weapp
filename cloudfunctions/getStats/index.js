const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 获取最近 N 天的日期范围
function getLastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

// 获取最近 N 个月的范围
function getLastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(m);
  }
  return months;
}

// 格式化日期为 YYYY-MM-DD
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 格式化月份为 M月
function formatMonth(d) {
  return `${d.getMonth() + 1}月`;
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const user = await db.collection('users').where({ _openid: openid }).get();
    const practiceCount = await db.collection('practice_records').where({ _openid: openid }).count();
    const testCount = await db.collection('test_records').where({ _openid: openid }).count();
    const practiceRecords = await db.collection('practice_records').where({ _openid: openid }).get();

    let totalScore = 0;
    let totalAccuracy = 0;
    const uniqueChars = new Set();
    practiceRecords.data.forEach((r) => {
      totalScore += r.score || 0;
      totalAccuracy += r.accuracy || 0;
      uniqueChars.add(r.character);
    });

    const avgScore = practiceRecords.data.length > 0 ? Math.round(totalScore / practiceRecords.data.length) : 0;
    const correctRate = practiceRecords.data.length > 0 ? Math.round(totalAccuracy / practiceRecords.data.length) : 0;

    // 计算近7天数据
    const last7Days = getLastNDays(7);
    const weeklyData = last7Days.map((day) => {
      const dayStr = formatDate(day);
      const dayRecords = practiceRecords.data.filter((r) => {
        if (!r.createTime) return false;
        const recordDate = new Date(r.createTime);
        return formatDate(recordDate) === dayStr;
      });
      const totalScore = dayRecords.reduce((sum, r) => sum + (r.score || 0), 0);
      return {
        date: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day.getDay()],
        count: dayRecords.length,
        score: dayRecords.length > 0 ? Math.round(totalScore / dayRecords.length) : 0,
      };
    });

    // 计算近6个月数据
    const last6Months = getLastNMonths(6);
    const monthlyData = last6Months.map((month) => {
      const monthRecords = practiceRecords.data.filter((r) => {
        if (!r.createTime) return false;
        const recordDate = new Date(r.createTime);
        return recordDate.getFullYear() === month.getFullYear() && recordDate.getMonth() === month.getMonth();
      });
      const totalScore = monthRecords.reduce((sum, r) => sum + (r.score || 0), 0);
      return {
        month: formatMonth(month),
        count: monthRecords.length,
        score: monthRecords.length > 0 ? Math.round(totalScore / monthRecords.length) : 0,
      };
    });

    return {
      code: 0,
      message: 'success',
      data: {
        totalPractices: practiceCount.total,
        totalTests: testCount.total,
        totalCharacters: uniqueChars.size,
        avgScore,
        correctRate,
        weeklyData,
        monthlyData,
      },
    };
  } catch (err) {
    console.error('[getStats] error:', err);
    return { code: -1, message: err.message || '服务异常', data: null };
  }
};
