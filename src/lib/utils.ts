import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}
