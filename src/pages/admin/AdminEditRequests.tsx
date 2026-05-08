import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { Check, X, Eye, ClipboardList } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  full_name: "الاسم الكامل",
  organization_name: "اسم الجهة",
  license_number: "رقم الترخيص",
  contact_officer_name: "اسم مسؤول التواصل",
  contact_officer_email: "بريد مسؤول التواصل",
  contact_officer_phone: "هاتف مسؤول التواصل",
  contact_officer_title: "مسمى مسؤول التواصل",
  region_id: "المنطقة",
  city_id: "المدينة",
  bio: "نبذة",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
};

function fmt(v: any) {
  if (v === null || v === undefined || v === "")
    return <span className="text-muted-foreground">—</span>;
  return String(v);
}

function useEditRequests(status: string) {
  return useQuery({
    queryKey: ["admin-edit-requests", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edit_requests")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useTargetProfiles(ids: string[]) {
  return useQuery({
    queryKey: ["edit-request-target-profiles", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, organization_name, user_number")
        .in("id", ids);
      if (error) throw error;
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => (map[p.id] = p));
      return map;
    },
  });
}

export default function AdminEditRequests() {
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const qc = useQueryClient();

  const { data: rows, isLoading } = useEditRequests(tab);
  const ids = (rows || []).map((r: any) => r.target_user_id);
  const { data: profiles } = useTargetProfiles(ids);

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("apply_edit_request", {
        p_request_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم اعتماد التعديلات");
      qc.invalidateQueries({ queryKey: ["admin-edit-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-by-id"] });
      setSelected(null);
    },
    onError: (e: any) => toast.error(e?.message || "حدث خطأ"),
  });

  const reject = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase.rpc("reject_edit_request", {
        p_request_id: id,
        p_note: note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم رفض التعديلات");
      qc.invalidateQueries({ queryKey: ["admin-edit-requests"] });
      setRejectOpen(false);
      setRejectNote("");
      setSelected(null);
    },
    onError: (e: any) => toast.error(e?.message || "حدث خطأ"),
  });

  const changes = (selected?.requested_changes || {}) as Record<string, any>;
  const olds = (selected?.old_values || {}) as Record<string, any>;
  const fieldKeys = Object.keys(changes);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">طلبات تعديل الملفات الشخصية</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">قيد المراجعة</TabsTrigger>
            <TabsTrigger value="approved">معتمدة</TabsTrigger>
            <TabsTrigger value="rejected">مرفوضة</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {STATUS_LABELS[tab]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (rows || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    لا توجد طلبات
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الجهة</TableHead>
                          <TableHead>الحقول المعدّلة</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(rows || []).map((r: any) => {
                          const p = profiles?.[r.target_user_id];
                          const name =
                            p?.organization_name ||
                            p?.full_name ||
                            r.target_user_id.slice(0, 8);
                          const keys = Object.keys(r.requested_changes || {});
                          return (
                            <TableRow key={r.id}>
                              <TableCell>
                                <Link
                                  to={`/admin/users/${r.target_user_id}`}
                                  className="font-medium hover:underline"
                                >
                                  {name}
                                </Link>
                                {p?.user_number && (
                                  <div className="text-xs text-muted-foreground">
                                    {p.user_number}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {keys.map((k) => (
                                    <Badge key={k} variant="secondary">
                                      {FIELD_LABELS[k] || k}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(r.created_at), "PPp", {
                                  locale: ar,
                                })}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    r.status === "pending"
                                      ? "outline"
                                      : r.status === "approved"
                                        ? "default"
                                        : "destructive"
                                  }
                                >
                                  {STATUS_LABELS[r.status] || r.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelected(r)}
                                >
                                  <Eye className="h-4 w-4 ms-1" /> عرض
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diff dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>مراجعة طلب تعديل</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                الجهة:{" "}
                {profiles?.[selected.target_user_id]?.organization_name ||
                  profiles?.[selected.target_user_id]?.full_name ||
                  "—"}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">الحقل</TableHead>
                      <TableHead>القيمة الحالية</TableHead>
                      <TableHead>القيمة المقترحة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldKeys.map((k) => (
                      <TableRow key={k}>
                        <TableCell className="font-medium">
                          {FIELD_LABELS[k] || k}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {fmt(olds[k])}
                        </TableCell>
                        <TableCell className="text-foreground bg-success/5">
                          {fmt(changes[k])}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {selected.admin_note && (
                <p className="text-sm text-muted-foreground">
                  ملاحظة سابقة: {selected.admin_note}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            {selected?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                >
                  <X className="h-4 w-4 ms-1" /> رفض
                </Button>
                <Button
                  onClick={() => approve.mutate(selected.id)}
                  disabled={approve.isPending}
                >
                  <Check className="h-4 w-4 ms-1" /> اعتماد
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject reason */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سبب الرفض</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="اكتب سبب الرفض ليصل المستخدم"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={reject.isPending || !rejectNote.trim()}
              onClick={() =>
                selected &&
                reject.mutate({ id: selected.id, note: rejectNote.trim() })
              }
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
