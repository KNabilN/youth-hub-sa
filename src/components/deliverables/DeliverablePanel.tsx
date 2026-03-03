import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/attachments/FileUploader";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { useDeliverable, useSubmitDeliverable, useReviewDeliverable } from "@/hooks/useDeliverables";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageCheck, Send, CheckCircle, RotateCcw, AlertTriangle } from "lucide-react";

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

export function DeliverablePanel({ projectId, isProvider, isAssociation }: DeliverablePanelProps) {
  const { data: deliverable, isLoading } = useDeliverable(projectId);
  const submitDeliverable = useSubmitDeliverable();
  const reviewDeliverable = useReviewDeliverable();
  const [notes, setNotes] = useState("");
  const [revisionNote, setRevisionNote] = useState("");

  if (isLoading) return <Skeleton className="h-48" />;

  const status = deliverable ? statusConfig[deliverable.status] : null;
  const canSubmit = isProvider && (!deliverable || deliverable.status === "revision_requested");
  const canReview = isAssociation && deliverable?.status === "pending_review";

  return (
    <div className="space-y-4">
      {/* Status banner */}
      {deliverable && status && (
        <Card className={deliverable.status === "accepted" ? "border-green-500/30 bg-green-500/5" : deliverable.status === "revision_requested" ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <status.icon className="h-5 w-5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">حالة التسليم:</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                {deliverable.reviewed_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    تمت المراجعة: {new Date(deliverable.reviewed_at).toLocaleDateString("ar-SA")}
                  </p>
                )}
              </div>
            </div>
            {deliverable.status === "revision_requested" && deliverable.revision_note && (
              <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-1 text-sm font-medium text-destructive mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  ملاحظات التعديل
                </div>
                <p className="text-sm">{deliverable.revision_note}</p>
              </div>
            )}
            {deliverable.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                <strong>ملاحظات مقدم الخدمة:</strong> {deliverable.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Provider: Upload & submit */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              {deliverable ? "إعادة تقديم التسليمات" : "تقديم التسليمات"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliverable && (
              <FileUploader entityType="deliverable" entityId={deliverable.id} />
            )}
            {!deliverable && (
              <p className="text-sm text-muted-foreground">
                أضف ملاحظاتك ثم اضغط "تقديم للمراجعة". بعد التقديم ستتمكن من رفع الملفات.
              </p>
            )}
            <Textarea
              placeholder="ملاحظات حول التسليمات..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <Button
              onClick={() => submitDeliverable.mutate({ projectId, notes })}
              disabled={submitDeliverable.isPending}
            >
              <Send className="h-4 w-4 me-1" />
              {submitDeliverable.isPending ? "جارٍ التقديم..." : "تقديم للمراجعة"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Files list (visible to both when deliverable exists) */}
      {deliverable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملفات التسليم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isProvider && deliverable.status !== "accepted" && (
              <FileUploader entityType="deliverable" entityId={deliverable.id} />
            )}
            <AttachmentList entityType="deliverable" entityId={deliverable.id} />
          </CardContent>
        </Card>
      )}

      {/* Association: Review actions */}
      {canReview && deliverable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">مراجعة التسليمات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  reviewDeliverable.mutate({
                    deliverableId: deliverable.id,
                    projectId,
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
                    projectId,
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
          </CardContent>
        </Card>
      )}

      {/* No deliverable yet and user is association */}
      {!deliverable && isAssociation && (
        <p className="text-sm text-muted-foreground text-center py-8">
          لم يقم مقدم الخدمة بتقديم التسليمات بعد
        </p>
      )}

      {/* Not involved */}
      {!deliverable && !isProvider && !isAssociation && (
        <p className="text-sm text-muted-foreground text-center py-8">
          لا توجد تسليمات
        </p>
      )}
    </div>
  );
}
