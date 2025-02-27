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
