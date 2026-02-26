import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { useCreateProject } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function ProjectCreate() {
  const createProject = useCreateProject();
  const navigate = useNavigate();

  const handleSubmit = (values: ProjectFormValues) => {
    createProject.mutate({ ...values, status: "pending_approval" } as any, {
      onSuccess: (data) => {
        toast({ title: "تم إنشاء الطلب بنجاح" });
        navigate(`/projects/${data.id}`);
      },
      onError: () => toast({ title: "حدث خطأ أثناء إنشاء الطلب", variant: "destructive" }),
    });
  };

  const handleSaveDraft = (values: ProjectFormValues) => {
    createProject.mutate({ ...values, status: "draft" } as any, {
      onSuccess: (data) => {
        toast({ title: "تم حفظ الطلب كمسودة" });
        navigate(`/projects/${data.id}`);
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
         <h1 className="text-2xl font-bold">إنشاء طلب جديد</h1>
          <p className="text-sm text-muted-foreground mt-1">أضف تفاصيل الطلب وانشره لمقدمي الخدمات</p>
        </div>
        <ProjectForm onSubmit={handleSubmit} onSaveDraft={handleSaveDraft} isLoading={createProject.isPending} submitLabel="إنشاء طلب" />
      </div>
    </DashboardLayout>
  );
}
