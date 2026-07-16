const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

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

    return {
      code: 0,
      message: 'success',
      data: {
        totalPractices: practiceCount.total,
        totalTests: testCount.total,
        totalCharacters: uniqueChars.size,
        avgScore,
        correctRate,
        weeklyData: [],
        monthlyData: [],
      },
    };
  } catch (err) {
    console.error('[getStats] error:', err);
    return { code: -1, message: err.message || '服务异常', data: null };
  }
};
