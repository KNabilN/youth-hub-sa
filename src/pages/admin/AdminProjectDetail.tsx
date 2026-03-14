import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUpdateProjectStatus, useAdminUpdateProject } from "@/hooks/useAdminProjects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, FileEdit, Tag, MapPin, Calendar, DollarSign, Clock, Users, Eye, Lock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminDirectEditDialog, type DirectEditFieldConfig } from "@/components/admin/AdminDirectEditDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BidList } from "@/components/bids/BidList";
import { ContractTimeline } from "@/components/contracts/ContractTimeline";
import { EntityActivityLog } from "@/components/admin/EntityActivityLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeLogTable } from "@/components/time-logs/TimeLogTable";
import { useProjectTimeLogs } from "@/hooks/useTimeLogs";
import { useUpdateTimeLogApproval } from "@/hooks/useTimeLogs";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const statusLabels: Record<string, string> = {
  draft: "مسودة", pending_approval: "بانتظار الموافقة", open: "مفتوح", in_progress: "قيد التنفيذ",
  completed: "مكتمل", disputed: "مُشتكى عليه", cancelled: "ملغي",
  suspended: "معلق", archived: "مؤرشف", rejected: "مرفوض",
};

/** Admin can only: pending_approval→open/rejected, and any active status→cancelled */
function getAdminAllowedStatuses(current: string): string[] {
  if (current === "pending_approval") return ["open", "rejected"];
  if (["open", "in_progress", "disputed", "suspended"].includes(current)) return ["cancelled"];
  return [];
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", pending_approval: "bg-orange-500/10 text-orange-600",
  open: "bg-primary/10 text-primary", in_progress: "bg-yellow-500/10 text-yellow-600",
  completed: "bg-emerald-500/10 text-emerald-600", disputed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground", rejected: "bg-destructive/10 text-destructive",
  suspended: "bg-orange-500/10 text-orange-600", archived: "bg-muted text-muted-foreground",
};

const projectFields: DirectEditFieldConfig[] = [
  { key: "title", label: "العنوان" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "budget", label: "الميزانية", type: "number" },
  { key: "estimated_hours", label: "الساعات المقدرة", type: "number" },
  { key: "category_id", label: "التصنيف", type: "select", selectSource: "categories" },
  { key: "region_id", label: "المنطقة", type: "select", selectSource: "regions" },
];

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const updateStatus = useUpdateProjectStatus();
  const updateProject = useAdminUpdateProject();
  const updateTimeLog = useUpdateTimeLogApproval();
  const [editOpen, setEditOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Realtime subscription for project status changes
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`project-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-project-detail", id] });
          qc.invalidateQueries({ queryKey: ["admin-projects"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, qc]);
  const { data: hoursSummary } = useProjectTimeLogs(id);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["admin-project-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, categories(name), regions(name), profiles!projects_association_id_fkey(id, full_name, avatar_url, organization_name), assigned_provider:profiles!projects_assigned_provider_id_fkey(id, full_name, avatar_url)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contract } = useQuery({
    queryKey: ["admin-project-contract", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("*, profiles:provider_id(full_name)")
        .eq("project_id", id!)
        .maybeSingle();
      return data;
    },
  });

  const { data: escrow } = useQuery({
    queryKey: ["admin-project-escrow", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("project_id", id!)
        .maybeSingle();
      return data;
    },
  });

  const { data: bidsCount } = useQuery({
    queryKey: ["admin-project-bids-count", id],
    enabled: !!id,
    queryFn: async () => {
      const { count } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true })
        .eq("project_id", id!);
      return count ?? 0;
    },
  });

  const { data: projectTimeLogs } = useQuery({
    queryKey: ["admin-project-time-logs", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_logs")
        .select("*, projects(title), profiles:provider_id(full_name)")
        .eq("project_id", id!)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleStatusChange = (status: ProjectStatus) => {
    if (!id) return;
    if (status === "rejected") {
      setRejectionReason("");
      setRejectDialogOpen(true);
      return;
    }
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success("تم تحديث الحالة"),
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  const handleRejectConfirm = () => {
    if (!id || !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }
    updateStatus.mutate(
      { id, status: "rejected" as ProjectStatus, rejection_reason: rejectionReason.trim() },
      {
        onSuccess: () => {
          toast.success("تم رفض الطلب");
          setRejectDialogOpen(false);
        },
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">لم يتم العثور على الطلب</p>
          <Button variant="outline" onClick={() => navigate("/admin/projects")}>
            <ArrowRight className="h-4 w-4 me-1" />العودة للقائمة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const association = project.profiles as any;
  const assignedProvider = project.assigned_provider as any;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4 me-1" />العودة لطلبات الجمعيات
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <FileEdit className="h-4 w-4 me-1" />تعديل
          </Button>
        </div>

        {/* Title & Status */}
        <div className="space-y-2">
           {(project as any).request_number && (
             <span className="text-sm font-mono text-muted-foreground">{(project as any).request_number}</span>
           )}
           <div className="flex items-center gap-3 flex-wrap">
             <h1 className="text-2xl font-bold">{project.title}</h1>
             <Badge className={statusColors[project.status]}>{statusLabels[project.status]}</Badge>
            {project.is_private && (
              <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />خاص</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skills */}
            {project.required_skills && project.required_skills.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">المهارات المطلوبة</h2>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Hours Progress */}
            {project.estimated_hours && hoursSummary && (
              <Card className="border-primary/20">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-1"><Clock className="h-4 w-4" /> تقدم الساعات</span>
                    <span className="text-muted-foreground">{hoursSummary.approvedHours} / {project.estimated_hours} ساعة</span>
                  </div>
                  <Progress value={Math.min((hoursSummary.approvedHours / Number(project.estimated_hours)) * 100, 100)} className="h-2" />
                  {hoursSummary.approvedHours >= Number(project.estimated_hours) && (
                    <div className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> تم تجاوز الساعات المقدرة!</div>
                  )}
                  {hoursSummary.approvedHours >= Number(project.estimated_hours) * 0.8 && hoursSummary.approvedHours < Number(project.estimated_hours) && (
                    <div className="flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3" /> تم استهلاك أكثر من 80% من الساعات المقدرة</div>
                  )}
                  {hoursSummary.pendingHours > 0 && (
                    <p className="text-xs text-muted-foreground">{hoursSummary.pendingHours} ساعة قيد المراجعة</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tabs: Bids, Contract, Time Logs, Activity */}
            <Tabs defaultValue="bids" dir="rtl">
              <TabsList>
                <TabsTrigger value="bids">العروض ({bidsCount ?? 0})</TabsTrigger>
                <TabsTrigger value="contract">العقد</TabsTrigger>
                <TabsTrigger value="timelogs">سجل الساعات</TabsTrigger>
                <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
              </TabsList>
              <TabsContent value="bids" className="mt-4">
                <BidList projectId={project.id} />
              </TabsContent>
              <TabsContent value="contract" className="mt-4">
                {contract ? (
                  <Card>
                    <CardContent className="pt-6 space-y-3 text-sm">
                      <p>{contract.terms}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">توقيع الجمعية:</span>
                        <span>{contract.association_signed_at ? new Date(contract.association_signed_at).toLocaleDateString("ar-SA") : "لم يوقّع بعد"}</span>
                        <span className="text-muted-foreground">توقيع مقدم الخدمة:</span>
                        <span>{contract.provider_signed_at ? new Date(contract.provider_signed_at).toLocaleDateString("ar-SA") : "لم يوقّع بعد"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا يوجد عقد بعد</p>
                )}
              </TabsContent>
              <TabsContent value="timelogs" className="mt-4">
                <TimeLogTable
                  logs={(projectTimeLogs as any) ?? []}
                  onApprove={(logId) => {
                    const log = ((projectTimeLogs as any) ?? []).find((l: any) => l.id === logId);
                    updateTimeLog.mutate({ id: logId, approval: "approved", providerId: log?.provider_id ?? "" }, { onSuccess: () => toast.success("تم اعتماد السجل") });
                  }}
                  onReject={(logId, reason) => {
                    const log = ((projectTimeLogs as any) ?? []).find((l: any) => l.id === logId);
                    updateTimeLog.mutate({ id: logId, approval: "rejected", providerId: log?.provider_id ?? "", rejectionReason: reason }, { onSuccess: () => toast.success("تم رفض السجل") });
                  }}
                  isLoading={updateTimeLog.isPending}
                />
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <EntityActivityLog tableName="projects" recordId={project.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status Change */}
            <Card>
              <CardHeader><CardTitle className="text-sm">تغيير الحالة</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Badge className={statusColors[project.status]}>{statusLabels[project.status]}</Badge>
                {project.status === "rejected" && (project as any).rejection_reason && (
                  <div className="text-xs text-destructive bg-destructive/5 rounded-md p-2 border border-destructive/20">
                    <span className="font-semibold">سبب الرفض:</span> {(project as any).rejection_reason}
                  </div>
                )}
                {(() => {
                  const opts = getAdminAllowedStatuses(project.status);
                  if (opts.length === 0) return <p className="text-xs text-muted-foreground">لا يمكن تغيير الحالة يدوياً — تتغير تلقائياً مع تقدم المشروع</p>;
                  if (project.status === "pending_approval") {
                    return (
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleStatusChange("open" as ProjectStatus)} disabled={updateStatus.isPending}>
                          موافقة
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleStatusChange("rejected" as ProjectStatus)} disabled={updateStatus.isPending}>
                          رفض
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <Select value={project.status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={project.status}>{statusLabels[project.status]}</SelectItem>
                        {opts.map((k) => <SelectItem key={k} value={k}>{statusLabels[k]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Association */}
            {association && (
              <Card>
                <CardHeader><CardTitle className="text-sm">الجمعية</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={association.avatar_url} />
                      <AvatarFallback>{association.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{association.full_name}</p>
                      {association.organization_name && (
                        <p className="text-xs text-muted-foreground">{association.organization_name}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assigned Provider */}
            {assignedProvider && (
              <Card>
                <CardHeader><CardTitle className="text-sm">مقدم الخدمة المعين</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={assignedProvider.avatar_url} />
                      <AvatarFallback>{assignedProvider.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm">{assignedProvider.full_name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meta Info */}
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                {project.budget && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>الميزانية: {project.budget?.toLocaleString()} ر.س</span>
                  </div>
                )}
                {project.estimated_hours && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>الساعات المقدرة: {project.estimated_hours}</span>
                  </div>
                )}
                {(project.categories as any)?.name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>{(project.categories as any).name}</span>
                  </div>
                )}
                {(project.regions as any)?.name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{(project.regions as any).name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{bidsCount ?? 0} عرض مقدم</span>
                </div>
                {escrow && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>الضمان: {escrow.amount?.toLocaleString()} ر.س ({escrow.status === "held" ? "محتجز" : escrow.status === "released" ? "محرر" : escrow.status === "refunded" ? "مسترد" : escrow.status})</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(project.created_at), "yyyy/MM/dd", { locale: ar })}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {editOpen && (
        <AdminDirectEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          currentValues={project}
          fields={projectFields}
          title="تعديل الطلب"
          isPending={updateProject.isPending}
          onSave={async (updates) => {
            await updateProject.mutateAsync({ id: project.id, ...updates });
          }}
        />
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">سيتم رفض طلب "{project.title}" وإرسال سبب الرفض للجمعية.</p>
            <div>
              <Label>سبب الرفض *</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="اكتب سبب الرفض..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={updateStatus.isPending}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
