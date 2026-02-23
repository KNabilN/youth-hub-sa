import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyDisputes } from "@/hooks/useMyDisputes";
import { DisputeResponseThread } from "@/components/disputes/DisputeResponseThread";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gavel, ExternalLink } from "lucide-react";

const statusLabels: Record<string, string> = {
  open: "مفتوح",
  under_review: "قيد المراجعة",
  resolved: "تم الحل",
  closed: "مغلق",
};

export default function MyDisputes() {
  const { data: disputes, isLoading } = useMyDisputes();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">النزاعات</h1>

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : !disputes?.length ? (
          <EmptyState icon={Gavel} title="لا توجد نزاعات" description="لا يوجد لديك أي نزاعات حالياً" />
        ) : (
          <div className="space-y-4">
            {disputes.map((d: any) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        نزاع على: {d.projects?.title ?? "مشروع محذوف"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">بواسطة: {d.profiles?.full_name ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{statusLabels[d.status] ?? d.status}</Badge>
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
                  {d.resolution_notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2">ملاحظات الحل: {d.resolution_notes}</p>
                  )}
                  <DisputeResponseThread disputeId={d.id} disputeStatus={d.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
