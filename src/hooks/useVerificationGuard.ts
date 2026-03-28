import { useProfile } from "@/hooks/useProfile";
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
