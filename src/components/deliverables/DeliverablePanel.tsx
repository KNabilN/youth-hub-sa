import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/attachments/FileUploader";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { useDeliverables, useSubmitDeliverable, useReviewDeliverable, Deliverable } from "@/hooks/useDeliverables";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageCheck, Send, CheckCircle, RotateCcw, AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";

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
          ? "border-green-500/30 bg-green-500/5"
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

  if (isLoading) return <Skeleton className="h-48" />;

  const allDeliverables = deliverables ?? [];
  const canReview = isAssociation;

  return (
    <div className="space-y-4">
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
              أضف ملاحظاتك ثم اضغط "تقديم للمراجعة". بعد التقديم ستتمكن من رفع الملفات.
            </p>
            <Textarea
              placeholder="ملاحظات حول التسليمات..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <Button
              onClick={() => {
                submitDeliverable.mutate({ projectId, notes });
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
        <div className="space-y-3">
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
    </div>
  );
}
