const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const record = {
      _openid: openid,
      character: event.character,
      mode: event.mode,
      strokes: event.strokes || [],
      score: event.score || 0,
      accuracy: event.accuracy || 0,
      aesthetics: event.aesthetics || 0,
      duration: event.duration || 0,
      createTime: db.serverDate(),
    };
    const result = await db.collection('practice_records').add({ data: record });
    await db.collection('users').where({ _openid: openid }).update({
      data: { totalPractices: db.command.inc(1) },
    });
    return { code: 0, message: 'success', data: { _id: result._id, ...record } };
  } catch (err) {
    console.error('[savePracticeRecord] error:', err);
    return { code: -1, message: err.message || '服务异常', data: null };
  }
};
