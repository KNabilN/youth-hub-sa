import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useMyServices";
import { MyServiceCard } from "@/components/services/MyServiceCard";
import { ServiceForm, type ServiceFormValues } from "@/components/services/ServiceForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Layers, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyServices() {
  const { data: services, isLoading } = useMyServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const editingService = editingId ? services?.find(s => s.id === editingId) : null;

  const handleCreate = (values: ServiceFormValues) => {
    createService.mutate({ title: values.title, description: values.description, category_id: values.category_id, region_id: values.region_id, service_type: values.service_type, price: values.price }, {
      onSuccess: () => { toast({ title: "تم إنشاء الخدمة بنجاح" }); setFormOpen(false); },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleEdit = (values: ServiceFormValues) => {
    if (!editingId) return;
    updateService.mutate({ id: editingId, ...values }, {
      onSuccess: () => { toast({ title: "تم تحديث الخدمة" }); setEditingId(null); },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteService.mutate(deletingId, {
      onSuccess: () => { toast({ title: "تم حذف الخدمة" }); setDeletingId(null); },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">خدماتي</h1>
          <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 ml-2" />إضافة خدمة</Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : !services?.length ? (
          <EmptyState icon={Layers} title="لا توجد خدمات" description="أضف خدمتك الأولى لتبدأ في تلقي الطلبات" actionLabel="إضافة خدمة" actionHref="#" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => (
              <MyServiceCard key={s.id} service={s} onEdit={setEditingId} onDelete={setDeletingId} />
            ))}
          </div>
        )}

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>إضافة خدمة جديدة</DialogTitle></DialogHeader>
            <ServiceForm onSubmit={handleCreate} isLoading={createService.isPending} submitLabel="إنشاء الخدمة" />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>تعديل الخدمة</DialogTitle></DialogHeader>
            <Alert variant="default" className="border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-xs">تعديل الخدمة سيعيدها إلى حالة "قيد المراجعة" حتى يوافق عليها المدير مجدداً.</AlertDescription>
            </Alert>
            {editingService && (
              <ServiceForm
                defaultValues={{
                  title: editingService.title,
                  description: editingService.description,
                  category_id: editingService.category_id ?? "",
                  region_id: editingService.region_id ?? "",
                  service_type: editingService.service_type,
                  price: editingService.price,
                }}
                onSubmit={handleEdit}
                isLoading={updateService.isPending}
                submitLabel="حفظ التعديلات"
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>سيتم حذف هذه الخدمة نهائياً.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
