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
import { FileEdit, Eye, Download, Trash2, Layers } from "lucide-react";
import { useSoftDelete } from "@/hooks/useTrash";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { AdminDirectEditDialog, type DirectEditFieldConfig } from "@/components/admin/AdminDirectEditDialog";
import { useCategories } from "@/hooks/useCategories";
import type { Database } from "@/integrations/supabase/types";
import { ExportDialog, type ExportColumnDef, type ExportFilterDef } from "@/components/admin/ExportDialog";

const serviceExportColumns: ExportColumnDef[] = [
  { key: "title", label: "العنوان" },
  { key: "provider", label: "مقدم الخدمة" },
  { key: "category", label: "التصنيف" },
  { key: "price", label: "السعر" },
  { key: "approval", label: "الحالة" },
  { key: "service_number", label: "رقم الخدمة" },
  { key: "created_at", label: "التاريخ" },
];
const serviceExportDefaults = ["title", "provider", "category", "price", "approval", "created_at"];

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
  const { data: categories } = useCategories();
  const updateApproval = useUpdateServiceApproval();
  const updateService = useAdminUpdateService();
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editService, setEditService] = useState<any>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const softDelete = useSoftDelete();
  const navigate = useNavigate();

  const filtered = (services ?? []).filter((s: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.title.toLowerCase().includes(q) && !(s.service_number || "").toLowerCase().includes(q) && !(s.profiles?.full_name || "").toLowerCase().includes(q)) return false;
    }
    if (approvalFilter !== "all" && s.approval !== approvalFilter) return false;
    if (categoryFilter !== "all" && s.category_id !== categoryFilter) return false;
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <Layers className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                إدارة الخدمات
                {(() => { const pending = (services ?? []).filter((s: any) => s.approval === "pending").length; return pending > 0 ? <Badge className="bg-warning/15 text-warning border-warning/30">{pending} بانتظار الموافقة</Badge> : null; })()}
              </h1>
              <p className="text-sm text-muted-foreground">عرض وإدارة جميع الخدمات المصغرة</p>
            </div>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">البحث</Label>
            <Input placeholder="بحث بالعنوان أو مقدم الخدمة..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">التصنيف</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="التصنيف" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {(categories ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => { setSearch(""); setApprovalFilter("all"); setCategoryFilter("all"); }}
          >
            إعادة تعيين
          </Button>
          <Button variant="outline" size="sm" className="h-10 gap-1" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />تصدير CSV
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
                     <TableHead>الرقم</TableHead>
                     <TableHead>العنوان</TableHead>
                     <TableHead>مقدم الخدمة</TableHead>
                     <TableHead>التصنيف</TableHead>
                     <TableHead>الحالة</TableHead>
                     <TableHead>السعر</TableHead>
                     <TableHead>الترتيب</TableHead>
                     <TableHead>مميز</TableHead>
                     <TableHead>التاريخ</TableHead>
                     <TableHead>تغيير الحالة</TableHead>
                     <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((s: any) => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/services/${s.id}`)}>
                      <TableCell className="font-mono text-sm font-semibold">{s.service_number || "—"}</TableCell>
                      <TableCell className="font-medium max-w-[120px] truncate" title={s.title}>{s.title}</TableCell>
                      <TableCell className="max-w-[100px] truncate" title={s.profiles?.full_name ?? "—"}>{s.profiles?.full_name ?? "—"}</TableCell>
                      <TableCell>{s.categories?.name ?? "—"}</TableCell>
                      <TableCell><Badge className={approvalColors[s.approval]}>{approvalLabels[s.approval]}</Badge></TableCell>
                       <TableCell>{s.price} ر.س</TableCell>
                       <TableCell onClick={(e) => e.stopPropagation()}>
                         <Input
                            type="number"
                            className="w-20 h-8 text-center"
                            min={0}
                            placeholder="—"
                            defaultValue={(s as any).display_order === 999 ? "" : (s as any).display_order}
                            onBlur={(e) => {
                              const raw = e.target.value.trim();
                              const val = raw === "" || raw === "0" ? 999 : parseInt(raw) || 999;
                              if (val !== ((s as any).display_order ?? 999)) {
                                updateService.mutate(
                                  { id: s.id, display_order: val },
                                  { onSuccess: () => toast.success("تم تحديث الترتيب"), onError: () => toast.error("حدث خطأ") }
                                );
                              }
                            }}
                          />
                       </TableCell>
                       <TableCell onClick={(e) => e.stopPropagation()}>
                         <Switch
                           checked={(s as any).is_featured ?? false}
                           onCheckedChange={(checked) => {
                             updateService.mutate(
                               { id: s.id, is_featured: checked },
                               {
                                 onSuccess: () => toast.success(checked ? "تم تمييز الخدمة" : "تم إلغاء التمييز"),
                                 onError: () => toast.error("حدث خطأ"),
                               }
                             );
                           }}
                         />
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">{format(new Date(s.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const allowed: Record<string, { key: string; label: string }[]> = {
                            pending: [{ key: "approved", label: "مقبول" }, { key: "rejected", label: "مرفوض" }],
                            approved: [{ key: "suspended", label: "موقوف" }],
                            suspended: [{ key: "approved", label: "مقبول" }],
                          };
                          const options = allowed[s.approval];
                          if (!options) return <span className="text-xs text-muted-foreground">—</span>;
                          return (
                            <Select value={s.approval} onValueChange={(v) => handleApprovalChange(s, v as ApprovalStatus)}>
                              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={s.approval} disabled>{approvalLabels[s.approval]}</SelectItem>
                                {options.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/services/${s.id}`}><Eye className="h-4 w-4 me-1" />عرض</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditService(s)}>
                          <FileEdit className="h-4 w-4 me-1" />تعديل
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(s)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">لا توجد خدمات</TableCell></TableRow>}
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
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="تصدير الخدمات"
        filename="services.csv"
        columns={serviceExportColumns}
        defaultColumns={serviceExportDefaults}
        filters={[{
          key: "approval",
          label: "فلتر حسب الحالة",
          options: Object.entries(approvalLabels).map(([k, v]) => ({ value: k, label: v })),
        }]}
        onExport={async (cols, filters) => {
          const { data } = await supabase.from("micro_services").select("service_number, title, price, approval, created_at, categories(name), profiles!micro_services_provider_id_fkey(full_name)");
          let rows = data ?? [];
          if (filters.approval !== "all") rows = rows.filter((s: any) => s.approval === filters.approval);
          const colMap: Record<string, (s: any) => string> = {
            title: (s) => s.title || "",
            provider: (s) => (s.profiles as any)?.full_name || "",
            category: (s) => (s.categories as any)?.name || "",
            price: (s) => String(s.price),
            approval: (s) => approvalLabels[s.approval] || s.approval,
            service_number: (s) => s.service_number || "",
            created_at: (s) => s.created_at?.slice(0, 10) || "",
          };
          const activeCols = serviceExportColumns.filter((c) => cols.includes(c.key));
          return {
            headers: activeCols.map((c) => c.label),
            rows: rows.map((s: any) => activeCols.map((c) => colMap[c.key]?.(s) ?? "")),
          };
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="نقل إلى سلة المحذوفات"
        description={`سيتم نقل الخدمة "${deleteTarget?.title}" إلى سلة المحذوفات.`}
        confirmLabel="نقل للسلة"
        variant="destructive"
        loading={softDelete.isPending}
        onConfirm={() => {
          softDelete.mutate({ table: "micro_services", id: deleteTarget.id }, {
            onSuccess: () => { toast.success("تم النقل إلى سلة المحذوفات"); setDeleteTarget(null); },
            onError: () => toast.error("حدث خطأ"),
          });
        }}
      />
    </DashboardLayout>
  );
}
