import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const navigate = useNavigate();

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;
  if (!project) return <DashboardLayout><p className="text-center py-16 text-muted-foreground">المشروع غير موجود</p></DashboardLayout>;
  if (project.status !== "draft") return <DashboardLayout><p className="text-center py-16 text-muted-foreground">لا يمكن تعديل مشروع غير مسودة</p></DashboardLayout>;

  const handleSubmit = (values: ProjectFormValues) => {
    updateProject.mutate(
      { id: project.id, ...values } as any,
      {
        onSuccess: () => {
          toast({ title: "تم تحديث المشروع" });
          navigate(`/projects/${project.id}`);
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">تعديل المشروع</h1>
        <ProjectForm
          defaultValues={{
            title: project.title,
            description: project.description,
            category_id: project.category_id,
            region_id: project.region_id,
            required_skills: project.required_skills ?? [],
            estimated_hours: project.estimated_hours,
            budget: project.budget,
            is_private: project.is_private,
          }}
          onSubmit={handleSubmit}
          isLoading={updateProject.isPending}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </DashboardLayout>
  );
}
