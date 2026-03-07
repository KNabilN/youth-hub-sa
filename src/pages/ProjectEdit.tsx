import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const navigate = useNavigate();

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;
  if (!project) return <DashboardLayout><p className="text-center py-16 text-muted-foreground">الطلب غير موجود</p></DashboardLayout>;
  if (project.assigned_provider_id) return <DashboardLayout><p className="text-center py-16 text-muted-foreground">لا يمكن تعديل طلب تم تعيين مزود خدمة له</p></DashboardLayout>;

  const willResetStatus = project.status !== "draft";

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
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
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
            category_id: project.category_id,
            region_id: project.region_id,
            city_id: (project as any).city_id,
            required_skills: project.required_skills ?? [],
            estimated_hours: project.estimated_hours,
            budget: project.budget,
            is_private: project.is_private,
          }}
          existingProjectId={project.id}
          onSubmit={handleSubmit}
          isLoading={updateProject.isPending}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </DashboardLayout>
  );
}
