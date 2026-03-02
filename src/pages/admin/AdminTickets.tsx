import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminTickets, useUpdateTicketStatus } from "@/hooks/useAdminTickets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const statusLabels: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-yellow-500/10 text-yellow-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

export default function AdminTickets() {
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useAdminTickets();
  const updateStatus = useUpdateTicketStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (tickets ?? []).filter((t: any) => {
    const q = search.toLowerCase();
    if (search && !t.subject.toLowerCase().includes(q) && !(t.ticket_number ?? '').toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = (id: string, status: TicketStatus) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast.success("تم تحديث حالة التذكرة"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">تذاكر الدعم الفني</h1>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">البحث</Label>
            <Input placeholder="بحث بالموضوع أو الرقم..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">الحالة</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
          >
            إعادة تعيين
          </Button>
        </div>
        {isLoading ? (
          <div className="border rounded-lg p-4 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>رقم التذكرة</TableHead>
                   <TableHead>الموضوع</TableHead>
                   <TableHead>المستخدم</TableHead>
                   <TableHead>الأولوية</TableHead>
                   <TableHead>الحالة</TableHead>
                   <TableHead>التاريخ</TableHead>
                   <TableHead>تغيير الحالة</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: any) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                     <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket_number}</TableCell>
                     <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>{t.profiles?.full_name ?? "—"}</TableCell>
                    <TableCell><Badge className={priorityColors[t.priority]}>{priorityLabels[t.priority]}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(t.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v as TicketStatus)}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد تذاكر</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
