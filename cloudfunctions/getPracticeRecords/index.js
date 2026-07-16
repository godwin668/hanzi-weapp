const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const page = event.page || 1;
    const pageSize = event.pageSize || 10;
    const total = await db.collection('practice_records').where({ _openid: openid }).count();
    const records = await db.collection('practice_records')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    return { code: 0, message: 'success', data: { records: records.data, total: total.total } };
  } catch (err) {
    console.error('[getPracticeRecords] error:', err);
    return { code: -1, message: err.message || '服务异常', data: null };
  }
};
