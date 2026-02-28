import { useState } from "react";
import { useAdminUsers, useToggleVerification, useToggleSuspension, useChangeUserRole, useAdminUpdateProfile } from "@/hooks/useAdminUsers";
import { AdminDirectEditDialog, type DirectEditFieldConfig } from "@/components/admin/AdminDirectEditDialog";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Ban, FileEdit, UserPlus } from "lucide-react";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { AdminCreateUserDialog } from "@/components/admin/AdminCreateUserDialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { PaginationControls } from "@/components/PaginationControls";
import { logAudit } from "@/lib/audit";

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

const profileFields: DirectEditFieldConfig[] = [
  { key: "full_name", label: "الاسم" },
  { key: "phone", label: "الهاتف" },
  { key: "organization_name", label: "اسم المنظمة" },
  { key: "license_number", label: "رقم الترخيص" },
  { key: "contact_officer_name", label: "اسم ضابط الاتصال" },
  { key: "contact_officer_phone", label: "رقم ضابط الاتصال" },
  { key: "contact_officer_email", label: "بريد ضابط الاتصال" },
  { key: "contact_officer_title", label: "صفة ضابط الاتصال" },
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
  const updateProfile = useAdminUpdateProfile();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [editUser, setEditUser] = useState<any>(null);
  const [viewUser, setViewUser] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Suspension reason dialog state
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [suspensionReason, setSuspensionReason] = useState("");

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

  const handleSuspendConfirm = () => {
    if (!suspendTarget) return;
    const isSuspended = suspendTarget.is_suspended;

    if (!suspensionReason.trim()) {
      toast.error(isSuspended ? "يرجى إدخال سبب إلغاء التعليق" : "يرجى إدخال سبب التعليق");
      return;
    }

    toggleSuspend.mutate(
      { id: suspendTarget.id, is_suspended: !isSuspended, suspension_reason: isSuspended ? "" : suspensionReason },
      {
        onSuccess: async () => {
          await logAudit("profiles", suspendTarget.id, isSuspended ? "unsuspend" : "suspend",
            { is_suspended: isSuspended },
            { is_suspended: !isSuspended, reason: suspensionReason.trim() }
          );
          toast.success(isSuspended ? "تم إلغاء التعليق" : "تم تعليق الحساب");
          setSuspendTarget(null);
          setSuspensionReason("");
        },
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  const openEdit = (u: any) => {
    setEditUser(u);
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
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
        <div className="me-auto">
          <Button onClick={() => setCreateOpen(true)} className="gap-1">
            <UserPlus className="h-4 w-4" />تسجيل مستخدم
          </Button>
        </div>
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
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle className="h-3 w-3 ms-1" />موثق</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground"><XCircle className="h-3 w-3 ms-1" />غير موثق</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {u.is_suspended ? (
                    <div>
                      <Badge variant="destructive" className="text-xs"><Ban className="h-3 w-3 ms-1" />معلّق</Badge>
                      {u.suspension_reason && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px] truncate" title={u.suspension_reason}>
                          {u.suspension_reason}
                        </p>
                      )}
                    </div>
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
                    <Button
                      size="sm"
                      variant={u.is_suspended ? "outline" : "destructive"}
                      onClick={() => {
                        setSuspendTarget(u);
                        setSuspensionReason(u.suspension_reason || "");
                      }}
                    >
                      {u.is_suspended ? "إلغاء التعليق" : "تعليق"}
                    </Button>
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

      {/* Suspension Reason Dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(o) => { if (!o) { setSuspendTarget(null); setSuspensionReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {suspendTarget?.is_suspended ? "إلغاء تعليق الحساب" : "تعليق الحساب"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {suspendTarget?.is_suspended
                ? `هل أنت متأكد من إلغاء تعليق حساب "${suspendTarget?.full_name}"؟`
                : `سيتم تعليق حساب "${suspendTarget?.full_name}" ولن يتمكن من الوصول إلى النظام.`}
            </p>
            <div>
              <Label>{suspendTarget?.is_suspended ? "سبب إلغاء التعليق *" : "سبب التعليق *"}</Label>
              <Textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder={suspendTarget?.is_suspended ? "اكتب سبب إلغاء التعليق..." : "اكتب سبب تعليق الحساب..."}
                rows={3}
              />
            </div>
            {suspendTarget?.is_suspended && suspendTarget?.suspension_reason && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">سبب التعليق السابق:</p>
                <p className="text-sm">{suspendTarget.suspension_reason}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSuspendTarget(null); setSuspensionReason(""); }}>إلغاء</Button>
            <Button variant={suspendTarget?.is_suspended ? "default" : "destructive"} onClick={handleSuspendConfirm}>
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      {editUser && (
        <AdminDirectEditDialog
          open={!!editUser}
          onOpenChange={(o) => !o && setEditUser(null)}
          currentValues={editUser}
          fields={profileFields}
          title="تعديل الملف الشخصي"
          onSave={async (updates) => {
            await updateProfile.mutateAsync({ id: editUser.id, ...updates });
          }}
          isPending={updateProfile.isPending}
        />
      )}

      {/* User Detail Sheet */}
      <UserDetailSheet
        user={viewUser}
        open={!!viewUser}
        onOpenChange={(o) => !o && setViewUser(null)}
      />

      {/* Create User Dialog */}
      <AdminCreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
