import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Ban, User } from "lucide-react";
import { EntityActivityLog } from "@/components/admin/EntityActivityLog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  useAdminUserServices,
  useAdminUserProjects,
  useAdminUserContracts,
  useAdminUserDisputes,
  useAdminUserTimeLogs,
  useAdminUserDonations,
} from "@/hooks/useAdminUserDetails";

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

const donationStatusLabels: Record<string, string> = {
  available: "متاح",
  consumed: "مستهلك",
  reserved: "محجوز",
};

interface UserDetailSheetProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
  const userId = user?.id ?? null;
  const services = useAdminUserServices(userId);
  const projects = useAdminUserProjects(userId);
  const contracts = useAdminUserContracts(userId);
  const disputes = useAdminUserDisputes(userId);
  const timeLogs = useAdminUserTimeLogs(userId);
  const donations = useAdminUserDonations(userId);

  if (!user) return null;

  const role = user.user_roles?.[0]?.role;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="sm:max-w-2xl w-[90%] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">{user.full_name || "—"}</SheetTitle>
              <SheetDescription className="flex flex-wrap gap-2 mt-1">
                {role && <Badge variant="secondary">{roleLabels[role] ?? role}</Badge>}
                {user.is_verified ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle className="h-3 w-3 me-1" />موثق</Badge>
                ) : (
                  <Badge variant="outline"><XCircle className="h-3 w-3 me-1" />غير موثق</Badge>
                )}
                {user.is_suspended && (
                  <Badge variant="destructive"><Ban className="h-3 w-3 me-1" />معلّق</Badge>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            {role === "service_provider" && <TabsTrigger value="services">الخدمات</TabsTrigger>}
            {(role === "service_provider" || role === "youth_association") && (
              <TabsTrigger value="projects">الطلبات</TabsTrigger>
            )}
            {(role === "service_provider" || role === "youth_association") && (
              <TabsTrigger value="contracts">العقود</TabsTrigger>
            )}
            {(role === "service_provider" || role === "youth_association") && (
              <TabsTrigger value="disputes">الشكاوى</TabsTrigger>
            )}
            {role === "service_provider" && <TabsTrigger value="timelogs">سجل الوقت</TabsTrigger>}
            {role === "donor" && <TabsTrigger value="donations">المنح</TabsTrigger>}
            
            <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="space-y-4 pt-2">
                <InfoRow label="الاسم الكامل" value={user.full_name} />
                <InfoRow label="الهاتف" value={user.phone} />
                {(role === "youth_association" || role === "donor") && (
                  <InfoRow label="اسم المنظمة" value={user.organization_name} />
                )}
                {role === "youth_association" && (
                  <>
                    <InfoRow label="رقم الترخيص" value={user.license_number} />
                    <InfoRow label="اسم ضابط الاتصال" value={user.contact_officer_name} />
                    <InfoRow label="رقم ضابط الاتصال" value={user.contact_officer_phone} />
                    <InfoRow label="بريد ضابط الاتصال" value={user.contact_officer_email} />
                    <InfoRow label="صفة ضابط الاتصال" value={user.contact_officer_title} />
                  </>
                )}
                <InfoRow label="نبذة" value={user.bio} />
                {role === "service_provider" && (
                  <InfoRow label="السعر بالساعة" value={user.hourly_rate ? `${user.hourly_rate} ر.س` : null} />
                )}
                <InfoRow label="تاريخ الانضمام" value={format(new Date(user.created_at), "yyyy/MM/dd", { locale: ar })} />
                {user.is_suspended && user.suspension_reason && (
                  <div className="bg-destructive/10 rounded-lg p-3 space-y-1">
                    <span className="text-xs font-medium text-destructive">سبب التعليق</span>
                    <p className="text-sm">{user.suspension_reason}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              {services.isLoading ? <LoadingSkeleton /> : !services.data?.length ? <EmptyState message="لا توجد خدمات" /> : (
                <div className="space-y-3 pt-2">
                  {services.data.map((s: any) => (
                    <div key={s.id} className="border rounded-lg p-4 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{s.title}</span>
                        <Badge variant="outline">{approvalLabels[s.approval] ?? s.approval}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.description?.slice(0, 100)}</p>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>{s.price} ر.س</span>
                        {s.categories?.name && <span>• {s.categories.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              {projects.isLoading ? <LoadingSkeleton /> : !projects.data?.length ? <EmptyState message="لا توجد طلبات" /> : (
                <div className="space-y-3 pt-2">
                  {projects.data.map((p: any) => (
                    <div key={p.id} className="border rounded-lg p-4 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{p.title}</span>
                        <Badge variant="outline">{statusLabels[p.status] ?? p.status}</Badge>
                      </div>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        {p.budget && <span>{p.budget} ر.س</span>}
                        {p.categories?.name && <span>• {p.categories.name}</span>}
                        {p.regions?.name && <span>• {p.regions.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contracts Tab */}
            <TabsContent value="contracts">
              {contracts.isLoading ? <LoadingSkeleton /> : !contracts.data?.length ? <EmptyState message="لا توجد عقود" /> : (
                <div className="space-y-3 pt-2">
                  {contracts.data.map((c: any) => (
                    <div key={c.id} className="border rounded-lg p-4 space-y-1">
                      <span className="font-medium">{c.projects?.title ?? "—"}</span>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>مقدم الخدمة: {c.provider_signed_at ? "وقّع" : "لم يوقّع"}</span>
                        <span>• الجمعية: {c.association_signed_at ? "وقّعت" : "لم توقّع"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), "yyyy/MM/dd", { locale: ar })}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes">
              {disputes.isLoading ? <LoadingSkeleton /> : !disputes.data?.length ? <EmptyState message="لا توجد شكاوى" /> : (
                <div className="space-y-3 pt-2">
                  {disputes.data.map((d: any) => (
                    <div key={d.id} className="border rounded-lg p-4 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{d.projects?.title ?? "—"}</span>
                        <Badge variant="outline">{disputeStatusLabels[d.status] ?? d.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{d.description?.slice(0, 120)}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Time Logs Tab */}
            <TabsContent value="timelogs">
              {timeLogs.isLoading ? <LoadingSkeleton /> : !timeLogs.data?.length ? <EmptyState message="لا يوجد سجل وقت" /> : (
                <div className="space-y-3 pt-2">
                  {timeLogs.data.map((t: any) => (
                    <div key={t.id} className="border rounded-lg p-4 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{t.projects?.title ?? "—"}</span>
                        <Badge variant="outline">{approvalLabels[t.approval] ?? t.approval}</Badge>
                      </div>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>{t.hours} ساعة</span>
                        <span>• {t.log_date}</span>
                      </div>
                      {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Donations Tab - Donors only */}
            <TabsContent value="donations">
              {donations.isLoading ? <LoadingSkeleton /> : !donations.data?.length ? <EmptyState message="لا توجد منح" /> : (
                <div className="space-y-3 pt-2">
                  {donations.data.map((d: any) => (
                    <div key={d.id} className="border rounded-lg p-4 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">
                          {d.projects?.title ?? d.micro_services?.title ?? d.profiles?.organization_name ?? d.profiles?.full_name ?? "منحة عامة"}
                        </span>
                        <Badge variant="outline">{donationStatusLabels[d.donation_status] ?? d.donation_status}</Badge>
                      </div>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>{d.amount} ر.س</span>
                        <span>• {format(new Date(d.created_at), "yyyy/MM/dd", { locale: ar })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="activity">
              <EntityActivityLog tableName="profiles" recordId={userId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-start border-b pb-3 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm text-start max-w-[60%]">{value || "—"}</span>
    </div>
  );
}
