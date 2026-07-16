import Taro from '@tarojs/taro'
import getStatsMock from '@/data/getStats'
import getPracticeRecordsMock from '@/data/getPracticeRecords'
import getTestRecordsMock from '@/data/getTestRecords'
import getUserProfileMock from '@/data/getUserProfile'
import loginMock from '@/data/login'
import savePracticeRecordMock from '@/data/savePracticeRecord'
import saveTestRecordMock from '@/data/saveTestRecord'
import updateUserProfileMock from '@/data/updateUserProfile'

const mockMap: Record<string, (data?: any) => any> = {
  getStats: getStatsMock,
  getPracticeRecords: getPracticeRecordsMock,
  getTestRecords: getTestRecordsMock,
  getUserProfile: getUserProfileMock,
  login: loginMock,
  savePracticeRecord: savePracticeRecordMock,
  saveTestRecord: saveTestRecordMock,
  updateUserProfile: updateUserProfileMock,
}

const isWeapp = process.env.TARO_ENV === 'weapp'

function getMockData<T = any>(name: string, data?: Record<string, any>): T {
  const mockFn = mockMap[name]
  if (!mockFn) {
    throw new Error(`Mock function not found: ${name}`)
  }
  return mockFn(data) as T
}

export async function callFunction<T = any>(
  name: string,
  data?: Record<string, any>
): Promise<T> {
  if (!isWeapp) {
    return getMockData<T>(name, data)
  }
  try {
    const res = await Taro.cloud.callFunction({ name, data })
    const result = res.result as { code: number; message: string; data: T }
    if (result.code !== 0) {
      console.error(`[Cloud] ${name} failed:`, result.message)
      throw new Error(result.message || '请求失败')
    }
    return result.data
  } catch (err: any) {
    const errMsg = err?.errMsg || err?.message || ''
    if (errMsg.includes('-601034') || errMsg.includes('没有权限') || errMsg.includes('cloud.callFunction:fail')) {
      console.warn(`[Cloud] ${name} 云开发未开通，使用本地数据:`, errMsg)
      return getMockData<T>(name, data)
    }
    throw err
  }
}

export function getDatabase() {
  if (!isWeapp) {
    return null
  }
  return Taro.cloud.database()
}
