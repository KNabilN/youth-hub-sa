import { useState } from "react";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, UserCheck } from "lucide-react";

export function ProfileCompletionBanner() {
  const { isComplete, missingFields, completionPercentage, isLoading } = useProfileCompleteness();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (isLoading || isComplete || dismissed) return null;

  return (
    <div className="mx-4 md:mx-6 mt-4 animate-fade-in">
      <div className="relative rounded-xl border border-warning/30 bg-warning/5 p-4 md:p-5">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors rounded-full p-1"
          aria-label="إخفاء"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-warning/10 rounded-xl p-3 shrink-0">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm font-semibold text-foreground">
              يرجى إكمال بيانات ملفك الشخصي لتفعيل جميع ميزات المنصة
            </p>
            <div className="flex items-center gap-3">
              <Progress value={completionPercentage} className="h-2 flex-1 max-w-xs" />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {completionPercentage}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              الحقول المتبقية: {missingFields.join("، ")}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/profile")}
            className="shrink-0 gap-1.5 shadow-sm"
          >
            <UserCheck className="h-4 w-4" />
            إكمال الملف الشخصي
          </Button>
        </div>
      </div>
    </div>
  );
}
