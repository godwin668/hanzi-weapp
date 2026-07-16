const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const updateData = {};
    if (event.nickname !== undefined) updateData.nickname = event.nickname;
    if (event.avatar !== undefined) updateData.avatar = event.avatar;
    if (event.grade !== undefined) updateData.grade = event.grade;
    await db.collection('users').where({ _openid: openid }).update({ data: updateData });
    const user = await db.collection('users').where({ _openid: openid }).get();
    return { code: 0, message: 'success', data: user.data[0] };
  } catch (err) {
    console.error('[updateUserProfile] error:', err);
    return { code: -1, message: err.message || '服务异常', data: null };
  }
};
