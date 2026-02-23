import { useState } from "react";
import { useAdminUsers, useToggleVerification, useToggleSuspension, useChangeUserRole, useAdminUpdateProfile } from "@/hooks/useAdminUsers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Ban, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { PaginationControls } from "@/components/PaginationControls";

const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

interface PaginationProps {
  page: number;
  pageSize: number;
  from: number;
  to: number;
  nextPage: () => void;
  prevPage: () => void;
}

interface UserTableProps {
  pagination?: PaginationProps;
}

export function UserTable({ pagination }: UserTableProps) {
  const from = pagination?.from ?? 0;
  const to = pagination?.to ?? 19;
  const { data: users, isLoading } = useAdminUsers(from, to);
  const toggleVerify = useToggleVerification();
  const toggleSuspend = useToggleSuspension();
  const changeRole = useChangeUserRole();
  const updateProfile = useAdminUpdateProfile();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", organization_name: "", bio: "", hourly_rate: "" });

  const filtered = (users ?? []).filter((u: any) => {
    if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    const userRole = u.user_roles?.[0]?.role;
    if (roleFilter !== "all" && userRole !== roleFilter) return false;
    if (verifiedFilter === "verified" && !u.is_verified) return false;
    if (verifiedFilter === "unverified" && u.is_verified) return false;
    return true;
  });

  const handleToggle = (id: string, current: boolean) => {
    toggleVerify.mutate({ id, is_verified: !current }, {
      onSuccess: () => toast.success(current ? "تم إلغاء التوثيق" : "تم التوثيق"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const handleSuspend = (id: string, current: boolean) => {
    toggleSuspend.mutate({ id, is_suspended: !current }, {
      onSuccess: () => toast.success(current ? "تم إلغاء التعليق" : "تم تعليق الحساب"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name || "",
      phone: u.phone || "",
      organization_name: u.organization_name || "",
      bio: u.bio || "",
      hourly_rate: u.hourly_rate?.toString() || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    updateProfile.mutate({
      id: editUser.id,
      full_name: editForm.full_name,
      phone: editForm.phone || undefined,
      organization_name: editForm.organization_name || undefined,
      bio: editForm.bio || undefined,
      hourly_rate: editForm.hourly_rate ? Number(editForm.hourly_rate) : null,
    }, {
      onSuccess: () => { toast.success("تم تحديث الملف الشخصي"); setEditUser(null); },
      onError: () => toast.error("حدث خطأ"),
    });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input placeholder="بحث بالاسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="الدور" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="youth_association">جمعية شبابية</SelectItem>
            <SelectItem value="service_provider">مقدم خدمة</SelectItem>
            <SelectItem value="donor">مانح</SelectItem>
            <SelectItem value="super_admin">مدير النظام</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="التوثيق" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="verified">موثق</SelectItem>
            <SelectItem value="unverified">غير موثق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>التوثيق</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الانضمام</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                <TableCell>
                  <Select
                    value={u.user_roles?.[0]?.role ?? ""}
                    onValueChange={(v) => {
                      changeRole.mutate({ userId: u.id, role: v }, {
                        onSuccess: () => toast.success("تم تغيير الدور"),
                        onError: () => toast.error("حدث خطأ في تغيير الدور"),
                      });
                    }}
                  >
                    <SelectTrigger className="w-36 h-8"><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {u.is_verified ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle className="h-3 w-3 ml-1" />موثق</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground"><XCircle className="h-3 w-3 ml-1" />غير موثق</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {u.is_suspended ? (
                    <Badge variant="destructive" className="text-xs"><Ban className="h-3 w-3 ml-1" />معلّق</Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">نشط</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(u.created_at), "yyyy/MM/dd", { locale: ar })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant={u.is_verified ? "outline" : "default"} onClick={() => handleToggle(u.id, u.is_verified)}>
                      {u.is_verified ? "إلغاء التوثيق" : "توثيق"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant={u.is_suspended ? "outline" : "destructive"}>
                          {u.is_suspended ? "إلغاء التعليق" : "تعليق"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {u.is_suspended ? "إلغاء تعليق الحساب" : "تعليق الحساب"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {u.is_suspended
                              ? `هل أنت متأكد من إلغاء تعليق حساب "${u.full_name}"؟`
                              : `هل أنت متأكد من تعليق حساب "${u.full_name}"؟ لن يتمكن المستخدم من الوصول إلى النظام.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleSuspend(u.id, u.is_suspended)}>
                            تأكيد
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا يوجد مستخدمين</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalFetched={users?.length ?? 0}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
        />
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل الملف الشخصي</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>الاسم</Label><Input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div><Label>الهاتف</Label><Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>اسم المنظمة</Label><Input value={editForm.organization_name} onChange={e => setEditForm(p => ({ ...p, organization_name: e.target.value }))} /></div>
            <div><Label>نبذة</Label><Textarea value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} rows={3} /></div>
            <div><Label>السعر بالساعة</Label><Input type="number" value={editForm.hourly_rate} onChange={e => setEditForm(p => ({ ...p, hourly_rate: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>إلغاء</Button>
            <Button onClick={handleSaveEdit} disabled={updateProfile.isPending}>{updateProfile.isPending ? "جارٍ الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
