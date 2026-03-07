import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDisplayName(profile: { organization_name?: string | null; full_name?: string | null } | null | undefined): string {
  return profile?.organization_name || profile?.full_name || "—";
}
