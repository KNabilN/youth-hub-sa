import { useProfile } from "@/hooks/useProfile";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useCallback } from "react";

export function useVerificationGuard() {
  const { data: profile, isLoading } = useProfile();
  const isVerified = profile?.is_verified ?? false;

  const guardAction = useCallback(
    (callback: () => void) => {
      if (!isVerified) {
        toast.error("يجب توثيق حسابك أولاً للقيام بهذا الإجراء");
        return;
      }
      callback();
    },
    [isVerified],
  );

  return { isVerified, guardAction, isLoading };
}

export function usePublishGuard() {
  const { role } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { isComplete, missingFields, isLoading: completenessLoading } = useProfileCompleteness();
  const isVerified = profile?.is_verified ?? false;
  const isLoading = profileLoading || completenessLoading;
  const canPublish = isVerified && isComplete;

  const blockReason: "verification" | "profile" | "portfolio" | null = !isVerified
    ? "verification"
    : !isComplete
      ? (role === "service_provider" && missingFields.includes("نموذج عمل واحد على الأقل") && missingFields.length === 1
          ? "portfolio"
          : "profile")
      : null;

  const guardPublish = useCallback(
    (callback: () => void) => {
      if (!isVerified) {
        toast.error("يجب توثيق حسابك أولاً قبل النشر");
        return;
      }
      if (!isComplete) {
        const isPortfolioOnly =
          role === "service_provider" &&
          missingFields.includes("نموذج عمل واحد على الأقل") &&
          missingFields.length === 1;
        if (isPortfolioOnly) {
          toast.error("يجب إضافة نموذج عمل واحد على الأقل في معرض الأعمال قبل نشر الخدمات");
        } else {
          toast.error("يجب إكمال الملف الشخصي أولاً قبل النشر");
        }
        return;
      }
      callback();
    },
    [isVerified, isComplete, missingFields, role],
  );

  return { canPublish, guardPublish, isVerified, isComplete, missingFields, blockReason, isLoading };
}
