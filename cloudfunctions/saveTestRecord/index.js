const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const record = {
      _openid: openid,
      characters: event.characters || [],
      scores: event.scores || [],
      avgAccuracy: event.avgAccuracy || 0,
      totalTime: event.totalTime || 0,
      createTime: db.serverDate(),
    };
    const result = await db.collection('test_records').add({ data: record });
    await db.collection('users').where({ _openid: openid }).update({
      data: { totalTests: db.command.inc(1) },
    });
    return { code: 0, message: 'success', data: { _id: result._id, ...record } };
  } catch (err) {
    console.error('[saveTestRecord] error:', err);
    return { code: -1, message: err.message || '服务异常', data: null };
  }
};
