import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyServices, useCreateService, useUpdateService, useDeleteService, useUpdateServiceStatus } from "@/hooks/useMyServices";
import { MyServiceCard } from "@/components/services/MyServiceCard";
import { ServiceForm, type ServiceFormValues } from "@/components/services/ServiceForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Layers, AlertTriangle, Filter, ArrowUpDown } from "lucide-react";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useListHighlight } from "@/hooks/useListHighlight";

export default function MyServices() {
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { data: services, isLoading } = useMyServices(approvalFilter, sortBy);
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const updateStatus = useUpdateServiceStatus();
  const { toast } = useToast();
  const { isVerified, guardAction } = useVerificationGuard();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  useListHighlight("my-services");

  const editingService = editingId ? services?.find(s => s.id === editingId) : null;

  const handleCreate = (values: ServiceFormValues & { image_url?: string | null; gallery?: string[] }) => {
    if (createService.isPending) return;
    createService.mutate({ title: values.title, description: values.description, category_id: values.category_id, region_id: values.region_id, service_type: values.service_type, price: values.price, image_url: values.image_url, long_description: values.long_description ?? "", gallery: values.gallery ?? [], faq: values.faq ?? [], packages: values.packages ?? [] } as any, {
      onSuccess: () => {
        toast({ title: "تم إنشاء الخدمة بنجاح" });
        setFormOpen(false);
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleCreateDraft = (values: ServiceFormValues & { image_url?: string | null; gallery?: string[] }) => {
    if (createService.isPending) return;
    createService.mutate({ title: values.title || "خدمة جديدة (مسودة)", description: values.description || "", category_id: values.category_id || null, region_id: values.region_id || null, service_type: values.service_type, price: values.price || 0, image_url: values.image_url, approval: "draft" as any, long_description: values.long_description ?? "", gallery: values.gallery ?? [], faq: values.faq ?? [], packages: values.packages ?? [] } as any, {
      onSuccess: () => {
        toast({ title: "تم حفظ الخدمة كمسودة" });
        setFormOpen(false);
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleEdit = (values: ServiceFormValues & { image_url?: string | null; gallery?: string[] }) => {
    if (!editingId || updateService.isPending) return;
    updateService.mutate({ id: editingId, ...values, long_description: values.long_description ?? "", gallery: values.gallery ?? [], faq: values.faq ?? [], packages: values.packages ?? [] } as any, {
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Layers className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">خدماتي</h1>
              <p className="text-sm text-muted-foreground">أدر خدماتك المقدمة وأضف خدمات جديدة</p>
            </div>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md">
            <Plus className="h-4 w-4 me-2" />إضافة خدمة
          </Button>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Filter & Sort */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger className="w-[150px] h-9 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="approved">معتمدة</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="suspended">موقوفة</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 ms-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] h-9 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="sales">الأكثر مبيعاً</SelectItem>
                  <SelectItem value="views">الأكثر مشاهدة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : !services?.length ? (
          <EmptyState icon={Layers} title="لا توجد خدمات" description="أضف خدمتك الأولى لتبدأ في تلقي الطلبات" actionLabel="إضافة خدمة" onAction={() => setFormOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.id} id={`row-${s.id}`}>
              <MyServiceCard
                service={s}
                onEdit={setEditingId}
                onDelete={setDeletingId}
                onSuspend={(id) => updateStatus.mutate({ id, approval: "suspended" }, {
                  onSuccess: () => toast({ title: "تم إيقاف الخدمة مؤقتاً" }),
                  onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
                })}
                onReactivate={(id) => updateStatus.mutate({ id, approval: "pending" }, {
                  onSuccess: () => toast({ title: "تم إعادة تقديم الخدمة للمراجعة" }),
                  onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
                })}
              />
              </div>
            ))}
          </div>
        )}

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>إضافة خدمة جديدة</DialogTitle></DialogHeader>
            <ServiceForm
              onSubmit={handleCreate}
              isLoading={createService.isPending}
              submitLabel="إنشاء ونشر الخدمة"
              onSaveDraft={handleCreateDraft}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  long_description: (editingService as any).long_description ?? "",
                  category_id: editingService.category_id ?? "",
                  region_id: editingService.region_id ?? "",
                  service_type: editingService.service_type,
                  price: editingService.price,
                  faq: (editingService as any).faq ?? [],
                  packages: (editingService as any).packages ?? [],
                }}
                defaultImageUrl={(editingService as any).image_url}
                defaultGallery={(editingService as any).gallery ?? []}
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
              <AlertDialogDescription>سيتم نقل هذه الخدمة إلى سلة المحذوفات لمدة 30 يوماً، ويمكنك استرجاعها خلال هذه المدة.</AlertDialogDescription>
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
