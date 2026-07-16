/**
 * 笔画评分工具
 * 基于 DTW（动态时间规整）对比用户书写笔画与标准笔画
 */

/**
 * 计算两点之间的欧氏距离
 */
function pointDistance(
  p1: [number, number],
  p2: [number, number]
): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 简化版 DTW：计算两个点序列的相似度
 * 返回 0-1 的值，1 表示完全匹配
 */
function computeDTWSimilarity(
  userPoints: [number, number][],
  refPoints: [number, number][],
  threshold: number = 50  // 像素距离阈值
): number {
  if (userPoints.length < 2 || refPoints.length < 2) return 0;

  const m = userPoints.length;
  const n = refPoints.length;

  // 简化：使用贪心对齐代替完整DTW（性能更好）
  let totalDist = 0;
  let matchCount = 0;

  const stepU = Math.max(1, m / n);
  const stepR = Math.max(1, n / m);

  let uIdx = 0;
  let rIdx = 0;

  while (uIdx < m && rIdx < n) {
    const dist = pointDistance(userPoints[Math.floor(uIdx)], refPoints[Math.floor(rIdx)]);
    if (dist < threshold) {
      totalDist += dist;
      matchCount++;
    } else {
      totalDist += threshold;
      matchCount++;
    }
    uIdx += stepU;
    rIdx += stepR;
  }

  if (matchCount === 0) return 0;

  const avgDist = totalDist / matchCount;
  // 转换为相似度分数
  const similarity = Math.max(0, 1 - avgDist / threshold);
  return similarity;
}

/**
 * 归一化用户笔画的坐标到 0-1 范围
 */
function normalizePoints(points: string[]): [number, number][] {
  if (points.length < 2) return points.map(p => {
    const [x, y] = p.split(',').map(Number);
    return [x, y] as [number, number];
  });

  const parsed = points.map(p => {
    const [x, y] = p.split(',').map(Number);
    return [x, y] as [number, number];
  });

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of parsed) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return parsed.map(([x, y]) => [
    (x - minX) / rangeX,
    1 - (y - minY) / rangeY,
  ]);
}

/**
 * 归一化标准 medians 到 0-1 范围
 * Y 轴翻转：SVG 坐标系 (Y=900 顶部) → Canvas 屏幕坐标系 (Y=0 顶部)
 */
function normalizeMedians(medians: number[][]): [number, number][] {
  return medians.map(([x, y]) => [x / 1024, (900 - y) / 1024]);
}

/**
 * 计算用户书写与标准笔画的匹配度
 * @param userStrokes 用户书写的笔画路径（原始坐标字符串）
 * @param refMedians 标准笔画的 medians 数据
 * @returns 每笔画的相似度数组 [0-1]，以及总体准确度
 */
export function calculateStrokeAccuracy(
  userStrokes: string[][],
  refMedians: number[][][]
): {
  strokeAccuracies: number[];
  overallAccuracy: number;
} {
  const strokeAccuracies: number[] = [];

  const maxStrokes = Math.max(userStrokes.length, refMedians.length);
  if (maxStrokes === 0) {
    return { strokeAccuracies: [], overallAccuracy: 0 };
  }

  for (let i = 0; i < maxStrokes; i++) {
    if (i >= userStrokes.length) {
      // 用户少写了笔画
      strokeAccuracies.push(0);
      continue;
    }
    if (i >= refMedians.length) {
      // 用户多写了笔画
      strokeAccuracies.push(0);
      continue;
    }

    const userNorm = normalizePoints(userStrokes[i]);
    const refNorm = normalizeMedians(refMedians[i]);

    const similarity = computeDTWSimilarity(userNorm, refNorm);
    strokeAccuracies.push(similarity);
  }

  // 综合准确度 = 各笔画平均
  const overallAccuracy = strokeAccuracies.reduce((a, b) => a + b, 0) / strokeAccuracies.length;

  return { strokeAccuracies, overallAccuracy };
}

/**
 * 综合评分：结合准确度和笔画数匹配
 * @returns 0-100 的分数
 */
export function calculateScore(
  userStrokes: string[][],
  refMedians: number[][][]
): {
  score: number;
  accuracy: number;
  strokeMatch: number;   // 笔画数匹配度
} {
  const { strokeAccuracies, overallAccuracy } = calculateStrokeAccuracy(userStrokes, refMedians);

  // 笔画数匹配度
  const strokeMatch = refMedians.length > 0
    ? Math.min(userStrokes.length, refMedians.length) / Math.max(userStrokes.length, refMedians.length)
    : 0;

  // 综合分数：准确度 70% + 笔画匹配 30%
  const score = Math.round((overallAccuracy * 0.7 + strokeMatch * 0.3) * 100);
  const accuracy = Math.round(overallAccuracy * 100);

  return { score, accuracy, strokeMatch: Math.round(strokeMatch * 100) };
}

/**
 * 评分配置选项
 */
export interface ScoreConfig {
  defaultScoreWithStrokes: number;
  defaultScoreNoStrokes: number;
}

/**
 * 默认评分配置
 */
export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  defaultScoreWithStrokes: 50,
  defaultScoreNoStrokes: 10,
};

/**
 * 统一评分函数：计算用户书写字符的得分
 * @param userStrokes 用户书写的笔画路径
 * @param refMedians 标准笔画的 medians 数据（可为 undefined 表示无标准数据）
 * @param config 可选的评分配置（默认使用 DEFAULT_SCORE_CONFIG）
 * @returns 评分结果，包含分数、准确度、美观度、笔画匹配度
 */
export function evaluateCharacterScore(
  userStrokes: string[][],
  refMedians: number[][][] | undefined,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): {
  score: number;
  accuracy: number;
  aesthetics: number;
  strokeMatch: number;
} {
  if (refMedians && userStrokes.length > 0) {
    const result = calculateScore(userStrokes, refMedians);
    const aesthetics = Math.round(result.accuracy * 0.9 + 5);
    
    return {
      score: result.score,
      accuracy: result.accuracy,
      aesthetics,
      strokeMatch: result.strokeMatch,
    };
  }

  const hasStrokes = userStrokes.length > 0;
  const score = hasStrokes ? config.defaultScoreWithStrokes : config.defaultScoreNoStrokes;
  
  return {
    score,
    accuracy: score,
    aesthetics: Math.round(score * 0.9 + 5),
    strokeMatch: 0,
  };
}
