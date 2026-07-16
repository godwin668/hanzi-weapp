/**
 * 从 hanzi-writer-data 提取本项目所需汉字的笔画数据
 * 运行: npx ts-node scripts/extractStrokeData.ts
 */
import * as fs from 'fs';
import * as path from 'path';

// 本项目所有汉字列表
const ALL_CHARS = [
  // 一年级
  '一','二','三','十','人','大','小','天','日','月','水','火','山','田','木','上','下','中','口','目',
  // 二年级
  '花','草','红','绿','明','林','从','好','学','校','雨','东','西','北','马','鸟','鱼','风','云',
  // 三年级
  '春','夏','秋','冬','江','河','美','星','阳','光','雪','国','家','笑','书','画','金','石','飞','高',
  // 四年级
  '潮','观','雾','熟','淘','震','牵','鹅','卵','霸','豌','豆','坑','洼','庄','稼','葡',
  // 五年级
  '窃','魂','幽','葬','愁','甚','婪','踮','檐','皱','酸','撑','柜','侣','娱','盒','豫','趟','诵',
  // 六年级
  '邀','俯','瀑','峭','躯','蕴','侠','勤','勉','吻','庞','烤','韵','朦','胧','凄','斑','斓',
];

interface StrokeCharData {
  strokes: string[];
  medians: number[][][];
}

const result: Record<string, StrokeCharData> = {};
let successCount = 0;
let failCount = 0;

for (const char of ALL_CHARS) {
  try {
    const data = require(`hanzi-writer-data/${char}`);
    result[char] = {
      strokes: data.strokes,
      medians: data.medians,
    };
    successCount++;
    console.log(`✓ ${char}`);
  } catch (e) {
    failCount++;
    console.log(`✗ ${char} - 数据不存在`);
  }
}

const outputPath = path.join(__dirname, '..', 'src', 'data', 'strokeData.ts');
const content = `/**
 * 汉字标准笔画数据
 * 自动生成，数据来源: hanzi-writer-data (Make Me a Hanzi)
 * 坐标基于 1024x1024 网格
 * 
 * strokes: SVG path 字符串数组，用于渲染笔画轮廓
 * medians: 每笔画的中心线坐标点数组 [x,y][]，用于动画演示和笔顺校验
 */
export interface StrokeCharData {
  strokes: string[];
  medians: number[][][];
}

export const strokeDataMap: Record<string, StrokeCharData> = ${JSON.stringify(result, null, 2)};

export function getStrokeData(char: string): StrokeCharData | undefined {
  return strokeDataMap[char];
}
`;

fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`\n生成完成: ${outputPath}`);
console.log(`成功: ${successCount}, 失败: ${failCount}`);
