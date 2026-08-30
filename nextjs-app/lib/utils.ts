import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cache-Control max-age (seconds) for files uploaded to Supabase Storage.
// Every upload either gets a unique path or a ?v= cache buster, so a long
// lifetime is safe — and it stops browsers re-downloading (and re-billing
// egress for) the same asset every hour.
export const UPLOAD_CACHE_CONTROL = '31536000' // 1 year
