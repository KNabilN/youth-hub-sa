import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export function getDisplayName(
 profile: { organization_name?: string | null; full_name?: string | null } | null | undefined,
 role?: string | null,
): string {
 if (!profile) return "—";
 // For organizational accounts the legal/organization name is the primary identifier.
 // For individuals (service providers, donors, admins) the full personal name comes first.
 if (role === "youth_association") {
 return profile.organization_name || profile.full_name || "—";
 }
 return profile.full_name || profile.organization_name || "—";
}
