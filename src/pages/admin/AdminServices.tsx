import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminServices, useUpdateServiceApproval, useAdminUpdateService } from "@/hooks/useAdminServices";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import { FileEdit, Eye } from "lucide-react";
import { Link } from "react-router-dom";
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
  { key: "title", label: "العنوان" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "price", label: "السعر", type: "number" },
  { key: "category_id", label: "التصنيف", type: "select", selectSource: "categories" },
  { key: "region_id", label: "المنطقة", type: "select", selectSource: "regions" },
];

export default function AdminServices() {
  const pagination = usePagination();
  const { data: services, isLoading } = useAdminServices();
  const updateApproval = useUpdateServiceApproval();
  const updateService = useAdminUpdateService();
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [editService, setEditService] = useState<any>(null);

  const filtered = (services ?? []).filter((s: any) => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (approvalFilter !== "all" && s.approval !== approvalFilter) return false;
    return true;
  });

  const paged = filtered.slice(pagination.from, pagination.to + 1);

  const handleApprovalChange = (service: any, approval: ApprovalStatus) => {
    updateApproval.mutate(
      { id: service.id, approval, providerId: service.provider_id },
      {
        onSuccess: () => toast.success("تم تحديث الحالة"),
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">البحث</Label>
            <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">الحالة</Label>
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(approvalLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => { setSearch(""); setApprovalFilter("all"); }}
          >
            إعادة تعيين
          </Button>
        </div>
        {isLoading ? (
          <div className="border rounded-lg p-4 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>مقدم الخدمة</TableHead>
                    <TableHead>التصنيف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>تغيير الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium"><Link to={`/admin/services/${s.id}`} className="hover:underline hover:text-primary transition-colors">{s.title}</Link></TableCell>
                      <TableCell>{s.profiles?.full_name ?? "—"}</TableCell>
                      <TableCell>{s.categories?.name ?? "—"}</TableCell>
                      <TableCell><Badge className={approvalColors[s.approval]}>{approvalLabels[s.approval]}</Badge></TableCell>
                      <TableCell>{s.price} ر.س</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(s.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                      <TableCell>
                        <Select value={s.approval} onValueChange={(v) => handleApprovalChange(s, v as ApprovalStatus)}>
                          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(approvalLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/services/${s.id}`}><Eye className="h-4 w-4 me-1" />عرض</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditService(s)}>
                          <FileEdit className="h-4 w-4 me-1" />تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد خدمات</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalFetched={paged.length}
              onPrev={pagination.prevPage}
              onNext={pagination.nextPage}
            />
          </>
        )}
      </div>

      {editService && (
        <AdminDirectEditDialog
          open={!!editService}
          onOpenChange={(o) => !o && setEditService(null)}
          currentValues={editService}
          fields={serviceFields}
          title="تعديل الخدمة"
          isPending={updateService.isPending}
          onSave={async (updates) => {
            await updateService.mutateAsync({ id: editService.id, ...updates });
          }}
        />
      )}
    </DashboardLayout>
  );
}
