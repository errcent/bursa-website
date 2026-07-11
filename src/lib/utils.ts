import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

/** True when the entity has at least one review (rating is computed live; 0 means unrated). */
export function hasRating(rating: number): boolean {
  return rating > 0;
}
