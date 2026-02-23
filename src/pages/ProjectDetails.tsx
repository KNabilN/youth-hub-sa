import { useState } from "react";
import { useParams } from "react-router-dom";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimeLogTable } from "@/components/time-logs/TimeLogTable";
import { useUpdateTimeLogApproval } from "@/hooks/useTimeLogs";
import { useCreateDispute } from "@/hooks/useDisputes";
import { useReleaseEscrow, useRefundEscrow } from "@/hooks/useEscrow";
import { useGenerateInvoice } from "@/hooks/useInvoices";
import { sendNotification } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import { Send, FileText, Check, AlertTriangle, CheckCircle, XCircle, PenLine } from "lucide-react";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const signContract = useSignContract();
  const updateTimeLog = useUpdateTimeLogApproval();
  const createDispute = useCreateDispute();
  const releaseEscrow = useReleaseEscrow();
  const refundEscrow = useRefundEscrow();
  const generateInvoice = useGenerateInvoice();
  const { role, user } = useAuth();
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const handlePublish = () => {
    if (!id) return;
    updateProject.mutate(
      { id, status: "open" },
      {
        onSuccess: () => toast({ title: "تم نشر المشروع بنجاح" }),
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const handleComplete = async () => {
    if (!id || !project) return;
    setCompleting(true);
    try {
      // 1. Update project status
      await supabase.from("projects").update({ status: "completed" }).eq("id", id);

      // 2. Release escrow and generate invoice
      const escrow = await releaseEscrow.mutateAsync(id);
      await generateInvoice.mutateAsync({
        escrowId: escrow.id,
        amount: escrow.amount,
        issuedTo: project.assigned_provider_id!,
      });

      // 3. Notify provider
      if (project.assigned_provider_id) {
        await sendNotification(
          project.assigned_provider_id,
          "تم إتمام المشروع وتحرير المستحقات المالية",
          "project_completed"
        );
      }

      toast({ title: "تم إتمام المشروع وتحرير المستحقات" });
      // Refresh
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast({ title: "حدث خطأ أثناء إتمام المشروع", variant: "destructive" });
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

      // Notify provider
      if (project.assigned_provider_id) {
        await sendNotification(
          project.assigned_provider_id,
          "تم إلغاء المشروع",
          "project_cancelled"
        );
      }

      toast({ title: "تم إلغاء المشروع" });
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const isAssociation = role === "youth_association" && user?.id === project?.association_id;

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;
  if (!project) return <DashboardLayout><p className="text-center py-16 text-muted-foreground">المشروع غير موجود</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {project.status === "draft" && isAssociation && (
              <Button onClick={handlePublish} disabled={updateProject.isPending}>
                <Send className="h-4 w-4 ml-1" />
                نشر المشروع
              </Button>
            )}
            {project.status === "in_progress" && isAssociation && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={completing} variant="default">
                    <CheckCircle className="h-4 w-4 ml-1" />
                    إتمام المشروع
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>إتمام المشروع</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من إتمام هذا المشروع؟ سيتم تحرير المستحقات المالية لمقدم الخدمة وإصدار فاتورة.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleComplete}>تأكيد الإتمام</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {(project.status === "draft" || project.status === "open") && isAssociation && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={cancelling} variant="outline">
                    <XCircle className="h-4 w-4 ml-1" />
                    إلغاء المشروع
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>إلغاء المشروع</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من إلغاء هذا المشروع؟ سيتم استرداد أي مبالغ محجوزة في الضمان المالي.
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
                      <AlertTriangle className="h-4 w-4 ml-1" />
                      رفع نزاع
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>رفع نزاع على المشروع</DialogTitle>
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
                                toast({ title: "تم رفع النزاع" });
                                setDisputeOpen(false);
                                setDisputeDesc("");
                              },
                              onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
                            }
                          );
                        }}
                        disabled={createDispute.isPending || !disputeDesc.trim()}
                      >
                        إرسال النزاع
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {project.budget && <span><strong>الميزانية:</strong> {project.budget} ر.س</span>}
          {project.estimated_hours && <span><strong>الساعات المقدرة:</strong> {project.estimated_hours}</span>}
          {(project as any).categories?.name && <Badge variant="secondary">{(project as any).categories.name}</Badge>}
          {(project as any).regions?.name && <Badge variant="secondary">{(project as any).regions.name}</Badge>}
          {project.required_skills?.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
        </div>

        <Tabs defaultValue="bids" dir="rtl">
          <TabsList>
            <TabsTrigger value="bids">العروض</TabsTrigger>
            <TabsTrigger value="contract">العقد</TabsTrigger>
            <TabsTrigger value="timelogs">سجل الساعات</TabsTrigger>
          </TabsList>

          <TabsContent value="bids" className="mt-4">
            <BidList projectId={project.id} />
          </TabsContent>

          <TabsContent value="contract" className="mt-4">
            {contract ? (
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
                       <PenLine className="h-4 w-4 ml-1" />
                       توقيع العقد
                     </Button>
                   )}
                 </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">لا يوجد عقد مرتبط بهذا المشروع</p>
            )}
          </TabsContent>

          <TabsContent value="timelogs" className="mt-4">
            <TimeLogTable
              logs={(timeLogs as any) ?? []}
              onApprove={(logId) => updateTimeLog.mutate({ id: logId, approval: "approved" }, { onSuccess: () => toast({ title: "تم اعتماد السجل" }) })}
              onReject={(logId) => updateTimeLog.mutate({ id: logId, approval: "rejected" }, { onSuccess: () => toast({ title: "تم رفض السجل" }) })}
              isLoading={updateTimeLog.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
