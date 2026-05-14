import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTodayFormatted(shortYear = false) {
  const now = new Date();
  const year = now.getFullYear();
  const yearStr = shortYear ? String(year).slice(-2) : String(year);
  return `${String(now.getDate()).padStart(2, "0")}.${String(
    now.getMonth() + 1
  ).padStart(2, "0")}.${yearStr}`;
}

export function getTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function formatIsoToPretty(iso: string) {
  if (!iso || !iso.includes("-")) return iso;
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0].slice(-2)}`;
}

export function getTimeFormatted() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}.${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

export function parseDateString(dateStr: string) {
  if (!dateStr || dateStr.trim() === "") return new Date(9999, 0, 1);
  
  // Handle ISO YYYY-MM-DD
  if (dateStr.includes("-")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }

  const parts = dateStr.split(".");
  if (parts.length < 2) return new Date(9999, 0, 1);
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parts.length >= 3 ? parseInt(parts[2]) : new Date().getFullYear();
  
  return new Date(year, month, day);
}
