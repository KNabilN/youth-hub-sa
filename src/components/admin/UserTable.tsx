import { useState } from "react";
import { useAdminUsers, useToggleVerification, useToggleSuspension, useChangeUserRole } from "@/hooks/useAdminUsers";
import { EditRequestDialog, type FieldConfig } from "@/components/admin/EditRequestDialog";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Ban, FileEdit } from "lucide-react";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
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

const profileFields: FieldConfig[] = [
  { key: "full_name", label: "الاسم" },
  { key: "phone", label: "الهاتف" },
  { key: "organization_name", label: "اسم المنظمة" },
  { key: "bio", label: "نبذة", type: "textarea" },
  { key: "hourly_rate", label: "السعر بالساعة", type: "number" },
];

export function UserTable({ pagination }: UserTableProps) {
  const from = pagination?.from ?? 0;
  const to = pagination?.to ?? 19;
  const { data: users, isLoading } = useAdminUsers(from, to);
  const { user: authUser } = useAuth();
  const toggleVerify = useToggleVerification();
  const toggleSuspend = useToggleSuspension();
  const changeRole = useChangeUserRole();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [editUser, setEditUser] = useState<any>(null);
  const [viewUser, setViewUser] = useState<any>(null);

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
                <TableCell>
                  <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setViewUser(u)}>
                    {u.full_name || "—"}
                  </Button>
                </TableCell>
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
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><FileEdit className="h-4 w-4" /></Button>
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

      {/* Edit Request Dialog */}
      {editUser && (
        <EditRequestDialog
          open={!!editUser}
          onOpenChange={(o) => !o && setEditUser(null)}
          targetTable="profiles"
          targetId={editUser.id}
          targetUserId={editUser.id}
          currentValues={editUser}
          fields={profileFields}
          title="طلب تعديل الملف الشخصي"
        />
      )}

      {/* User Detail Sheet */}
      <UserDetailSheet
        user={viewUser}
        open={!!viewUser}
        onOpenChange={(o) => !o && setViewUser(null)}
      />
    </div>
  );
}
