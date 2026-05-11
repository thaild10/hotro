import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTodayFormatted() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}.${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function getTimeFormatted() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}.${String(
    now.getMinutes()
  ).padStart(2, "0")} ${getTodayFormatted()}`;
}

export function parseDateString(dateStr: string) {
  if (!dateStr || dateStr.trim() === "") return new Date(9999, 0, 1);
  const parts = dateStr.split(".");
  if (parts.length < 2) return new Date(9999, 0, 1);
  return new Date(
    new Date().getFullYear(),
    parseInt(parts[1]) - 1,
    parseInt(parts[0])
  );
}
