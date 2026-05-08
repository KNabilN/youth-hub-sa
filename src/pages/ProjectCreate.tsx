import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  ProjectForm,
  type ProjectFormValues,
} from "@/components/projects/ProjectForm";
import { useCreateProject } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  sanitizeFormValues,
  PROJECT_UUID_FIELDS,
  PROJECT_NUMERIC_FIELDS,
} from "@/lib/sanitize";
import { getFriendlyDatabaseError } from "@/lib/db-errors";
import { usePublishGuard } from "@/hooks/useVerificationGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProjectCreate() {
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const { canPublish, blockReason } = usePublishGuard();
  const [draftId, setDraftId] = useState<string | null>(null);

  // Create draft so attachments can be uploaded in step 3
  const handleCreateDraft = async (
    values: ProjectFormValues,
  ): Promise<string> => {
    if (draftId) return draftId; // Already created
    return new Promise((resolve, reject) => {
      createProject.mutate({ ...values, status: "draft" } as any, {
        onSuccess: (data) => {
          setDraftId(data.id);
          resolve(data.id);
        },
        onError: (error) => {
          toast.error(getFriendlyDatabaseError(error);
          reject(new Error("Draft creation failed"));
        },
      });
    });
  };

  // Final submit: update draft to pending_approval
  const handleSubmit = async (values: ProjectFormValues) => {
    if (draftId) {
      // Update existing draft
      const clean = sanitizeFormValues(
        values as Record<string, unknown>,
        PROJECT_UUID_FIELDS,
        PROJECT_NUMERIC_FIELDS,
      );
      const { error } = await supabase
        .from("projects")
        .update({ ...clean, status: "pending_approval" as any })
        .eq("id", draftId);
      if (error) {
        toast.error(getFriendlyDatabaseError(error);
        return;
      }
      toast.success("تم إنشاء الطلب بنجاح", { description: "سيتم مراجعته من قبل فريق المنصة قبل اعتماده" });
      navigate(`/projects/${draftId}`);
    } else {
      // No draft created (skipped attachments step somehow)
      createProject.mutate({ ...values, status: "pending_approval" } as any, {
        onSuccess: (data) => {
          toast.success("تم إنشاء الطلب بنجاح", { description: "سيتم مراجعته من قبل فريق المنصة قبل اعتماده" });
          navigate(`/projects/${data.id}`);
        },
        onError: (error) =>
          toast.error(getFriendlyDatabaseError(error),
      });
    }
  };

  const handleSaveDraft = (values: ProjectFormValues) => {
    if (draftId) {
      // Update existing draft
      const cleanDraft = sanitizeFormValues(
        values as Record<string, unknown>,
        PROJECT_UUID_FIELDS,
        PROJECT_NUMERIC_FIELDS,
      );
      supabase
        .from("projects")
        .update({ ...cleanDraft, status: "draft" as any })
        .eq("id", draftId)
        .then(({ error }) => {
          if (error)
            toast.error(getFriendlyDatabaseError(
                error);
          else {
            toast.success("تم حفظ الطلب كمسودة");
            navigate(`/projects/${draftId}`);
          }
        });
    } else {
      createProject.mutate({ ...values, status: "draft" } as any, {
        onSuccess: (data) => {
          toast.success("تم حفظ الطلب كمسودة");
          navigate(`/projects/${data.id}`);
        },
        onError: (error) =>
          toast.error(getFriendlyDatabaseError(error),
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">إنشاء طلب جديد</h1>
          <p className="text-sm text-muted-foreground mt-1">
            أضف تفاصيل الطلب وانشره لمقدمي الخدمات
          </p>
        </div>
        {!canPublish && blockReason && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>
                {blockReason === "verification" &&
                  "حسابك غير موثق. يجب توثيق حسابك أولاً لإنشاء طلبات جديدة."}
                {blockReason === "profile" &&
                  "ملفك الشخصي غير مكتمل. يجب إكمال البيانات المطلوبة قبل إنشاء طلبات جديدة."}
                {blockReason === "portfolio" &&
                  "يجب إضافة نموذج عمل واحد على الأقل في معرض الأعمال قبل إنشاء طلبات جديدة."}
              </span>
              <Link
                to={
                  blockReason === "portfolio"
                    ? "/profile?tab=portfolio"
                    : "/profile"
                }
                className="font-semibold underline underline-offset-4"
              >
                {blockReason === "portfolio"
                  ? "إضافة نموذج عمل"
                  : "إكمال الملف الشخصي"}
              </Link>
            </AlertDescription>
          </Alert>
        )}
        {canPublish ? (
          <ProjectForm
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            onCreateDraft={handleCreateDraft}
            isLoading={createProject.isPending}
            submitLabel="إنشاء طلب"
          />
        ) : (
          <p className="text-center text-muted-foreground py-8">
            يرجى استكمال المتطلبات أعلاه قبل إنشاء طلب جديد
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
