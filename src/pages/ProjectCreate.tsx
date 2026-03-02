import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { useCreateProject } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/attachments/FileUploader";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function ProjectCreate() {
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleSubmit = (values: ProjectFormValues) => {
    createProject.mutate({ ...values, status: "pending_approval" } as any, {
      onSuccess: (data) => {
        toast({ title: "تم إنشاء الطلب بنجاح" });
        setCreatedId(data.id);
      },
      onError: () => toast({ title: "حدث خطأ أثناء إنشاء الطلب", variant: "destructive" }),
    });
  };

  const handleSaveDraft = (values: ProjectFormValues) => {
    createProject.mutate({ ...values, status: "draft" } as any, {
      onSuccess: (data) => {
        toast({ title: "تم حفظ الطلب كمسودة" });
        setCreatedId(data.id);
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  if (createdId) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 text-success">
            <CheckCircle className="h-6 w-6" />
            <h2 className="text-xl font-bold">تم إنشاء الطلب بنجاح</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إرفاق ملفات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploader entityType="project" entityId={createdId} />
              <AttachmentList entityType="project" entityId={createdId} />
            </CardContent>
          </Card>
          <Button onClick={() => navigate(`/projects/${createdId}`)}>
            <ArrowLeft className="h-4 w-4 me-2" />
            الانتقال لتفاصيل الطلب
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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