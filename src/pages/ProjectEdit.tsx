import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFormValues, PROJECT_UUID_FIELDS, PROJECT_NUMERIC_FIELDS } from "@/lib/sanitize";
import { getFriendlyDatabaseError } from "@/lib/db-errors";

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const navigate = useNavigate();

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;
  if (!project) return <DashboardLayout><p className="text-center py-16 text-muted-foreground">الطلب غير موجود</p></DashboardLayout>;
  if (project.assigned_provider_id) return <DashboardLayout><p className="text-center py-16 text-muted-foreground">لا يمكن تعديل طلب تم تعيين مزود خدمة له</p></DashboardLayout>;

  const isDraft = project.status === "draft";
  const willResetStatus = !isDraft;

  const handleCreateDraft = async (values: ProjectFormValues): Promise<string> => {
    // Project already exists, just update it as draft
    const clean = sanitizeFormValues(values as Record<string, unknown>, PROJECT_UUID_FIELDS, PROJECT_NUMERIC_FIELDS);
    const { error } = await supabase
      .from("projects")
      .update({ ...clean, status: "draft" as any })
      .eq("id", project.id);
    if (error) throw new Error(getFriendlyDatabaseError(error, "حدث خطأ"));
    return project.id;
  };

  const handleSaveDraft = (values: ProjectFormValues) => {
    const clean = sanitizeFormValues(values as Record<string, unknown>, PROJECT_UUID_FIELDS, PROJECT_NUMERIC_FIELDS);
    supabase
      .from("projects")
      .update({ ...clean, status: "draft" as any })
      .eq("id", project.id)
      .then(({ error }) => {
        if (error) toast({ title: getFriendlyDatabaseError(error, "حدث خطأ أثناء حفظ المسودة"), variant: "destructive" });
        else {
          toast({ title: "تم حفظ المسودة" });
          navigate(`/projects/${project.id}`);
        }
      });
  };

  const handleSubmit = (values: ProjectFormValues) => {
    const payload: any = { id: project.id, ...values };
    if (willResetStatus) {
      payload.status = "pending_approval";
    }
    updateProject.mutate(payload, {
      onSuccess: () => {
        toast({ title: willResetStatus ? "تم تحديث الطلب وإعادته للمراجعة" : "تم تحديث الطلب" });
        navigate(`/projects/${project.id}`);
      },
      onError: (error) => toast({ title: getFriendlyDatabaseError(error, "حدث خطأ"), variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">تعديل الطلب</h1>
        {willResetStatus && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              أي تعديل على الطلب سيعيده لحالة "بانتظار الموافقة" وسيحتاج مراجعة الإدارة مرة أخرى.
            </AlertDescription>
          </Alert>
        )}
        <ProjectForm
          defaultValues={{
            title: project.title,
            description: project.description,
            category_id: project.category_id ?? "",
            region_id: project.region_id,
            city_id: (project as any).city_id,
            required_skills: project.required_skills ?? [],
            estimated_hours: project.estimated_hours,
            budget: project.budget,
            is_private: project.is_private,
          }}
          existingProjectId={project.id}
          onSubmit={handleSubmit}
          onSaveDraft={isDraft ? handleSaveDraft : undefined}
          onCreateDraft={handleCreateDraft}
          isLoading={updateProject.isPending}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </DashboardLayout>
  );
}
