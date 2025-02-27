import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 将文件大小转换为人类可读的显示格式
 */
export const formatFileSize = (size: number | string): string => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  if (
    typeof size === "string" &&
    units.some((unit) => (size as string).includes(unit))
  ) {
    return size;
  }
  size = Number(size);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(0)} ${units[unitIndex]}`;
};

// 辅助函数：判断是否是同一天
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// 辅助函数：判断是否在本周
export function isThisWeek(date: Date): boolean {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(now.setDate(now.getDate() + 6));
  return date >= weekStart && date <= weekEnd;
}
