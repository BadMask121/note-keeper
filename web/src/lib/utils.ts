import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSlug() {
  // Get the pathname of the URL
  const pathname = window.location.pathname;

  // Split the pathname by '/' and get the last part
  const pathSegments = pathname.split('/');

  // Remove empty segments (in case the URL ends with '/')
  return pathSegments.filter(segment => segment !== '').pop();
}