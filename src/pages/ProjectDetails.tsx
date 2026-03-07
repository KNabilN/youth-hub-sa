import { useState } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useSignContract } from "@/hooks/useContracts";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { BidList } from "@/components/bids/BidList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimeLogTable } from "@/components/time-logs/TimeLogTable";
import { useUpdateTimeLogApproval, useProjectTimeLogs } from "@/hooks/useTimeLogs";
import { useCreateDispute } from "@/hooks/useDisputes";
import { useReleaseEscrow, useRefundEscrow } from "@/hooks/useEscrow";
import { useGenerateInvoice } from "@/hooks/useInvoices";
// Notifications are handled by database triggers — no client-side sendNotification needed
import { useAuth } from "@/hooks/useAuth";
import { DisputeResponseThread } from "@/components/disputes/DisputeResponseThread";
import { ContractTimeline } from "@/components/contracts/ContractTimeline";
import { ContractVersionsList } from "@/components/contracts/ContractVersionsList";
import { Send, FileText, Check, AlertTriangle, CheckCircle, XCircle, PenLine, Paperclip, Shield, Clock, PackageCheck, Plus, Pencil } from "lucide-react";

import { FileUploader } from "@/components/attachments/FileUploader";
import { BidPaymentDialog } from "@/components/bids/BidPaymentDialog";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { EntityActivityLog } from "@/components/admin/EntityActivityLog";
import { DeliverablePanel } from "@/components/deliverables/DeliverablePanel";
import { useDeliverable } from "@/hooks/useDeliverables";
import { TimeEntryForm, type TimeEntryFormValues } from "@/components/provider/TimeEntryForm";
import { WorkTimer } from "@/components/provider/WorkTimer";
import { useCreateTimeLog } from "@/hooks/useProviderTimeLogs";



export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const signContract = useSignContract();
  const updateTimeLog = useUpdateTimeLogApproval();
  const createDispute = useCreateDispute();
  const releaseEscrow = useReleaseEscrow();
  const refundEscrow = useRefundEscrow();
  const generateInvoice = useGenerateInvoice();
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [timerDefaults, setTimerDefaults] = useState<Partial<TimeEntryFormValues>>({});
  const createTimeLog = useCreateTimeLog();
  const [resumePaymentOpen, setResumePaymentOpen] = useState(false);
  const { data: hoursSummary } = useProjectTimeLogs(id);
  const { data: deliverable } = useDeliverable(id);

  const { data: contract } = useQuery({
    queryKey: ["contract", id],
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

  const { data: timeLogs } = useQuery({
    queryKey: ["project-time-logs", id],
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

  const { data: disputes } = useQuery({
    queryKey: ["project-disputes", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*, profiles:raised_by(full_name)")
        .eq("project_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: escrow } = useQuery({
    queryKey: ["project-escrow", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("project_id", id!)
        .eq("payer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Query accepted bid for resume-payment flow
  const { data: acceptedBid } = useQuery({
    queryKey: ["accepted-bid", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("bids")
        .select("*, profiles:provider_id(full_name)")
        .eq("project_id", id!)
        .eq("status", "accepted")
        .is("deleted_at", null)
        .maybeSingle();
      return data;
    },
  });

  const handlePublish = () => {
    if (!id) return;
    updateProject.mutate(
      { id, status: "pending_approval" as any },
      {
        onSuccess: () => toast({ title: "تم إرسال الطلب للمراجعة والموافقة" }),
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const handleComplete = async () => {
    if (!id || !project) return;
    setCompleting(true);
    try {
      // 0. Verify escrow exists and is held
      if (!escrow || escrow.status !== "held") {
        console.error("Escrow check failed:", { escrow: escrow?.status });
        toast({ title: "لا يمكن إتمام الطلب", description: "لا يوجد ضمان مالي محتجز. يرجى التأكد من إنشاء الضمان المالي أولاً.", variant: "destructive" });
        setCompleting(false);
        return;
      }

      // 0b. Verify at least one deliverable is accepted
      const { data: allDeliverables } = await supabase
        .from("project_deliverables")
        .select("status")
        .eq("project_id", id!)
        .eq("status", "accepted")
        .limit(1);
      if (!allDeliverables?.length) {
        console.error("No accepted deliverables found for project", id);
        toast({ title: "لا يمكن إتمام الطلب", description: "يجب قبول التسليمات أولاً قبل إتمام الطلب.", variant: "destructive" });
        setCompleting(false);
        return;
      }

      // 1. Update project status
      const { error: updateErr } = await supabase.from("projects").update({ status: "completed" }).eq("id", id);
      if (updateErr) throw updateErr;

      // 2. Release escrow and generate invoice
      const escrowResult = await releaseEscrow.mutateAsync(id);
      await generateInvoice.mutateAsync({
        escrowId: escrowResult.id,
        amount: escrowResult.amount,
        issuedTo: project.assigned_provider_id!,
      });

      // DB triggers handle notifications (project status + escrow release)

      toast({ title: "تم إتمام الطلب وتحرير المستحقات بنجاح ✅", description: "سيتم إشعار مقدم الخدمة ويمكنه الآن طلب سحب المستحقات." });
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["project-escrow", id] });
      queryClient.invalidateQueries({ queryKey: ["project-time-logs", id] });
      queryClient.invalidateQueries({ queryKey: ["project-disputes", id] });
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["earnings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-stats"] });
    } catch (err: any) {
      console.error("Project completion failed:", err);
      toast({ title: "حدث خطأ أثناء إتمام الطلب", description: err?.message || "يرجى المحاولة مرة أخرى", variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !project) return;
    setCancelling(true);
    try {
      await supabase.from("projects").update({ status: "cancelled" }).eq("id", id);

      // Refund escrow if held
      try {
        await refundEscrow.mutateAsync(id);
      } catch {
        // No escrow to refund, that's fine
      }

      // DB triggers handle notifications (project status + escrow refund)

      toast({ title: "تم إلغاء الطلب" });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["project-escrow", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (err) {
      console.error("Project cancellation failed");
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const isAssociation = role === "youth_association" && user?.id === project?.association_id;
  const isProvider = role === "service_provider" && user?.id === project?.assigned_provider_id;

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;
  if (!project) return <DashboardLayout><p className="text-center py-16 text-muted-foreground">الطلب غير موجود</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
             {(project as any).request_number && (
               <span className="text-sm font-mono text-muted-foreground">{(project as any).request_number}</span>
             )}
             <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold">{project.title}</h1>
               <ProjectStatusBadge status={project.status} />
             </div>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {!project.assigned_provider_id && isAssociation && (
              <Button variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                <Pencil className="h-4 w-4 me-1" />
                تعديل الطلب
              </Button>
            )}
            {project.status === "draft" && isAssociation && (
              <Button onClick={handlePublish} disabled={updateProject.isPending}>
                <Send className="h-4 w-4 me-1" />
                إرسال للموافقة
              </Button>
            )}
            {project.status === "in_progress" && isAssociation && (() => {
              const hasEscrow = escrow && escrow.status === "held";
              const hasAcceptedDeliverable = deliverable && deliverable.status === "accepted";
              const canComplete = hasEscrow && hasAcceptedDeliverable;
              return (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={completing} variant="default">
                      <CheckCircle className="h-4 w-4 me-1" />
                       إتمام الطلب
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                       <AlertDialogTitle>إتمام الطلب</AlertDialogTitle>
                      {canComplete ? (
                        <AlertDialogDescription>
                          هل أنت متأكد من إتمام هذا الطلب؟ سيتم تحرير المستحقات المالية لمقدم الخدمة وإصدار فاتورة.
                        </AlertDialogDescription>
                      ) : (
                        <div className="space-y-3 text-sm pt-2">
                          <p className="text-muted-foreground">لا يمكن إتمام الطلب حتى يتم استيفاء المتطلبات التالية:</p>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              {hasEscrow ? <Check className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                              <span className={hasEscrow ? "text-green-700" : "text-destructive font-medium"}>
                                {hasEscrow ? "الضمان المالي محتجز ✓" : "لا يوجد ضمان مالي محتجز — يجب إنشاء الضمان المالي أولاً"}
                              </span>
                            </li>
                            <li className="flex items-center gap-2">
                              {hasAcceptedDeliverable ? <Check className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                              <span className={hasAcceptedDeliverable ? "text-green-700" : "text-destructive font-medium"}>
                                {hasAcceptedDeliverable ? "التسليمات مقبولة ✓" : "لا توجد تسليمات مقبولة — يجب قبول التسليمات أولاً"}
                              </span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{canComplete ? "إلغاء" : "فهمت"}</AlertDialogCancel>
                      {canComplete && (
                        <AlertDialogAction onClick={handleComplete} disabled={completing}>
                          {completing ? "جاري الإتمام..." : "تأكيد الإتمام"}
                        </AlertDialogAction>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            })()}
            {(project.status === "draft" || project.status === "open") && isAssociation && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={cancelling} variant="outline">
                    <XCircle className="h-4 w-4 me-1" />
                     إلغاء الطلب
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                     <AlertDialogTitle>إلغاء الطلب</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من إلغاء هذا الطلب؟ سيتم استرداد أي مبالغ محجوزة في الضمان المالي.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>تأكيد الإلغاء</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {(project.status === "in_progress" || project.status === "completed") &&
              (role === "youth_association" || role === "service_provider") && (
                <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <AlertTriangle className="h-4 w-4 me-1" />
                      رفع شكوى
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>رفع شكوى على الطلب</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="وصف المشكلة..."
                        value={disputeDesc}
                        onChange={(e) => setDisputeDesc(e.target.value)}
                        rows={4}
                      />
                      <Button
                        onClick={() => {
                          if (!disputeDesc.trim() || !id) return;
                          createDispute.mutate(
                            { project_id: id, description: disputeDesc },
                            {
                              onSuccess: () => {
                                toast({ title: "تم رفع الشكوى" });
                                setDisputeOpen(false);
                                setDisputeDesc("");
                              },
                              onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
                            }
                          );
                        }}
                        disabled={createDispute.isPending || !disputeDesc.trim()}
                      >
                        إرسال الشكوى
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
          </div>
        </div>

        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <div className="flex flex-wrap gap-4 text-sm">
          {project.budget && <span><strong>الميزانية:</strong> {project.budget} ر.س</span>}
          {project.estimated_hours && <span><strong>الساعات المقدرة:</strong> {project.estimated_hours}</span>}
          {(project as any).categories?.name && <Badge variant="secondary">{(project as any).categories.name}</Badge>}
          {(project as any).regions?.name && <Badge variant="secondary">{(project as any).regions.name}</Badge>}
          {(project as any).cities?.name && <Badge variant="outline">{(project as any).cities.name}</Badge>}
          {project.required_skills?.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
        </div>

        {/* Hours Progress Card */}
        {project.estimated_hours && hoursSummary && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-1"><Clock className="h-4 w-4" /> تقدم الساعات</span>
                <span className="text-muted-foreground">{hoursSummary.approvedHours} / {project.estimated_hours} ساعة معتمدة</span>
              </div>
              <Progress value={Math.min((hoursSummary.approvedHours / Number(project.estimated_hours)) * 100, 100)} className="h-2" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>إجمالي مسجل: {hoursSummary.totalLogged} ساعة</span>
                {hoursSummary.pendingHours > 0 && <span>قيد المراجعة: {hoursSummary.pendingHours} ساعة</span>}
              </div>
              {hoursSummary.approvedHours >= Number(project.estimated_hours) && (
                <div className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> تم تجاوز الساعات المقدرة!</div>
              )}
              {hoursSummary.approvedHours >= Number(project.estimated_hours) * 0.8 && hoursSummary.approvedHours < Number(project.estimated_hours) && (
                <div className="flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3" /> تم استهلاك أكثر من 80% من الساعات</div>
              )}
            </CardContent>
          </Card>
        )}
        {/* Pending payment banner — bid accepted but no escrow yet */}
        {project.status === "open" && project.assigned_provider_id && !escrow && isAssociation && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-warning shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">بانتظار إتمام الدفع</p>
                <p className="text-xs text-muted-foreground">تم قبول العرض وتعيين مقدم الخدمة. يرجى إتمام عملية الدفع لإنشاء الضمان المالي وبدء العمل.</p>
              </div>
              {acceptedBid && (
                <Button size="sm" onClick={() => setResumePaymentOpen(true)}>
                  <CreditCard className="h-4 w-4 me-1" />
                  متابعة الدفع
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bank transfer under review banner */}
        {project.status === "open" && project.assigned_provider_id && escrow && escrow.status === "pending_payment" && isAssociation && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="font-medium text-sm">التحويل البنكي قيد المراجعة</p>
                <p className="text-xs text-muted-foreground">تم رفع إيصال التحويل وهو بانتظار مراجعة الإدارة. سيبدأ العمل فور الموافقة.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="bids" dir="rtl">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scrollbar-hide h-auto p-1">
            <TabsTrigger value="bids">{role === "service_provider" ? "عرضي" : "العروض"}</TabsTrigger>
            <TabsTrigger value="contract">العقد</TabsTrigger>
            <TabsTrigger value="timelogs">سجل الساعات</TabsTrigger>
            <TabsTrigger value="disputes">الشكاوى</TabsTrigger>
            <TabsTrigger value="attachments" className="flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              المرفقات
            </TabsTrigger>
            {(project.status === "in_progress" || project.status === "completed") && (
              <TabsTrigger value="deliverables" className="flex items-center gap-1">
                <PackageCheck className="h-3.5 w-3.5" />
                التسليمات
              </TabsTrigger>
            )}
            {role === "super_admin" && <TabsTrigger value="activity">سجل النشاط</TabsTrigger>}
          </TabsList>

          <TabsContent value="bids" className="mt-4">
            <BidList projectId={project.id} projectTitle={project.title} role={role} userId={user?.id} />
          </TabsContent>

          <TabsContent value="contract" className="mt-4">
            {contract ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> تفاصيل العقد</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>{contract.terms}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">مقدم الخدمة:</span>
                      <span>{(contract as any).profiles?.full_name || "-"}</span>
                      <span className="text-muted-foreground">توقيع الجمعية:</span>
                      <span className="flex items-center gap-1">
                        {contract.association_signed_at ? <><Check className="h-3.5 w-3.5 text-success" /> {new Date(contract.association_signed_at).toLocaleDateString("ar-SA")}</> : "لم يوقّع بعد"}
                      </span>
                      <span className="text-muted-foreground">توقيع مقدم الخدمة:</span>
                      <span className="flex items-center gap-1">
                        {contract.provider_signed_at ? <><Check className="h-3.5 w-3.5 text-success" /> {new Date(contract.provider_signed_at).toLocaleDateString("ar-SA")}</> : "لم يوقّع بعد"}
                      </span>
                      {escrow && (
                        <>
                          <span className="text-muted-foreground">الضمان المالي:</span>
                          <span className="flex items-center gap-1">
                            {escrow.amount} ر.س
                            <Badge variant={escrow.status === "released" ? "default" : escrow.status === "held" ? "secondary" : "outline"} className="me-1 text-xs">
                              {escrow.status === "held" ? "محتجز" : escrow.status === "released" ? "محرر" : escrow.status === "refunded" ? "مسترد" : escrow.status}
                            </Badge>
                          </span>
                        </>
                      )}
                    </div>
                    {isAssociation && !contract.association_signed_at && (
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => signContract.mutate(contract.id, {
                          onSuccess: () => toast({ title: "تم توقيع العقد بنجاح" }),
                          onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
                        })}
                        disabled={signContract.isPending}
                      >
                        <PenLine className="h-4 w-4 me-1" />
                        توقيع العقد
                      </Button>
                    )}
                    {isProvider && !contract.provider_signed_at && (
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => signContract.mutate(contract.id, {
                          onSuccess: () => toast({ title: "تم توقيع العقد بنجاح" }),
                          onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
                        })}
                        disabled={signContract.isPending}
                      >
                        <PenLine className="h-4 w-4 me-1" />
                        توقيع العقد
                      </Button>
                    )}
                    {/* Escrow status note - payment now happens at bid acceptance */}
                    {contract.association_signed_at && contract.provider_signed_at && escrow && (
                      <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-accent/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="font-medium text-sm">تم إنشاء الضمان المالي</span>
                          <Badge variant="secondary" className="mr-auto text-xs">
                            {escrow.amount} ر.س — {escrow.status === "held" ? "محتجز" : escrow.status === "released" ? "محرر" : escrow.status === "refunded" ? "مسترد" : escrow.status}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <ContractVersionsList
                  contractId={contract.id}
                  currentTerms={contract.terms}
                  canEdit={(isAssociation || isProvider) && !(contract.association_signed_at && contract.provider_signed_at)}
                />

                <ContractTimeline
                  contract={contract}
                  escrow={escrow}
                  timeLogs={timeLogs as any[]}
                  disputes={disputes as any[]}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      مرفقات العقد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(isAssociation || isProvider) && (
                      <FileUploader entityType="contract" entityId={contract.id} />
                    )}
                    <AttachmentList entityType="contract" entityId={contract.id} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">لا يوجد عقد مرتبط بهذا الطلب</p>
            )}
          </TabsContent>

          <TabsContent value="timelogs" className="mt-4 space-y-4">
            {isProvider && project.status === "in_progress" && (() => {
              const isContractSigned = contract?.association_signed_at && contract?.provider_signed_at;
              if (!isContractSigned) {
                return (
                  <Card className="border-warning/30 bg-warning/5">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                      <div>
                        <p className="font-medium text-sm">يجب توقيع العقد أولاً</p>
                        <p className="text-xs text-muted-foreground">لا يمكنك تسجيل ساعات عمل قبل توقيع العقد من الطرفين. يرجى الانتقال لتبويب "العقد" لتوقيعه.</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return (
              <div className="space-y-4">
                <WorkTimer
                  onStop={(startTime, endTime, hours) => {
                    setTimerDefaults({ start_time: startTime, end_time: endTime, hours, project_id: project.id });
                  }}
                />
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      تسجيل ساعات عمل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimeEntryForm
                      projects={[{ id: project.id, title: project.title }]}
                      defaultValues={{ project_id: project.id, ...timerDefaults }}
                      isLoading={createTimeLog.isPending}
                      onSubmit={(values) => {
                        createTimeLog.mutate({ project_id: values.project_id, log_date: values.log_date, hours: values.hours, description: values.description, start_time: values.start_time, end_time: values.end_time }, {
                          onSuccess: () => {
                            toast({ title: "تم تسجيل الساعات بنجاح" });
                            queryClient.invalidateQueries({ queryKey: ["project-time-logs", id] });
                            queryClient.invalidateQueries({ queryKey: ["project-time-logs-summary", id] });
                            setTimerDefaults({});
                          },
                          onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
                        });
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
              );
            })()}

            {/* Stats summary */}
            {hoursSummary && (
              <div className="flex flex-wrap gap-4 text-sm">
                <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> معتمدة: {hoursSummary.approvedHours} ساعة</Badge>
                {hoursSummary.pendingHours > 0 && (
                  <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> قيد المراجعة: {hoursSummary.pendingHours} ساعة</Badge>
                )}
                <Badge variant="outline" className="gap-1">إجمالي: {hoursSummary.totalLogged} ساعة</Badge>
              </div>
            )}

            <TimeLogTable
              logs={(timeLogs as any) ?? []}
              onApprove={isAssociation ? (logId) => { const log = ((timeLogs as any) ?? []).find((l: any) => l.id === logId); updateTimeLog.mutate({ id: logId, approval: "approved", providerId: log?.provider_id ?? "" }, { onSuccess: () => { toast({ title: "تم اعتماد السجل" }); queryClient.invalidateQueries({ queryKey: ["project-time-logs", id] }); } }); } : undefined}
              onReject={isAssociation ? (logId, reason) => { const log = ((timeLogs as any) ?? []).find((l: any) => l.id === logId); updateTimeLog.mutate({ id: logId, approval: "rejected", providerId: log?.provider_id ?? "", rejectionReason: reason }, { onSuccess: () => { toast({ title: "تم رفض السجل" }); queryClient.invalidateQueries({ queryKey: ["project-time-logs", id] }); } }); } : undefined}
              isLoading={updateTimeLog.isPending}
            />
          </TabsContent>

          <TabsContent value="disputes" className="mt-4">
            {disputes && disputes.length > 0 ? (
              <div className="space-y-4">
                {disputes.map((d: any) => (
                  <Card key={d.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">شكوى بواسطة: {d.profiles?.full_name ?? "—"}</CardTitle>
                        <Badge variant="outline">{d.status === "open" ? "مفتوح" : d.status === "under_review" ? "قيد المراجعة" : d.status === "resolved" ? "تم الحل" : "مغلق"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{d.description}</p>
                      {d.resolution_notes && <p className="text-xs text-muted-foreground border-t pt-2">ملاحظات الحل: {d.resolution_notes}</p>}
                      <DisputeResponseThread disputeId={d.id} disputeStatus={d.status} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد شكاوى</p>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  مرفقات الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(isAssociation || isProvider) && (
                  <FileUploader entityType="project" entityId={project.id} />
                )}
                <AttachmentList entityType="project" entityId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {(project.status === "in_progress" || project.status === "completed") && (
            <TabsContent value="deliverables" className="mt-4">
              {isProvider && !(contract?.association_signed_at && contract?.provider_signed_at) ? (
                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                    <div>
                      <p className="font-medium text-sm">يجب توقيع العقد أولاً</p>
                      <p className="text-xs text-muted-foreground">لا يمكنك تقديم تسليمات قبل توقيع العقد من الطرفين.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <DeliverablePanel
                  projectId={project.id}
                  isProvider={isProvider}
                  isAssociation={isAssociation}
                />
              )}
            </TabsContent>
          )}

          {role === "super_admin" && (
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">سجل النشاط</CardTitle></CardHeader>
                <CardContent>
                  <EntityActivityLog tableName="projects" recordId={id ?? null} maxHeight="500px" />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
