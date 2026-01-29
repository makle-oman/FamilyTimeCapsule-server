import { v4 as uuidv4 } from 'uuid';

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * 生成6位数字邀请码
 */
export function generateInviteCode(): string {
  return Math.random().toString().slice(2, 8);
}

/**
 * 获取今天的日期（不含时间）
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * 获取一年前的今天
 */
export function getYearAgoToday(): Date {
  const today = getToday();
  return new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 休眠函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
