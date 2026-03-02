import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyDisputes } from "@/hooks/useMyDisputes";
import { useMyAssignedProjects } from "@/hooks/useMyAssignedProjects";
import { useProjects } from "@/hooks/useProjects";
import { useCreateDispute, useReopenDispute } from "@/hooks/useDisputes";
import { DisputeResponseThread } from "@/components/disputes/DisputeResponseThread";
import { DisputeFinancialImpact } from "@/components/disputes/DisputeFinancialImpact";
import { DisputeTimeline } from "@/components/disputes/DisputeTimeline";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gavel, ExternalLink, Plus, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { disputeStatusLabels, disputeStatusColors } from "@/lib/dispute-statuses";

function canReopen(dispute: any): boolean {
  if (!["resolved", "closed"].includes(dispute.status)) return false;
  const closedAt = new Date(dispute.updated_at);
  const daysDiff = (Date.now() - closedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
}

export default function MyDisputes() {
  const { data: disputes, isLoading } = useMyDisputes();
  const { role } = useAuth();
  const isAssociation = role === "youth_association";
  const { data: assignedProjects } = useMyAssignedProjects("in_progress");
  const { data: associationProjects } = useProjects("all");
  const disputeProjects = isAssociation
    ? (associationProjects ?? []).filter((p: any) => ["in_progress", "completed", "disputed"].includes(p.status))
    : assignedProjects;
  const createDispute = useCreateDispute();
  const reopenDispute = useReopenDispute();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [description, setDescription] = useState("");

  const [reopenDialogId, setReopenDialogId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  const handleCreateDispute = () => {
    if (!selectedProject || !description.trim()) return;
    createDispute.mutate(
      { project_id: selectedProject, description: description.trim() },
      {
        onSuccess: () => {
          toast({ title: "تم رفع الشكوى بنجاح" });
          setDialogOpen(false);
          setSelectedProject("");
          setDescription("");
        },
        onError: () => toast({ title: "حدث خطأ أثناء رفع الشكوى", variant: "destructive" }),
      }
    );
  };

  const handleReopen = () => {
    if (!reopenDialogId || !reopenReason.trim()) return;
    reopenDispute.mutate(
      { disputeId: reopenDialogId, reason: reopenReason.trim() },
      {
        onSuccess: () => {
          toast({ title: "تم إعادة فتح الشكوى" });
          setReopenDialogId(null);
          setReopenReason("");
        },
        onError: (err: any) => toast({ title: err.message || "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <Gavel className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الشكاوى</h1>
              <p className="text-sm text-muted-foreground">إدارة ومتابعة الشكاوى الخاصة بطلباتك</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-1" />
                رفع شكوى
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفع شكوى جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الطلب</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger><SelectValue placeholder="اختر الطلب" /></SelectTrigger>
                    <SelectContent>
                      {disputeProjects?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>وصف الشكوى</Label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="اشرح سبب الشكوى بالتفصيل..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleCreateDispute}
                  disabled={!selectedProject || !description.trim() || createDispute.isPending}
                  className="w-full"
                >
                  {createDispute.isPending ? "جاري الإرسال..." : "رفع الشكوى"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : !disputes?.length ? (
          <EmptyState icon={Gavel} title="لا توجد شكاوى" description="لا يوجد لديك أي شكاوى حالياً" />
        ) : (
          <div className="space-y-4">
            {disputes.map((d: any) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        شكوى على: {d.projects?.title ?? "طلب محذوف"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {d.dispute_number && <span className="text-sm font-semibold font-mono">{d.dispute_number}</span>}
                        <p className="text-xs text-muted-foreground">بواسطة: {d.profiles?.full_name ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={disputeStatusColors[d.status] ?? ""}>{disputeStatusLabels[d.status] ?? d.status}</Badge>
                      {d.projects && (
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/projects/${d.project_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{d.description}</p>

                  <DisputeFinancialImpact projectId={d.project_id} />

                  {d.resolution_notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2">ملاحظات الحل: {d.resolution_notes}</p>
                  )}

                  {/* Reopen button */}
                  {canReopen(d) && (
                    <div className="border-t pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setReopenDialogId(d.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        إعادة فتح الشكوى
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        متاح خلال 7 أيام من الإغلاق
                      </p>
                    </div>
                  )}

                  <DisputeTimeline disputeId={d.id} />
                  <DisputeResponseThread disputeId={d.id} disputeStatus={d.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reopen Dialog */}
      <Dialog open={!!reopenDialogId} onOpenChange={(open) => { if (!open) setReopenDialogId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعادة فتح الشكوى</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              سيتم إعادة فتح الشكوى وتجميد المبالغ المالية المرتبطة بالطلب مرة أخرى.
            </p>
            <div className="space-y-2">
              <Label>سبب إعادة الفتح</Label>
              <Textarea
                value={reopenReason}
                onChange={e => setReopenReason(e.target.value)}
                placeholder="اشرح سبب إعادة فتح الشكوى..."
                rows={3}
              />
            </div>
            <Button
              onClick={handleReopen}
              disabled={!reopenReason.trim() || reopenDispute.isPending}
              variant="destructive"
              className="w-full"
            >
              {reopenDispute.isPending ? "جاري الإرسال..." : "تأكيد إعادة الفتح"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
