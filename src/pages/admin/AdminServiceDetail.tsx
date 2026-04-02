import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useServiceDetail } from "@/hooks/useServiceDetail";
import { useUpdateServiceApproval, useAdminUpdateService } from "@/hooks/useAdminServices";
import { ServiceGallery } from "@/components/services/ServiceGallery";
import { ServicePackages } from "@/components/services/ServicePackages";
import { ServiceFAQ } from "@/components/services/ServiceFAQ";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Eye, ShoppingBag, FileEdit, Tag, MapPin, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { AdminDirectEditDialog, type DirectEditFieldConfig } from "@/components/admin/AdminDirectEditDialog";
import type { Database } from "@/integrations/supabase/types";

type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

const approvalLabels: Record<string, string> = {
  draft: "مسودة",
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
  suspended: "موقوف",
  archived: "مؤرشف",
};

const approvalColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-orange-500/10 text-orange-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
  suspended: "bg-orange-500/10 text-orange-600",
  archived: "bg-muted text-muted-foreground",
};

const serviceFields: DirectEditFieldConfig[] = [
  { key: "image_url", label: "صورة الخدمة", type: "image", imageBucket: "service-images", imageMaxMB: 5, imageDimensions: "الحد الأقصى: 5 MB" },
  { key: "title", label: "العنوان" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "long_description", label: "الوصف التفصيلي", type: "textarea" },
  { key: "price", label: "السعر", type: "number" },
  { key: "category_id", label: "التصنيف", type: "select", selectSource: "categories" },
  { key: "region_id", label: "المنطقة", type: "select", selectSource: "regions" },
];

export default function AdminServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { service, isLoading, error } = useServiceDetail(id);
  const updateApproval = useUpdateServiceApproval();
  const updateService = useAdminUpdateService();
  const [editOpen, setEditOpen] = useState(false);

  const handleApprovalChange = (approval: ApprovalStatus) => {
    if (!service) return;
    updateApproval.mutate(
      { id: service.id, approval, providerId: service.provider_id },
      {
        onSuccess: () => toast.success("تم تحديث الحالة"),
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !service) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">لم يتم العثور على الخدمة</p>
          <Button variant="outline" onClick={() => navigate("/admin/services")}>
            <ArrowRight className="h-4 w-4 me-1" />العودة للقائمة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const gallery = Array.isArray(service.gallery) ? (service.gallery as string[]) : [];
  const packages = Array.isArray(service.packages) ? (service.packages as any[]) : [];
  const faq = Array.isArray(service.faq) ? (service.faq as any[]) : [];
  const provider = service.profiles as any;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4 me-1" />العودة لإدارة الخدمات
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <FileEdit className="h-4 w-4 me-1" />تعديل
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <ServiceGallery mainImage={service.image_url || (service as any).categories?.image_url} gallery={gallery} />

            {/* Title & Description */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{service.title}</h1>
              <p className="text-muted-foreground">{service.description}</p>
              {service.long_description && (
                <div className="pt-2 border-t">
                  <h2 className="text-lg font-semibold mb-2">الوصف التفصيلي</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{service.long_description}</p>
                </div>
              )}
            </div>

            {/* Packages */}
            {packages.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">الباقات</CardTitle></CardHeader>
                <CardContent>
                  <ServicePackages
                    packages={packages}
                    basePrice={service.price}
                    baseDescription={service.description}
                    serviceType={service.service_type}
                    onAddToCart={() => {}}
                    canPurchase={false}
                    isAdding={false}
                  />
                </CardContent>
              </Card>
            )}

            {/* FAQ */}
            <ServiceFAQ items={faq} />
          </div>

          {/* Sidebar - 1 col */}
          <div className="space-y-4">
            {/* Approval Status */}
            <Card>
              <CardHeader><CardTitle className="text-sm">حالة الموافقة</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Badge className={approvalColors[service.approval]}>{approvalLabels[service.approval]}</Badge>
                {(() => {
                  const transitions: Record<string, string[]> = {
                    pending: ["approved", "rejected"],
                    approved: ["suspended"],
                    suspended: ["approved"],
                  };
                  const allowed = transitions[service.approval] || [];
                  if (allowed.length === 0) return null;
                  return (
                    <Select onValueChange={(v) => handleApprovalChange(v as ApprovalStatus)}>
                      <SelectTrigger><SelectValue placeholder="تغيير الحالة" /></SelectTrigger>
                      <SelectContent>
                        {allowed.map((k) => (
                          <SelectItem key={k} value={k}>{approvalLabels[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Price */}
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="text-sm text-muted-foreground">{service.service_type === "hourly" ? "السعر بالساعة" : "السعر"}</p>
                <p className="text-2xl font-bold text-primary">{service.price?.toLocaleString()} ر.س</p>
              </CardContent>
            </Card>

            {/* Provider */}
            {provider && (
              <Card>
                <CardHeader><CardTitle className="text-sm">مقدم الخدمة</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={provider.avatar_url} />
                      <AvatarFallback>{provider.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{provider.full_name}</p>
                      {provider.is_verified && <Badge variant="secondary" className="text-xs mt-0.5">موثق</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meta Info */}
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                {service.categories && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>{(service.categories as any).name}</span>
                  </div>
                )}
                {service.regions && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{(service.regions as any).name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{service.service_views ?? 0} مشاهدة</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShoppingBag className="h-4 w-4" />
                  <span>{service.sales_count ?? 0} مبيعات</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(service.created_at), "yyyy/MM/dd", { locale: ar })}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {editOpen && (
        <AdminDirectEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          currentValues={service}
          fields={serviceFields}
          title="تعديل الخدمة"
          isPending={updateService.isPending}
          onSave={async (updates) => {
            await updateService.mutateAsync({ id: service.id, ...updates });
          }}
        />
      )}
    </DashboardLayout>
  );
}
