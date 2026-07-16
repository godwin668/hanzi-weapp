const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const user = await db.collection('users').where({ _openid: openid }).get();
    if (user.data.length === 0) {
      const newUser = { _openid: openid, nickname: '', avatar: '', grade: 1, totalPractices: 0, totalTests: 0, createTime: db.serverDate() };
      await db.collection('users').add({ data: newUser });
      return { code: 0, message: 'success', data: newUser };
    }
    return { code: 0, message: 'success', data: user.data[0] };
  } catch (err) {
    console.error('[getUserProfile] error:', err);
    return { code: -1, message: err.message || '服务异常', data: null };
  }
};
