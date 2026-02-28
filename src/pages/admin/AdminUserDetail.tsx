import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminUserById } from "@/hooks/useAdminUserById";
import {
  useAdminUserServices,
  useAdminUserProjects,
  useAdminUserContracts,
  useAdminUserDisputes,
  useAdminUserTimeLogs,
  useAdminUserEditRequests,
} from "@/hooks/useAdminUserDetails";
import { useToggleVerification, useToggleSuspension, useAdminUpdateProfile } from "@/hooks/useAdminUsers";
import { AdminDirectEditDialog, type DirectEditFieldConfig } from "@/components/admin/AdminDirectEditDialog";
import { EntityActivityLog } from "@/components/admin/EntityActivityLog";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight, FileEdit, CheckCircle, XCircle, Ban, User, Phone, Building2,
  FileText, Mail, Briefcase, Clock, Calendar, UserCircle, DollarSign, AlignRight,
  ShieldCheck, ShieldOff,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

const approvalLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_approval: "قيد الموافقة",
  open: "مفتوح",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  disputed: "مُشتكى عليه",
  cancelled: "ملغى",
};

const disputeStatusLabels: Record<string, string> = {
  open: "مفتوح",
  under_review: "قيد المراجعة",
  resolved: "تم الحل",
  closed: "مغلق",
};

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

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-center text-muted-foreground py-8">{message}</p>;
}

function InfoField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: any }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border bg-card flex-row-reverse text-end">
      <div className="mt-0.5 p-2.5 rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground leading-relaxed">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading } = useAdminUserById(id ?? null);

  const services = useAdminUserServices(id ?? null);
  const projects = useAdminUserProjects(id ?? null);
  const contracts = useAdminUserContracts(id ?? null);
  const disputes = useAdminUserDisputes(id ?? null);
  const timeLogs = useAdminUserTimeLogs(id ?? null);
  const editRequests = useAdminUserEditRequests(id ?? null);

  const toggleVerify = useToggleVerification();
  const toggleSuspend = useToggleSuspension();
  const updateProfile = useAdminUpdateProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-4 w-full max-w-lg">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">لم يتم العثور على المستخدم</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/users")}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const role = user.user_roles?.[0]?.role;

  const handleToggleVerify = () => {
    toggleVerify.mutate(
      { id: user.id, is_verified: !user.is_verified },
      {
        onSuccess: () => toast.success(user.is_verified ? "تم إلغاء التوثيق" : "تم التوثيق"),
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  const handleSuspendConfirm = () => {
    if (!suspensionReason.trim()) {
      toast.error(user.is_suspended ? "يرجى إدخال سبب إلغاء التعليق" : "يرجى إدخال سبب التعليق");
      return;
    }
    toggleSuspend.mutate(
      { id: user.id, is_suspended: !user.is_suspended, suspension_reason: user.is_suspended ? "" : suspensionReason },
      {
        onSuccess: async () => {
          await logAudit("profiles", user.id, user.is_suspended ? "unsuspend" : "suspend",
            { is_suspended: user.is_suspended },
            { is_suspended: !user.is_suspended, reason: suspensionReason.trim() }
          );
          toast.success(user.is_suspended ? "تم إلغاء التعليق" : "تم تعليق الحساب");
          setSuspendOpen(false);
          setSuspensionReason("");
        },
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  return (
    <DashboardLayout>
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b mb-6">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
              <FileEdit className="h-4 w-4" />
              تعديل
            </Button>
            <Button
              variant={user.is_verified ? "outline" : "default"}
              size="sm"
              onClick={handleToggleVerify}
              className="gap-1.5"
            >
              {user.is_verified ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {user.is_verified ? "إلغاء التوثيق" : "توثيق"}
            </Button>
            <Button
              variant={user.is_suspended ? "outline" : "destructive"}
              size="sm"
              onClick={() => {
                setSuspendOpen(true);
                setSuspensionReason(user.suspension_reason || "");
              }}
              className="gap-1.5"
            >
              <Ban className="h-4 w-4" />
              {user.is_suspended ? "إلغاء التعليق" : "تعليق"}
            </Button>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin/users")} className="gap-2">
            العودة للمستخدمين
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
        {/* Hero Section */}
        <div className="rounded-2xl bg-gradient-to-l from-primary/5 via-primary/[0.02] to-background border p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-primary/10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-3">{user.full_name || "—"}</h1>
              <div className="flex flex-wrap justify-center gap-2">
                {role && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {roleLabels[role] ?? role}
                  </Badge>
                )}
                {user.is_verified ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-sm px-3 py-1">
                    <CheckCircle className="h-3.5 w-3.5 me-1.5" />
                    موثق
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <XCircle className="h-3.5 w-3.5 me-1.5" />
                    غير موثق
                  </Badge>
                )}
                {user.is_suspended && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    <Ban className="h-3.5 w-3.5 me-1.5" />
                    معلّق
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                تاريخ الانضمام: {format(new Date(user.created_at), "yyyy/MM/dd", { locale: ar })}
              </p>
            </div>
          </div>
        </div>

        {/* Suspension Alert */}
        {user.is_suspended && user.suspension_reason && (
          <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">سبب التعليق:</span> {user.suspension_reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full flex-wrap flex-row-reverse justify-end h-auto gap-1 p-1">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="services">الخدمات</TabsTrigger>
            <TabsTrigger value="projects">الطلبات</TabsTrigger>
            <TabsTrigger value="contracts">العقود</TabsTrigger>
            <TabsTrigger value="disputes">الشكاوى</TabsTrigger>
            <TabsTrigger value="timelogs">سجل الوقت</TabsTrigger>
            <TabsTrigger value="editrequests">طلبات التعديل</TabsTrigger>
            <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg flex-row-reverse justify-end">
                  <UserCircle className="h-5 w-5 text-primary" />
                  البيانات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                  <InfoField icon={User} label="الاسم الكامل" value={user.full_name} />
                  <InfoField icon={Phone} label="الهاتف" value={user.phone} />
                  <InfoField icon={Building2} label="اسم المنظمة" value={user.organization_name} />
                  <InfoField icon={FileText} label="رقم الترخيص" value={user.license_number} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg flex-row-reverse justify-end">
                  <Briefcase className="h-5 w-5 text-primary" />
                  بيانات ضابط الاتصال
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                  <InfoField icon={UserCircle} label="الاسم" value={user.contact_officer_name} />
                  <InfoField icon={Phone} label="الهاتف" value={user.contact_officer_phone} />
                  <InfoField icon={Mail} label="البريد الإلكتروني" value={user.contact_officer_email} />
                  <InfoField icon={Briefcase} label="الصفة" value={user.contact_officer_title} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg flex-row-reverse justify-end">
                  <AlignRight className="h-5 w-5 text-primary" />
                  معلومات إضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                  <InfoField icon={AlignRight} label="النبذة" value={user.bio} />
                  <InfoField icon={DollarSign} label="السعر بالساعة" value={user.hourly_rate ? `${user.hourly_rate} ر.س` : null} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            {services.isLoading ? <LoadingSkeleton /> : !services.data?.length ? <EmptyState message="لا توجد خدمات" /> : (
              <div className="grid gap-4">
                {services.data.map((s: any) => (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{s.title}</span>
                        <Badge variant="outline">{approvalLabels[s.approval] ?? s.approval}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{s.description?.slice(0, 100)}</p>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-2">
                        <span>{s.price} ر.س</span>
                        {s.categories?.name && <span>• {s.categories.name}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-6">
            {projects.isLoading ? <LoadingSkeleton /> : !projects.data?.length ? <EmptyState message="لا توجد طلبات" /> : (
              <div className="grid gap-4">
                {projects.data.map((p: any) => (
                  <Card key={p.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{p.title}</span>
                        <Badge variant="outline">{statusLabels[p.status] ?? p.status}</Badge>
                      </div>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-2">
                        {p.budget && <span>{p.budget} ر.س</span>}
                        {p.categories?.name && <span>• {p.categories.name}</span>}
                        {p.regions?.name && <span>• {p.regions.name}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="mt-6">
            {contracts.isLoading ? <LoadingSkeleton /> : !contracts.data?.length ? <EmptyState message="لا توجد عقود" /> : (
              <div className="grid gap-4">
                {contracts.data.map((c: any) => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <span className="font-medium">{c.projects?.title ?? "—"}</span>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                        <span>مقدم الخدمة: {c.provider_signed_at ? "وقّع" : "لم يوقّع"}</span>
                        <span>• الجمعية: {c.association_signed_at ? "وقّعت" : "لم توقّع"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(c.created_at), "yyyy/MM/dd", { locale: ar })}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="mt-6">
            {disputes.isLoading ? <LoadingSkeleton /> : !disputes.data?.length ? <EmptyState message="لا توجد شكاوى" /> : (
              <div className="grid gap-4">
                {disputes.data.map((d: any) => (
                  <Card key={d.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{d.projects?.title ?? "—"}</span>
                        <Badge variant="outline">{disputeStatusLabels[d.status] ?? d.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{d.description?.slice(0, 120)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Time Logs Tab */}
          <TabsContent value="timelogs" className="mt-6">
            {timeLogs.isLoading ? <LoadingSkeleton /> : !timeLogs.data?.length ? <EmptyState message="لا يوجد سجل وقت" /> : (
              <div className="grid gap-4">
                {timeLogs.data.map((t: any) => (
                  <Card key={t.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{t.projects?.title ?? "—"}</span>
                        <Badge variant="outline">{approvalLabels[t.approval] ?? t.approval}</Badge>
                      </div>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                        <span>{t.hours} ساعة</span>
                        <span>• {t.log_date}</span>
                      </div>
                      {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Edit Requests Tab */}
          <TabsContent value="editrequests" className="mt-6">
            {editRequests.isLoading ? <LoadingSkeleton /> : !editRequests.data?.length ? <EmptyState message="لا توجد طلبات تعديل" /> : (
              <div className="grid gap-4">
                {editRequests.data.map((e: any) => (
                  <Card key={e.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{e.target_table}</span>
                        <Badge variant={e.status === "pending" ? "default" : "outline"}>
                          {e.status === "pending" ? "قيد الانتظار" : e.status === "accepted" ? "مقبول" : "مرفوض"}
                        </Badge>
                      </div>
                      {e.message && <p className="text-sm text-muted-foreground mt-1">{e.message}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(e.created_at), "yyyy/MM/dd", { locale: ar })}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="mt-6">
            <EntityActivityLog tableName="profiles" recordId={id ?? ""} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      {editOpen && user && (
        <AdminDirectEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          currentValues={user}
          fields={profileFields}
          title="تعديل الملف الشخصي"
          onSave={async (updates) => {
            await updateProfile.mutateAsync({ id: user.id, ...updates });
          }}
          isPending={updateProfile.isPending}
        />
      )}

      {/* Suspend Dialog */}
      <Dialog open={suspendOpen} onOpenChange={(o) => { if (!o) { setSuspendOpen(false); setSuspensionReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{user.is_suspended ? "إلغاء تعليق الحساب" : "تعليق الحساب"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {user.is_suspended
                ? `هل أنت متأكد من إلغاء تعليق حساب "${user.full_name}"؟`
                : `سيتم تعليق حساب "${user.full_name}" ولن يتمكن من الوصول إلى النظام.`}
            </p>
            <div>
              <Label>{user.is_suspended ? "سبب إلغاء التعليق *" : "سبب التعليق *"}</Label>
              <Textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder={user.is_suspended ? "اكتب سبب إلغاء التعليق..." : "اكتب سبب تعليق الحساب..."}
                rows={3}
              />
            </div>
            {user.is_suspended && user.suspension_reason && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">سبب التعليق السابق:</p>
                <p className="text-sm">{user.suspension_reason}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSuspendOpen(false); setSuspensionReason(""); }}>إلغاء</Button>
            <Button variant={user.is_suspended ? "default" : "destructive"} onClick={handleSuspendConfirm}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
