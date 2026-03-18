import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminContracts, type AdminContract, type SignatureStatus } from "@/hooks/useAdminContracts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import { ScrollText, Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ExportDialog, type ExportColumnDef } from "@/components/admin/ExportDialog";
import { supabase } from "@/integrations/supabase/client";
import { getSignatureStatus } from "@/hooks/useAdminContracts";

const signatureLabels: Record<SignatureStatus, string> = {
  unsigned: "غير موقّع",
  partial: "جزئي",
  completed: "مكتمل",
};

const signatureColors: Record<SignatureStatus, string> = {
  unsigned: "bg-muted text-muted-foreground",
  partial: "bg-orange-500/10 text-orange-600",
  completed: "bg-emerald-500/10 text-emerald-600",
};

const exportColumns: ExportColumnDef[] = [
  { key: "request_number", label: "رقم الطلب" },
  { key: "project_title", label: "عنوان المشروع" },
  { key: "association", label: "الجمعية" },
  { key: "provider", label: "المزود" },
  { key: "status", label: "حالة التوقيع" },
  { key: "association_signed", label: "توقيع الجمعية" },
  { key: "provider_signed", label: "توقيع المزود" },
  { key: "created_at", label: "تاريخ الإنشاء" },
];
const exportDefaults = ["request_number", "project_title", "association", "provider", "status", "created_at"];

function getDisplayName(profile: { full_name: string; organization_name: string | null } | null): string {
  if (!profile) return "—";
  return profile.organization_name || profile.full_name;
}

export default function AdminContracts() {
  const { data: contracts, isLoading } = useAdminContracts();
  const pagination = usePagination("admin-contracts");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = (contracts ?? []).filter((c) => {
    if (statusFilter !== "all" && c.signatureStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const projectTitle = c.project?.title?.toLowerCase() ?? "";
      const requestNum = c.project?.request_number?.toLowerCase() ?? "";
      const assocName = getDisplayName(c.association).toLowerCase();
      const provName = getDisplayName(c.provider).toLowerCase();
      if (!projectTitle.includes(q) && !requestNum.includes(q) && !assocName.includes(q) && !provName.includes(q)) return false;
    }
    return true;
  });

  const paged = filtered.slice(pagination.from, pagination.to + 1);

  const statusCounts = (contracts ?? []).reduce(
    (acc, c) => { acc[c.signatureStatus] = (acc[c.signatureStatus] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <ScrollText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                إدارة العقود
                {(statusCounts.partial ?? 0) > 0 && (
                  <Badge className="bg-warning/15 text-warning border-warning/30">{statusCounts.partial} جزئي التوقيع</Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">متابعة حالة توقيع العقود بين الجمعيات ومقدمي الخدمات</p>
            </div>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">البحث</Label>
            <Input placeholder="بحث بالعنوان أو رقم الطلب أو اسم الطرف..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">حالة التوقيع</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل ({contracts?.length ?? 0})</SelectItem>
                {(Object.entries(signatureLabels) as [SignatureStatus, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v} ({statusCounts[k] ?? 0})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="h-10" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            إعادة تعيين
          </Button>
          <Button variant="outline" size="sm" className="h-10 gap-1" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />تصدير CSV
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="border rounded-lg p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>عنوان المشروع</TableHead>
                    <TableHead>الجمعية</TableHead>
                    <TableHead>المزود</TableHead>
                    <TableHead>حالة التوقيع</TableHead>
                    <TableHead>توقيع الجمعية</TableHead>
                    <TableHead>توقيع المزود</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/projects/${(c as any).project_id}`)}>
                      <TableCell className="font-mono text-sm font-semibold">{c.project?.request_number || "—"}</TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate" title={c.project?.title ?? "—"}>{c.project?.title ?? "—"}</TableCell>
                      <TableCell className="max-w-[120px] truncate" title={getDisplayName(c.association)}>{getDisplayName(c.association)}</TableCell>
                      <TableCell className="max-w-[120px] truncate" title={getDisplayName(c.provider)}>{getDisplayName(c.provider)}</TableCell>
                      <TableCell>
                        <Badge className={signatureColors[c.signatureStatus]}>{signatureLabels[c.signatureStatus]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.association_signed_at ? (
                          <span className="text-emerald-600">{format(new Date(c.association_signed_at), "yyyy/MM/dd", { locale: ar })}</span>
                        ) : (
                          <span className="text-muted-foreground">لم يوقّع</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.provider_signed_at ? (
                          <span className="text-emerald-600">{format(new Date(c.provider_signed_at), "yyyy/MM/dd", { locale: ar })}</span>
                        ) : (
                          <span className="text-muted-foreground">لم يوقّع</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(c.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/projects/${(c as any).project_id}`)}>
                          <Eye className="h-4 w-4 me-1" />عرض المشروع
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد عقود</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalFetched={filtered.length}
              onPrev={pagination.prevPage}
              onNext={pagination.nextPage}
            />
          </>
        )}
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="تصدير العقود"
        filename="contracts.csv"
        columns={exportColumns}
        defaultColumns={exportDefaults}
        filters={[{
          key: "status",
          label: "حالة التوقيع",
          options: Object.entries(signatureLabels).map(([k, v]) => ({ value: k, label: v })),
        }]}
        onExport={async (cols, filters) => {
          const { data } = await supabase
            .from("contracts")
            .select(`
              id, created_at, association_signed_at, provider_signed_at,
              project:projects(title, request_number),
              association:profiles!contracts_association_id_fkey(full_name, organization_name),
              provider:profiles!contracts_provider_id_fkey(full_name, organization_name)
            `)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });
          let rows = (data ?? []).map((c: any) => ({
            ...c,
            signatureStatus: getSignatureStatus(c.association_signed_at, c.provider_signed_at),
          }));
          if (filters.status !== "all") rows = rows.filter((c: any) => c.signatureStatus === filters.status);
          const colMap: Record<string, (c: any) => string> = {
            request_number: (c) => c.project?.request_number || "",
            project_title: (c) => c.project?.title || "",
            association: (c) => c.association?.organization_name || c.association?.full_name || "",
            provider: (c) => c.provider?.full_name || "",
            status: (c) => signatureLabels[c.signatureStatus as SignatureStatus] || "",
            association_signed: (c) => c.association_signed_at?.slice(0, 10) || "لم يوقّع",
            provider_signed: (c) => c.provider_signed_at?.slice(0, 10) || "لم يوقّع",
            created_at: (c) => c.created_at?.slice(0, 10) || "",
          };
          const activeCols = exportColumns.filter((col) => cols.includes(col.key));
          return {
            headers: activeCols.map((col) => col.label),
            rows: rows.map((c: any) => activeCols.map((col) => colMap[col.key]?.(c) ?? "")),
          };
        }}
      />
    </DashboardLayout>
  );
}
