import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { useCreateProject } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFormValues, PROJECT_UUID_FIELDS, PROJECT_NUMERIC_FIELDS } from "@/lib/sanitize";

export default function ProjectCreate() {
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const [draftId, setDraftId] = useState<string | null>(null);

  // Create draft so attachments can be uploaded in step 3
  const handleCreateDraft = async (values: ProjectFormValues): Promise<string> => {
    if (draftId) return draftId; // Already created
    return new Promise((resolve, reject) => {
      createProject.mutate({ ...values, status: "draft" } as any, {
        onSuccess: (data) => {
          setDraftId(data.id);
          resolve(data.id);
        },
        onError: () => {
          toast({ title: "حدث خطأ أثناء حفظ المسودة", variant: "destructive" });
          reject(new Error("Draft creation failed"));
        },
      });
    });
  };

  // Final submit: update draft to pending_approval
  const handleSubmit = async (values: ProjectFormValues) => {
    if (draftId) {
      // Update existing draft
      const { error } = await supabase
        .from("projects")
        .update({ ...values, status: "pending_approval" as any })
        .eq("id", draftId);
      if (error) {
        toast({ title: "حدث خطأ أثناء إنشاء الطلب", variant: "destructive" });
        return;
      }
      toast({ title: "تم إنشاء الطلب بنجاح" });
      navigate(`/projects/${draftId}`);
    } else {
      // No draft created (skipped attachments step somehow)
      createProject.mutate({ ...values, status: "pending_approval" } as any, {
        onSuccess: (data) => {
          toast({ title: "تم إنشاء الطلب بنجاح" });
          navigate(`/projects/${data.id}`);
        },
        onError: () => toast({ title: "حدث خطأ أثناء إنشاء الطلب", variant: "destructive" }),
      });
    }
  };

  const handleSaveDraft = (values: ProjectFormValues) => {
    if (draftId) {
      // Update existing draft
      supabase
        .from("projects")
        .update({ ...values, status: "draft" as any })
        .eq("id", draftId)
        .then(({ error }) => {
          if (error) toast({ title: "حدث خطأ", variant: "destructive" });
          else {
            toast({ title: "تم حفظ الطلب كمسودة" });
            navigate(`/projects/${draftId}`);
          }
        });
    } else {
      createProject.mutate({ ...values, status: "draft" } as any, {
        onSuccess: (data) => {
          toast({ title: "تم حفظ الطلب كمسودة" });
          navigate(`/projects/${data.id}`);
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">إنشاء طلب جديد</h1>
          <p className="text-sm text-muted-foreground mt-1">أضف تفاصيل الطلب وانشره لمقدمي الخدمات</p>
        </div>
        <ProjectForm
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onCreateDraft={handleCreateDraft}
          isLoading={createProject.isPending}
          submitLabel="إنشاء طلب"
        />
      </div>
    </DashboardLayout>
  );
}
