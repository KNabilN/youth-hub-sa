import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileUploader } from "@/components/attachments/FileUploader";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { useDeliverables, useSubmitDeliverable, useReviewDeliverable, Deliverable } from "@/hooks/useDeliverables";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageCheck, Send, CheckCircle, CheckCircle2, RotateCcw, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface DeliverablePanelProps {
  projectId: string;
  isProvider: boolean;
  isAssociation: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending_review: { label: "بانتظار المراجعة", variant: "secondary", icon: PackageCheck },
  accepted: { label: "مقبول", variant: "default", icon: CheckCircle },
  revision_requested: { label: "مطلوب تعديلات", variant: "destructive", icon: RotateCcw },
};

function DeliverableVersionCard({ deliverable, index, total, isProvider, isAssociation, canReview }: {
  deliverable: Deliverable;
  index: number;
  total: number;
  isProvider: boolean;
  isAssociation: boolean;
  canReview: boolean;
}) {
  const reviewDeliverable = useReviewDeliverable();
  const [revisionNote, setRevisionNote] = useState("");
  const [expanded, setExpanded] = useState(index === 0);
  const status = statusConfig[deliverable.status];
  const versionNumber = total - index;

  if (!status) return null;

  return (
    <Card className={
      index === 0
        ? deliverable.status === "accepted"
          ? "border-success/30/30 bg-success/5"
          : deliverable.status === "revision_requested"
            ? "border-destructive/30 bg-destructive/5"
            : "border-primary/30 bg-primary/5"
        : "border-muted"
    }>
      <CardContent className="pt-4 pb-4">
        <button
          type="button"
          className="flex items-center gap-3 w-full text-start"
          onClick={() => setExpanded(!expanded)}
        >
          <status.icon className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">تسليم #{versionNumber}</span>
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(deliverable.created_at).toLocaleDateString("ar-SA")}
              </span>
            </div>
            {deliverable.status === "pending_review" && (
              <p className="text-[11px] text-success flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3 w-3" />
                تم الإرسال للجمعية في {new Date(deliverable.created_at).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
              </p>
            )}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {deliverable.reviewed_at && (
              <p className="text-xs text-muted-foreground">
                تمت المراجعة: {new Date(deliverable.reviewed_at).toLocaleDateString("ar-SA")}
              </p>
            )}

            {deliverable.status === "revision_requested" && deliverable.revision_note && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-1 text-sm font-medium text-destructive mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  ملاحظات التعديل
                </div>
                <p className="text-sm">{deliverable.revision_note}</p>
              </div>
            )}

            {deliverable.notes && (
              <p className="text-sm text-muted-foreground">
                <strong>ملاحظات مقدم الخدمة:</strong> {deliverable.notes}
              </p>
            )}

            {/* Files for this version */}
            <div className="space-y-2">
              {isProvider && deliverable.status !== "accepted" && index === 0 && (
                <FileUploader entityType="deliverable" entityId={deliverable.id} />
              )}
              <AttachmentList entityType="deliverable" entityId={deliverable.id} />
            </div>

            {/* Review actions — only for latest pending_review */}
            {canReview && index === 0 && deliverable.status === "pending_review" && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      reviewDeliverable.mutate({
                        deliverableId: deliverable.id,
                        projectId: deliverable.project_id,
                        action: "accepted",
                      })
                    }
                    disabled={reviewDeliverable.isPending}
                  >
                    <CheckCircle className="h-4 w-4 me-1" />
                    قبول التسليمات
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!revisionNote.trim()) return;
                      reviewDeliverable.mutate({
                        deliverableId: deliverable.id,
                        projectId: deliverable.project_id,
                        action: "revision_requested",
                        revisionNote,
                      });
                    }}
                    disabled={reviewDeliverable.isPending || !revisionNote.trim()}
                  >
                    <RotateCcw className="h-4 w-4 me-1" />
                    طلب تعديلات
                  </Button>
                </div>
                <Textarea
                  placeholder="وصف التعديلات المطلوبة..."
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DeliverablePanel({ projectId, isProvider, isAssociation }: DeliverablePanelProps) {
  const { data: deliverables, isLoading } = useDeliverables(projectId);
  const submitDeliverable = useSubmitDeliverable();
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState<{ versionNumber: number; submittedAt: string } | null>(null);

  if (isLoading) return <Skeleton className="h-48" />;

  const allDeliverables = deliverables ?? [];
  const canReview = isAssociation;
  const latest = allDeliverables[0];
  const showRevisionBanner = isProvider && latest?.status === "revision_requested";
  const showReceiptBanner = isProvider && latest?.status === "pending_review";

  const scrollToHistory = () => {
    document.getElementById("deliverables-history")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-4">
      {showRevisionBanner && (
        <Card className="border-destructive/40 bg-destructive/5 animate-fade-in">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-destructive">
                مطلوب منك تعديلات على التسليم #{allDeliverables.length}
              </p>
              {latest?.revision_note && (
                <p className="text-sm mt-1 text-foreground/80">{latest.revision_note}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                قدّم نسخة جديدة من النموذج بالأسفل بعد إجراء التعديلات المطلوبة.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showReceiptBanner && latest && (
        <Card className="border-info/40 bg-info/5 animate-fade-in">
          <CardContent className="p-4 flex items-start gap-3">
            <Send className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-info">
                تسليمك #{allDeliverables.length} وصل للجمعية ✓
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                تم الإرسال بتاريخ {new Date(latest.created_at).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })} — بانتظار المراجعة. سيتم إشعارك فور الرد.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider: Submit new version — always available */}
      {isProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              {allDeliverables.length > 0 ? "تقديم تسليم جديد" : "تقديم التسليمات"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              أضف ملاحظاتك ثم اضغط "تقديم للمراجعة". بعد التقديم ستتمكن من رفع الملفات وسيتم إشعار الجمعية مباشرة.
            </p>
            <Textarea
              placeholder="ملاحظات حول التسليمات..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <Button
              onClick={() => {
                submitDeliverable.mutate(
                  { projectId, notes },
                  {
                    onSuccess: () => {
                      setConfirmInfo({
                        versionNumber: allDeliverables.length + 1,
                        submittedAt: new Date().toISOString(),
                      });
                      setConfirmOpen(true);
                    },
                  }
                );
                setNotes("");
              }}
              disabled={submitDeliverable.isPending}
            >
              <Send className="h-4 w-4 me-1" />
              {submitDeliverable.isPending ? "جارٍ التقديم..." : "تقديم للمراجعة"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Submission history */}
      {allDeliverables.length > 0 && (
        <div id="deliverables-history" className="space-y-3 scroll-mt-24">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            سجل التسليمات ({allDeliverables.length})
          </h3>
          {allDeliverables.map((d, i) => (
            <DeliverableVersionCard
              key={d.id}
              deliverable={d}
              index={i}
              total={allDeliverables.length}
              isProvider={isProvider}
              isAssociation={isAssociation}
              canReview={canReview}
            />
          ))}
        </div>
      )}

      {/* No deliverable yet and user is association */}
      {allDeliverables.length === 0 && isAssociation && (
        <p className="text-sm text-muted-foreground text-center py-8">
          لم يقم مقدم الخدمة بتقديم التسليمات بعد
        </p>
      )}

      {/* Not involved */}
      {allDeliverables.length === 0 && !isProvider && !isAssociation && (
        <p className="text-sm text-muted-foreground text-center py-8">
          لا توجد تسليمات
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
              <CheckCircle2 className="h-9 w-9 text-success" />
            </div>
            <DialogTitle className="text-center text-xl mt-3">تم إرسال التسليم بنجاح ✓</DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              وصل تسليمك للجمعية وهي الآن بانتظار مراجعته. سيتم إشعارك فور الرد على التسليم سواء بالقبول أو طلب تعديلات.
            </DialogDescription>
          </DialogHeader>
          {confirmInfo && (
            <div className="rounded-lg border bg-muted/40 p-3 text-center text-xs text-muted-foreground space-y-1">
              <p>رقم التسليم: <strong className="text-foreground">#{confirmInfo.versionNumber}</strong></p>
              <p>{new Date(confirmInfo.submittedAt).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
          )}
          <DialogFooter className="sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setTimeout(scrollToHistory, 100);
              }}
            >
              عرض سجل التسليمات
            </Button>
            <Button onClick={() => setConfirmOpen(false)}>حسناً</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
