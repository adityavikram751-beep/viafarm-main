import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeFirstWord(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed[0].toUpperCase() + trimmed.slice(1)
}

export function hasDigits(value: string) {
  return /\d/.test(value)
}
