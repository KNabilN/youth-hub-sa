import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ScrollText } from "lucide-react";

const actionLabels: Record<string, string> = {
  INSERT: "إضافة",
  UPDATE: "تعديل",
  DELETE: "حذف",
};

const actionColors: Record<string, string> = {
  INSERT: "bg-emerald-500/10 text-emerald-600",
  UPDATE: "bg-blue-500/10 text-blue-600",
  DELETE: "bg-red-500/10 text-red-600",
};

export default function AdminAuditLog() {
  const { data: logs, isLoading } = useAuditLog();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filtered = (logs ?? []).filter((l: any) => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (search && !l.table_name?.toLowerCase().includes(search.toLowerCase()) && !l.record_id?.includes(search)) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">سجل التدقيق</h1>

        <div className="flex flex-wrap gap-3">
          <Input placeholder="بحث بالجدول أو المعرف..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الإجراء" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="INSERT">إضافة</SelectItem>
              <SelectItem value="UPDATE">تعديل</SelectItem>
              <SelectItem value="DELETE">حذف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !filtered.length ? (
          <EmptyState icon={ScrollText} title="لا توجد سجلات" description="ستظهر سجلات التدقيق هنا عند إجراء أي تغييرات" />
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>الجدول</TableHead>
                  <TableHead>معرف السجل</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={actionColors[log.action] ?? ""}>{actionLabels[log.action] ?? log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.record_id?.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
